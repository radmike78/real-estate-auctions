#!/usr/bin/env bash
# DeedOwl: one-command install (or update) with Podman.
#
#   deploy/podman/install.sh               install as systemd services (Quadlet): starts now and on every boot
#   deploy/podman/install.sh --no-systemd  just start the containers (quick try-out, laptops, Macs)
#   deploy/podman/install.sh --update      rebuild from the current code and restart (keeps data, keys, settings)
#
# Run as root for a system-wide install, or as a normal user for a rootless install.
# Everything it creates: the image localhost/forced-sale-finder, Podman secrets fsf-*, the volume
# forced-sale-finder-data, and (with systemd) unit files in the Quadlet folder.
set -euo pipefail

MODE=systemd
case "${1:-}" in
  --no-systemd) MODE=plain ;;
  --update) MODE=update ;;
  ""|--systemd) ;;
  -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
  *) echo "Unknown option: $1 (try --help)"; exit 1 ;;
esac

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE=localhost/forced-sale-finder:latest
KEY_DIR="${FSF_KEY_DIR:-$HOME/.config/forced-sale-finder}"
if [ "$(id -u)" = 0 ]; then QUADLET_DIR=/etc/containers/systemd; SYSTEMCTL=(systemctl); else QUADLET_DIR="$HOME/.config/containers/systemd"; SYSTEMCTL=(systemctl --user); fi

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nError: %s\n' "$*" >&2; exit 1; }

# ---------- prerequisites ----------
command -v podman >/dev/null || die "Podman is not installed. See the README: Deploy with Podman > Prerequisites."
command -v openssl >/dev/null || die "OpenSSL is not installed (needed to create the signing key)."
PV=$(podman version --format '{{.Client.Version}}' 2>/dev/null || podman --version | awk '{print $3}')
if [ "$MODE" = systemd ]; then
  printf '4.4.0\n%s\n' "$PV" | sort -V -C || die "Podman $PV is too old for systemd services (Quadlet needs 4.4+). Upgrade, or run with --no-systemd."
  command -v systemctl >/dev/null || die "systemd not found. Run with --no-systemd instead."
fi

# ---------- signing keys (created once, reused on every update) ----------
# Two key pairs: feed-signing.pem signs listings (listings updater only); directory-signing.pem signs the
# advertiser directory (web server only). A compromised web server then can't publish fake listings.
mkdir -p "$KEY_DIR" && chmod 700 "$KEY_DIR"
for k in feed directory; do
  if [ ! -f "$KEY_DIR/$k-signing.pem" ]; then
    say "Creating the $k signing key in $KEY_DIR"
    openssl genpkey -algorithm ed25519 -out "$KEY_DIR/$k-signing.pem"
    chmod 600 "$KEY_DIR/$k-signing.pem"
  fi
  openssl pkey -in "$KEY_DIR/$k-signing.pem" -pubout -outform DER | base64 | tr -d '\n' > "$KEY_DIR/$k-public-key.txt"
done
PUBLIC_KEY=$(cat "$KEY_DIR/feed-public-key.txt")
DIRECTORY_PUBLIC_KEY=$(cat "$KEY_DIR/directory-public-key.txt")

# ---------- build ----------
say "Building the image (installs packages, runs the tests, builds the site; takes a few minutes)"
# shellcheck disable=SC2086
podman build ${PODMAN_BUILD_ARGS:-} -t "$IMAGE" --build-arg FEED_PUBLIC_KEY="$PUBLIC_KEY" --build-arg DIRECTORY_PUBLIC_KEY="$DIRECTORY_PUBLIC_KEY" -f "$REPO/Containerfile" "$REPO"

if [ "$MODE" = update ]; then
  say "Restarting with the new image"
  if "${SYSTEMCTL[@]}" cat forced-sale-finder-web.service >/dev/null 2>&1; then
    "${SYSTEMCTL[@]}" restart forced-sale-finder-web.service forced-sale-finder-ingest.service
  else
    for c in forced-sale-finder-web forced-sale-finder-ingest; do
      podman inspect "$c" >/dev/null 2>&1 || die "No running install found. Run install.sh without --update first."
    done
    podman rm -f forced-sale-finder-web forced-sale-finder-ingest >/dev/null
    FSF_RECREATE=1
  fi
  if [ -z "${FSF_RECREATE:-}" ]; then podman image prune -f >/dev/null; echo "Updated."; exit 0; fi
fi

