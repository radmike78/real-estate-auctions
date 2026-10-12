import { workStorage as localStorage } from './workStorage';
// "I bought it": for a deal you closed on, the actual rent and costs month by month, against what you projected.
// Kept in this browser like the rest of My deals.

export const OWNED_KEY = 'deedowl.owned.v1';
export const OWNED_EVENT = 'deedowl-owned-change';

export interface OwnedMonth {
  /** YYYY-MM */
  month: string;
  rent: number;
  /** Everything you paid that month: loan, taxes, insurance, HOA, repairs, management, utilities. */
  costs: number;
  /** Money moved into or out of your repair and replacement savings. */
  note: string;
}

export interface Owned {
  boughtOn: string; // YYYY-MM-DD
  months: OwnedMonth[];
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-1e9, Math.min(1e9, v)) : 0);

/** Rebuilt safely from storage: only well-formed entries, one per month, newest first, at most 10 years. */
export function cleanOwned(v: unknown): Record<string, Owned> {
  const out: Record<string, Owned> = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [id, raw] of Object.entries(v as Record<string, unknown>).slice(0, 200)) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !raw || typeof raw !== 'object') continue;
    const r = raw as { boughtOn?: unknown; months?: unknown };
    if (typeof r.boughtOn !== 'string' || !DATE_RE.test(r.boughtOn)) continue;
    const seen = new Set<string>();
    const months = (Array.isArray(r.months) ? r.months : [])
      .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
      .filter((m) => typeof m.month === 'string' && MONTH_RE.test(m.month) && !seen.has(m.month) && !!seen.add(m.month))
      .map((m) => ({ month: m.month as string, rent: num(m.rent), costs: num(m.costs), note: typeof m.note === 'string' ? m.note.slice(0, 200) : '' }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 120);
    out[id] = { boughtOn: r.boughtOn, months };
  }
  return out;
}

export function loadOwned(): Record<string, Owned> {
  try {
    return cleanOwned(JSON.parse(localStorage.getItem(OWNED_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

export function saveOwned(all: Record<string, Owned>) {
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify(all));
  } catch {
    /* private mode: not kept */
  }
  window.dispatchEvent(new CustomEvent(OWNED_EVENT));
}

/** Actual against projected for one property: totals, the average month, and the gap. */
export function ownedSummary(o: Owned, projectedMonthly: number | null) {
  const n = o.months.length;
  const rent = o.months.reduce((s, m) => s + m.rent, 0);
  const costs = o.months.reduce((s, m) => s + m.costs, 0);
  const actual = rent - costs;
  const avg = n ? actual / n : 0;
  return {
    months: n,
    rent,
    costs,
    actual,
    averageMonthly: avg,
    projectedTotal: projectedMonthly === null ? null : projectedMonthly * n,
    /** Average actual minus projected, a month; negative means it's earning less than planned. */
    gapMonthly: projectedMonthly === null || !n ? null : avg - projectedMonthly,
  };
}
