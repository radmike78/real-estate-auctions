// Ingestion CLI.
//
//   npm run ingest                         run every source that is due, then publish the signed feed
//   npm run ingest -- --watch              keep running; sleep until the next source is due
//   npm run ingest -- --dry-run            verify + fetch + parse + report only (no state, no publish)
//   npm run ingest -- --from-dir <dir>     read page.html / events.json / parcels.json saved from the
//                                          official site instead of fetching (dry-run unless --commit)
//   npm run ingest -- --source <id>        check only this source (e.g. nv-clark-sid-certificate-sale)
//   npm run ingest -- --force              ignore the schedule and check now
//   npm run ingest -- --approve-snapshot <sha256>     accept a quarantined data snapshot after review
//   npm run ingest -- --approve-cert <fingerprint>    accept a server certificate from a new CA after review
//
// Each check, in order (any failure = nothing new is published for that source):
//   1. Site identity: public DNS, valid TLS certificate for the exact .gov name, issuing CA unchanged
//   2. Fetch from the exact official host (HTTPS, redirects re-checked)
//   3. Strict parse (fail closed on any format change)
//   4. Anomaly screening (mass removal/addition, bid manipulation) -> quarantine
//   5. Independent corroboration: each parcel must exist in the Assessor's records
//   6. Publish an Ed25519-signed feed that expires on the source's cadence
//
// Signing key: FEED_SIGNING_KEY env (PEM) or ingest/.keys/feed-signing.pem (npm run keys:generate).
// Folders: DATA_DIR (signed feed output, default public/data), INGEST_STATE_DIR (default ingest/state).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES, validateRegistry, type SourceConfig } from './sources/registry';
import { fetchSnapshot, parseSnapshot, type RawSnapshot } from './connectors/clarkTaxSale';
import { fetchSidPage, parseSidSnapshot } from './connectors/sidCertificateSale';
import { fetchIrsIndex, parseIrsSnapshot } from './connectors/irsAuctions';
import { applyIrsSnapshot } from './lib/irsReconcile';
import { applySnapshot, detectAnomalies, emptyState, type SourceState } from './lib/reconcile';
import { applySidSnapshot, detectSidAnomalies } from './lib/sidReconcile';
import { auctionStillOpen } from './lib/cadence';
import { fetchLandUse } from './lib/landUse';
import { confirmParcelsExist } from './lib/corroborate';
import { IdentityError, makeCertificateVerifier, type CertIdentity } from './lib/siteIdentity';
import { buildFeed, scheduleFor } from './lib/publish';
import { loadPrivateKey, signBytes } from './lib/sign';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// In containers these point at the shared data volume (the server serves DATA_DIR at /data/).
const STATE_DIR = process.env.INGEST_STATE_DIR ?? join(ROOT, 'ingest', 'state');
const FEED_DIR = process.env.DATA_DIR ?? join(ROOT, 'public', 'data');
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
  return existsSync(p) ? { ...emptyState(id), ...(JSON.parse(readFileSync(p, 'utf8')) as SourceState) } : emptyState(id);
}
const saveState = (s: SourceState) => writeAtomic(join(STATE_DIR, `${s.sourceId}.json`), JSON.stringify(s, null, 2));

function readSnapshotDir(dir: string): RawSnapshot {
  return {
    page: readFileSync(join(dir, 'page.html'), 'utf8'),
    events: readFileSync(join(dir, 'events.json'), 'utf8'),
    parcels: readFileSync(join(dir, 'parcels.json'), 'utf8'),
  };
}