if [ -z "${FSF_RECREATE:-}" ]; then
  # ---------- settings ----------
  say "Settings"
  read -r -p "Web address people will use [http://localhost:8080]: " BASE_URL
  BASE_URL=${BASE_URL:-http://localhost:8080}
  BASE_URL=${BASE_URL%/}
  [[ "$BASE_URL" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "Use a plain address like https://example.com or http://localhost:8080"
  read -r -p "Admin username [admin]: " ADMIN_USER
  ADMIN_USER=${ADMIN_USER:-admin}
  while :; do
    read -r -s -p "Admin password (12+ characters): " PW1; echo
    read -r -s -p "Repeat the password: " PW2; echo
    [ "$PW1" = "$PW2" ] || { echo "They don't match. Try again."; continue; }
    [ ${#PW1} -ge 12 ] || { echo "Use at least 12 characters."; continue; }
    break
  done
  CADDY=no
  if [[ "$BASE_URL" == https://* ]] && [ "$MODE" = systemd ]; then
    read -r -p "Get a free HTTPS certificate automatically with Caddy? (needs ports 80/443 and DNS pointing here) [Y/n]: " A
    [[ "${A:-y}" =~ ^[Yy] ]] && CADDY=yes
  fi
  TRUST_PROXY=0; [[ "$BASE_URL" == https://* ]] && TRUST_PROXY=1
  TRUST_CLOUDFLARE=0
  if [[ "$BASE_URL" == https://* ]]; then
    read -r -p "Will Cloudflare proxy this domain (orange cloud)? See README: Cloudflare [y/N]: " A
    [[ "${A:-n}" =~ ^[Yy] ]] && TRUST_CLOUDFLARE=1
  fi
  echo "Email: paste your Postmark Server API token to send email now (README: Email), or press Enter to set it up later."
  read -r -s -p "Postmark Server API token [skip]: " PM_TOKEN; echo
  MAIL_FROM=""
  if [ -n "$PM_TOKEN" ]; then
    read -r -p "Send email from (an address verified in Postmark), like no-reply@your-domain: " MAIL_ADDR
    [[ "$MAIL_ADDR" =~ ^[^[:space:]@\<\>]+@[^[:space:]@\<\>]+\.[^[:space:]@\<\>]+$ ]] || die "That doesn't look like an email address."
    MAIL_FROM="DeedOwl <$MAIL_ADDR>"
  fi

  # ---------- secrets ----------
  say "Storing secrets in Podman"
  HASH=$(printf '%s\n' "$PW1" | podman run --rm -i "$IMAGE" node --import tsx server/hash-password.ts 2>/dev/null)
  unset PW1 PW2
  [[ "$HASH" == scrypt\$* ]] || die "Could not create the password hash."
  podman secret rm fsf-admin-password-hash fsf-feed-signing-key >/dev/null 2>&1 || true
  printf '%s' "$HASH" | podman secret create fsf-admin-password-hash - >/dev/null
  podman secret create fsf-feed-signing-key "$KEY_DIR/feed-signing.pem" >/dev/null
  podman secret rm fsf-directory-signing-key >/dev/null 2>&1 || true
  podman secret create fsf-directory-signing-key "$KEY_DIR/directory-signing.pem" >/dev/null
  if [ -n "$PM_TOKEN" ]; then
    podman secret rm fsf-postmark-token >/dev/null 2>&1 || true
    printf '%s' "$PM_TOKEN" | podman secret create fsf-postmark-token - >/dev/null
  fi
  unset PM_TOKEN
fi
# Installs from before the directory key existed: add its secret on update.
podman secret inspect fsf-directory-signing-key >/dev/null 2>&1 || podman secret create fsf-directory-signing-key "$KEY_DIR/directory-signing.pem" >/dev/null
HAS_MAIL=""; podman secret inspect fsf-postmark-token >/dev/null 2>&1 && HAS_MAIL=1

HEALTH="node -e \"fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))\""

if [ "$MODE" = systemd ]; then
  say "Installing systemd services in $QUADLET_DIR"
  mkdir -p "$QUADLET_DIR"
  cp "$REPO"/deploy/podman/quadlet/forced-sale-finder.volume "$REPO"/deploy/podman/quadlet/forced-sale-finder-web.container \
     "$REPO"/deploy/podman/quadlet/forced-sale-finder-ingest.container "$QUADLET_DIR/"
  # Without a proxy in front, and a real host name, listen on all interfaces instead of only this machine.
  HOST_PART=${BASE_URL#*://}; HOST_PART=${HOST_PART%%:*}
  if [ "$CADDY" = no ] && [ "$TRUST_PROXY" = 0 ] && [ "$HOST_PART" != localhost ] && [ "$HOST_PART" != 127.0.0.1 ]; then
    sed -i 's|^PublishPort=127.0.0.1:8080:8080|PublishPort=8080:8080|' "$QUADLET_DIR/forced-sale-finder-web.container"
  fi
  if [ -n "$HAS_MAIL" ]; then sed -i 's|^#Secret=fsf-postmark-token|Secret=fsf-postmark-token|' "$QUADLET_DIR/forced-sale-finder-web.container"; fi
  cat > "$QUADLET_DIR/forced-sale-finder.env" <<EOF
BASE_URL=$BASE_URL
ADMIN_USERNAME=$ADMIN_USER
TRUST_PROXY=$TRUST_PROXY
TRUST_CLOUDFLARE=$TRUST_CLOUDFLARE
BACKUP_KEEP=7
EOF
  if [ -n "${MAIL_FROM:-}" ]; then printf 'MAIL_FROM=%s\n' "$MAIL_FROM" >> "$QUADLET_DIR/forced-sale-finder.env"; fi
  if [ "$CADDY" = yes ]; then
    DOMAIN=${BASE_URL#https://}; DOMAIN=${DOMAIN%%:*}
    cp "$REPO"/deploy/podman/quadlet/forced-sale-finder-caddy.container "$REPO"/deploy/podman/quadlet/forced-sale-finder-caddy.volume "$QUADLET_DIR/"
    printf '%s {\n\tencode zstd gzip\n\treverse_proxy 127.0.0.1:8080\n}\n' "$DOMAIN" > "$QUADLET_DIR/Caddyfile"
    if [ "$(id -u)" != 0 ] && [ "$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo 1024)" -gt 80 ]; then
      echo "Note: rootless Caddy needs ports 80/443. Run once as root:"
      echo "  echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf && sudo sysctl --system"
    fi
  fi
  "${SYSTEMCTL[@]}" daemon-reload
  "${SYSTEMCTL[@]}" restart forced-sale-finder-web.service forced-sale-finder-ingest.service
  [ "$CADDY" = yes ] && "${SYSTEMCTL[@]}" restart forced-sale-finder-caddy.service
  if [ "$(id -u)" != 0 ] && command -v loginctl >/dev/null; then
    loginctl enable-linger "$USER" 2>/dev/null || echo "Tip: run 'sudo loginctl enable-linger $USER' so the site starts at boot without you logging in."
  fi
else
  say "Starting the containers"
  podman volume create --ignore forced-sale-finder-data >/dev/null
  podman rm -f forced-sale-finder-web forced-sale-finder-ingest >/dev/null 2>&1 || true
  if [ -n "${FSF_RECREATE:-}" ]; then
    ENV_ARGS=(--env-file "$KEY_DIR/forced-sale-finder.env")
  else
    printf 'BASE_URL=%s\nADMIN_USERNAME=%s\nTRUST_PROXY=%s\nTRUST_CLOUDFLARE=%s\nBACKUP_KEEP=7\n' "$BASE_URL" "$ADMIN_USER" "$TRUST_PROXY" "$TRUST_CLOUDFLARE" > "$KEY_DIR/forced-sale-finder.env"
    if [ -n "${MAIL_FROM:-}" ]; then printf 'MAIL_FROM=%s\n' "$MAIL_FROM" >> "$KEY_DIR/forced-sale-finder.env"; fi
    ENV_ARGS=(--env-file "$KEY_DIR/forced-sale-finder.env")
  fi
  MAIL_ARGS=(); if [ -n "$HAS_MAIL" ]; then MAIL_ARGS=(--secret fsf-postmark-token,type=env,target=POSTMARK_SERVER_TOKEN); fi
  podman run -d --name forced-sale-finder-web --restart=always -p "${FSF_PORT:-8080}:8080" -v forced-sale-finder-data:/data "${ENV_ARGS[@]}" ${MAIL_ARGS[@]+"${MAIL_ARGS[@]}"} \
    --secret fsf-admin-password-hash,type=env,target=ADMIN_PASSWORD_HASH --secret fsf-directory-signing-key,type=env,target=DIRECTORY_SIGNING_KEY \
    --read-only --security-opt no-new-privileges --cap-drop all --health-cmd "$HEALTH" --health-interval 30s "$IMAGE" >/dev/null
  podman run -d --name forced-sale-finder-ingest --restart=always -v forced-sale-finder-data:/data \
    --secret fsf-feed-signing-key,type=env,target=FEED_SIGNING_KEY --read-only --security-opt no-new-privileges --cap-drop all \
    "$IMAGE" node --import tsx ingest/run.ts --watch >/dev/null
fi

say "Checking that the site is up"
for _ in $(seq 1 30); do
  if podman exec forced-sale-finder-web sh -c "$HEALTH" >/dev/null 2>&1; then OK=1; break; fi
  sleep 2
done
[ -n "${OK:-}" ] || die "The site didn't start. See the log: podman logs forced-sale-finder-web"
podman image prune -f >/dev/null 2>&1 || true

URL=$(grep '^BASE_URL=' "$( [ "$MODE" = systemd ] && echo "$QUADLET_DIR" || echo "$KEY_DIR")/forced-sale-finder.env" | cut -d= -f2-)
cat <<EOF

DeedOwl is running.
  Site:          $URL
  Admin page:    $URL/#/admin
  Signing keys:  $KEY_DIR/feed-signing.pem and directory-signing.pem   (back these up; keep them private)
  Data volume:   forced-sale-finder-data (database, daily backups, feeds)
  Logs:          podman logs -f forced-sale-finder-web
  Email:         $( [ -n "$HAS_MAIL" ] && echo "on (Postmark)" || echo "OFF: emails only go to the log. See README > Email." )
  Update later:  git pull && deploy/podman/install.sh --update
  Auto-deploy:   deploy/podman/auto-deploy.sh   (updates the site whenever main changes; see README)
  Off-site copy: deploy/podman/offsite-backup.sh (database to Cloudflare R2 within seconds; see README)
EOF
