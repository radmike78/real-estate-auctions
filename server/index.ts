// Server entry point. Configure with environment variables:
//   ADMIN_USERNAME, ADMIN_PASSWORD_HASH   required (hash from `npm run admin:hash-password`)
//   BASE_URL           public URL of the site, used in confirmation emails (default http://localhost:PORT)
//   PORT, HOST         default 8080, 127.0.0.1
//   DB_PATH            default server/data/app.db
//   DATA_DIR           signed feeds directory, default public/data
//   DIST_DIR           built site to serve, default dist ("" for API only)
//   FEED_SIGNING_KEY   Ed25519 PEM (or ingest/.keys/feed-signing.pem); without it the directory isn't published
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PLANS   online card payments for advertisers
//                      (all three, or none: then billing is recorded by hand in the admin page).
//                      STRIPE_PLANS is JSON: {"agent": {"priceId": "price_...", "amountLabel": "$199 / month"}, ...}
//   POSTMARK_SERVER_TOKEN, MAIL_FROM   send email through Postmark (both, or neither: then emails are only
//                      written to the log). MAIL_FROM is a sender verified in Postmark, e.g.
//                      "Forced-Sale Finder <no-reply@your-domain>". Optional: MAIL_REPLY_TO,
//                      POSTMARK_MESSAGE_STREAM (default "outbound").
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
import { loadPrivateKey } from '../ingest/lib/sign';
import { createApp } from './app';
import { consoleMailer, postmarkMailer, type Mailer } from './mailer';
import { createStripeClient, parsePlans } from './stripe';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const port = Number(env.PORT ?? 8080);
const baseUrl = env.BASE_URL ?? `http://localhost:${port}`;

if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH?.startsWith('scrypt$')) {
  console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH (run `npm run admin:hash-password`). Refusing to start without an admin login.');
  process.exit(1);
}

const keyFile = join(ROOT, 'ingest', '.keys', 'feed-signing.pem');
const pem = env.FEED_SIGNING_KEY ?? (existsSync(keyFile) ? readFileSync(keyFile, 'utf8') : null);
if (!pem) console.warn('No feed signing key: approvals are saved but the public directory is not published. Run `npm run keys:generate`.');

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
  mailer = postmarkMailer({ serverToken: env.POSTMARK_SERVER_TOKEN.trim(), from: env.MAIL_FROM.trim(), replyTo: env.MAIL_REPLY_TO?.trim() || undefined, messageStream: env.POSTMARK_MESSAGE_STREAM?.trim() || undefined });
  console.log(`Email on: sending through Postmark as ${env.MAIL_FROM.trim()}${env.POSTMARK_SERVER_TOKEN.trim() === 'POSTMARK_API_TEST' ? ' (TEST token: nothing is delivered)' : ''}`);
} else if (!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl)) {
  console.warn('WARNING: email is OFF. Confirmation links, sign-in links and leads are only written to this log. Set POSTMARK_SERVER_TOKEN and MAIL_FROM.');
} else {
  console.log('Email off: messages are written to this log (set POSTMARK_SERVER_TOKEN and MAIL_FROM to send them).');
}

const dbPath = env.DB_PATH ?? join(ROOT, 'server', 'data', 'app.db');
const app = createApp({
  dbPath,
  dataDir: env.DATA_DIR ?? join(ROOT, 'public', 'data'),
  distDir: env.DIST_DIR === '' ? null : (env.DIST_DIR ?? join(ROOT, 'dist')),
  adminUsername: env.ADMIN_USERNAME,
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,
  signingKey: pem ? loadPrivateKey(pem) : null,
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
app.maintain();
setInterval(() => app.maintain(), 3_600_000).unref();

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

const server = createServer(app.handler).listen(port, env.HOST ?? '127.0.0.1', () => {
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
