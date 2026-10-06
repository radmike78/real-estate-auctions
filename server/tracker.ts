// Property tracking for email alerts. Only verified data can trigger an email: the server reads the
// same signed listings feed the browser does (public/data/listings.json + .sig), checks the signature
// with the public half of its own signing key, and refuses expired feeds. Sample data never emails.
//
// Each check compares the current feed with what we recorded last time and turns the differences into
// changes for each tracked property: removed from the list, back on it, a new auction date, a new
// minimum bid, a new format or place, and reminders before the auction. Nothing is sent on the very
// first check (there's nothing to compare with), or while the feed is missing, invalid or expired.

import { webcrypto } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { isClarkSale, verifyFeed } from '../src/feed/verify';
import type { Feed, FeedFederalSale, FeedListing } from '../src/feed/types';
import { matchesSearch, parseSearchTarget } from '../src/lib/savedSearch';
import { pacificDay } from './metrics';

/** What we remember about a tracked listing. */
export interface ListingSnapshot {
  /** Which official list it's on; absent = the Clark County Treasurer's tax-sale list. */
  source?: 'irs';
  /** The feed source it came from (absent on snapshots recorded before this was kept). */
  sourceId?: string;
  apn: string;
  address: string | null;
  minimumBid: number | null; // null: not published (some IRS sales)
  auctionStartsAt: string | null;
  auctionFormat: string | null;
  auctionLocation: string | null;
  sourceUrl: string;
  landUseCode?: string | null; // Assessor land-use code, for saved-search matching
}

export type Change =
  | { kind: 'removed' }
  | { kind: 'back'; auctionStartsAt: string | null; minimumBid: number | null }
  | { kind: 'date'; from: string | null; to: string | null }
  | { kind: 'minimumBid'; from: number | null; to: number | null }
  | { kind: 'place'; format: string | null; location: string | null }
  | { kind: 'register'; auctionStartsAt: string } // about 10 days before: registration closes about a week out
  | { kind: 'tomorrow'; auctionStartsAt: string };

/** Subscription target for a Clark County tax-sale parcel. */
export const taxTarget = (apn: string) => `tax:${apn}`;
/** Subscription target for an IRS sale of Clark County property (the ad's id on irsauctions.gov). */
export const irsTarget = (adId: string) => `irs:${adId}`;
export const TARGET_RE = /^(tax:\d{3}-\d{2}-\d{3}-\d{3}|irs:[a-z0-9-]{3,200})$/;

export const snapshotOf = (l: FeedListing): ListingSnapshot => ({
  sourceId: l.sourceId,
  apn: l.apn,
  address: l.address,
  minimumBid: l.minimumBid,
  auctionStartsAt: l.auctionStartsAt,
  auctionFormat: l.auctionFormat,
  auctionLocation: l.auctionLocation,
  sourceUrl: l.sourceUrl,
  landUseCode: l.landUse?.code ?? null,
});

export const federalSnapshotOf = (f: FeedFederalSale): ListingSnapshot => ({
  source: 'irs',
  sourceId: f.sourceId,
  apn: f.apns[0],
  address: f.address ?? f.title,
  minimumBid: f.minimumBid,
  auctionStartsAt: f.saleStartsAt,
  auctionFormat: f.saleFormat,
  auctionLocation: f.saleLocation,
  sourceUrl: f.sourceUrl,
  landUseCode: f.landUse?.code ?? null,
});

/** Every verified listing in the feed that can be tracked, by subscription target. IRS sales outside Clark County (shown
 * only in a list, as the IRS lists them, without a property page) can't be. */
export function trackableListings(feed: Feed): Map<string, ListingSnapshot> {
  return new Map([
    ...feed.listings.map((l) => [taxTarget(l.apn), snapshotOf(l)] as const),
    ...(feed.federalSales ?? []).filter(isClarkSale).map((f) => [irsTarget(f.id), federalSnapshotOf(f)] as const),
  ]);
}

export const labelOf = (s: Pick<ListingSnapshot, 'address' | 'apn'>) => (s.address ? `${s.address} (APN ${s.apn})` : `APN ${s.apn}`);