async function checkSource(source: SourceConfig, now: Date, opts: { dryRun: boolean; fromDir?: string }): Promise<SourceState> {
  const prev = loadState(source.id);

  if (!source.termsReviewedAt && !opts.dryRun) {
    log(`[${source.id}] skipped: set termsReviewedAt in ingest/sources/registry.ts after reviewing the site's terms of use.`);
    return { ...prev, health: 'terms_not_reviewed', message: 'Terms of use not reviewed' };
  }
  if (!source.parserVerifiedAt && !opts.dryRun) {
    log(`[${source.id}] skipped: check the connector against a real list with --dry-run, then set parserVerifiedAt.`);
    return { ...prev, health: 'terms_not_reviewed', message: 'Connector not yet checked against a real list' };
  }
  if (source.kind === 'sid-certificate') return checkSidSource(source, prev, now, opts);
  if (source.kind === 'irs-auction') return checkIrsSource(source, prev, now, opts);

  try {
    const state: SourceState = { ...prev, tlsBaselines: { ...prev.tlsBaselines } };
    // Site identity is verified on every connection that returns data (see secureFetch).
    const observed: Record<string, CertIdentity> = {};
    const verifyCertificate = makeCertificateVerifier(state.tlsBaselines, observed, { now, approvedFingerprint: opt('--approve-cert') });

    const raw = opts.fromDir ? readSnapshotDir(opts.fromDir) : await fetchSnapshot(source, { verifyCertificate });
    const { parsed, sha256 } = parseSnapshot(raw);
    const open = parsed.rows.filter((r) => !r.withdrawn);
    log(
      `[${source.id}] auction ${parsed.auctionKey}: ${parsed.rows.length} parcels (${open.length} not lined out/sold), ` +
        `${parsed.rejected.length} rejected; next session ${parsed.auctionStartsAt ?? 'none'} ` +
        `(${parsed.auctionFormat ?? '?'}; ${auctionStillOpen(parsed.auctionStartsAt, now) ? 'upcoming' : 'already held, nothing available'})`,
    );
    for (const r of parsed.rejected.slice(0, 10)) log(`  rejected row ${r.row}: ${r.reason}`);

    const anomalies = detectAnomalies(state, parsed, now);
    if (anomalies.length && opt('--approve-snapshot') !== sha256) {
      for (const a of anomalies) log(`  ANOMALY ${a.code}: ${a.detail}`);
      log(`[${source.id}] QUARANTINED snapshot ${sha256}. Review it on the official site, then re-run with --approve-snapshot ${sha256}`);
      return { ...state, lastCheckedAt: now.toISOString(), health: 'quarantined', quarantinedSha256: sha256, message: anomalies.map((a) => a.detail).join(' ') };
    }

    // Only parcels that could be shown need corroboration.
    const candidates = auctionStillOpen(parsed.auctionStartsAt, now) ? open.map((r) => r.apn) : [];
    const confirmed = candidates.length ? await confirmParcelsExist(candidates, source.corroborationHosts, { verifyCertificate }) : new Set<string>();
    if (candidates.length) log(`[${source.id}] Assessor confirmed ${confirmed.size} of ${candidates.length} parcels`);
    // Land use (residential / commercial) for confirmed parcels we haven't classified yet; kept between runs.
    const needLandUse = [...confirmed].filter((apn) => !prev.listings[apn]?.landUse).slice(0, 500);
    const landUse = needLandUse.length ? await fetchLandUse(needLandUse, source.corroborationHosts, { verifyCertificate }) : new Map();
    if (needLandUse.length) log(`[${source.id}] land use read for ${landUse.size} of ${needLandUse.length} parcels`);

    for (const [host, id] of Object.entries(observed)) {
      const before = state.tlsBaselines[host];
      if (before?.fingerprint256 !== id.fingerprint256) {
        log(`[${source.id}] ${host}: ${before ? 'certificate renewed' : 'certificate baseline recorded'} (issuer ${id.issuerOrg || id.issuerCN})`);
      }
      state.tlsBaselines[host] = { issuerOrg: id.issuerOrg, issuerCN: id.issuerCN, fingerprint256: id.fingerprint256, approvedAt: now.toISOString() };
    }
    log(`[${source.id}] site identity verified: ${Object.values(observed).map((i) => `${i.host} (${i.issuerOrg || i.issuerCN})`).join(', ')}`);
    return { ...applySnapshot(state, parsed, { sha256, sourceUrl: source.officialUrl, now, confirmedApns: confirmed, landUse }), pendingCertFingerprint: null };
  } catch (err) {
    if (err instanceof IdentityError) {
      log(`[${source.id}] SITE IDENTITY ${err.code}: ${err.message}`);
      if (err.code === 'ISSUER_CHANGED') log(`  After confirming with the agency, re-run with --approve-cert ${err.fingerprint256}`);
      return { ...prev, lastCheckedAt: now.toISOString(), health: 'quarantined', pendingCertFingerprint: err.fingerprint256, message: `Site identity check failed: ${err.message}` };
    }
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    log(`[${source.id}] ERROR ${message}`);
    return { ...prev, lastCheckedAt: now.toISOString(), consecutiveErrors: prev.consecutiveErrors + 1, health: 'error', message };
  }
}

