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
//   TRUST_PROXY=1      read client IP from the LAST X-Forwarded-For entry (only behind your own reverse proxy
//                      that appends to that header; see SECURITY.md)

import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPrivateKey } from '../ingest/lib/sign';
import { createApp } from './app';
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

const app = createApp({
  dbPath: env.DB_PATH ?? join(ROOT, 'server', 'data', 'app.db'),
  dataDir: env.DATA_DIR ?? join(ROOT, 'public', 'data'),
  distDir: env.DIST_DIR === '' ? null : (env.DIST_DIR ?? join(ROOT, 'dist')),
  adminUsername: env.ADMIN_USERNAME,
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,
  signingKey: pem ? loadPrivateKey(pem) : null,
  baseUrl,
  secureCookies: !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl),
  trustProxy: env.TRUST_PROXY === '1',
  stripe,
});

// Hourly housekeeping: republish the signed directory (so it never expires and overdue
// re-verifications or lapsed payments drop off), purge old visitor hashes, sessions and leads,
// and on the 1st of the month email each advertiser last month's report.
app.maintain();
setInterval(() => app.maintain(), 3_600_000).unref();

createServer(app.handler).listen(port, env.HOST ?? '127.0.0.1', () => {
  console.log(`Forced-Sale Finder server on http://${env.HOST ?? '127.0.0.1'}:${port} (public URL ${baseUrl})`);
});