/** Differences between what we recorded and what the feed says now. */
export function diffSnapshots(prev: ListingSnapshot | null, prevPresent: boolean, cur: ListingSnapshot | null): Change[] {
  if (!cur) return prevPresent ? [{ kind: 'removed' }] : [];
  if (!prev || !prevPresent) return [{ kind: 'back', auctionStartsAt: cur.auctionStartsAt, minimumBid: cur.minimumBid }];
  const out: Change[] = [];
  if (prev.auctionStartsAt !== cur.auctionStartsAt) out.push({ kind: 'date', from: prev.auctionStartsAt, to: cur.auctionStartsAt });
  if (prev.minimumBid !== cur.minimumBid) out.push({ kind: 'minimumBid', from: prev.minimumBid, to: cur.minimumBid });
  if (prev.auctionFormat !== cur.auctionFormat || prev.auctionLocation !== cur.auctionLocation) out.push({ kind: 'place', format: cur.auctionFormat, location: cur.auctionLocation });
  return out;
}

const DAY = 86_400_000;
/** Reminders due now for a listing, with keys so each is sent once per auction date. */
export function dueReminders(s: ListingSnapshot, now: Date): { key: string; change: Change }[] {
  if (!s.auctionStartsAt) return [];
  const until = Date.parse(s.auctionStartsAt) - now.getTime();
  if (until <= 0) return [];
  const out: { key: string; change: Change }[] = [];
  if (until <= 10 * DAY && until > 7 * DAY) out.push({ key: `register:${s.auctionStartsAt}`, change: { kind: 'register', auctionStartsAt: s.auctionStartsAt } });
  if (until <= DAY) out.push({ key: `tomorrow:${s.auctionStartsAt}`, change: { kind: 'tomorrow', auctionStartsAt: s.auctionStartsAt } });
  return out;
}

/** Reads and verifies the published listings feed; cached until the file changes. Null if missing, invalid or expired. */
export function feedReader(dataDir: string, publicSpki: string | null) {
  let cache: { stamp: string; feed: Feed | null; at: number } | null = null;
  return async (now: Date): Promise<Feed | null> => {
    if (!publicSpki) return null;
    const file = join(dataDir, 'listings.json');
    let stamp: string;
    try {
      const a = statSync(file);
      const b = statSync(`${file}.sig`);
      stamp = `${a.mtimeMs}:${a.size}:${b.mtimeMs}:${b.size}`;
    } catch {
      return null;
    }
    // A feed that failed to verify is re-checked after a minute even if the files look unchanged: it may have been
    // read halfway through a publish (new listings, old signature) on a filesystem with coarse timestamps.
    if (!cache || cache.stamp !== stamp || (!cache.feed && now.getTime() - cache.at > 60_000)) {
      let feed: Feed | null = null;
      try {
        const bytes = readFileSync(file);
        const sig = readFileSync(`${file}.sig`, 'utf8').trim();
        const r = await verifyFeed(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, sig, publicSpki, now, webcrypto.subtle as unknown as SubtleCrypto);
        feed = r.ok ? r.feed : null;
      } catch {
        feed = null;
      }
      cache = { stamp, feed, at: now.getTime() };
    }
    // Expiry is time-based, so check it on every call, not only when the file changes.
    return cache.feed && Date.parse(cache.feed.expiresAt) > now.getTime() ? cache.feed : null;
  };
}

