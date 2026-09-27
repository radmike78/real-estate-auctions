// Server entry point. Configure with environment variables:
//   ADMIN_USERNAME, ADMIN_PASSWORD_HASH   required (hash from `npm run admin:hash-password`)
//   BASE_URL           public URL of the site, used in confirmation emails (default http://localhost:PORT)
//   PORT, HOST         default 8080, 127.0.0.1
//   DB_PATH            default server/data/app.db
//   DATA_DIR           signed feeds directory, default public/data
//   DIST_DIR           built site to serve, default dist ("" for API only)
//   DIRECTORY_SIGNING_KEY  Ed25519 PEM that signs the advertiser directory (or ingest/.keys/directory-signing.pem);
//                      without it the directory isn't published
//   FEED_PUBLIC_KEY    Ed25519 public key (SPKI, base64) of the LISTINGS key (or ingest/.keys/feed-public-key.txt),
//                      used to read the signed listings for email alerts. Container images set it from the
//                      FEED_PUBLIC_KEY build argument. The web server never holds the listings private key.
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PLANS   online card payments for advertisers
//                      (all three, or none: then billing is recorded by hand in the admin page).
//                      STRIPE_PLANS is JSON: {"agent": {"priceId": "price_...", "amountLabel": "$199 / month"}, ...}
//   POSTMARK_SERVER_TOKEN, MAIL_FROM   send email through Postmark (both, or neither: then emails are only
//                      written to the log). MAIL_FROM is a sender verified in Postmark, e.g.
//                      "Forced-Sale Finder <no-reply@your-domain>". Optional: MAIL_REPLY_TO,
//                      POSTMARK_MESSAGE_STREAM (default "outbound"),
//                      POSTMARK_BROADCAST_STREAM (default "broadcast", for updates to the general email list).
//   TRUST_PROXY=1      read client IP from the LAST X-Forwarded-For entry (only behind your own reverse proxy
//                      that appends to that header; see SECURITY.md)
//   TRUST_CLOUDFLARE=1 the domain is proxied through Cloudflare: read the visitor's address from
//                      CF-Connecting-IP, only on requests that come from Cloudflare's address ranges
//   BACKUP_DIR         where daily database backups go, default <DB_PATH folder>/backups ("" turns backups off)
//   BACKUP_KEEP        how many daily backups to keep, default 7

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicKey } from 'node:crypto';
import { loadPrivateKey } from '../ingest/lib/sign';
import { createApp } from './app';
import { consoleMailer, postmarkMailer, type Mailer } from './mailer';
import { createStripeClient, parsePlans } from './stripe';
import { SITE_INFO } from '../src/lib/siteInfo';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const port = Number(env.PORT ?? 8080);
const baseUrl = env.BASE_URL ?? `http://localhost:${port}`;

if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH?.startsWith('scrypt$')) {
  console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH (run `npm run admin:hash-password`). Refusing to start without an admin login.');
  process.exit(1);
}

const KEY_DIR = join(ROOT, 'ingest', '.keys');
const readKeyFile = (name: string) => (existsSync(join(KEY_DIR, name)) ? readFileSync(join(KEY_DIR, name), 'utf8').trim() : null);
if (env.FEED_SIGNING_KEY) {
  console.error('FEED_SIGNING_KEY is for the listings updater only. Give the web server DIRECTORY_SIGNING_KEY and FEED_PUBLIC_KEY instead (see README, Deploy).');
  process.exit(1);
}
const directoryPem = env.DIRECTORY_SIGNING_KEY ?? readKeyFile('directory-signing.pem');
const directoryKey = directoryPem ? loadPrivateKey(directoryPem) : null;
if (!directoryKey) console.warn('No directory signing key: approvals are saved but the public directory is not published. Run `npm run keys:generate`.');
const feedPublicKey = (env.FEED_PUBLIC_KEY ?? readKeyFile('feed-public-key.txt'))?.trim() || null;
if (feedPublicKey && !/^[A-Za-z0-9+/=]{40,200}$/.test(feedPublicKey)) {
  console.error('FEED_PUBLIC_KEY must be the base64 public key from feed-public-key.txt.');
  process.exit(1);
}
if (!feedPublicKey) console.warn('No FEED_PUBLIC_KEY: email alerts about listings are off until it is set.');
if (directoryKey && feedPublicKey && createPublicKey(directoryKey).export({ type: 'spki', format: 'der' }).toString('base64') === feedPublicKey) {
  console.error('DIRECTORY_SIGNING_KEY must be a different key from the listings key. Run `npm run keys:generate` (see README, Deploy).');
  process.exit(1);
}

