// Ingestion CLI.
//
//   npm run ingest                       run every source that is due, then publish the signed feed
//   npm run ingest -- --watch            keep running; sleep until the next source is due
//   npm run ingest -- --dry-run          fetch + parse + report only (no state, no publish)
//   npm run ingest -- --file saved.html  parse a saved copy of the official page (still dry-run unless --commit)
//   npm run ingest -- --force            ignore the schedule and check now
//   npm run ingest -- --approve-snapshot <sha256>   accept a quarantined snapshot after human review
//
// Signing key: FEED_SIGNING_KEY env (PEM) or ingest/.keys/feed-signing.pem (npm run keys:generate).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES, type SourceConfig } from './sources/registry';
import { secureFetch } from './lib/secureFetch';
import { parseAuctionList } from './connectors/clarkTaxSale';
import { applyNotModified, applySnapshot, detectAnomalies, emptyState, type SourceState } from './lib/reconcile';
import { buildFeed, scheduleFor } from './lib/publish';
import { loadPrivateKey, signBytes } from './lib/sign';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_DIR = join(ROOT, 'ingest', 'state');
const FEED_DIR = join(ROOT, 'public', 'data');
const KEY_FILE = join(ROOT, 'ingest', '.keys', 'feed-signing.pem');

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

function writeAtomic(path: string, data: string | Uint8Array) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, data);
  renameSync(`${path}.tmp`, path);
}

function loadState(id: string): SourceState {
  const p = join(STATE_DIR, `${id}.json`);
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as SourceState) : emptyState(id);
}
const saveState = (s: SourceState) => writeAtomic(join(STATE_DIR, `${s.sourceId}.json`), JSON.stringify(s, null, 2));

async function checkSource(source: SourceConfig, now: Date, opts: { dryRun: boolean; approve?: string; file?: string }): Promise<SourceState> {
  const prev = loadState(source.id);

  if (!source.termsReviewedAt && !opts.dryRun) {
    log(`[${source.id}] skipped: set termsReviewedAt in ingest/sources/registry.ts after reviewing the site's terms of use.`);
    return { ...prev, health: 'terms_not_reviewed', message: 'Terms of use not reviewed' };
  }

  try {
    let body: string;
    let sha256: string;
    let url = source.fetchUrl;
    let validators = { etag: null as string | null, lastModified: null as string | null };
    if (opts.file) {
      const bytes = readFileSync(opts.file);
      body = bytes.toString('utf8');
      sha256 = createHash('sha256').update(bytes).digest('hex');
    } else {
      const res = await secureFetch(source.fetchUrl, { allowedHosts: source.allowedHosts, etag: prev.etag, lastModified: prev.lastModified });
      if (res.kind === 'not_modified') {
        log(`[${source.id}] not modified; ${Object.values(prev.listings).filter((l) => l.state === 'AVAILABLE').length} listings re-verified`);
        return applyNotModified(prev, now);
      }
      ({ body, sha256, url } = res);
      // Remember the validators only once this exact content has been accepted below.
      // Saving them earlier would let a later 304 "re-verify" a rejected or quarantined page.
      validators = { etag: res.etag, lastModified: res.lastModified };
    }

    const parsed = parseAuctionList(body);
    const available = parsed.rows.filter((r) => !r.withdrawn).length;
    log(`[${source.id}] parsed ${parsed.rows.length} parcels (${available} available, ${parsed.rows.length - available} lined out), ${parsed.rejected.length} rejected; auction ${parsed.auctionStartsAt ?? 'date not found'}`);
    for (const r of parsed.rejected.slice(0, 10)) log(`  rejected row ${r.row}: ${r.reason}`);

    const anomalies = detectAnomalies(prev, parsed);
    if (anomalies.length && opts.approve !== sha256) {
      for (const a of anomalies) log(`  ANOMALY ${a.code}: ${a.detail}`);
      log(`[${source.id}] QUARANTINED snapshot ${sha256}. Review it on the official site, then re-run with --approve-snapshot ${sha256}`);
      return { ...prev, lastCheckedAt: now.toISOString(), health: 'quarantined', quarantinedSha256: sha256, message: anomalies.map((a) => a.detail).join(' ') };
    }
    return { ...applySnapshot(prev, parsed, { sha256, sourceUrl: url, now }), ...validators };
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    log(`[${source.id}] ERROR ${message}`);
    return { ...prev, lastCheckedAt: now.toISOString(), consecutiveErrors: prev.consecutiveErrors + 1, health: 'error', message };
  }
}

function publish(states: Record<string, SourceState>, now: Date) {
  const pem = process.env.FEED_SIGNING_KEY ?? (existsSync(KEY_FILE) ? readFileSync(KEY_FILE, 'utf8') : null);
  if (!pem) throw new Error('No signing key. Run `npm run keys:generate` or set FEED_SIGNING_KEY. Refusing to publish an unsigned feed.');
  const feed = buildFeed(SOURCES, states, now);
  const bytes = new TextEncoder().encode(JSON.stringify(feed));
  const sig = signBytes(bytes, loadPrivateKey(pem));
  // Write data first, then signature; the browser rejects any mismatched pair.
  writeAtomic(join(FEED_DIR, 'listings.json'), bytes);
  writeAtomic(join(FEED_DIR, 'listings.json.sig'), sig);
  log(`published ${feed.listings.length} verified listings; feed expires ${feed.expiresAt}`);
}

async function runOnce(): Promise<Date> {
  const now = new Date();
  const dryRun = flag('--dry-run') || (!!opt('--file') && !flag('--commit'));
  const states: Record<string, SourceState> = {};
  for (const source of SOURCES) {
    const current = loadState(source.id);
    const { nextCheckAt } = scheduleFor(source, current, now);
    if (!dryRun && !flag('--force') && current.lastCheckedAt && nextCheckAt > now) {
      states[source.id] = current;
      continue;
    }
    const next = await checkSource(source, now, { dryRun, approve: opt('--approve-snapshot'), file: opt('--file') });
    if (!dryRun) saveState(next);
    states[source.id] = dryRun ? current : next;
  }
  if (!dryRun) publish(states, now);
  const soonest = Math.min(...SOURCES.map((s) => scheduleFor(s, states[s.id] ?? emptyState(s.id), new Date()).nextCheckAt.getTime()));
  return new Date(Math.max(soonest, Date.now() + 60_000));
}

async function main() {
  if (!flag('--watch')) {
    await runOnce();
    return;
  }
  for (;;) {
    const next = await runOnce();
    log(`next check at ${next.toISOString()}`);
    await new Promise((r) => setTimeout(r, next.getTime() - Date.now()));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