export function openTracker(db: DatabaseSync) {
  db.exec(`
    -- The last verified state of each listing, to compare with the next feed.
    CREATE TABLE IF NOT EXISTS alert_listings (
      target TEXT PRIMARY KEY,
      snapshot TEXT NOT NULL,
      present INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    -- Reminders already sent, so each goes out once per subscription and auction date.
    CREATE TABLE IF NOT EXISTS alert_sent (
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      PRIMARY KEY (subscription_id, key)
    );
    -- When each saved search last got its daily digest.
    CREATE TABLE IF NOT EXISTS alert_search_state (
      subscription_id TEXT PRIMARY KEY REFERENCES subscriptions(id) ON DELETE CASCADE,
      last_digest_at TEXT NOT NULL
    );
    -- Change emails the email service didn't accept, kept to retry on the next check (the listing state has moved on).
    CREATE TABLE IF NOT EXISTS alert_outbox (
      subscriber_id TEXT PRIMARY KEY REFERENCES subscribers(id) ON DELETE CASCADE,
      items TEXT NOT NULL,
      queued_at TEXT NOT NULL
    );
  `);
  // When a listing (re)appeared on the list; '' for listings recorded on the very first check (the baseline).
  const cols = db.prepare('PRAGMA table_info(alert_listings)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'appeared_at')) db.exec(`ALTER TABLE alert_listings ADD COLUMN appeared_at TEXT NOT NULL DEFAULT ''`);
  return {
    isEmpty(): boolean {
      return !db.prepare('SELECT 1 FROM alert_listings LIMIT 1').get();
    },
    all(): Map<string, { snapshot: ListingSnapshot; present: boolean }> {
      const rows = db.prepare('SELECT target, snapshot, present FROM alert_listings').all() as { target: string; snapshot: string; present: number }[];
      return new Map(rows.map((r) => [r.target, { snapshot: JSON.parse(r.snapshot) as ListingSnapshot, present: r.present === 1 }]));
    },
    /** `appearedAt` is set only when a listing newly appears (or reappears); otherwise the old value stays. */
    save(target: string, snapshot: ListingSnapshot, present: boolean, now: string, appearedAt?: string) {
      db.prepare(
        `INSERT INTO alert_listings (target, snapshot, present, updated_at, appeared_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(target) DO UPDATE SET snapshot = excluded.snapshot, present = excluded.present, updated_at = excluded.updated_at,
           appeared_at = CASE WHEN ? IS NULL THEN alert_listings.appeared_at ELSE excluded.appeared_at END`,
      ).run(target, JSON.stringify(snapshot), present ? 1 : 0, now, appearedAt ?? '', appearedAt ?? null);
    },
    /** Listings on the list now that appeared after `since` (baseline listings never count). */
    appearedSince(since: string): ListingSnapshot[] {
      return (db.prepare(`SELECT snapshot FROM alert_listings WHERE present = 1 AND appeared_at != '' AND appeared_at > ? ORDER BY appeared_at, target`).all(since) as { snapshot: string }[]).map(
        (r) => JSON.parse(r.snapshot) as ListingSnapshot,
      );
    },
    /** Saved searches of confirmed addresses, with when each last got a digest (or was created). */
    searches(): { subscriptionId: string; subscriberId: string; target: string; label: string; since: string }[] {
      return db
        .prepare(
          `SELECT s.id AS subscriptionId, s.subscriber_id AS subscriberId, s.target, s.label,
                  COALESCE(d.last_digest_at, s.created_at) AS since
           FROM subscriptions s JOIN subscribers u ON u.id = s.subscriber_id
           LEFT JOIN alert_search_state d ON d.subscription_id = s.id
           WHERE s.kind = 'search' AND u.status = 'ACTIVE'`,
        )
        .all() as { subscriptionId: string; subscriberId: string; target: string; label: string; since: string }[];
    },
    markDigested(subscriptionId: string, at: string) {
      db.prepare(
        `INSERT INTO alert_search_state (subscription_id, last_digest_at) VALUES (?, ?)
         ON CONFLICT(subscription_id) DO UPDATE SET last_digest_at = excluded.last_digest_at`,
      ).run(subscriptionId, at);
    },
    /** Active subscribers tracking a target, with their subscription ids. */
    watchers(target: string): { subscriptionId: string; subscriberId: string }[] {
      return db
        .prepare(
          `SELECT s.id AS subscriptionId, s.subscriber_id AS subscriberId FROM subscriptions s
           JOIN subscribers u ON u.id = s.subscriber_id WHERE s.kind = 'property' AND s.target = ? AND u.status = 'ACTIVE'`,
        )
        .all(target) as { subscriptionId: string; subscriberId: string }[];
    },
    /** Change emails waiting to be retried, per subscriber, with when they were first queued. */
    outbox(): Map<string, { items: TrackedItem[]; queuedAt: string }> {
      const rows = db.prepare('SELECT subscriber_id AS id, items, queued_at AS queuedAt FROM alert_outbox').all() as { id: string; items: string; queuedAt: string }[];
      return new Map(rows.map((r) => [r.id, { items: JSON.parse(r.items) as TrackedItem[], queuedAt: r.queuedAt }]));
    },
    /** Keeps (or, with null, clears) a subscriber's unsent changes, with when the oldest of them was first queued. */
    setOutbox(subscriberId: string, items: TrackedItem[] | null, now: string) {
      if (!items) db.prepare('DELETE FROM alert_outbox WHERE subscriber_id = ?').run(subscriberId);
      else
        db.prepare(
          `INSERT INTO alert_outbox (subscriber_id, items, queued_at) VALUES (?, ?, ?)
           ON CONFLICT(subscriber_id) DO UPDATE SET items = excluded.items, queued_at = excluded.queued_at`,
        ).run(subscriberId, JSON.stringify(items), now);
    },
    /** Records a reminder as sent; false if it already was. */
    claim(subscriptionId: string, key: string, now: string): boolean {
      return db.prepare('INSERT OR IGNORE INTO alert_sent (subscription_id, key, sent_at) VALUES (?, ?, ?)').run(subscriptionId, key, now).changes > 0;
    },
  };
}

export type Tracker = ReturnType<typeof openTracker>;
export type TrackedItem = { target: string; snapshot: ListingSnapshot; changes: Change[] };

/** Unsent changes from earlier checks plus this check's, per target (the newest snapshot wins). */
export function mergeTracked(earlier: TrackedItem[], fresh: TrackedItem[]): TrackedItem[] {
  const out: TrackedItem[] = earlier.map((x) => ({ ...x, changes: [...x.changes] }));
  for (const f of fresh) {
    const same = out.find((x) => x.target === f.target);
    if (same) {
      same.snapshot = f.snapshot;
      same.changes.push(...f.changes);
    } else out.push(f);
  }
  return out;
}

/**
 * Compares the feed with the last recorded state and returns, per subscriber, the changes to email.
 * Records the new state as it goes. On the first run it only records.
 */
export function collectChanges(tracker: Tracker, feed: Feed, now: Date): Map<string, { target: string; snapshot: ListingSnapshot; changes: Change[] }[]> {
  const at = now.toISOString();
  const first = tracker.isEmpty();
  const known = tracker.all();
  const current = trackableListings(feed);
  const out = new Map<string, { target: string; snapshot: ListingSnapshot; changes: Change[] }[]>();
  const add = (subscriberId: string, target: string, snapshot: ListingSnapshot, changes: Change[]) => {
    if (!changes.length) return;
    const list = out.get(subscriberId) ?? [];
    const same = list.find((x) => x.target === target);
    if (same) same.changes.push(...changes);
    else list.push({ target, snapshot, changes });
    out.set(subscriberId, list);
  };

  // A source that failed, went stale or was quarantined drops its listings from the feed without them having left the
  // official list. Its parcels are left as they were: no "removed" email now, and no "back" email when it recovers.
  const unhealthy = new Set(feed.sources.filter((s) => s.health !== 'ok').map((s) => s.sourceId));
  const sourceDown = (snap: ListingSnapshot) => (snap.sourceId ? unhealthy.has(snap.sourceId) : unhealthy.size > 0);

  for (const target of new Set([...known.keys(), ...current.keys()])) {
    const prev = known.get(target) ?? null;
    const cur = current.get(target) ?? null;
    if (!cur && prev?.present && sourceDown(prev.snapshot)) continue;
    const changes = first ? [] : diffSnapshots(prev?.snapshot ?? null, prev?.present ?? false, cur);
    // Newly on the list (or back on it): remember when, for saved-search digests. The first check is only a baseline.
    const appeared = cur && !prev?.present ? (first ? '' : at) : undefined;
    if (cur) tracker.save(target, cur, true, at, appeared);
    else if (prev?.present) tracker.save(target, prev.snapshot, false, at);
    const watchers = tracker.watchers(target);
    if (!watchers.length) continue;
    const snap = cur ?? prev!.snapshot;
    for (const w of watchers) {
      const all = [...changes];
      if (cur) for (const r of dueReminders(cur, now)) if (tracker.claim(w.subscriptionId, r.key, at)) all.push(r.change);
      add(w.subscriberId, target, snap, all);
    }
  }
  return out;
}

/** Digests are sent once a day, from this hour (Las Vegas time). */
export const DIGEST_HOUR = 7;
const vegasHour = (d: Date) => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(d));

