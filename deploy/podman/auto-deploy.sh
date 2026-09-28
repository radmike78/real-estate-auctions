#!/usr/bin/env bash
# DeedOwl: turn on automatic deploys for a Podman install (run after install.sh).
#
#   deploy/podman/auto-deploy.sh                     use ghcr.io/<owner>/<repo>:latest (from this checkout's git remote)
#   deploy/podman/auto-deploy.sh --image REF         use another published image
#   deploy/podman/auto-deploy.sh --every MINUTES     how often to check for a new image (default 10)
#
# How it works: every change merged into main is tested by GitHub Actions, built into an image and published to
# GitHub Container Registry (see .github/workflows/ci.yml). This server checks the registry on a timer
# (podman auto-update), pulls a new image when there is one, and restarts the site with it. If the new version
# doesn't start, Podman rolls back to the previous image. GitHub never gets access to this server.
#
# To go back to building on this server, run install.sh --update, then edit Image= in the Quadlet files back to
# localhost/forced-sale-finder:latest and run: systemctl daemon-reload.
set -euo pipefail

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nError: %s\n' "$*" >&2; exit 1; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE=""
EVERY=10
while [ $# -gt 0 ]; do
  case "$1" in
    --image) IMAGE="${2:-}"; shift 2 ;;
    --every) EVERY="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done
[[ "$EVERY" =~ ^[0-9]+$ ]] && [ "$EVERY" -ge 5 ] && [ "$EVERY" -le 60 ] || die "--every must be 5 to 60 minutes."