// Online payments: all three settings, or none.
const stripeEnv = [env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET, env.STRIPE_PLANS];
let stripe = null;
if (stripeEnv.some(Boolean)) {
  if (!stripeEnv.every(Boolean)) {
    console.error('Set all of STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PLANS, or none of them.');
    process.exit(1);
  }
  if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY!) || !/^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET!)) {
    console.error('STRIPE_SECRET_KEY must start with sk_ or rk_, and STRIPE_WEBHOOK_SECRET with whsec_.');
    process.exit(1);
  }
  const plans = parsePlans(env.STRIPE_PLANS!);
  stripe = { client: createStripeClient({ secretKey: env.STRIPE_SECRET_KEY!, webhookSecret: env.STRIPE_WEBHOOK_SECRET!, plans }), webhookSecret: env.STRIPE_WEBHOOK_SECRET! };
  console.log(`Online payments on (${env.STRIPE_SECRET_KEY!.includes('_test_') ? 'TEST mode' : 'LIVE mode'}) for: ${Object.keys(plans).join(', ') || 'no categories'}`);
} else {
  console.log('Online payments off: record advertiser billing by hand in the admin page.');
}

// Email: Postmark when configured, otherwise the log (fine for trying the site, not for real visitors).
const ADDRESS = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const validSender = (v: string) => ADDRESS.test(v) || /^[^<>\r\n]{1,80}<[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+>$/.test(v.trim());
let mailer: Mailer = consoleMailer;
if (env.POSTMARK_SERVER_TOKEN || env.MAIL_FROM) {
  if (!env.POSTMARK_SERVER_TOKEN || !env.MAIL_FROM) {
    console.error('Set both POSTMARK_SERVER_TOKEN and MAIL_FROM, or neither.');
    process.exit(1);
  }
  if (!validSender(env.MAIL_FROM) || (env.MAIL_REPLY_TO && !ADDRESS.test(env.MAIL_REPLY_TO))) {
    console.error('MAIL_FROM must look like "Forced-Sale Finder <no-reply@your-domain>" or no-reply@your-domain, and MAIL_REPLY_TO like help@your-domain.');
    process.exit(1);
  }
  mailer = postmarkMailer({ serverToken: env.POSTMARK_SERVER_TOKEN.trim(), from: env.MAIL_FROM.trim(), replyTo: env.MAIL_REPLY_TO?.trim() || undefined, messageStream: env.POSTMARK_MESSAGE_STREAM?.trim() || undefined, broadcastStream: env.POSTMARK_BROADCAST_STREAM?.trim() || undefined });
  console.log(`Email on: sending through Postmark as ${env.MAIL_FROM.trim()}${env.POSTMARK_SERVER_TOKEN.trim() === 'POSTMARK_API_TEST' ? ' (TEST token: nothing is delivered)' : ''}`);
} else if (!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl)) {
  console.warn('WARNING: email is OFF. Confirmation links, sign-in links and leads are only written to this log. Set POSTMARK_SERVER_TOKEN and MAIL_FROM.');
} else {
  console.log('Email off: messages are written to this log (set POSTMARK_SERVER_TOKEN and MAIL_FROM to send them).');
}

