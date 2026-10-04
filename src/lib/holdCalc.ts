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

/**
 * The loan. At an auction it comes after the purchase (cash on the day): a refinance against the finished value.
 * Buying a listed home (`onPrice`), it's a purchase loan: a % of the price or the appraised value, whichever is
 * lower, so a lower price means a smaller loan and payment.
 */
export interface LoanInputs {
  value: number; // value after repairs (or by income, for commercial); the appraised value for a purchase loan
  loanPct: number; // loan as % of that value, or of the lower of price and value (0 = no loan)
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
  reserveCash: number; // savings left after closing and repairs, to carry the property with no rent
  atPrice: number; // the price you'd actually pay (0 until entered), saved with the deal
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

/** The loan at a price: on the lower of price and value for a purchase loan, on the value for a later refinance. */
export function loanAt(i: LoanInputs, price: number, onPrice = false): number {
  const pct = Math.min(nz(i.loanPct), 100) / 100;
  if (!onPrice) return nz(i.value) * pct;
  const base = nz(i.value) > 0 ? Math.min(nz(price), nz(i.value)) : nz(price);
  return base * pct;
}

/** Largest whole bid in [0, hi] where `ok` holds, for a condition that only gets harder as the bid rises. */
function largest(ok: (bid: number) => boolean, hi: number): number {
  if (!ok(0)) return -1;
  if (ok(hi)) return hi;
  let lo = 0;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
const SEARCH_MAX = 1e9;

export interface HoldResult {
  maxBid: number;
  limitedBy: 'return' | 'cash';
  noBidWorks: boolean;
  noi: number; // yearly net operating income: income after operating costs, before reserves and the loan
  reserves: number; // yearly money set aside for big replacements (roof, HVAC), counted after NOI
  debtService: number; // yearly
  cashFlow: number; // yearly, after reserves and the loan payment
  dscr: number | null; // NOI / debt service; null without a loan
  loanOk: boolean; // DSCR meets your minimum (true without a loan)
  loanNet: number; // loan proceeds after its costs
  cashAtAuction: number;
  allIn: number;
  cashLeft: number; // your cash still in the deal after the loan (negative = you took money out)
  cashOnCash: number | null; // yearly cash flow / cash left; null when no cash is left in
  capOnCost: number | null; // NOI / all-in cost
  cashLimit: number | null; // the cash you said you can bring, if any
}

function hold(i: BuyInputs & LoanInputs, noi: number, limit: (loanNet: number, cashFlow: number) => number, minDscr: number, reserves = 0, onPrice = false): HoldResult {
  const at = (bid: number) => {
    const loan = loanAt(i, bid, onPrice);
    const debtService = annualDebtService(loan, i.ratePct, i.years);
    const loanNet = loan * (1 - nz(i.loanCostPct) / 100);
    return { debtService, loanNet, cashFlow: noi - reserves - debtService };
  };
  let returnBid: number;
  if (!onPrice) {
    // A later refinance doesn't change with the price: the limit is a straight line.
    const m = at(0);
    returnBid = m.cashFlow > 0 ? bidForAllIn(i, limit(m.loanNet, m.cashFlow)) : 0;
  } else {
    // A purchase loan grows with the price, and so does the payment: search for the highest price that still works.
    const ok = (bid: number) => {
      const m = at(bid);
      return m.cashFlow > 0 && allInCost(i, bid) <= limit(m.loanNet, m.cashFlow);
    };
    returnBid = Math.max(0, largest(ok, SEARCH_MAX));
    // No target (or none that binds) and no loan to grow: the return sets no price limit, same as the refinance case.
    if (returnBid >= SEARCH_MAX) returnBid = Infinity;
  }
  // Your cash covers everything you pay before any later refinance; with a purchase loan, everything but the loan.
  const cash = nz(i.cashAvailable);
  const cb = cash > 0 ? Math.max(0, largest((bid) => (onPrice || bid * (1 + nz(i.buyerPremiumPct) / 100) <= cash) && allInCost(i, bid) - (onPrice ? at(bid).loanNet : 0) <= cash, Math.ceil(cash / Math.max(1 - (onPrice ? Math.min(nz(i.loanPct), 100) / 100 : 0), 0.01)) + 1)) : Infinity;
  const maxBid = Math.min(returnBid, cb);
  const { debtService, loanNet, cashFlow } = at(maxBid);
  const dscr = debtService > 0 ? noi / debtService : null;
  const allIn = allInCost(i, maxBid);
  const cashLeft = allIn - loanNet;
  return {
    maxBid,
    limitedBy: cb < returnBid ? 'cash' : 'return',
    noBidWorks: maxBid <= 0,
    noi: r2(noi),
    reserves: r2(reserves),
    debtService: r2(debtService),
    cashFlow: r2(cashFlow),
    dscr: dscr === null ? null : Math.round(dscr * 100) / 100,
    loanOk: dscr === null || dscr >= nz(minDscr),
    loanNet: r2(loanNet),
    cashAtAuction: r2(maxBid * (1 + nz(i.buyerPremiumPct) / 100)),
    cashLimit: cash > 0 ? r2(cash) : null,
    allIn: r2(allIn),
    cashLeft: r2(cashLeft),
    cashOnCash: cashLeft > 0 ? cashFlow / cashLeft : null,
    capOnCost: allIn > 0 ? noi / allIn : null,
  };
}

/**
 * A year of rent: rent collected, operating costs, net operating income (NOI), and reserves for big replacements.
 * NOI is before reserves and the loan; cash flow subtracts both.
 */
export function rentNoi(i: RentInputs): { collected: number; expenses: number; noi: number; reserves: number } {
  const collected = nz(i.monthlyRent) * 12 * (1 - Math.min(nz(i.vacancyPct), 100) / 100);
  const expenses = nz(i.propertyTaxYear) + nz(i.insuranceYear) + nz(i.hoaMonthly) * 12 + (collected * (nz(i.managementPct) + nz(i.maintenancePct))) / 100;
  const reserves = (collected * nz(i.capexPct)) / 100;
  return { collected: r2(collected), expenses: r2(expenses), noi: r2(collected - expenses), reserves: r2(reserves) };
}

/**
 * Rent / hold: the highest bid that still gives your cash-on-cash return on the cash left in the deal after the loan.
 * With no loan, that's the cash flow divided by everything you put in.
 */
export function rentMaxBid(i: RentInputs, onPrice = false): HoldResult {
  const t = nz(i.targetCocPct) / 100;
  const n = rentNoi(i);
  return hold(i, n.noi, (loanNet, cf) => (t > 0 ? loanNet + cf / t : Infinity), i.minDscr, n.reserves, onPrice);
}

/**
 * How long your savings carry the property with no rent coming in: the loan payment, taxes, insurance and HOA dues
 * keep coming either way. `months` is null until you enter the cash you'll have left.
 */
export function rentEmptyMonths(i: RentInputs, price = nz(i.value), onPrice = false): { monthly: number; months: number | null } {
  const loan = loanAt(i, price, onPrice);
  const monthly = annualDebtService(loan, i.ratePct, i.years) / 12 + (nz(i.propertyTaxYear) + nz(i.insuranceYear)) / 12 + nz(i.hoaMonthly);
  return { monthly: r2(monthly), months: nz(i.reserveCash) > 0 && monthly > 0 ? Math.floor((nz(i.reserveCash) / monthly) * 10) / 10 : null };
}

/** Monthly cash flow after the loan payment, at a price (a purchase loan depends on it; a later refinance doesn't). */
export function rentMonthlyCashFlow(i: RentInputs, price = nz(i.value), onPrice = false): number {
  const loan = loanAt(i, price, onPrice);
  const n = rentNoi(i);
  return r2((n.noi - n.reserves - annualDebtService(loan, i.ratePct, i.years)) / 12);
}

/** The rental at a price you choose: every step from rent to cash flow, and the cash it takes. Yearly amounts. */
export function rentAtPrice(i: RentInputs, price: number, onPrice = false) {
  const n = rentNoi(i);
  const loan = loanAt(i, nz(price), onPrice);
  const debtService = annualDebtService(loan, i.ratePct, i.years);
  const loanNet = loan * (1 - nz(i.loanCostPct) / 100);
  const allIn = allInCost(i, nz(price));
  const cashIn = allIn - loanNet;
  const cashFlow = n.noi - n.reserves - debtService;
  return {
    gross: r2(nz(i.monthlyRent) * 12),
    vacancy: r2(nz(i.monthlyRent) * 12 - n.collected),
    collected: n.collected,
    operating: n.expenses,
    noi: n.noi,
    reserves: n.reserves,
    debtService: r2(debtService),
    cashFlow: r2(cashFlow),
    loan: r2(loan),
    allIn: r2(allIn),
    cashIn: r2(cashIn),
    cashOnCash: cashIn > 0 ? cashFlow / cashIn : null,
    capOnPrice: nz(price) > 0 ? n.noi / nz(price) : null,
    capOnCost: allIn > 0 ? n.noi / allIn : null,
    dscr: debtService > 0 ? Math.round((n.noi / debtService) * 100) / 100 : null,
  };
}

/** What the monthly cash flow becomes when common surprises happen. */
export function rentStress(i: RentInputs, price = nz(i.value), onPrice = false): { key: string; label: string; monthly: number }[] {
  const at = (patch: Partial<RentInputs>, oneOff = 0) => r2(rentMonthlyCashFlow({ ...i, ...patch }, price, onPrice) - oneOff / 12);
  const rows = [
    { key: 'base', label: 'As entered', monthly: at({}) },
    { key: 'rent', label: 'Rent 10% lower', monthly: at({ monthlyRent: nz(i.monthlyRent) * 0.9 }) },
    { key: 'insurance', label: 'Insurance up $1,200 a year', monthly: at({ insuranceYear: nz(i.insuranceYear) + 1200 }) },
    { key: 'vacant', label: 'Empty for two months', monthly: at({ vacancyPct: Math.max(nz(i.vacancyPct), 100 / 6) }) },
    { key: 'tax', label: 'Property tax 20% higher', monthly: at({ propertyTaxYear: nz(i.propertyTaxYear) * 1.2 }) },
    { key: 'repair', label: 'A $5,000 repair this year', monthly: at({}, 5000) },
  ];
  if (nz(i.loanPct) > 0) rows.push({ key: 'rate', label: 'Interest rate 1 point higher', monthly: at({ ratePct: nz(i.ratePct) + 1 }) });
  return rows;
}

/** The deal in plain words: what it earns, what could break it, and what to check before going further. */
export function explainRent(i: RentInputs, price = nz(i.value), onPrice = false): string[] {
  const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
  const stress = rentStress(i, price, onPrice);
  const base = stress[0].monthly;
  const out: string[] = [];
  if (base <= 0) {
    out.push(`With your numbers, this rental loses about ${money(base)} a month after all costs${nz(i.loanPct) > 0 ? ' and the loan payment' : ''}. Unless the rent can be higher or the costs lower, it isn’t a rental that pays for itself.`);
  } else {
    out.push(`With your numbers, this rental brings in about ${money(base)} a month after all costs${nz(i.loanPct) > 0 ? ' and the loan payment' : ''}.`);
    const breaks = stress.slice(1).filter((s) => s.monthly < 0);
    if (breaks.length) out.push(`It turns negative if any of these happen: ${breaks.map((s) => s.label.toLowerCase()).join('; ')}.`);
    const ins = stress.find((s) => s.key === 'insurance')!;
    if (ins.monthly >= 0 && base - ins.monthly > base / 4) out.push(`An insurance increase of $1,200 a year would take ${Math.round(((base - ins.monthly) / base) * 100)}% of your cash flow.`);
    if (!breaks.length) out.push('It stays positive in every stress test below.');
  }
  if (!(nz(i.capexPct) > 0)) out.push('You set nothing aside for big replacements like the roof, HVAC and water heater. Leaving them out is the most common way rental numbers look better than they are.');
  if (nz(i.vacancyPct) < 5) out.push(`Your vacancy of ${nz(i.vacancyPct)}% is below the 5–8% that’s common for homes.`);
  if (!(nz(i.managementPct) > 0)) out.push('You assumed you’ll manage it yourself. If you later hire a property manager, that fee comes out of your cash flow.');
  out.push('Before you go further, check the rent against homes that actually rented nearby, get an insurance quote, ask the county what the property tax will be after you buy, and have the roof and systems inspected.');
  return out;
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
export function commercialMaxBid(i: CommercialInputs, onPrice = false): HoldResult & { leaseUpCost: number } {
  const leaseUpCost = nz(i.leaseUpMonths) * nz(i.monthlyCarry);
  const cap = nz(i.targetCapPct) / 100;
  const noi = commercialNoi(i).noi;
  const withLeaseUp = { ...i, possession: nz(i.possession) + leaseUpCost };
  return { ...hold(withLeaseUp, noi, () => (cap > 0 ? noi / cap : Infinity), i.minDscr, 0, onPrice), leaseUpCost: r2(leaseUpCost) };
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
  value: 350_000, loanPct: 0, ratePct: 7.5, years: 30, loanCostPct: 2, targetCocPct: 8, minDscr: 1.25, reserveCash: 0, atPrice: 0,
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
