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
  atPrice: number; // asking price or proposed offer/bid, saved with the deal
  monthlyRent: number; // all spaces leased
  otherMonthly: number;
  vacancyPct: number;
  expensePct: number; // operating costs as % of rent collected
  /** Operating costs line by line (yearly, what the owner pays). Any line above zero replaces expensePct. */
  opTaxYear: number;
  opInsuranceYear: number;
  opRepairsYear: number;
  opUtilitiesYear: number;
  opManagementPct: number; // % of rent collected
  opOtherYear: number;
  leaseUpMonths: number; // months to find tenants before rent starts
  monthlyCarry: number; // carrying costs while empty
  /** Yearly money set aside for big replacements and future leasing (roof, HVAC, tenant improvements), after NOI. */
  reservesYear: number;
  targetCapPct: number; // yield on your all-in cost you require (going-in cap rate)
  minDscr: number;
}

/** Yearly payment on an amortizing loan. A loan with no term entered is figured over 30 years, never as free. */
export function annualDebtService(loan: number, ratePct: number, years: number): number {
  if (!(loan > 0)) return 0;
  const r = nz(ratePct) / 100 / 12;
  const n = (years > 0 ? years : 30) * 12;
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
  /** What sets the walk-away price: your return target, your cash, or the lender's minimum coverage (DSCR). */
  limitedBy: 'return' | 'cash' | 'dscr';
  noBidWorks: boolean;
  noi: number; // yearly net operating income: income after operating costs, before reserves and the loan
  reserves: number; // yearly money set aside for big replacements (roof, HVAC), counted after NOI
  debtService: number; // yearly
  cashFlow: number; // yearly, after reserves and the loan payment
  dscr: number | null; // NOI / debt service; null without a loan
  loanOk: boolean; // DSCR meets your minimum (true without a loan)
  loanNet: number; // loan proceeds after its costs
  loanFees: number; // the loan's costs (points and fees), not counted in allIn
  cashAtAuction: number;
  allIn: number;
  cashLeft: number; // your cash still in the deal after the loan (negative = you took money out)
  cashOnCash: number | null; // yearly cash flow / cash left; null when no cash is left in
  capOnCost: number | null; // NOI / all-in cost
  cashLimit: number | null; // the cash you said you can bring, if any
  /** A later refinance whose payment is more than the income: no price works with that loan, though a smaller one might. */
  loanTooBig: boolean;
  /** A return target is set, yet even a $1 billion price meets it: almost always a typo in the rent or costs. */
  overCap: boolean;
}