// Anti-spam law (CAN-SPAM) requires a real postal address in every alert email.
if (/^\[.*\]$/.test(SITE_INFO.operatorName) || /^\[.*\]$/.test(SITE_INFO.mailingAddress)) {
  console.warn('WARNING: set operatorName and mailingAddress in src/lib/siteInfo.ts. Every email-alert message must show your business name and postal address.');
}

const dbPath = env.DB_PATH ?? join(ROOT, 'server', 'data', 'app.db');
const app = createApp({
  dbPath,
  dataDir: env.DATA_DIR ?? join(ROOT, 'public', 'data'),
  distDir: env.DIST_DIR === '' ? null : (env.DIST_DIR ?? join(ROOT, 'dist')),
  adminUsername: env.ADMIN_USERNAME,
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,
  directorySigningKey: directoryKey,
  feedPublicKey,
  baseUrl,
  secureCookies: !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl),
  trustProxy: env.TRUST_PROXY === '1',
  trustCloudflare: env.TRUST_CLOUDFLARE === '1',
  stripe,
  mailer,
});

// Hourly housekeeping: republish the signed directory (so it never expires and overdue
// re-verifications or lapsed payments drop off), purge old visitor hashes, sessions and leads,
// and on the 1st of the month email each advertiser last month's report.
// A failure here (a full disk, say) is logged and retried next hour; it never takes the site down.
const maintain = () => {
  try {
    app.maintain();
  } catch (e) {
    console.error('Hourly housekeeping failed:', e);
  }
};
maintain();
setInterval(maintain, 3_600_000).unref();

// Email alerts for tracked properties: compare the verified listings feed with the last check every 10 minutes.
const checkTracked = () => app.checkTracked().then((n) => n && console.log(`Sent ${n} tracked-property alert email(s).`)).catch((e) => console.error('Tracked-property check failed:', e));
void checkTracked();
setInterval(checkTracked, 10 * 60_000).unref();

// Daily database backups on the same volume. Copy them somewhere else too (see DEPLOY.md).
const backupDir = env.BACKUP_DIR === '' ? null : (env.BACKUP_DIR ?? join(dirname(dbPath), 'backups'));
const backupKeep = Math.max(1, Number(env.BACKUP_KEEP ?? 7) || 7);
function backup() {
  if (!backupDir) return;
  try {
    mkdirSync(backupDir, { recursive: true });
    const files = readdirSync(backupDir).filter((f) => /^app-.*\.db$/.test(f)).sort();
    const newest = files[files.length - 1];
    if (newest && Date.now() - statSync(join(backupDir, newest)).mtimeMs < 23 * 3_600_000) return;
    const file = join(backupDir, `app-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
    app.db.backupTo(file);
    for (const old of [...files, basename(file)].sort().slice(0, -backupKeep)) rmSync(join(backupDir, old), { force: true });
    console.log(`Database backed up to ${file}`);
  } catch (e) {
    console.error('Database backup failed:', e);
  }
}
if (!backupDir) console.log('Database backups off (BACKUP_DIR is empty).');
backup();
setInterval(backup, 3_600_000).unref();

// A promise nobody handled is a bug to log, not a reason to take the whole site down.
process.on('unhandledRejection', (e) => console.error('Unhandled promise rejection:', e));

// Timeouts against slow or idle connections (Node's defaults hold them for minutes), and a cap on open
// connections so a flood can't run the server out of file handles. Cloudflare and the reverse proxy
// in front keep their own connections open, so these are generous for real visitors.
const server = createServer({ headersTimeout: 15_000, requestTimeout: 30_000, keepAliveTimeout: 5_000 }, app.handler);
server.maxConnections = 2_000;
server.maxRequestsPerSocket = 1_000;
server.listen(port, env.HOST ?? '127.0.0.1', () => {
  console.log(`Forced-Sale Finder server on http://${env.HOST ?? '127.0.0.1'}:${port} (public URL ${baseUrl})`);
});

// Containers are stopped with SIGTERM: finish open requests, close the database cleanly, then exit.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => {
    app.db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
