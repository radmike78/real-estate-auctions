import { workStorage as localStorage } from './workStorage';
// Download learning progress from the current workspace. Optional accounts save only allowed structured work.
// Downloads may include local-only notes; keep them private. A guest can load the file back into a browser on My plan.
// Sign-in links and email-alert tokens are never included.
import { cleanDeal } from './analyze';
import { cleanPacket } from './dealPacket';
import { cleanBuyBox } from './toolkit';
import { cleanJourney, JOURNEY_KEY } from '../practice/dealJourney';
import { cleanCase } from '../practice/caseProgress';
import { cleanDealSteps, DEAL_STEPS_KEY } from './roadmapDeals';
import { cleanOwned } from './owned';

export { backedUp } from './workKeys';
import { backedUp, PATTERN, CONFIRMED } from './workKeys';

const MAX_VALUE = 1_000_000; // one item, e.g. 50 analyzed deals with long notes
const MAX_FILE = 4_000_000;

/** Pages clean what they read from storage; these keys are also checked here because their pages render them directly. */
const CLEAN: Record<string, (v: unknown) => unknown> = {
  [JOURNEY_KEY]: cleanJourney,
  'deedowl.buybox.v1': cleanBuyBox,
  'deedowl.analyze.v1': (v) => (Array.isArray(v) ? v.map(cleanDeal).filter(Boolean) : []),
  'deedowl.analyze.current.v1': (v) => cleanDeal(v),
  'deedowl.owned.v1': cleanOwned,
  'deedowl.case.v1': cleanCase,
  'deedowl.case.tx.v1': cleanCase,
  'deedowl.case.ca.v1': cleanCase,
  'deedowl.case.az.v1': cleanCase,
  'deedowl.case.ut.v1': cleanCase,
  [DEAL_STEPS_KEY]: cleanDealSteps,
  // Pre-foreclosure watchlist: { listing id: stage last seen }, strings only.
  'fsf.preforeclosure.watch.v1': (v) => Object.fromEntries(Object.entries(v && typeof v === 'object' && !Array.isArray(v) ? v : {}).filter(([, x]) => typeof x === 'string').slice(0, 500).map(([k, x]) => [k.slice(0, 80), (x as string).slice(0, 40)])),
  'deedowl.dealPacket.v1': (v) => Object.fromEntries(Object.entries(v && typeof v === 'object' && !Array.isArray(v) ? v : {}).slice(0, 100).map(([k, x]) => [k.slice(0, 40), cleanPacket(x)])),
};

export interface Backup {
  app: 'deedowl';
  version: 1;
  saved: string;
  data: Record<string, string>;
}

/** Everything to back up from this browser. */
export function makeBackup(storage: Storage = localStorage, now = new Date()): Backup {
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k || !backedUp(k)) continue;
    const v = storage.getItem(k);
    if (v !== null && v.length <= MAX_VALUE) data[k] = v;
  }
  return { app: 'deedowl', version: 1, saved: now.toISOString(), data };
}

/** Checks a backup file and returns what to restore, or why it can't be used. Only known DeedOwl keys are kept. */
export function readBackup(text: string): { ok: true; data: Record<string, string>; saved: string } | { ok: false; error: string } {
  if (text.length > MAX_FILE) return { ok: false, error: 'That file is too large to be a DeedOwl backup.' };
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t a DeedOwl backup.' };
  }
  const o = v as Partial<Backup> | null;
  if (!o || o.app !== 'deedowl' || o.version !== 1 || !o.data || typeof o.data !== 'object') return { ok: false, error: 'That file isn’t a DeedOwl backup.' };
  const data: Record<string, string> = {};
  for (const [k, val] of Object.entries(o.data)) {
    if (!backedUp(k) || typeof val !== 'string' || val.length > MAX_VALUE) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(val);
    } catch {
      if (k === 'deedowl.state.v1' && /^[A-Z]{2}$/.test(val)) data[k] = val;
      if (PATTERN.test(k) && k.endsWith('.region') && val.length <= 1000) data[k] = val; // every saved value is JSON except the chosen state code
      continue;
    }
    data[k] = CONFIRMED.test(k) ? JSON.stringify(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(x)).slice(0, 100) : []) : CLEAN[k] ? JSON.stringify(CLEAN[k](parsed)) : val;
  }
  return { ok: true, data, saved: typeof o.saved === 'string' && !Number.isNaN(Date.parse(o.saved)) ? o.saved : '' };
}

/** Writes a checked backup into this browser. Returns how many items were restored. */
export function restoreBackup(data: Record<string, string>, storage: Storage = localStorage): number {
  let n = 0;
  for (const [k, v] of Object.entries(data)) {
    if (!backedUp(k)) continue;
    try {
      // Older backups carry numbers without confirmation: never keep this device's old confirmations.
      if (/^fsf\.(bid|calc\.)/.test(k) && k.endsWith('.v1') && !CONFIRMED.test(k)) {
        for (const typedKey of [`${k}.typed.v1`, k.replace(/\.v1$/, '.typed.v1')]) {
          if (CONFIRMED.test(typedKey) && !(typedKey in data)) storage.removeItem(typedKey);
        }
      }
      storage.setItem(k, v);
      n++;
    } catch {
      /* storage full or blocked */
    }
  }
  return n;
}
