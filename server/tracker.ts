// Property tracking for email alerts. Only verified data can trigger an email: the server reads the
// same signed listings feed the browser does (public/data/listings.json + .sig), checks the signature
// with the public half of its own signing key, and refuses expired feeds. Sample data never emails.
//
// Each check compares the current feed with what we recorded last time and turns the differences into
// changes for each tracked property: removed from the list, back on it, a new auction date, a new
// minimum bid, a new format or place, and reminders before the auction. Nothing is sent on the very
// first check (there's nothing to compare with), or while the feed is missing, invalid or expired.

import { createPublicKey, webcrypto, type KeyObject } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { verifyFeed } from '../src/feed/verify';
import type { Feed, FeedListing } from '../src/feed/types';

/** What we remember about a tracked listing. */
export interface ListingSnapshot {
  apn: string;
  address: string | null;
  minimumBid: number;
  auctionStartsAt: string | null;
  auctionFormat: string | null;
  auctionLocation: string | null;
  sourceUrl: string;
}

export type Change =
  | { kind: 'removed' }
  | { kind: 'back'; auctionStartsAt: string | null; minimumBid: number }
  | { kind: 'date'; from: string | null; to: string | null }
  | { kind: 'minimumBid'; from: number; to: number }
  | { kind: 'place'; format: string | null; location: string | null }
  | { kind: 'register'; auctionStartsAt: string } // about 10 days before: registration closes about a week out
  | { kind: 'tomorrow'; auctionStartsAt: string };

/** Subscription target for a Clark County tax-sale parcel. */
export const taxTarget = (apn: string) => `tax:${apn}`;
export const TARGET_RE = /^tax:\d{3}-\d{2}-\d{3}-\d{3}$/;

export const snapshotOf = (l: FeedListing): ListingSnapshot => ({
  apn: l.apn,
  address: l.address,
  minimumBid: l.minimumBid,
  auctionStartsAt: l.auctionStartsAt,
  auctionFormat: l.auctionFormat,
  auctionLocation: l.auctionLocation,
  sourceUrl: l.sourceUrl,
});

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
export function feedReader(dataDir: string, signingKey: KeyObject | null) {
  const publicSpki = signingKey ? createPublicKey(signingKey).export({ type: 'spki', format: 'der' }).toString('base64') : null;
  let cache: { stamp: string; feed: Feed | null } | null = null;
  return async (now: Date): Promise<Feed | null> => {
    if (!publicSpki) return null;
    const file = join(dataDir, 'listings.json');
    let stamp: string;
    try {
      const a = statSync(file);
      const b = statSync(`${file}.sig`);
      stamp = `${a.mtimeMs}:${a.size}:${b.mtimeMs}`;
    } catch {
      return null;
    }
    if (!cache || cache.stamp !== stamp) {
      let feed: Feed | null = null;
      try {
        const bytes = readFileSync(file);
        const sig = readFileSync(`${file}.sig`, 'utf8').trim();
        const r = await verifyFeed(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, sig, publicSpki, now, webcrypto.subtle as unknown as SubtleCrypto);
        feed = r.ok ? r.feed : null;
      } catch {
        feed = null;
      }
      cache = { stamp, feed };
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
  `);
  return {
    isEmpty(): boolean {
      return !db.prepare('SELECT 1 FROM alert_listings LIMIT 1').get();
    },
    all(): Map<string, { snapshot: ListingSnapshot; present: boolean }> {
      const rows = db.prepare('SELECT target, snapshot, present FROM alert_listings').all() as { target: string; snapshot: string; present: number }[];
      return new Map(rows.map((r) => [r.target, { snapshot: JSON.parse(r.snapshot) as ListingSnapshot, present: r.present === 1 }]));
    },
    save(target: string, snapshot: ListingSnapshot, present: boolean, now: string) {
      db.prepare(
        `INSERT INTO alert_listings (target, snapshot, present, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(target) DO UPDATE SET snapshot = excluded.snapshot, present = excluded.present, updated_at = excluded.updated_at`,
      ).run(target, JSON.stringify(snapshot), present ? 1 : 0, now);
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
    /** Records a reminder as sent; false if it already was. */
    claim(subscriptionId: string, key: string, now: string): boolean {
      return db.prepare('INSERT OR IGNORE INTO alert_sent (subscription_id, key, sent_at) VALUES (?, ?, ?)').run(subscriptionId, key, now).changes > 0;
    },
  };
}

export type Tracker = ReturnType<typeof openTracker>;

/**
 * Compares the feed with the last recorded state and returns, per subscriber, the changes to email.
 * Records the new state as it goes. On the first run it only records.
 */
export function collectChanges(tracker: Tracker, feed: Feed, now: Date): Map<string, { target: string; snapshot: ListingSnapshot; changes: Change[] }[]> {
  const at = now.toISOString();
  const first = tracker.isEmpty();
  const known = tracker.all();
  const current = new Map(feed.listings.map((l) => [taxTarget(l.apn), snapshotOf(l)]));
  const out = new Map<string, { target: string; snapshot: ListingSnapshot; changes: Change[] }[]>();
  const add = (subscriberId: string, target: string, snapshot: ListingSnapshot, changes: Change[]) => {
    if (!changes.length) return;
    const list = out.get(subscriberId) ?? [];
    const same = list.find((x) => x.target === target);
    if (same) same.changes.push(...changes);
    else list.push({ target, snapshot, changes });
    out.set(subscriberId, list);
  };

  for (const target of new Set([...known.keys(), ...current.keys()])) {
    const prev = known.get(target) ?? null;
    const cur = current.get(target) ?? null;
    const changes = first ? [] : diffSnapshots(prev?.snapshot ?? null, prev?.present ?? false, cur);
    if (cur) tracker.save(target, cur, true, at);
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