function hold(i: BuyInputs & LoanInputs, noi: number, limit: (loanNet: number, cashFlow: number) => number, minDscr: number, reserves = 0, onPrice = false, carryMonths = 0): HoldResult {
  const at = (bid: number) => {
    const loan = loanAt(i, bid, onPrice);
    const debtService = annualDebtService(loan, i.ratePct, i.years);
    const loanNet = loan * (1 - nz(i.loanCostPct) / 100);
    return { debtService, loanNet, cashFlow: noi - reserves - debtService };
  };
  // A purchase loan's payments start at closing, so months before the rent starts (lease-up) cost loan payments too.
  const allInAt = (bid: number) => allInCost(i, bid) + (onPrice ? (nz(carryMonths) * at(bid).debtService) / 12 : 0);
  // The lender's minimum coverage (DSCR) caps a purchase loan's price too, not just the return you want.
  const dscrOk = (m: { debtService: number }) => !(nz(minDscr) > 0 && m.debtService > 0) || noi / m.debtService >= nz(minDscr);
  let returnBid: number;
  let dscrBinds = false;
  let overCap = false;
  if (!onPrice) {
    // A later refinance doesn't change with the price: the limit is a straight line.
    const m = at(0);
    returnBid = m.cashFlow > 0 ? bidForAllIn(i, limit(m.loanNet, m.cashFlow)) : 0;
  } else {
    // A purchase loan grows with the price, and so does the payment: search for the highest price that still works.
    const ok = (bid: number) => {
      const m = at(bid);
      return m.cashFlow > 0 && dscrOk(m) && allInAt(bid) <= limit(m.loanNet, m.cashFlow);
    };
    returnBid = Math.max(0, largest(ok, SEARCH_MAX));
    // Would one dollar more still meet the return, and fail only the lender's coverage? Then coverage sets the price.
    const next = at(returnBid + 1);
    dscrBinds = returnBid < SEARCH_MAX && next.cashFlow > 0 && !dscrOk(next) && allInAt(returnBid + 1) <= limit(next.loanNet, next.cashFlow);
    // No target (or none that binds) and no loan to grow: the return sets no price limit, same as the refinance case.
    if (returnBid >= SEARCH_MAX) {
      returnBid = Infinity;
      // With a target that would bind, the search only stopped at its $1 billion ceiling.
      overCap = Number.isFinite(limit(at(SEARCH_MAX).loanNet, at(SEARCH_MAX).cashFlow));
    }
  }
  // Your cash covers everything you pay before any later refinance; with a purchase loan, everything but the loan.
  const cash = nz(i.cashAvailable);
  const cb = cash > 0 ? Math.max(0, largest((bid) => (onPrice || bid * (1 + nz(i.buyerPremiumPct) / 100) <= cash) && allInAt(bid) - (onPrice ? at(bid).loanNet : 0) <= cash, Math.ceil(cash / Math.max(1 - (onPrice ? Math.min(nz(i.loanPct), 100) / 100 : 0), 0.01)) + 1)) : Infinity;
  const maxBid = Math.min(returnBid, cb);
  const { debtService, loanNet, cashFlow } = at(maxBid);
  const dscr = debtService > 0 ? noi / debtService : null;
  const allIn = allInAt(maxBid);
  const cashLeft = allIn - loanNet;
  const refi = at(0);
  return {
    maxBid,
    limitedBy: cb < returnBid ? 'cash' : dscrBinds ? 'dscr' : 'return',
    noBidWorks: maxBid <= 0,
    noi: r2(noi),
    reserves: r2(reserves),
    debtService: r2(debtService),
    cashFlow: r2(cashFlow),
    dscr: dscr === null ? null : Math.round(dscr * 100) / 100,
    // Eligibility uses full precision; rounding is presentation only.
    loanOk: dscr === null || dscr >= nz(minDscr),
    loanNet: r2(loanNet),
    loanFees: r2(loanAt(i, maxBid, onPrice) - loanNet),
    cashAtAuction: r2(maxBid * (1 + nz(i.buyerPremiumPct) / 100)),
    cashLimit: cash > 0 ? r2(cash) : null,
    allIn: r2(allIn),
    cashLeft: r2(cashLeft),
    cashOnCash: cashLeft > 0 ? cashFlow / cashLeft : null,
    capOnCost: allIn > 0 ? noi / allIn : null,
    loanTooBig: !onPrice && refi.debtService > 0 && refi.cashFlow <= 0 && noi - reserves > 0,
    overCap: overCap && !Number.isFinite(maxBid),
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

/** The yearly operating costs entered line by line, or 0 when none were (then the percentage is used). */
export function commercialLines(i: CommercialInputs, collected: number): number {
  const fixed = nz(i.opTaxYear) + nz(i.opInsuranceYear) + nz(i.opRepairsYear) + nz(i.opUtilitiesYear) + nz(i.opOtherYear);
  const management = (collected * Math.min(nz(i.opManagementPct), 100)) / 100;
  return fixed + management;
}

export function commercialNoi(i: CommercialInputs): { collected: number; expenses: number; noi: number; byLine: boolean } {
  const collected = (nz(i.monthlyRent) + nz(i.otherMonthly)) * 12 * (1 - Math.min(nz(i.vacancyPct), 100) / 100);
  const lines = commercialLines(i, collected);
  const expenses = lines > 0 ? lines : (collected * Math.min(nz(i.expensePct), 100)) / 100;
  return { collected: r2(collected), expenses: r2(expenses), noi: r2(collected - expenses), byLine: lines > 0 };
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
  return { ...hold(withLeaseUp, noi, () => (cap > 0 ? noi / cap : Infinity), i.minDscr, nz(i.reservesYear), onPrice, onPrice ? i.leaseUpMonths : 0), leaseUpCost: r2(leaseUpCost) };
}

/** Commercial results at the actual price, using the same lease-up and loan assumptions as the target. */
export function commercialAtPrice(i: CommercialInputs, price: number, onPrice = false) {
  const p = nz(price);
  const n = commercialNoi(i);
  const loan = loanAt(i, p, onPrice);
  const debtService = annualDebtService(loan, i.ratePct, i.years);
  const leaseUpCost = nz(i.leaseUpMonths) * nz(i.monthlyCarry);
  const leaseUpDebt = onPrice ? nz(i.leaseUpMonths) * debtService / 12 : 0;
  const allIn = allInCost({ ...i, possession: nz(i.possession) + leaseUpCost }, p) + leaseUpDebt;
  const loanFees = loan * nz(i.loanCostPct) / 100;
  const cashIn = allIn - loan + loanFees;
  const cashFlow = n.noi - nz(i.reservesYear) - debtService;
  const dscr = debtService > 0 ? n.noi / debtService : null;
  return {
    price: p, noi: n.noi, operating: n.expenses, reserves: nz(i.reservesYear),
    allIn: r2(allIn), cashIn: r2(cashIn), loan: r2(loan), loanFees: r2(loanFees),
    leaseUpCost: r2(leaseUpCost), leaseUpDebt: r2(leaseUpDebt), debtService: r2(debtService), cashFlow: r2(cashFlow),
    capOnPrice: p > 0 ? n.noi / p : null, capOnCost: allIn > 0 ? n.noi / allIn : null,
    cashOnCash: cashIn > 0 ? cashFlow / cashIn : null,
    dscr, loanOk: dscr === null || dscr >= nz(i.minDscr),
  };
}

// ---------------- Lien certificates (special assessment / SID) ----------------

export interface LienInputs {
  price: number; // certificate price you pay
  fees: number; // fees you pay that aren't repaid
  ratePctMonth: number; // interest a redemption pays, % a month
  monthsToRedeem: number;
  payoutDelayMonths: number; // time from redemption until you're paid
}

/** Limits no real certificate reaches, so a mistyped field can't produce numbers too long to read. */
export const LIEN_MAX = { price: 1e8, fees: 1e8, ratePctMonth: 10, monthsToRedeem: 120, payoutDelayMonths: 60 };

export function lienYield(raw: LienInputs): { interest: number; payoff: number; profit: number; yearlyYield: number | null } {
  const i = { ...raw };
  for (const k of Object.keys(LIEN_MAX) as (keyof LienInputs)[]) i[k] = Math.min(nz(raw[k]), LIEN_MAX[k]);
  const interest = (i.price * i.ratePctMonth * i.monthsToRedeem) / 100;
  const profit = interest - i.fees;
  const cash = i.price + i.fees;
  const years = (i.monthsToRedeem + i.payoutDelayMonths) / 12;
  return { interest: r2(interest), payoff: r2(i.price + interest), profit: r2(profit), yearlyYield: cash > 0 && years > 0 ? profit / cash / years : null };
}

export const RENT_DEFAULTS: RentInputs = {
  cashAvailable: 0, buyerPremiumPct: 0, transferTaxPer500: 2.55, survivingLiens: 0, titleLegal: 500, possession: 300, repairs: 25_000, contingencyPct: 15,
  monthlyRent: 2_200, vacancyPct: 6, propertyTaxYear: 2_400, insuranceYear: 1_400, hoaMonthly: 0, managementPct: 8, maintenancePct: 5, capexPct: 5,
  value: 350_000, loanPct: 0, ratePct: 7.5, years: 30, loanCostPct: 2, targetCocPct: 8, minDscr: 1.25, reserveCash: 0, atPrice: 0,
};

export const COMMERCIAL_DEFAULTS: CommercialInputs = {
  atPrice: 0,
  cashAvailable: 0, buyerPremiumPct: 0, transferTaxPer500: 2.55, survivingLiens: 0, titleLegal: 2_500, possession: 500, repairs: 50_000, contingencyPct: 15,
  monthlyRent: 12_000, otherMonthly: 0, vacancyPct: 10, expensePct: 35,
  opTaxYear: 0, opInsuranceYear: 0, opRepairsYear: 0, opUtilitiesYear: 0, opManagementPct: 0, opOtherYear: 0, leaseUpMonths: 6, monthlyCarry: 2_000, reservesYear: 0, targetCapPct: 9, minDscr: 1.25,
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

/** Loan balance left after `months` payments on a fully amortizing loan (the full amount for an interest-free one). */
export function loanBalance(loan: number, ratePct: number, years: number, months: number): number {
  const L = nz(loan);
  const n = Math.round((nz(years) || 30) * 12);
  const p = Math.min(Math.max(0, Math.round(months)), n);
  const r = nz(ratePct) / 100 / 12;
  if (!L) return 0;
  if (!r) return r2(L * (1 - p / n));
  return r2((L * ((1 + r) ** n - (1 + r) ** p)) / ((1 + r) ** n - 1));
}

/** The yearly rate that makes the cash flows' present value zero (first flow at time 0); null if there's none. */
export function irr(flows: number[]): number | null {
  const npv = (rate: number) => flows.reduce((s, f, t) => s + f / (1 + rate) ** t, 0);
  let lo = -0.99;
  let hi = 10;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export interface HoldSellInputs {
  years: number;
  appreciationPct: number;
  rentGrowthPct: number;
  sellingCostPct: number;
}
export const HOLD_SELL_DEFAULTS: HoldSellInputs = { years: 5, appreciationPct: 3, rentGrowthPct: 3, sellingCostPct: 7 };

/**
 * Keep it for some years, then sell: the yearly cash flows (rent and costs growing together), the sale after selling
 * costs and the loan payoff, and the return on the cash you put in. Before income tax.
 */
export function holdAndSell(i: RentInputs, price: number, h: HoldSellInputs, onPrice = false) {
  // With neither a price nor a value there's nothing to buy or sell: no result, rather than a "profit" on a $0 home.
  if (!(nz(price) > 0) && !(nz(i.value) > 0)) return null;
  const base = rentAtPrice(i, price, onPrice);
  const years = Math.min(30, Math.max(1, Math.round(nz(h.years) || 1)));
  const grow = 1 + nz(h.rentGrowthPct) / 100;
  const flows = Array.from({ length: years }, (_, t) => r2((base.noi - base.reserves) * grow ** t - base.debtService));
  const value = nz(i.value) || nz(price);
  const saleValue = r2(value * (1 + nz(h.appreciationPct) / 100) ** years);
  const payoff = loanBalance(base.loan, i.ratePct, i.years, years * 12);
  const saleNet = r2(saleValue * (1 - nz(h.sellingCostPct) / 100) - payoff);
  const cashIn = base.cashIn;
  const totalBack = r2(flows.reduce((a, b) => a + b, 0) + saleNet);
  return {
    years,
    cashIn,
    flows,
    saleValue,
    payoff,
    saleNet,
    profit: r2(totalBack - cashIn),
    equityMultiple: cashIn > 0 ? totalBack / cashIn : null,
    irr: cashIn > 0 ? irr([-cashIn, ...flows.slice(0, -1), flows[years - 1] + saleNet]) : null,
  };
}

export interface SellerFinanceInputs {
  price: number;
  downPct: number;
  ratePct: number;
  amortYears: number; // the payment is figured over this many years
  balloonYears: number; // the rest is due after this many years (0: none, it pays off)
  bankDownPct: number;
  bankRatePct: number;
}
export const SELLER_FINANCE_DEFAULTS: SellerFinanceInputs = { price: 300_000, downPct: 10, ratePct: 7, amortYears: 30, balloonYears: 5, bankDownPct: 25, bankRatePct: 7.5 };

/**
 * A seller-financed purchase next to a bank loan: the down payment, the monthly payment, the balloon still owed when
 * it comes due (which you'll need cash or a new loan for), and what the bank route would take instead.
 */
export function sellerFinance(i: SellerFinanceInputs) {
  const price = nz(i.price);
  const down = r2((price * Math.min(nz(i.downPct), 100)) / 100);
  const loan = r2(price - down);
  const amort = nz(i.amortYears) || 30;
  const monthly = r2(annualDebtService(loan, i.ratePct, amort) / 12);
  const balloonYears = Math.min(nz(i.balloonYears), amort);
  const balloon = balloonYears > 0 && balloonYears < amort ? loanBalance(loan, i.ratePct, amort, balloonYears * 12) : 0;
  const months = balloonYears > 0 && balloonYears < amort ? balloonYears * 12 : amort * 12;
  const interestPaid = r2(monthly * months - (loan - balloon));
  const bankDown = r2((price * Math.min(nz(i.bankDownPct), 100)) / 100);
  const bankMonthly = r2(annualDebtService(price - bankDown, i.bankRatePct, 30) / 12);
  return {
    down,
    loan,
    monthly,
    balloon,
    balloonYears: balloon > 0 ? balloonYears : 0,
    /** Share of the price still owed at the balloon: what a refinance would need to cover. */
    balloonPctOfPrice: price > 0 ? balloon / price : 0,
    interestPaid,
    bankDown,
    bankMonthly,
    cashSaved: r2(bankDown - down),
  };
}

/**
 * How a lender sees the rent, at a price. A conventional (Fannie Mae-style) lender usually counts 75% of the rent and
 * subtracts the full payment with taxes, insurance and HOA dues (PITIA); a shortfall counts against your income. A DSCR
 * lender divides the rent by PITIA.
 */
export function lenderView(i: RentInputs, price: number, onPrice = false) {
  const base = rentAtPrice(i, price, onPrice);
  const pitia = r2(base.debtService / 12 + nz(i.propertyTaxYear) / 12 + nz(i.insuranceYear) / 12 + nz(i.hoaMonthly));
  const rent = nz(i.monthlyRent);
  return {
    pitia,
    /** 75% of the rent minus PITIA: what a conventional lender adds to (or takes from) your monthly income. */
    conventionalNet: r2(rent * 0.75 - pitia),
    /** Rent ÷ PITIA; null with no payment. */
    dscr: pitia > 0 ? Math.round((rent / pitia) * 100) / 100 : null,
    loan: base.loan,
  };
}

export interface StrInputs {
  nightlyRate: number;
  occupancyPct: number;
  avgStayNights: number;
  cleaningFeeCharged: number; // per stay, paid by the guest
  cleaningCost: number; // per stay, paid by you
  platformFeePct: number; // of what guests pay you
  strManagementPct: number;
  monthlyUtilities: number; // utilities, internet, streaming, supplies
  furnishing: number; // one-time
  licenseYear: number; // permits, inspections, registration
}
export const STR_DEFAULTS: StrInputs = { nightlyRate: 180, occupancyPct: 60, avgStayNights: 3, cleaningFeeCharged: 100, cleaningCost: 90, platformFeePct: 3, strManagementPct: 20, monthlyUtilities: 450, furnishing: 20_000, licenseYear: 500 };

/**
 * The same property rented by the night instead of by the year: income, costs and NOI, against the long-term rental's
 * NOI, and the occupancy at which the two are even. Lodging taxes are left out: guests pay them, usually collected by the
 * platform.
 */
/** strTaxFactor: how much more property tax the short-term rental pays (Utah: it loses the 45% exemption, so 1 ÷ 0.55). */
export function strCompare(i: RentInputs, s: StrInputs, strTaxFactor = 1) {
  const nights = 365 * Math.min(nz(s.occupancyPct), 100) / 100;
  const stays = nz(s.avgStayNights) > 0 ? nights / nz(s.avgStayNights) : 0;
  const perNight = nz(s.nightlyRate) + (nz(s.avgStayNights) > 0 ? nz(s.cleaningFeeCharged) / nz(s.avgStayNights) : 0);
  const gross = nights * perNight;
  const variablePct = (nz(s.platformFeePct) + nz(s.strManagementPct)) / 100;
  // Costs that rise with each night or stay, and costs you pay whether or not it's booked.
  const perNightCost = perNight * variablePct + (nz(s.avgStayNights) > 0 ? nz(s.cleaningCost) / nz(s.avgStayNights) : 0) + perNight * (nz(i.maintenancePct) + nz(i.capexPct)) / 100;
  const fixed = nz(i.propertyTaxYear) * (strTaxFactor > 0 ? strTaxFactor : 1) + nz(i.insuranceYear) + nz(i.hoaMonthly) * 12 + nz(s.monthlyUtilities) * 12 + nz(s.licenseYear);
  const noi = gross - nights * perNightCost - fixed;
  const lt = rentNoi(i);
  const ltNoi = lt.noi - lt.reserves;
  const marginPerNight = perNight - perNightCost;
  const breakEvenNights = marginPerNight > 0 ? (ltNoi + fixed) / marginPerNight : null;
  return {
    nights: Math.round(nights),
    stays: Math.round(stays),
    gross: r2(gross),
    costs: r2(gross - noi),
    noi: r2(noi),
    longTermNoi: r2(ltNoi),
    difference: r2(noi - ltNoi),
    /** Occupancy at which renting by the night earns the same as the long-term rental; null if it never does. */
    breakEvenOccupancyPct: breakEvenNights === null || breakEvenNights > 365 ? null : Math.round((breakEvenNights / 365) * 1000) / 10,
    /** Years for the extra income to pay back the furniture; null if it never does. */
    furnishingPaybackYears: noi - ltNoi > 0 ? Math.round((nz(s.furnishing) / (noi - ltNoi)) * 10) / 10 : null,
  };
}

/**
 * Before the loan on a listed home was sized on your price, its rent calculator started with a $350,000 appraised value
 * example. A listed home's numbers saved then still hold it, unmarked: unless you typed it, it's dropped (the loan uses
 * your price). An auction rental keeps its value: it's the example value after repairs that a later refinance uses.
 */
export function withoutOldValueExample(v: RentInputs, offer: boolean, typed: ReadonlySet<string>): RentInputs {
  return offer && v.value === RENT_DEFAULTS.value && !typed.has('value') ? { ...v, value: 0 } : v;
}

/**
 * An auction rental's later refinance with no real value after repairs yet (a loan entered, the value still our example,
 * or blank): its loan and return aren't the property's. A blank value means no refinance is counted at all.
 */
export function refiOnExampleValue(v: RentInputs, offer: boolean, typed: ReadonlySet<string>): boolean {
  return !offer && v.loanPct > 0 && (!(v.value > 0) || (v.value === RENT_DEFAULTS.value && !typed.has('value')));
}

/** How a refinance with no real value after repairs is figured, in words (for refiOnExampleValue's case). */
export const refiValueWords = (value: number) => (value > 0 ? `the loan is on our example value after repairs` : 'no refinance is counted until you enter the value after repairs');

/**
 * A listed home's "cash you can put in" starts from My plan's investable cash. Until you type your own figure there, it
 * follows My plan (so changing My plan updates the deal everywhere); a figure you typed stays yours.
 */
export function withPlanCash<T extends { cashAvailable: number }>(v: T, offer: boolean, typed: ReadonlySet<string>, planCash: number): T {
  if (!offer || typed.has('cashAvailable')) return v;
  const cash = planCash > 0 ? Math.round(planCash) : 0;
  return v.cashAvailable === cash ? v : { ...v, cashAvailable: cash };
}

/**
 * Keep and rent's verdict at your price, one rule for Analyze, My deals and the packet: short of cash is bad; a
 * refinance on our example value, or a monthly cost of living there, is neutral (not this property's result); otherwise
 * good when cash flow is positive and the return meets the target.
 */
export function rentVerdict(o: { cashFlow: number; cashOnCash: number | null; targetPct: number; cashShort: boolean; exampleRefi: boolean; living: boolean }): 'good' | 'bad' | 'neutral' {
  if (o.cashShort) return 'bad';
  if (o.exampleRefi || (o.living && o.cashFlow <= 0)) return 'neutral';
  return o.cashFlow > 0 && (o.cashOnCash === null || o.cashOnCash >= o.targetPct / 100) ? 'good' : 'bad';
}
