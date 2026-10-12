#!/usr/bin/env bash
# Enable optional DeedOwl accounts on an existing Podman + systemd (Quadlet) server.
# Run as the SAME Linux user that installed the site; do not add sudo to a rootless install.
#   bash deploy/podman/enable-learner-accounts.sh --check  # read-only prerequisites check
#   bash deploy/podman/enable-learner-accounts.sh          # enable, restart web only, verify
# FSF_KEY_DIR / FSF_QUADLET_DIR can override the install locations.
set +x # Even bash -x must not expose credentials.
set -euo pipefail
umask 077
say() { printf '\n%s\n' "$*"; }
die() { printf '\nError: %s\n' "$*" >&2; exit 1; }
CHECK=0
case "${1:-}" in
  --check) CHECK=1 ;;
  -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
  '') ;;
  *) die 'Use --check, --help, or no option.' ;;
esac
[ "$#" -le 1 ] || die 'Too many arguments.'
for tool in podman systemctl python3 openssl flock; do command -v "$tool" >/dev/null || die "Install $tool first."; done
if [ "$(id -u)" = 0 ]; then DEFAULT_QUADLET=/etc/containers/systemd; CTL=(systemctl); else DEFAULT_QUADLET="$HOME/.config/containers/systemd"; CTL=(systemctl --user); fi
QUADLET_DIR="${FSF_QUADLET_DIR:-$DEFAULT_QUADLET}"
KEY_DIR="${FSF_KEY_DIR:-$HOME/.config/forced-sale-finder}"
UNIT="$QUADLET_DIR/forced-sale-finder-web.container"
KEY_FILE="$KEY_DIR/learner-account-key.hex"
SECRET=fsf-account-encryption-key
CONTAINER=forced-sale-finder-web
SERVICE=forced-sale-finder-web.service
[ -f "$UNIT" ] && [ ! -L "$UNIT" ] || die "No regular web Quadlet found in $QUADLET_DIR. Run as the original install user. This script requires the systemd install."
[ ! -L "$KEY_DIR" ] && [ ! -L "$KEY_FILE" ] || die 'Refusing a symlink for the key directory or key file.'
# Parse the one EnvironmentFile in [Container]; never source/eval a configuration file.
ENV_FILE=$(python3 - "$UNIT" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]); section=''; paths=[]
for line in p.read_text().splitlines():
 s=line.strip()
 if s.startswith('['): section=s
 elif section=='[Container]' and s.startswith('EnvironmentFile='):
  v=s.split('=',1)[1].strip()
  if v.startswith('"') and v.endswith('"'):v=v[1:-1]
  if not v or '%' in v:sys.exit('Unsupported EnvironmentFile: use the existing simple file path.')
  paths.append(v)
if len(paths)!=1:sys.exit('Expected exactly one EnvironmentFile in the web Quadlet.')
v=pathlib.Path(paths[0]); print(v if v.is_absolute() else p.parent/v)
PY
) || die 'Could not locate the web environment file.'
[ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] || die "Missing regular environment file: $ENV_FILE"
# A different existing key source must be preserved, not silently replaced.
python3 - "$UNIT" "$ENV_FILE" <<'PY' || die 'An account encryption key is already configured differently. Preserve it and use the manual setup guide.'
import re,sys,pathlib
u=pathlib.Path(sys.argv[1]).read_text(); e=pathlib.Path(sys.argv[2]).read_text()
if re.search(r'^\s*(?:export\s+)?ACCOUNT_ENCRYPTION_KEY\s*=',e,re.M):sys.exit(1)
if re.search(r'^\s*Environment=.*\bACCOUNT_ENCRYPTION_KEY=',u,re.M):sys.exit(1)
for line in u.splitlines():
 line=line.strip()
 if line.startswith('Secret=') and 'target=ACCOUNT_ENCRYPTION_KEY' in line and not line.startswith('Secret=fsf-account-encryption-key,'):sys.exit(1)
PY
"${CTL[@]}" is-active --quiet "$SERVICE" || die 'The web service is not running. Start the existing installation first.'

if [ "$CHECK" = 0 ]; then
  mkdir -p "$KEY_DIR"; chmod 700 "$KEY_DIR"
  [ ! -L "$KEY_DIR/learner-account-setup.lock" ] || die 'Refusing a symlink setup lock.'
  exec 9>"$KEY_DIR/learner-account-setup.lock"
  flock -n 9 || die 'Another account setup is running.'
fi
if [ -e "$KEY_FILE" ]; then
  [ -f "$KEY_FILE" ] || die 'The key path is not a regular file.'
  python3 - "$KEY_FILE" <<'PY' || die 'Existing key file is invalid; it was not changed. Recover the original key rather than replacing it.'