/** SID lien certificates: one page on the agent's host, every parcel confirmed by the County Assessor. */
async function checkSidSource(source: SourceConfig, prev: SourceState, now: Date, opts: { dryRun: boolean; fromDir?: string }): Promise<SourceState> {
  try {
    const state: SourceState = { ...prev, tlsBaselines: { ...prev.tlsBaselines } };
    const observed: Record<string, CertIdentity> = {};
    const verifyCertificate = makeCertificateVerifier(state.tlsBaselines, observed, { now, approvedFingerprint: opt('--approve-cert') });
    const page = opts.fromDir ? readFileSync(join(opts.fromDir, 'page.html'), 'utf8') : await fetchSidPage(source, { verifyCertificate });
    const { parsed, sha256 } = parseSidSnapshot(page, now);
    // Counts only: owner details are never read, and parcel numbers aren't logged.
    log(
      `[${source.id}] sales announced: ${parsed.notices.map((n) => `${n.jurisdiction} ${n.saleDate}`).join('; ') || 'none'}; ` +
        (parsed.sale ? `list for ${parsed.sale.jurisdiction} ${parsed.sale.saleDate}: ${parsed.rows.length} certificates, ${parsed.rejected.length} rejected` : 'no list posted'),
    );
    for (const r of parsed.rejected.slice(0, 10)) log(`  rejected row ${r.row}: ${r.reason.replace(/\d{3}-\d{2}-\d{3}-\d{3}/g, '(parcel)')}`);

    const anomalies = detectSidAnomalies(state, parsed);
    if (anomalies.length && opt('--approve-snapshot') !== sha256) {
      for (const a of anomalies) log(`  ANOMALY ${a.code}: ${a.detail}`);
      log(`[${source.id}] QUARANTINED snapshot ${sha256}. Review it on the official page, then re-run with --approve-snapshot ${sha256}`);
      return { ...state, lastCheckedAt: now.toISOString(), health: 'quarantined', quarantinedSha256: sha256, message: anomalies.map((a) => a.detail).join(' ') };
    }
    const candidates = [...new Set(parsed.rows.map((r) => r.apn))];
    const confirmed = candidates.length ? await confirmParcelsExist(candidates, source.corroborationHosts, { verifyCertificate }) : new Set<string>();
    if (candidates.length) log(`[${source.id}] Assessor confirmed ${confirmed.size} of ${candidates.length} parcels`);
    for (const [host, id] of Object.entries(observed)) {
      state.tlsBaselines[host] = { issuerOrg: id.issuerOrg, issuerCN: id.issuerCN, fingerprint256: id.fingerprint256, approvedAt: now.toISOString() };
    }
    return { ...applySidSnapshot(state, parsed, { sha256, sourceUrl: source.officialUrl, publishedBy: source.publishedBy ?? source.agency, now, confirmedApns: confirmed }), pendingCertFingerprint: null };
  } catch (err) {
    if (err instanceof IdentityError) {
      log(`[${source.id}] SITE IDENTITY ${err.code}: ${err.message}`);
      return { ...prev, lastCheckedAt: now.toISOString(), health: 'quarantined', pendingCertFingerprint: err.fingerprint256, message: `Site identity check failed: ${err.message}` };
    }
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    log(`[${source.id}] ERROR ${message}`);
    return { ...prev, lastCheckedAt: now.toISOString(), consecutiveErrors: prev.consecutiveErrors + 1, health: 'error', message };
  }
}

