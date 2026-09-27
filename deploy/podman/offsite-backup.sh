#!/usr/bin/env bash
# DeedOwl: continuous off-site copy of the database in Cloudflare R2, with Litestream (run after install.sh).
#
#   deploy/podman/offsite-backup.sh             set it up (asks for your R2 bucket and access key), or change it
#   deploy/podman/offsite-backup.sh --status    show whether it's copying
#   deploy/podman/offsite-backup.sh --restore   replace this server's database with the copy in R2
#                                               (for a rebuilt or new server: run install.sh first, then this)
#
# Every database change (advertisers, alert sign-ups, leads, stats) reaches R2 within about 10 seconds, so losing
# the server loses at most seconds of data. The R2 access key is stored only as a Podman secret on this server.
set -euo pipefail

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nError: %s\n' "$*" >&2; exit 1; }

MODE=setup
case "${1:-}" in
  "") ;;
  --status) MODE=status ;;
  --restore) MODE=restore ;;
  -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
  *) die "Unknown option: $1 (try --help)" ;;
esac

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LS_IMAGE=$(sed -n 's/^Image=//p' "$REPO/deploy/podman/quadlet/forced-sale-finder-litestream.container")
if [ "$(id -u)" = 0 ]; then QUADLET_DIR=/etc/containers/systemd; SYSTEMCTL=(systemctl); JOURNAL=(journalctl); else QUADLET_DIR="$HOME/.config/containers/systemd"; SYSTEMCTL=(systemctl --user); JOURNAL=(journalctl --user); fi
UNIT=forced-sale-finder-litestream.service

command -v podman >/dev/null || die "Podman is not installed."
[ -f "$QUADLET_DIR/forced-sale-finder-web.container" ] || die "No systemd install found in $QUADLET_DIR. Run deploy/podman/install.sh first."

# The same flags the service uses, for one-off commands (status, restore).
ls_run() {
  podman run --rm --user 1001 -v forced-sale-finder-data:/data -v "$QUADLET_DIR/litestream.yml":/etc/litestream.yml:ro,Z \
    --env-file "$QUADLET_DIR/litestream.env" \
    --secret fsf-r2-access-key-id,type=env,target=LITESTREAM_ACCESS_KEY_ID \
    --secret fsf-r2-secret-access-key,type=env,target=LITESTREAM_SECRET_ACCESS_KEY \
    --security-opt no-new-privileges --cap-drop all "$LS_IMAGE" "$@"
}

if [ "$MODE" = status ]; then
  "${SYSTEMCTL[@]}" is-active --quiet "$UNIT" && echo "Off-site copy: running." || echo "Off-site copy: NOT running. Start it: ${SYSTEMCTL[*]} start $UNIT"
  "${JOURNAL[@]}" -u "$UNIT" -n 5 --no-pager 2>/dev/null || true
  exit 0
fi

if [ "$MODE" = restore ]; then
  [ -f "$QUADLET_DIR/litestream.env" ] || die "Not set up yet. Run this script without --restore first (it asks for your R2 details)."
  APP_IMAGE=$(sed -n 's/^Image=//p' "$QUADLET_DIR/forced-sale-finder-web.container")
  echo "This replaces the database on this server with the latest copy in R2."
  echo "The current database is kept as app.db.before-restore in the same folder."
  read -r -p "Type RESTORE to continue: " A
  [ "$A" = RESTORE ] || { echo "Cancelled."; exit 0; }
  say "Stopping the site"
  "${SYSTEMCTL[@]}" stop "$UNIT" forced-sale-finder-ingest.service forced-sale-finder-web.service 2>/dev/null || true
  say "Downloading the copy from R2"
  ls_run restore -if-replica-exists -o /data/db/app.db.restored /data/db/app.db
  podman run --rm --user 1001 -v forced-sale-finder-data:/data "$APP_IMAGE" sh -c '
    set -e; cd /data/db
    [ -f app.db.restored ] || { echo "R2 has no copy yet; nothing changed."; exit 3; }
    if [ -f app.db ]; then mv -f app.db app.db.before-restore; fi
    rm -f app.db-wal app.db-shm
    mv app.db.restored app.db' || { "${SYSTEMCTL[@]}" start forced-sale-finder-web.service forced-sale-finder-ingest.service "$UNIT"; exit 1; }
  say "Starting the site"
  "${SYSTEMCTL[@]}" start forced-sale-finder-web.service forced-sale-finder-ingest.service "$UNIT"
  echo "Restored. Check the admin page, then keep or delete /data/db/app.db.before-restore."
  exit 0