if [ -z "$IMAGE" ]; then
  REMOTE=$(git -C "$REPO" remote get-url origin 2>/dev/null || true)
  SLUG=$(printf '%s' "$REMOTE" | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##' | tr '[:upper:]' '[:lower:]')
  [[ "$SLUG" =~ ^[a-z0-9._-]+/[a-z0-9._-]+$ ]] || die "Couldn't work out the image name from the git remote. Use --image ghcr.io/OWNER/REPO:latest"
  IMAGE="ghcr.io/$SLUG:latest"
fi
[[ "$IMAGE" =~ ^[a-z0-9.-]+(:[0-9]+)?/[a-z0-9._/-]+:[A-Za-z0-9._-]+$ ]] || die "That doesn't look like an image reference: $IMAGE"
REGISTRY=${IMAGE%%/*}

KEY_DIR="${FSF_KEY_DIR:-$HOME/.config/forced-sale-finder}"
if [ "$(id -u)" = 0 ]; then
  QUADLET_DIR=/etc/containers/systemd; SYSTEMCTL=(systemctl); TIMER_DIR=/etc/systemd/system/podman-auto-update.timer.d
  SERVICE_DIR=/etc/systemd/system/podman-auto-update.service.d; AUTHFILE=/etc/containers/deedowl-auth.json
else
  QUADLET_DIR="$HOME/.config/containers/systemd"; SYSTEMCTL=(systemctl --user); TIMER_DIR="$HOME/.config/systemd/user/podman-auto-update.timer.d"
  SERVICE_DIR="$HOME/.config/systemd/user/podman-auto-update.service.d"; AUTHFILE="$HOME/.config/containers/deedowl-auth.json"
fi

# ---------- prerequisites ----------
command -v podman >/dev/null || die "Podman is not installed."
[ -f "$QUADLET_DIR/forced-sale-finder-web.container" ] || die "No systemd install found in $QUADLET_DIR. Run deploy/podman/install.sh first."
for k in feed directory; do [ -f "$KEY_DIR/$k-public-key.txt" ] || die "Missing $KEY_DIR/$k-public-key.txt. Run deploy/podman/install.sh first."; done
FEED_KEY=$(cat "$KEY_DIR/feed-public-key.txt"); DIR_KEY=$(cat "$KEY_DIR/directory-public-key.txt")
PV=$(podman version --format '{{.Client.Version}}' 2>/dev/null || podman --version | awk '{print $3}')

# ---------- the published image must carry this server's public keys ----------
say "Your public signing keys (safe to share)"
cat <<EOF
The image GitHub builds must contain this server's two public keys, or browsers will refuse the site's listings.
In GitHub: the repository > Settings > Secrets and variables > Actions > Variables, set:

  FEED_PUBLIC_KEY       = $FEED_KEY
  DIRECTORY_PUBLIC_KEY  = $DIR_KEY

Then publish a fresh image: Actions > CI > Run workflow (branch: main), and wait for it to finish.
EOF
read -r -p "Done, and the CI run on main has finished? [y/N]: " A
[[ "${A:-n}" =~ ^[Yy] ]] || { echo "Run this script again when it has."; exit 0; }

# ---------- registry access ----------
AUTH_ARGS=()
say "Pulling $IMAGE"
if [ -f "$AUTHFILE" ] && podman pull --authfile "$AUTHFILE" "$IMAGE" >/dev/null 2>&1; then
  AUTH_ARGS=(--authfile "$AUTHFILE") # the token saved on an earlier run still works
elif ! podman pull "$IMAGE" >/dev/null 2>&1; then
  echo "The image is private (or not published yet). Create a GitHub token that can only read packages:"
  echo "  GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) > scope: read:packages"
  read -r -p "GitHub username: " GH_USER
  read -r -s -p "Token (read:packages only): " GH_TOKEN; echo
  mkdir -p "$(dirname "$AUTHFILE")"
  printf '%s' "$GH_TOKEN" | podman login --authfile "$AUTHFILE" "$REGISTRY" -u "$GH_USER" --password-stdin >/dev/null || die "Login to $REGISTRY failed."
  unset GH_TOKEN
  chmod 600 "$AUTHFILE"
  AUTH_ARGS=(--authfile "$AUTHFILE")
  podman pull "${AUTH_ARGS[@]}" "$IMAGE" >/dev/null || die "Couldn't pull $IMAGE. Check that CI has published it (Actions > CI on main)."
fi

say "Checking the image carries this server's keys"
podman run --rm -e K1="$FEED_KEY" -e K2="$DIR_KEY" "$IMAGE" node -e "
  const fs = require('fs'); const d = 'dist/assets';
  const js = fs.readdirSync(d).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(d + '/' + f, 'utf8')).join('');
  process.exit(js.includes(process.env.K1) && js.includes(process.env.K2) ? 0 : 1);" \
  || die "The published image was built with different public keys. Set the two GitHub variables above, re-run CI on main, then run this again."

# ---------- switch the services to the published image ----------
say "Switching the site to $IMAGE with automatic updates"
for f in forced-sale-finder-web forced-sale-finder-ingest; do
  u="$QUADLET_DIR/$f.container"
  sed -i -E "s#^Image=.*#Image=$IMAGE#" "$u"
  grep -q '^AutoUpdate=' "$u" || sed -i -E "s#^Image=.*#&\nAutoUpdate=registry#" "$u"
  if [ ${#AUTH_ARGS[@]} -gt 0 ] && ! grep -q '^Environment=REGISTRY_AUTH_FILE=' "$u"; then
    sed -i -E "s#^\[Service\]#&\nEnvironment=REGISTRY_AUTH_FILE=$AUTHFILE#" "$u"
  fi
done
# Podman 5 can wait for the health check before calling a start successful, so a broken release rolls back.
if printf '5.0.0\n%s\n' "$PV" | sort -V -C; then
  grep -q '^Notify=healthy' "$QUADLET_DIR/forced-sale-finder-web.container" || sed -i -E 's#^HealthOnFailure=.*#&\nNotify=healthy#' "$QUADLET_DIR/forced-sale-finder-web.container"
fi

mkdir -p "$TIMER_DIR"
cat > "$TIMER_DIR/deedowl.conf" <<EOF
# DeedOwl: check for a new image every $EVERY minutes.
[Timer]
OnCalendar=
OnCalendar=*:0/$EVERY
RandomizedDelaySec=60
Persistent=true
EOF
if [ ${#AUTH_ARGS[@]} -gt 0 ]; then
  mkdir -p "$SERVICE_DIR"
  printf '[Service]\nEnvironment=REGISTRY_AUTH_FILE=%s\n' "$AUTHFILE" > "$SERVICE_DIR/deedowl.conf"
fi

"${SYSTEMCTL[@]}" daemon-reload
"${SYSTEMCTL[@]}" restart forced-sale-finder-web.service forced-sale-finder-ingest.service
"${SYSTEMCTL[@]}" enable --now podman-auto-update.timer >/dev/null

say "Checking that the site is up"
HEALTH="node -e \"fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))\""
for _ in $(seq 1 30); do
  if podman exec forced-sale-finder-web sh -c "$HEALTH" >/dev/null 2>&1; then OK=1; break; fi
  sleep 2
done
[ -n "${OK:-}" ] || die "The site didn't start on the published image. See: podman logs forced-sale-finder-web"

cat <<EOF

Automatic deploys are on.
  Image:          $IMAGE
  Checks:         every $EVERY minutes (podman-auto-update.timer)
  See pending:    podman auto-update --dry-run
  Deploy now:     podman auto-update
  History:        journalctl -u podman-auto-update.service$( [ "$(id -u)" != 0 ] && echo ' --user')
Merging a pull request into main now reaches the site within about $EVERY minutes of CI finishing.
EOF
