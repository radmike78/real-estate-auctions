// Server entry point. Configure with environment variables:
//   ADMIN_USERNAME, ADMIN_PASSWORD_HASH   required (hash from `npm run admin:hash-password`)
//   BASE_URL           public URL of the site, used in confirmation emails (default http://localhost:PORT)
//   PORT, HOST         default 8080, 127.0.0.1
//   DB_PATH            default server/data/app.db
//   DATA_DIR           signed feeds directory, default public/data
//   DIST_DIR           built site to serve, default dist ("" for API only)
//   FEED_SIGNING_KEY   Ed25519 PEM (or ingest/.keys/feed-signing.pem); without it the directory isn't published
//   TRUST_PROXY=1      read client IP from X-Forwarded-For (only behind your own reverse proxy)

import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPrivateKey } from '../ingest/lib/sign';
import { createApp } from './app';

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
if (!pem) console.warn('No feed signing key: approvals are saved but the public agent directory is not published. Run `npm run keys:generate`.');

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
});

// Republish regularly so the directory never expires and overdue re-verifications drop off.
app.publish();
setInterval(() => app.publish(), 6 * 3_600_000).unref();

createServer(app.handler).listen(port, env.HOST ?? '127.0.0.1', () => {
  console.log(`Forced-Sale Finder server on http://${env.HOST ?? '127.0.0.1'}:${port} (public URL ${baseUrl})`);
});