import pathlib,re,sys
if not re.fullmatch('[a-fA-F0-9]{64}',pathlib.Path(sys.argv[1]).read_text().strip()):sys.exit(1)
PY
fi
# Read-only checks in the current container. No profile, email or key is printed.
PREFLIGHT=$(cat <<'JS'
const fs=require('fs'), crypto=require('crypto');
const fail=m=>{console.error(m);process.exit(1);};
try {
 if(!fs.existsSync('server/accounts.ts'))fail('The running image does not include accounts yet. Let the latest deployment finish first.');
 if(!/^https:\/\//.test(process.env.BASE_URL||''))fail('Configure the public HTTPS BASE_URL first.');
 if(!process.env.MAIL_FROM || !(process.env.RESEND_API_KEY || process.env.POSTMARK_SERVER_TOKEN) || process.env.POSTMARK_SERVER_TOKEN==='POSTMARK_API_TEST')fail('Configure a real email provider and verified MAIL_FROM first.');
 const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync(process.env.DB_PATH||'server/data/app.db',{readOnly:true});
 const exists=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='learner_accounts'").get();
 const sample=exists ? db.prepare('SELECT id, profile FROM learner_accounts LIMIT 1').get() : null;
 const candidate=fs.readFileSync(0,'utf8').trim(); const current=process.env.ACCOUNT_ENCRYPTION_KEY;
 if(!candidate && (sample||current))fail('Existing account data or a key was found. Restore learner-account-key.hex from its protected backup; this script will not generate a replacement.');
 if(candidate && current && !Buffer.from(candidate,'hex').equals(Buffer.from(current,'hex')))fail('The key file does not match the running account key. Nothing was changed.');
 if(candidate && sample){
  const k=crypto.createHmac('sha256',Buffer.from(candidate,'hex')).update('deedowl-account-encryption-v1').digest();
  const b=Buffer.from(sample.profile,'base64'), d=crypto.createDecipheriv('aes-256-gcm',k,b.subarray(0,12));
  d.setAAD(Buffer.from(`profile:${sample.id}`));d.setAuthTag(b.subarray(12,28));d.update(b.subarray(28));d.final();
 }
 db.close();
} catch {fail('Could not safely verify the existing database/key. Nothing was changed. Recover the original key if accounts already exist.');}
JS
)
if [ -f "$KEY_FILE" ]; then podman exec -i "$CONTAINER" node --no-warnings -e "$PREFLIGHT" < "$KEY_FILE" || die 'Prerequisite check failed.';
else podman exec -i "$CONTAINER" node --no-warnings -e "$PREFLIGHT" < /dev/null || die 'Prerequisite check failed.'; fi
if [ "$CHECK" = 1 ]; then say 'Prerequisites passed. No keys or settings were changed. Run without --check to enable accounts.'; exit 0; fi

if [ ! -f "$KEY_FILE" ]; then
  # Lock held; create once, atomically, with restrictive permissions. Never print it.
  TEMP_KEY=$(mktemp "$KEY_DIR/.learner-key.XXXXXX")
  openssl rand -hex 32 > "$TEMP_KEY" || { rm -f "$TEMP_KEY"; die 'Key generation failed.'; }
  chmod 600 "$TEMP_KEY"; mv "$TEMP_KEY" "$KEY_FILE"
fi
chmod 600 "$KEY_FILE"
if ! podman secret inspect "$SECRET" >/dev/null 2>&1; then podman secret create "$SECRET" "$KEY_FILE" >/dev/null || die 'Could not create the account secret. The key file was kept.'; fi
# Compare an existing secret to the protected file without --showsecret, printing the key or passing it in argv.
KEY_HASH=$(python3 - "$KEY_FILE" <<'PY'
import hashlib,pathlib,sys
print(hashlib.sha256(bytes.fromhex(pathlib.Path(sys.argv[1]).read_text().strip())).hexdigest())
PY
)
IMAGE=$(podman inspect --format '{{.Image}}' "$CONTAINER")
podman run --rm --pull=never --network=none --read-only --cap-drop=all --security-opt=no-new-privileges \
  --secret "$SECRET,type=env,target=ACCOUNT_ENCRYPTION_KEY" --env "EXPECTED_KEY_HASH=$KEY_HASH" "$IMAGE" \
  node -e 'const c=require("crypto");const k=(process.env.ACCOUNT_ENCRYPTION_KEY||"").trim();process.exit(/^[a-f0-9]{64}$/i.test(k)&&c.createHash("sha256").update(Buffer.from(k,"hex")).digest("hex")===process.env.EXPECTED_KEY_HASH?0:1)' \
  >/dev/null 2>&1 || die 'Could not verify the Podman secret against the key file. Do not replace either key; investigate the mismatch or Podman error.'
unset KEY_HASH

BACKUP=$(mktemp -d "$KEY_DIR/account-config-backup.XXXXXX")
cp -p "$UNIT" "$BACKUP/web.container"; cp -p "$ENV_FILE" "$BACKUP/web.env"
chmod 600 "$BACKUP/web.container" "$BACKUP/web.env"
MUTATED=0
HEALTH='fetch("http://127.0.0.1:8080/healthz",{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
rollback() {
  local status=$?
  trap - EXIT INT TERM
  if [ "$status" != 0 ] && [ "$MUTATED" = 1 ]; then
    printf '\nSetup failed. Restoring previous configuration…\n' >&2
    if cp -p "$BACKUP/web.container" "$UNIT" && cp -p "$BACKUP/web.env" "$ENV_FILE" && "${CTL[@]}" daemon-reload && "${CTL[@]}" restart "$SERVICE"; then
      local recovered=0
      for attempt in $(seq 1 10); do
        if podman exec "$CONTAINER" node -e "$HEALTH" >/dev/null 2>&1; then recovered=1; break; fi
        sleep 2
      done
      if [ "$recovered" = 1 ]; then
      printf 'Previous configuration restored; the web health check passed. The encryption key and secret were kept for safe reuse.\n' >&2
      else printf 'Configuration restored, but web health is not yet verified. Check the web service before proceeding.\n' >&2; fi
    else printf 'Automatic recovery could not be verified. Protected configuration copies: %s. Check the web service before proceeding.\n' "$BACKUP" >&2; fi
  fi
  exit "$status"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
MUTATED=1
python3 - "$UNIT" "$ENV_FILE" <<'PY'
import os,pathlib,re,stat,sys,tempfile
unit,env=map(pathlib.Path,sys.argv[1:])
u=unit.read_text();e=env.read_text()
if u.splitlines().count('[Container]')!=1:sys.exit('Expected one [Container] section.')
# Refuse overriding directives or unusual placement rather than guessing at precedence.
if re.search(r'^\s*Environment=.*\bLEARNER_ACCOUNTS=',u,re.M):sys.exit('Remove the direct Quadlet LEARNER_ACCOUNTS override before using this script.')
lines=u.splitlines(); section=''; out=[]; inserted=False
for line in lines:
 if line.strip().startswith('['):section=line.strip()
 if section=='[Container]' and re.match(r'^\s*#?Secret=fsf-account-encryption-key,',line):continue
 out.append(line)
 if line.strip()=='[Container]':out.append('Secret=fsf-account-encryption-key,type=env,target=ACCOUNT_ENCRYPTION_KEY');inserted=True
if not inserted:sys.exit('Missing [Container] section.')
e=re.sub(r'^\s*LEARNER_ACCOUNTS\s*=.*\n?', '', e, flags=re.M).rstrip('\n')+'\nLEARNER_ACCOUNTS=1\n'
for p,text,mode in [(unit,'\n'.join(out)+'\n',stat.S_IMODE(unit.stat().st_mode)),(env,e,0o600)]:
 fd,tmp=tempfile.mkstemp(prefix='.account-setup-',dir=p.parent)
 try:
  with os.fdopen(fd,'w') as f:f.write(text);f.flush();os.fsync(f.fileno());os.fchmod(f.fileno(),mode)
  os.replace(tmp,p)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)
PY
say 'Restarting the web service only. Expect a brief interruption.'
"${CTL[@]}" daemon-reload
"${CTL[@]}" restart "$SERVICE"
PROBE='(async()=>{const h=await fetch("http://127.0.0.1:8080/healthz",{signal:AbortSignal.timeout(3000)});const f=await fetch("http://127.0.0.1:8080/api/features",{signal:AbortSignal.timeout(3000)});const v=await f.json();process.exit(h.ok&&f.ok&&v.accounts===true&&v.email===true?0:1)})().catch(()=>process.exit(1))'
OK=0
for attempt in $(seq 1 15); do
  if podman exec "$CONTAINER" node -e "$PROBE" >/dev/null 2>&1; then OK=1; break; fi
  sleep 2
done
[ "$OK" = 1 ] || die 'The restarted server did not report healthy account saving. Rolling back.'
MUTATED=0
say 'Account saving is enabled and the internal health/feature checks passed.'
printf 'Protected key file: %s\nProtected configuration backup: %s\n' "$KEY_FILE" "$BACKUP"
cat <<'MSG'
Back up the encryption key separately in protected storage. Do not delete, regenerate or paste it into chat.
Now open https://deedowl.com/account in your own browser and request a sign-in link.
Verify real email delivery, save a test deal, reopen it on a second device, and check sign-out/guest behavior.
The script verifies configuration, not real email delivery or your public proxy/Cloudflare rules.
MSG
