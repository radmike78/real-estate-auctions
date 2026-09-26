// Commercial value by income (the "income approach"): what the property earns, not what nearby homes
// sold for. Net operating income (NOI) = rent collected after vacancy, minus operating costs.
// Value = NOI ÷ cap rate. Cap rates vary by property type, location and condition: ask a local
// commercial broker or appraiser for current ones.

export interface IncomeInputs {
  monthlyRent: number; // all spaces fully leased, per month
  otherMonthly: number; // parking, signs, laundry, reimbursements
  vacancyPct: number; // share of rent you expect to lose to empty space and non-payment
  expensePct: number; // operating costs as % of the rent you collect (taxes, insurance, repairs, management)
  capRatePct: number;
}

export const INCOME_DEFAULTS: IncomeInputs = { monthlyRent: 0, otherMonthly: 0, vacancyPct: 10, expensePct: 35, capRatePct: 8 };

export interface IncomeResult {
  grossAnnual: number;
  collected: number; // after vacancy
  expenses: number;
  noi: number;
  value: number; // 0 when there's no income or no cap rate
}

const nz = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function incomeValue(i: IncomeInputs): IncomeResult {
  const grossAnnual = (nz(i.monthlyRent) + nz(i.otherMonthly)) * 12;
  const collected = grossAnnual * (1 - Math.min(nz(i.vacancyPct), 100) / 100);
  const expenses = (collected * Math.min(nz(i.expensePct), 100)) / 100;
  const noi = collected - expenses;
  const cap = nz(i.capRatePct);
  const value = noi > 0 && cap > 0 ? Math.round(noi / (cap / 100) / 1000) * 1000 : 0;
  return { grossAnnual, collected, expenses, noi, value };
}

/** Rebuild saved inputs from untrusted storage: known keys, finite non-negative numbers only. */
export function sanitizeIncome(saved: unknown): IncomeInputs {
  const out = { ...INCOME_DEFAULTS };
  if (!saved || typeof saved !== 'object') return out;
  for (const k of Object.keys(out) as (keyof IncomeInputs)[]) {
    const v = (saved as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v;
  }
  return out;
}
