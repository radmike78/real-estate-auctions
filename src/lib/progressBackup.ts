// Back up and restore learning progress: everything DeedOwl keeps in this browser for the visitor (roadmap, drills,
// practice runs, buy box, saved deals, evidence logs, calculator inputs), as one file they keep. There are no
// accounts, so this is how progress moves to another device or survives clearing the browser.
// Sign-in links and email-alert tokens are never included.

const EXACT = [
  'deedowl.path.v1',
  'deedowl.roadmap.v1',
  'deedowl.buybox.v1',
  'deedowl.drills.v1',
  'deedowl.decide.v1',
  'deedowl.evidence.v1',
  'deedowl.analyze.v1',
  'deedowl.analyze.current.v1',
  'deedowl.area.v1',
  'deedowl.state.v1',
  'fsf.practice.v1',
  'fsf.deals.v1',
  'fsf.calc.rent.v1',
  'fsf.calc.commercial.v1',
  'fsf.calc.lien.v1',
  'fsf.calc.lien.az.v1',
  'fsf.calc.strategy.v1',
  'fsf.bid.mode.v1',
];
const PATTERN = /^fsf\.(dd|bid)\.[A-Za-z0-9_-]{1,64}\.v1$/;

export const backedUp = (key: string) => EXACT.includes(key) || PATTERN.test(key);

const MAX_VALUE = 200_000;
const MAX_FILE = 2_000_000;

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
export function readBackup(text: string): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
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
    try {
      JSON.parse(val);
    } catch {
      if (k !== 'deedowl.state.v1') continue; // every saved value is JSON except the chosen state code
    }
    data[k] = val;
  }
  return { ok: true, data };
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
