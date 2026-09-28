// Buy-and-hold (rent) and commercial income: what you can pay for a property you keep and rent out, based on the
// return you want on the cash left in the deal. Purchase costs match the flip calculator (src/lib/bidCalc.ts).

const nz = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Costs of buying at auction and getting the property ready, shared by the rent and commercial calculators. */
export interface BuyInputs {
  cashAvailable: number; // cash you can bring on auction day (0 = no limit)
  buyerPremiumPct: number;
  transferTaxPer500: number;
  survivingLiens: number;
  titleLegal: number;
  possession: number;
  repairs: number; // repairs, or tenant improvements and leasing costs for commercial
  contingencyPct: number;
}

/** Loan after the purchase (auctions need cash on the day): a refinance or a new loan against the finished value. */
export interface LoanInputs {
  value: number; // value after repairs (or by income, for commercial)
  loanPct: number; // loan as % of that value (0 = no loan)
  ratePct: number; // yearly
  years: number; // amortization
  loanCostPct: number; // points and closing costs, % of the loan
}

export interface RentInputs extends BuyInputs, LoanInputs {
  monthlyRent: number;
  vacancyPct: number;
  propertyTaxYear: number;
  insuranceYear: number;
  hoaMonthly: number;
  managementPct: number; // % of rent collected
  maintenancePct: number; // % of rent collected
  capexPct: number; // reserves for big items (roof, HVAC), % of rent collected
  targetCocPct: number; // cash-on-cash return you require
  minDscr: number; // lenders often want 1.2 to 1.25
}

export interface CommercialInputs extends BuyInputs, LoanInputs {
  monthlyRent: number; // all spaces leased
  otherMonthly: number;
  vacancyPct: number;
  expensePct: number; // operating costs as % of rent collected
  leaseUpMonths: number; // months to find tenants before rent starts
  monthlyCarry: number; // carrying costs while empty
  targetCapPct: number; // yield on your all-in cost you require (going-in cap rate)
  minDscr: number;
}

/** Yearly payment on an amortizing loan. */
export function annualDebtService(loan: number, ratePct: number, years: number): number {
  if (!(loan > 0) || !(years > 0)) return 0;
  const r = nz(ratePct) / 100 / 12;
  const n = years * 12;
  const monthly = r > 0 ? (loan * r) / (1 - (1 + r) ** -n) : loan / n;
  return monthly * 12;
}

/** Everything it costs to own the property, ready to rent, at a given bid. */
export function allInCost(i: BuyInputs, bid: number): number {
  return bid * (1 + nz(i.buyerPremiumPct) / 100) + Math.ceil(bid / 500) * nz(i.transferTaxPer500) + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + nz(i.repairs) * (1 + nz(i.contingencyPct) / 100);
}

/** Highest bid whose all-in cost stays at or under `limit` (the transfer tax's rounding costs at most one extra step). */
function bidForAllIn(i: BuyInputs, limit: number): number {
  const perBid = 1 + nz(i.buyerPremiumPct) / 100 + nz(i.transferTaxPer500) / 500;
  const fixed = nz(i.transferTaxPer500) + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + nz(i.repairs) * (1 + nz(i.contingencyPct) / 100);
  return Math.max(0, Math.floor((limit - fixed) / perBid));
}

const cashBid = (i: BuyInputs) => (nz(i.cashAvailable) > 0 ? Math.floor(nz(i.cashAvailable) / (1 + nz(i.buyerPremiumPct) / 100)) : Infinity);

export interface HoldResult {
  maxBid: number;
  limitedBy: 'return' | 'cash';
  noBidWorks: boolean;
  noi: number; // yearly net operating income
  debtService: number; // yearly
  cashFlow: number; // yearly, after the loan payment
  dscr: number | null; // NOI / debt service; null without a loan
  loanOk: boolean; // DSCR meets your minimum (true without a loan)
  loanNet: number; // loan proceeds after its costs
  cashAtAuction: number;
  allIn: number;
  cashLeft: number; // your cash still in the deal after the loan (negative = you took money out)
  cashOnCash: number | null; // yearly cash flow / cash left; null when no cash is left in
  capOnCost: number | null; // NOI / all-in cost
}

function hold(i: BuyInputs & LoanInputs, noi: number, limit: (loanNet: number, cashFlow: number) => number, minDscr: number): HoldResult {
  const loan = (nz(i.value) * Math.min(nz(i.loanPct), 100)) / 100;
  const debtService = annualDebtService(loan, i.ratePct, i.years);
  const loanNet = loan * (1 - nz(i.loanCostPct) / 100);
  const cashFlow = noi - debtService;
  const dscr = debtService > 0 ? noi / debtService : null;
  const returnBid = cashFlow > 0 ? bidForAllIn(i, limit(loanNet, cashFlow)) : 0;
  const cb = cashBid(i);
  const maxBid = Math.min(returnBid, cb);
  const allIn = allInCost(i, maxBid);
  const cashLeft = allIn - loanNet;
  return {
    maxBid,
    limitedBy: cb < returnBid ? 'cash' : 'return',
    noBidWorks: maxBid <= 0,
    noi: r2(noi),
    debtService: r2(debtService),
    cashFlow: r2(cashFlow),
    dscr: dscr === null ? null : Math.round(dscr * 100) / 100,
    loanOk: dscr === null || dscr >= nz(minDscr),
    loanNet: r2(loanNet),
    cashAtAuction: r2(maxBid * (1 + nz(i.buyerPremiumPct) / 100)),
    allIn: r2(allIn),
    cashLeft: r2(cashLeft),
    cashOnCash: cashLeft > 0 ? cashFlow / cashLeft : null,
    capOnCost: allIn > 0 ? noi / allIn : null,
  };
}

