// Back up and restore learning progress: everything DeedOwl keeps in this browser for the visitor (roadmap, drills,
// practice runs, buy box, saved deals, evidence logs, calculator inputs), as one file they keep. There are no
// accounts, so this is how progress moves to another device or survives clearing the browser.
// Sign-in links and email-alert tokens are never included.
import { cleanDeal } from './analyze';
import { cleanBuyBox } from './toolkit';
import { cleanCase } from '../practice/caseProgress';

const EXACT = [
  'deedowl.path.v1',
  'deedowl.roadmap.v1',
  'deedowl.roadmap.path.v1',
  'deedowl.roadmap.status.v1',
  'deedowl.roadmap.deal.v1',
  'deedowl.roadmap.deals.v1',
  'deedowl.cash.v1',
  'deedowl.team.v1',
  'deedowl.teamlist.v1',
  'deedowl.goal.v1',
  'deedowl.buybox.v1',
  'deedowl.drills.v1',
  'deedowl.decide.v1',
  'deedowl.evidence.v1',
  'deedowl.analyze.v1',
  'deedowl.analyze.current.v1',
  'deedowl.area.v1',
  'deedowl.state.v1',
  'deedowl.mode.v1',
  'deedowl.read.v1',
  'deedowl.last.v1',
  'fsf.practice.v1',
  'deedowl.case.v1',
  'fsf.deals.v1',
  'fsf.calc.rent.v1',
  'fsf.calc.commercial.v1',
  'fsf.calc.rent.offer.v1',
  'fsf.calc.commercial.offer.v1',
  'fsf.calc.lien.v1',
  'fsf.calc.lien.az.v1',
  'fsf.calc.strategy.v1',
  'fsf.bid.mode.v1',
];
const PATTERN = /^fsf\.(dd|bid|income|checklist|calc\.rent|calc\.commercial)\.[A-Za-z0-9_-]{1,64}\.v1$/;

export const backedUp = (key: string) => EXACT.includes(key) || PATTERN.test(key);

const MAX_VALUE = 1_000_000; // one item, e.g. 50 analyzed deals with long notes
const MAX_FILE = 4_000_000;

/** Pages clean what they read from storage; these keys are also checked here because their pages render them directly. */
const CLEAN: Record<string, (v: unknown) => unknown> = {
  'deedowl.buybox.v1': cleanBuyBox,
  'deedowl.analyze.v1': (v) => (Array.isArray(v) ? v.map(cleanDeal).filter(Boolean) : []),
  'deedowl.analyze.current.v1': (v) => cleanDeal(v),
  'deedowl.case.v1': cleanCase,
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
      if (k === 'deedowl.state.v1' && /^[A-Z]{2}$/.test(val)) data[k] = val; // every saved value is JSON except the chosen state code
      continue;
    }
    data[k] = CLEAN[k] ? JSON.stringify(CLEAN[k](parsed)) : val;
  }
  return { ok: true, data, saved: typeof o.saved === 'string' && !Number.isNaN(Date.parse(o.saved)) ? o.saved : '' };
}

/** Writes a checked backup into this browser. Returns how many items were restored. */
export function restoreBackup(data: Record<string, string>, storage: Storage = localStorage): number {
  let n = 0;
  for (const [k, v] of Object.entries(data)) {
    if (!backedUp(k)) continue;
    try {
      storage.setItem(k, v);
      n++;
    } catch {
      /* storage full or blocked */
    }
  }
  return n;
}