/**
 * Daily saved-search digests that are due: per subscriber, each search with the listings that appeared since
 * its last digest. A due search with no matches is marked as done, so tomorrow starts from today; the caller marks
 * the others once their email goes out.
 */
export function collectDigests(tracker: Tracker, now: Date): Map<string, { subscriptionId: string; label: string; target: string; listings: ListingSnapshot[] }[]> {
  const out = new Map<string, { subscriptionId: string; label: string; target: string; listings: ListingSnapshot[] }[]>();
  if (vegasHour(now) < DIGEST_HOUR) return out;
  const today = pacificDay(now);
  const at = now.toISOString();
  for (const s of tracker.searches()) {
    if (pacificDay(new Date(s.since)) >= today) continue; // already done today (or created today: first digest tomorrow)
    const search = parseSearchTarget(s.target);
    // Saved searches cover the Treasurer's tax-sale list.
    const listings = search ? tracker.appearedSince(s.since).filter((l) => !l.source && matchesSearch(search, l)) : [];
    // A search with nothing new is done for today. One with matches is marked once its email is accepted
    // (the caller does that), so a failed send is retried on the next run instead of being skipped.
    if (!listings.length) {
      tracker.markDigested(s.subscriptionId, at);
      continue;
    }
    const list = out.get(s.subscriberId) ?? [];
    list.push({ subscriptionId: s.subscriptionId, label: s.label, target: s.target, listings });
    out.set(s.subscriberId, list);
  }
  return out;
}