fi

# ---------- setup ----------
cat <<'EOF'
You need, from the Cloudflare dashboard (README > Off-site database copy has the clicks):
  1. Your Account ID (R2 > Overview, right-hand side; 32 letters and numbers).
  2. A private R2 bucket, for example deedowl-db.
  3. An R2 API token limited to that bucket with "Object Read & Write": its Access Key ID and Secret Access Key.
EOF
read -r -p "Cloudflare Account ID: " ACCOUNT
ACCOUNT=$(printf '%s' "$ACCOUNT" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
[[ "$ACCOUNT" =~ ^[0-9a-f]{32}$ ]] || die "That doesn't look like a Cloudflare Account ID (32 characters, 0-9 and a-f)."
read -r -p "Bucket name [deedowl-db]: " BUCKET
BUCKET=${BUCKET:-deedowl-db}
[[ "$BUCKET" =~ ^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$ ]] || die "Bucket names use lowercase letters, numbers and dashes (3-63 characters)."
read -r -p "Access Key ID: " KEY_ID
KEY_ID=$(printf '%s' "$KEY_ID" | tr -d '[:space:]')
[[ "$KEY_ID" =~ ^[A-Za-z0-9]{16,128}$ ]] || die "That doesn't look like an R2 Access Key ID."
read -r -s -p "Secret Access Key (hidden): " SECRET; echo
SECRET=$(printf '%s' "$SECRET" | tr -d '[:space:]')
[ ${#SECRET} -ge 32 ] || die "That Secret Access Key looks too short."

say "Storing the access key as Podman secrets"
podman secret rm fsf-r2-access-key-id fsf-r2-secret-access-key >/dev/null 2>&1 || true
printf '%s' "$KEY_ID" | podman secret create fsf-r2-access-key-id - >/dev/null
printf '%s' "$SECRET" | podman secret create fsf-r2-secret-access-key - >/dev/null
unset SECRET

say "Installing the service"
printf 'R2_ACCOUNT_ID=%s\nLITESTREAM_BUCKET=%s\n' "$ACCOUNT" "$BUCKET" > "$QUADLET_DIR/litestream.env"
cp "$REPO/deploy/podman/quadlet/litestream.yml" "$REPO/deploy/podman/quadlet/forced-sale-finder-litestream.container" "$QUADLET_DIR/"
"${SYSTEMCTL[@]}" daemon-reload
"${SYSTEMCTL[@]}" restart "$UNIT"

say "Checking the first copy reaches R2"
for _ in $(seq 1 20); do
  sleep 3
  LOG=$("${JOURNAL[@]}" -u "$UNIT" -n 50 --no-pager 2>/dev/null || true)
  if grep -q 'snapshot complete' <<<"$LOG"; then OK=1; break; fi
  if grep -qiE 'level=ERROR|AccessDenied|NoSuchBucket|InvalidAccessKeyId|SignatureDoesNotMatch' <<<"$LOG"; then break; fi
done
if [ -z "${OK:-}" ]; then
  "${JOURNAL[@]}" -u "$UNIT" -n 15 --no-pager 2>/dev/null || true
  die "The first copy didn't reach R2. Check the Account ID, bucket name and the token's bucket access, then run this again."
fi

cat <<EOF

Off-site copy is on.
  Bucket:     $BUCKET (Cloudflare R2), folder deedowl/
  Status:     deploy/podman/offsite-backup.sh --status
  Restore:    deploy/podman/offsite-backup.sh --restore   (on a new server: after install.sh)
EOF
