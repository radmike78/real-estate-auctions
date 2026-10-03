// The evidence log for a deal: for each thing to verify, where the answer came from, when it was checked, what
// was found, what's still open, and who handles it by when. Plus the decision it supports. Kept in this browser.

export interface EvidenceArea {
  key: string;
  title: string;
  what: string;
}

/** What to verify before committing to any property, whatever the sale type. */
export const EVIDENCE_AREAS: EvidenceArea[] = [
  { key: 'sale', title: 'Sale and ownership', what: 'The parcel, who is selling, and exactly what interest is being sold, from the official notice or listing.' },
  { key: 'title', title: 'Title and liens', what: 'A title professional’s review of recorded liens and which survive this kind of sale in this state.' },
  { key: 'occupancy', title: 'Occupancy and leases', what: 'Who lives there, any leases and deposits, and the lawful path to possession.' },
  { key: 'condition', title: 'Condition and repairs', what: 'Inspections and written bids: roof, systems, sewer or septic, foundation.' },
  { key: 'use', title: 'Use and permits', what: 'Zoning, permit history, access and any rental license your city requires.' },
  { key: 'insurance', title: 'Insurance and flood zone', what: 'A written quote for this property, exclusions, and the FEMA flood zone.' },
  { key: 'income', title: 'Income and expenses', what: 'Rent from leases signed nearby, tax after purchase, HOA, utilities and other costs.' },
  { key: 'terms', title: 'Financing and sale terms', what: 'Cash ready, loan conditions, deposits, payment deadlines and any way out.' },
  { key: 'exit', title: 'Exit and reserves', what: 'A downside case that still works, cash reserves, and a fallback plan.' },
];

export interface EvidenceRow {
  source: string;
  checked: string; // YYYY-MM-DD
  finding: string;
  open: string;
  owner: string;
  done: boolean;
}

export type Gate = '' | 'investigate' | 'pass' | 'proceed';

export const GATES: { key: Exclude<Gate, ''>; label: string; when: string }[] = [
  { key: 'investigate', label: 'Investigate', when: 'Something that could change the decision isn’t verified yet.' },
  { key: 'pass', label: 'Pass', when: 'The risk, price or cash needed no longer fits your buy box.' },
  { key: 'proceed', label: 'Proceed with professional review', when: 'The evidence supports your numbers, and your professionals have answered the questions specific to this deal.' },
];

export interface EvidenceLog {
  rows: Record<string, EvidenceRow>;
  gate: Gate;
}

const KEY = 'deedowl.evidence.v1';
const EMPTY_ROW: EvidenceRow = { source: '', checked: '', finding: '', open: '', owner: '', done: false };
const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');

/** One deal's log, cleaned so old or hand-edited storage can't break the page. */
export function cleanLog(v: unknown): EvidenceLog {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const rowsIn = (o.rows && typeof o.rows === 'object' ? o.rows : {}) as Record<string, unknown>;
  const rows: Record<string, EvidenceRow> = {};
  for (const a of EVIDENCE_AREAS) {
    const r = (rowsIn[a.key] && typeof rowsIn[a.key] === 'object' ? rowsIn[a.key] : {}) as Record<string, unknown>;
    const checked = str(r.checked, 10);
    rows[a.key] = { source: str(r.source, 300), checked: /^\d{4}-\d{2}-\d{2}$/.test(checked) ? checked : '', finding: str(r.finding, 600), open: str(r.open, 600), owner: str(r.owner, 200), done: r.done === true };
  }
  const gate = GATES.some((g) => g.key === o.gate) ? (o.gate as Gate) : '';
  return { rows, gate };
}

function loadAll(): Record<string, unknown> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export const loadLog = (dealId: string): EvidenceLog => cleanLog(Object.prototype.hasOwnProperty.call(loadAll(), dealId) ? loadAll()[dealId] : undefined);

/** Forget a deal's log, when the deal is removed. */
export function removeLog(dealId: string) {
  try {
    const all = loadAll();
    if (!(dealId in all)) return;
    delete all[dealId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

/** True when nothing has been entered: such logs aren't stored, so the list doesn't grow with unopened deals. */
export const isEmptyLog = (log: EvidenceLog) => !log.gate && Object.values(log.rows).every((r) => !r.done && !r.source && !r.checked && !r.finding && !r.open && !r.owner);

export function saveLog(dealId: string, log: EvidenceLog) {
  try {
    const all = loadAll();
    if (isEmptyLog(log)) delete all[dealId];
    else all[dealId] = log;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: the log lasts for this visit */
  }
}

export const emptyRow = (): EvidenceRow => ({ ...EMPTY_ROW });

/** The log as plain text, to download or print. */
export function logText(name: string, log: EvidenceLog): string {
  const gate = GATES.find((g) => g.key === log.gate);
  const lines = [`Evidence log: ${name}`, 'DeedOwl educational worksheet. A checkmark records your review; it does not clear title or certify a deal.', ''];
  for (const a of EVIDENCE_AREAS) {
    const r = log.rows[a.key] ?? EMPTY_ROW;
    lines.push(`${r.done ? '[x]' : '[ ]'} ${a.title}: ${a.what}`, `    Source: ${r.source}`, `    Date checked: ${r.checked}`, `    Finding: ${r.finding}`, `    Open question: ${r.open}`, `    Who / by when: ${r.owner}`, '');
  }
  lines.push(`Decision: ${gate ? `${gate.label} (${gate.when})` : 'not decided'}`);
  return lines.join('\n');
}