/** Rent collected and operating costs for a year. */
export function rentNoi(i: RentInputs): { collected: number; expenses: number; noi: number } {
  const collected = nz(i.monthlyRent) * 12 * (1 - Math.min(nz(i.vacancyPct), 100) / 100);
  const expenses = nz(i.propertyTaxYear) + nz(i.insuranceYear) + nz(i.hoaMonthly) * 12 + (collected * (nz(i.managementPct) + nz(i.maintenancePct) + nz(i.capexPct))) / 100;
  return { collected: r2(collected), expenses: r2(expenses), noi: r2(collected - expenses) };
}

/**
 * Rent / hold: the highest bid that still gives your cash-on-cash return on the cash left in the deal after the loan.
 * With no loan, that's the cash flow divided by everything you put in.
 */
export function rentMaxBid(i: RentInputs): HoldResult {
  const t = nz(i.targetCocPct) / 100;
  return hold(i, rentNoi(i).noi, (loanNet, cf) => (t > 0 ? loanNet + cf / t : Infinity), i.minDscr);
}

export function commercialNoi(i: CommercialInputs): { collected: number; expenses: number; noi: number } {
  const collected = (nz(i.monthlyRent) + nz(i.otherMonthly)) * 12 * (1 - Math.min(nz(i.vacancyPct), 100) / 100);
  const expenses = (collected * Math.min(nz(i.expensePct), 100)) / 100;
  return { collected: r2(collected), expenses: r2(expenses), noi: r2(collected - expenses) };
}

/**
 * Commercial income: the highest bid whose all-in cost, plus carrying costs while you lease it up, still yields your
 * required cap rate on cost (NOI / everything you paid).
 */
export function commercialMaxBid(i: CommercialInputs): HoldResult & { leaseUpCost: number } {
  const leaseUpCost = nz(i.leaseUpMonths) * nz(i.monthlyCarry);
  const cap = nz(i.targetCapPct) / 100;
  const noi = commercialNoi(i).noi;
  const withLeaseUp = { ...i, possession: nz(i.possession) + leaseUpCost };
  return { ...hold(withLeaseUp, noi, () => (cap > 0 ? noi / cap : Infinity), i.minDscr), leaseUpCost: r2(leaseUpCost) };
}

// ---------------- Lien certificates (special assessment / SID) ----------------

export interface LienInputs {
  price: number; // certificate price you pay
  fees: number; // fees you pay that aren't repaid
  ratePctMonth: number; // interest a redemption pays, % a month
  monthsToRedeem: number;
  payoutDelayMonths: number; // time from redemption until you're paid
}

export function lienYield(i: LienInputs): { interest: number; payoff: number; profit: number; yearlyYield: number | null } {
  const interest = (nz(i.price) * nz(i.ratePctMonth) * nz(i.monthsToRedeem)) / 100;
  const profit = interest - nz(i.fees);
  const cash = nz(i.price) + nz(i.fees);
  const years = (nz(i.monthsToRedeem) + nz(i.payoutDelayMonths)) / 12;
  return { interest: r2(interest), payoff: r2(nz(i.price) + interest), profit: r2(profit), yearlyYield: cash > 0 && years > 0 ? profit / cash / years : null };
}

export const RENT_DEFAULTS: RentInputs = {
  cashAvailable: 0, buyerPremiumPct: 0, transferTaxPer500: 2.55, survivingLiens: 0, titleLegal: 500, possession: 300, repairs: 25_000, contingencyPct: 15,
  monthlyRent: 2_200, vacancyPct: 6, propertyTaxYear: 2_400, insuranceYear: 1_400, hoaMonthly: 0, managementPct: 8, maintenancePct: 5, capexPct: 5,
  value: 350_000, loanPct: 0, ratePct: 7.5, years: 30, loanCostPct: 2, targetCocPct: 8, minDscr: 1.25,
};

export const COMMERCIAL_DEFAULTS: CommercialInputs = {
  cashAvailable: 0, buyerPremiumPct: 0, transferTaxPer500: 2.55, survivingLiens: 0, titleLegal: 2_500, possession: 500, repairs: 50_000, contingencyPct: 15,
  monthlyRent: 12_000, otherMonthly: 0, vacancyPct: 10, expensePct: 35, leaseUpMonths: 6, monthlyCarry: 2_000, targetCapPct: 9, minDscr: 1.25,
  value: 0, loanPct: 0, ratePct: 8, years: 25, loanCostPct: 2,
};

export const LIEN_DEFAULTS: LienInputs = { price: 2_000, fees: 0, ratePctMonth: 1, monthsToRedeem: 8, payoutDelayMonths: 1.5 };

/** Rebuild saved inputs from untrusted storage: only known keys, only finite non-negative numbers, capped. */
export function sanitizeNumbers<T extends object>(saved: unknown, defaults: T, max = 1e10): T {
  const out = { ...defaults };
  if (!saved || typeof saved !== 'object') return out;
  for (const k of Object.keys(defaults) as (keyof T)[]) {
    const v = (saved as Record<string, unknown>)[k as string];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) (out[k] as unknown as number) = Math.min(v, max);
  }
  return out;
}