/** IRS sales: the site's own index, kept to Clark County parcels the County Assessor confirms. */
async function checkIrsSource(source: SourceConfig, prev: SourceState, now: Date, opts: { dryRun: boolean; fromDir?: string }): Promise<SourceState> {
  try {
    const state: SourceState = { ...prev, tlsBaselines: { ...prev.tlsBaselines } };
    const observed: Record<string, CertIdentity> = {};
    const verifyCertificate = makeCertificateVerifier(state.tlsBaselines, observed, { now, approvedFingerprint: opt('--approve-cert') });
    const body = opts.fromDir ? readFileSync(join(opts.fromDir, 'index.json'), 'utf8') : await fetchIrsIndex(source, { verifyCertificate });
    const { parsed, sha256 } = parseIrsSnapshot(body);
    log(`[${source.id}] ${parsed.totalAds} ads nationwide; ${parsed.rows.length} in Clark County; ${parsed.skipped.length} Clark County ad(s) skipped`);
    for (const s of parsed.skipped.slice(0, 10)) log(`  skipped ${s.id}: ${s.reason}`);
    const open = parsed.rows.filter((r) => !r.canceled && r.saleStartsAt && auctionStillOpen(r.saleStartsAt, now));
    const candidates = [...new Set(open.flatMap((r) => r.apns))];
    const confirmed = candidates.length ? await confirmParcelsExist(candidates, source.corroborationHosts, { verifyCertificate }) : new Set<string>();
    if (candidates.length) log(`[${source.id}] Assessor confirmed ${confirmed.size} of ${candidates.length} parcels`);
    const firstApns = open.map((r) => r.apns[0]).filter((a) => confirmed.has(a) && !prev.federalSales?.[a]?.landUse);
    const landUse = firstApns.length ? await fetchLandUse(firstApns, source.corroborationHosts, { verifyCertificate }) : new Map();
    for (const [host, id] of Object.entries(observed)) {
      state.tlsBaselines[host] = { issuerOrg: id.issuerOrg, issuerCN: id.issuerCN, fingerprint256: id.fingerprint256, approvedAt: now.toISOString() };
    }
    return { ...applyIrsSnapshot(state, parsed, { sha256, now, confirmedApns: confirmed, landUse }), pendingCertFingerprint: null };
  } catch (err) {
    if (err instanceof IdentityError) {
      log(`[${source.id}] SITE IDENTITY ${err.code}: ${err.message}`);
      return { ...prev, lastCheckedAt: now.toISOString(), health: 'quarantined', pendingCertFingerprint: err.fingerprint256, message: `Site identity check failed: ${err.message}` };
    }
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
  const fromDir = opt('--from-dir');
  const dryRun = flag('--dry-run') || (!!fromDir && !flag('--commit'));
  const states: Record<string, SourceState> = {};
  const only = opt('--source');
  if (only && !SOURCES.some((s) => s.id === only)) throw new Error(`Unknown source "${only}"`);
  for (const source of SOURCES) {
    if (only && source.id !== only) {
      states[source.id] = loadState(source.id);
      continue;
    }
    const current = loadState(source.id);
    const { nextCheckAt } = scheduleFor(source, current, now);
    if (!dryRun && !flag('--force') && current.lastCheckedAt && nextCheckAt > now) {
      states[source.id] = current;
      continue;
    }
    const next = await checkSource(source, now, { dryRun, fromDir });
    if (!dryRun) saveState(next);
    states[source.id] = dryRun ? current : next;
  }
  if (!dryRun) publish(states, now);
  const soonest = Math.min(...SOURCES.map((s) => scheduleFor(s, states[s.id] ?? emptyState(s.id), new Date()).nextCheckAt.getTime()));
  return new Date(Math.max(soonest, Date.now() + 60_000));
}

async function main() {
  validateRegistry();
  if (!flag('--watch')) {
    await runOnce();
    return;
  }
  // Containers stop with SIGTERM. Files are written atomically (temp file + rename), so exiting is safe.
  for (const sig of ['SIGTERM', 'SIGINT'] as const) process.on(sig, () => {
    log(`${sig} received, stopping.`);
    process.exit(0);
  });
  for (;;) {
    const next = await runOnce();
    log(`next check at ${next.toISOString()}`);
    await new Promise((r) => setTimeout(r, next.getTime() - Date.now()));
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
