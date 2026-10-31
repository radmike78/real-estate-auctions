import NumInput from './NumInput';
import StickyResult from './StickyResult';
import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useState } from 'react';
import { readConfirmed, saveConfirmed } from '../lib/calcConfirmation';
import type { BidInputs } from '../lib/bidCalc';
import { COMMERCIAL_DEFAULTS, commercialAtPrice, commercialLines, lenderView, STR_DEFAULTS, strCompare, type StrInputs, HOLD_SELL_DEFAULTS, SELLER_FINANCE_DEFAULTS, sellerFinance, type SellerFinanceInputs, holdAndSell, type HoldSellInputs, commercialMaxBid, commercialNoi, explainRent, rentStress, LIEN_DEFAULTS, lienYield, RENT_DEFAULTS, rentAtPrice, rentEmptyMonths, rentMaxBid, rentNoi, sanitizeNumbers, type BuyInputs, type CommercialInputs, type HoldResult, type LienInputs, type LoanInputs, type RentInputs } from '../lib/holdCalc';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';
import CalcFields, { type CalcGroup } from './CalcFields';
import { useCalcRegion } from './calcRegion';
import { ExampleInputs, ExampleResults, PriceHead, exampleLabels } from './CalcLabels';

/** The fields on screen, in order. */
const visibleFields = <T,>(groups: CalcGroup<T>[], v: T) => groups.flatMap((g) => g.fields.filter((f) => !f.when || f.when(v)));
/** Set by the county (transfer tax) or not a number you choose: never listed as an example. */
const NOT_EXAMPLES = new Set(['transferTaxPer500', 'buyerPremiumPct', 'atPrice']);
import { propertyTaxHint, rentalStartFor, transferTaxFor } from '../lib/stateCosts';

/** The purchase-cost fields worded for the deal's state and county, starting at its transfer tax. */
function useRegionTax<T extends BuyInputs>(groups: CalcGroup<T>[]): { groups: CalcGroup<T>[]; per500: number } {
  const r = useCalcRegion();
  const tax = transferTaxFor(r.state, r.county);
  const pt = propertyTaxHint(r.state);
  return {
    per500: tax.per500,
    groups: groups.map((g) => ({ ...g, fields: g.fields.map((f) => (f.k === 'transferTaxPer500' ? { ...f, hint: tax.hint, more: tax.more } : f.k === 'propertyTaxYear' ? { ...f, hint: pt.hint, more: pt.more } : f)) })),
  };
}

const pctText = (x: number | null) => (x === null ? '—' : `${(Math.round(x * 1000) / 10).toLocaleString()}%`);

/** Inputs kept in this browser (per property when there is one); rebuilt safely from storage. */
function useSaved<T extends object>(key: string, defaults: T, force: Partial<T> = {}, sig = JSON.stringify(force)): [T, (k: keyof T & string, v: number) => void, boolean, ReadonlySet<string>] {
  // `force` holds the region's values (its transfer tax, a rental's starting tax and insurance). They replace saved
  // numbers only when the region (`sig`) changes, so a number the user typed survives switching tabs and reloading.
  // Whether any number here is the user's own (typed now or kept from before), or all are the starting examples.
  const [typed, setTyped] = useState(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      // Nothing typed yet: start from the region's values (a stored region alone doesn't mean numbers were kept).
      if (raw === null) return { ...defaults, ...force };
      const saved = sanitizeNumbers(JSON.parse(raw), defaults);
      return localStorage.getItem(`${key}.region`) === sig ? saved : { ...saved, ...force };
    } catch {
      return { ...defaults, ...force };
    }
  });
  useEffect(() => {
    try {
      if (localStorage.getItem(`${key}.region`) === sig) return;
      localStorage.setItem(`${key}.region`, sig);
    } catch {
      return;
    }
    setV((cur) => ({ ...cur, ...force }));
    setTypedKeys((fields) => {
      const next = new Set(fields);
      Object.keys(force).forEach((field) => next.delete(field));
      saveConfirmed(key, next);
      return next;
    });
  }, [key, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  // The fields confirmed for this saved calculator: they're yours even when the number matches our example.
  const [typedKeys, setTypedKeys] = useState<ReadonlySet<string>>(() => readConfirmed(key));
  const set = (k: keyof T & string, n: number) => {
    trackAction('calculator_used', true);
    setTyped(true);
    setTypedKeys((t) => { const next = new Set([...t, k]); saveConfirmed(key, next); return next; });
    setV((cur) => {
      const next = { ...cur, [k]: n };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };
  return [v, set, typed, typedKeys];
}

/** Starting purchase costs from the flip calculator's estimates for a property. */
export const buyFromBid = (b: BidInputs): Partial<BuyInputs & LoanInputs> => ({
  buyerPremiumPct: b.buyerPremiumPct,
  transferTaxPer500: b.transferTaxPer500,
  survivingLiens: b.survivingLiens,
  titleLegal: b.titleLegal,
  possession: b.possession,
  repairs: b.repairs,
  contingencyPct: b.contingencyPct,
  value: b.exitValue,
});

function buyGroup<T extends BuyInputs>(repairsLabel = 'Repairs'): CalcGroup<T> {
  return {
    title: 'Buying it',
    fields: [
      { k: 'cashAvailable', label: 'Cash you can bring', unit: '$', hint: 'All the cash you can put in: the bid and every cost until it’s ready to rent. Leave 0 for no limit.' },
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'Confirm with a title search.' },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$' },
      { k: 'possession', label: 'Getting possession', unit: '$', hint: 'Eviction attorney, relocation, locks.' },
      { k: 'repairs', label: repairsLabel, unit: '$', hint: 'To make it ready to rent.' },
      { k: 'contingencyPct', label: 'Extra room in the repair budget', unit: '%', hint: 'A cushion for surprises.' },
    ] as CalcGroup<T>['fields'],
  };
}

/**
 * For a listed or bank-owned home: no buyer's premium, closing words instead of auction words, and a purchase loan
 * (a % of the price or the appraisal, whichever is lower) instead of a refinance later.
 */
function forOffer<T>(groups: CalcGroup<T>[]): CalcGroup<T>[] {
  const relabel: Record<string, { label?: string; hint?: string; more?: string }> = {
    cashAvailable: { label: 'Your investable cash for this deal (all in)', hint: 'Down payment, closing costs and repairs. 0 for no limit.', more: 'Starts at your investable cash from My plan: subtract the reserves your lender wants you to keep. Your walk-away price never needs more cash than this.' },
    transferTaxPer500: { hint: 'Your contract says who pays. Enter 0 if the seller pays it.' },
    survivingLiens: { label: 'Liens you’d have to pay', hint: 'Usually paid off at closing. Check the title report.' },
    titleLegal: { label: 'Closing costs: title, escrow, recording', hint: 'Lender fees go in “Loan costs” below.', more: 'Your Loan Estimate or the lender’s term sheet and the escrow officer’s estimate have the real figures. Together with lender fees, closing costs often run 2–4% of the price.' },
    possession: { hint: 'Only if a tenant or the owner stays after closing.' },
    value: { label: 'Appraised value', hint: 'The value the lender’s appraisal supports. The loan uses the lower of this and the price.', more: 'Homes are appraised mainly from recent sales nearby; commercial appraisals also weigh the income and the cost to rebuild. A seller’s or agent’s estimate isn’t an appraisal. Replace this, and the loan percentage, with your lender’s numbers when you have them.' },
    loanPct: { label: 'Loan, % of the price or value (lower)', hint: '75% (25% down) is common for a rental you won’t live in. 0 for all cash.', more: 'Lenders lend a % of the price or the appraised value, whichever is lower. A lower price means a smaller loan and a lower payment. Ask your lender for their limits.' },
  };
  return groups.map((g) => ({
    ...g,
    title: g.title === 'Loan after you buy' ? 'Your loan' : g.title,
    fields: g.fields.filter((f) => f.k !== 'buyerPremiumPct').map((f) => ({ ...f, ...relabel[f.k as string] })) as CalcGroup<T>['fields'],
  }));
}

/** Starting numbers for a listed home: no possession cost, closing costs and a common rental loan. */
const OFFER_START = { possession: 0, titleLegal: 2_500, repairs: 5_000, loanPct: 75, ratePct: 7 };
/** A listed home's numbers are kept apart from an auction's, since the costs and the loan work differently. */
const offerKey = (key: string) => key.replace(/\.v1$/, '.offer.v1');

function loanGroup<T extends LoanInputs>(valueLabel: string, valueHint: string): CalcGroup<T> {
  return {
    title: 'Loan after you buy',
    fields: [
      { k: 'value', label: valueLabel, unit: '$', hint: valueHint },
      { k: 'loanPct', label: 'Loan, % of that value', unit: '%', hint: 'A refinance once it’s rented. 0 for all cash.', more: 'Auctions need cash on the day, so any loan comes afterward. Lenders set their own waiting periods and limits for loans on recently bought property; ask yours.' },
      { k: 'ratePct', label: 'Interest rate', unit: '%/yr', when: (v) => v.loanPct > 0 },
      { k: 'years', label: 'Loan term', unit: 'yr', when: (v) => v.loanPct > 0 },
      { k: 'loanCostPct', label: 'Loan costs', unit: '%', hint: 'Points and closing costs.', when: (v) => v.loanPct > 0 },
    ] as CalcGroup<T>['fields'],
  };
}

function HoldResults({ r, title, target, noiNote, minDscr, offer = false, examples = 0, allExample = false, commercial = false, headLabel = 'Walk-away price' }: { r: HoldResult; title: string; target: string; noiNote: string; minDscr: number; offer?: boolean; /** How many inputs are still starting examples. */ examples?: number; /** Every number is still a starting example. */ allExample?: boolean; /** Commercial: no residential lender panel to point to. */ commercial?: boolean; /** The heading bar's name for the price this block evaluates. */ headLabel?: string }) {
  const priced = !r.noBidWorks && Number.isFinite(r.maxBid);
  return (
    <section className="price-block price-block-target" aria-label={`${headLabel}: the price that meets your goal`}>
      <PriceHead kind="target" label={headLabel} price={priced ? r.maxBid : null} result={priced ? r.cashFlow / 12 : null} note={priced ? 'Not the result at your price: this is the most you could pay and still meet your goal.' : undefined} />
      <ExampleResults count={examples} all={allExample} />
      <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
        <span>{title}</span>
        <strong>{r.noBidWorks ? (offer ? 'No offer works' : 'No bid works') : Number.isFinite(r.maxBid) ? fmtMoney(r.maxBid) : r.overCap ? 'More than $1 billion' : 'No limit yet'}</strong>
        <small>{r.noBidWorks ? (r.loanTooBig ? 'The refinance you entered costs more a year than the property earns, so no price works with that loan. Try a smaller loan, or run it all cash.' : 'The income doesn’t cover the costs and your target at any price. Walk away or change your plan.') : !Number.isFinite(r.maxBid) && r.overCap ? 'Check the rent and costs you entered: a price that high is almost always a typo.' : !Number.isFinite(r.maxBid) ? (offer ? 'Enter the return you want, or the cash you can put in, to get a walk-away price.' : 'Enter the return you want, or the cash you can bring, to get a walk-away price.') : r.limitedBy === 'cash' ? (offer ? 'Set by the cash you can put in: the down payment, closing costs and repairs.' : 'Set by the cash you can bring: the bid and every cost until it’s ready to rent.') : r.limitedBy === 'dscr' ? (commercial ? 'Set by the minimum debt-service coverage you entered: above this price the loan is too big for the income.' : 'Set by your minimum income-coverage target: above this price the income does not cover loan payments by the margin you chose. See “How a lender sees this rent” for lender tests.') : target}</small>
      </div>
      {!offer && r.debtService > 0 && !r.noBidWorks && Number.isFinite(r.maxBid) && (
        <p className="calc-note small warn">
          <strong>The loan here is a refinance after you buy, not money you have at the sale.</strong> Until it closes, all {fmtMoney(Math.round(r.allIn))} is your cash. Lenders often wait months after a purchase, may lend less than the value you expect, or may say no; have a plan for keeping the property on your own cash if that happens.
        </p>
      )}
      {!r.noBidWorks && Number.isFinite(r.maxBid) && (
        <dl className="calc-kv">
          {!offer && <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>}
          <div><dt>Everything you pay, ready to rent, before loan fees</dt><dd>{fmtMoney(Math.round(r.allIn))}</dd></div>
          {r.loanFees > 0 && <div><dt>Including the loan’s points and fees</dt><dd>{fmtMoney(Math.round(r.allIn + r.loanFees))}</dd></div>}
          <div><dt>Net operating income (NOI), per year: after operating costs{r.reserves > 0 ? ', before reserves' : ''} and before the loan</dt><dd>{fmtMoney(Math.round(r.noi))}</dd></div>
          {r.reserves > 0 && <div><dt>Reserves for big replacements, per year</dt><dd>{fmtMoney(Math.round(r.reserves))}</dd></div>}
          <div><dt>Return on everything you pay before loan fees (cap rate on cost)</dt><dd>{pctText(r.capOnCost)}</dd></div>
          {r.debtService > 0 && <div><dt>Debt service: loan payments, per year</dt><dd>{fmtMoney(Math.round(r.debtService))}</dd></div>}
          <div><dt>Cash flow, per month: NOI minus {r.reserves > 0 ? 'reserves and ' : ''}loan payments{r.reserves > 0 ? '' : ' (before any replacement reserves)'}</dt><dd>{fmtMoney(Math.round(r.cashFlow / 12))}</dd></div>
          {r.debtService > 0 && <div><dt>Your cash left in the deal</dt><dd>{r.cashLeft > 0 ? fmtMoney(Math.round(r.cashLeft)) : 'None: the loan repays it'}</dd></div>}
          <div><dt>Cash-on-cash return: that cash flow ÷ your cash left in the deal</dt><dd>{r.cashOnCash === null ? 'All your cash is back' : pctText(r.cashOnCash)}</dd></div>
          {r.dscr !== null && <div><dt>{commercial ? 'Debt-service coverage: yearly NOI ÷ yearly loan payments. Your lender may adjust the income, costs and reserves when it underwrites; ask for its calculation and minimum.' : 'Income coverage: NOI ÷ loan payments (a DSCR-loan lender instead divides rent by the full payment; see “How a lender sees this rent”)'}</dt><dd>{r.dscr.toFixed(2)}×</dd></div>}
        </dl>
      )}
      {r.dscr !== null && !r.loanOk && (
        <p className="calc-note small">The unrounded income coverage is below your {minDscr.toFixed(2)} minimum, even if the displayed ratio rounds to that number. A smaller loan may be needed; ask your lender for its own calculation.</p>
      )}
      <p className="muted small">{noiNote} An estimate to help you set a limit before the sale, not advice.</p>
    </section>
  );
}

// ---------------- Rent / hold ----------------

const RENT_GROUPS: CalcGroup<RentInputs>[] = [
  buyGroup<RentInputs>(),
  {
    title: 'Renting it',
    fields: [
      { k: 'monthlyRent', label: 'Monthly rent', unit: '$', hint: 'From rented comparables nearby.' },
      { k: 'vacancyPct', label: 'Vacancy and unpaid rent', unit: '%', hint: 'Use local evidence and your vacancy/nonpayment estimate.' },
      { k: 'propertyTaxYear', label: 'Property tax, per year', unit: '$' },
      { k: 'insuranceYear', label: 'Insurance, per year', unit: '$', hint: 'A landlord policy.' },
      { k: 'hoaMonthly', label: 'HOA dues, per month', unit: '$' },
      { k: 'managementPct', label: 'Property management', unit: '%', hint: 'Of rent collected. 0 if you manage it.' },
      { k: 'maintenancePct', label: 'Repairs and upkeep', unit: '%', hint: 'Of rent collected.' },
      { k: 'capexPct', label: 'Money set aside for large replacements', unit: '%', hint: 'Roof, HVAC, water heater.', more: 'Money set aside each month for large replacements. Leaving it out can make rental cash flow look stronger than it is.' },
    ],
  },
  loanGroup<RentInputs>('Value after repairs', 'For the loan amount. Use sold comps.'),
  {
    title: 'Your target',
    fields: [
      { k: 'targetCocPct', label: 'Yearly cash return you want (cash-on-cash)', unit: '%', hint: 'Yearly cash flow ÷ your cash in the deal.' },
      { k: 'minDscr', label: 'Your minimum income coverage', unit: 'x', hint: 'Income after operating expenses (NOI) ÷ loan payments. Your planning target, not a lender’s approval test.', when: (v) => v.loanPct > 0 },
      { k: 'reserveCash', label: 'Cash you’ll still have after buying', unit: '$', hint: 'Savings left after closing and repairs.', more: 'This shows how many months you could keep paying with no rent coming in.' },
    ],
  },
];

/** How long savings carry the rental with no rent: the payments don't stop when a unit is empty. */
function CashCushion({ v, price, at, onPrice }: { v: RentInputs; price: number; /** Which price, in words. */ at: string; onPrice: boolean }) {
  const e = rentEmptyMonths(v, Number.isFinite(price) && price > 0 ? price : v.value, onPrice);
  if (e.monthly <= 0) return null;
  if (e.months === null) return <p className="calc-note small">Enter the cash you’ll still have after buying to see how many months you could pay {fmtMoney(Math.round(e.monthly))} a month in loan, tax, insurance and HOA costs with no rent coming in.</p>;
  const short = e.months < 6;
  return (
    <p className={`calc-note small${short ? ' warn' : ''}`}>
      <strong>With no rent, your cash lasts about {e.months.toLocaleString()} months</strong> (at {at}). That pays {fmtMoney(Math.round(e.monthly))} a month in loan, tax, insurance and HOA costs.
      {short && ' Less than 6 months is thin: Fannie Mae asks for 6 months of payments in reserve on most rental purchases, and an eviction or a big repair can take that long.'}
    </p>
  );
}

/** Costs beginners often leave out of a rental budget. */
const OFTEN_FORGOTTEN = [
  'Leasing or tenant-placement fees when you hire someone to find a tenant',
  'Turnover: cleaning, paint and repairs between tenants',
  'Utilities you pay as the owner, such as water, sewer or trash',
  'Landscaping, pest control and pool service',
  'Legal costs if you ever need to evict',
  'Bookkeeping and tax preparation',
  'A business or rental license, where your city requires one',
  'HOA special assessments on top of the monthly dues',
  'Insurance and property tax going up after you buy',
];

/** Stress tests, the deal in plain words, and a checklist of easy-to-forget costs. */
/** The rental at a price you type: every step from rent to cash flow, with its assumptions. */
function AtThisPrice({ v, start, onPrice, setPrice, word }: { v: RentInputs; start: number; onPrice: boolean; setPrice: (n: number) => void; /** "Your offer" or "Your bid". */ word: string }) {
  const walkAway = Number.isFinite(start) && start > 0 ? Math.round(start) : 0;
  // The price you'd actually pay is saved with the deal; the walk-away price is only used when you choose it.
  const price = v.atPrice;
  const a = rentAtPrice(v, price, onPrice);
  const coc = a.cashOnCash;
  const target = v.targetCocPct / 100;
  const mo = (n: number) => fmtMoney(Math.round(n / 12));
  const neg = (n: number) => (n > 0 ? `−${mo(n)}` : mo(0));
  return (
    <section className="at-price price-block price-block-yours" aria-labelledby="at-price-head">
      <PriceHead id="at-price-head" kind="yours" label={word} price={price > 0 ? price : null} result={price > 0 ? a.cashFlow / 12 : null} note={price > 0 ? 'Your actual price: the result for the property as you’d buy it.' : 'Enter the price you’d pay to see this property’s own result.'} />
      <label className="field">
        <span>{word} ($)</span>
        <NumInput blank max={1e9} value={price} onValue={(n) => setPrice(n ?? 0)} />
      </label>
      {price > 0 && (
        <p className={`calc-verdict ${a.cashFlow > 0 && (coc === null || coc >= target) ? 'good' : 'bad'}`} role="status">
          <strong>{coc === null ? `Estimated return: the loan returns all your cash${onPrice ? '' : ' (if the refinance comes through)'}; your target: ${v.targetCocPct}%.` : `Estimated return: ${pctText(coc)} a year on your cash; your target: ${v.targetCocPct}%.`}</strong>{' '}
          {a.cashFlow <= 0
            ? `It loses about ${fmtMoney(Math.round(-a.cashFlow / 12))} a month after every cost. Investigate whether the price, the costs or your plan should change, or walk away.`
            : coc !== null && coc < target
              ? `Cash flow is positive (about ${fmtMoney(Math.round(a.cashFlow / 12))} a month), but it misses your goal. Investigate whether the price, the costs or the goal should change.`
              : `It meets your target at this price, based on your numbers. Check each number against evidence before you rely on it.`}
        </p>
      )}
      {price === 0 && <p className="muted small">Enter the price you’d pay (the asking price, or your offer) to see your numbers at that price.</p>}
      {walkAway > 0 && price !== walkAway && <button type="button" className="linkish" onClick={() => setPrice(walkAway)}>Use the walk-away price ({fmtMoney(walkAway)})</button>}
      {price > 0 && (<>
      <table className="deal-stress waterfall">
        <caption className="sr-only">Monthly income and costs at this price</caption>
        <tbody>
          <tr><th scope="row">Rent, if fully rented</th><td>{mo(a.gross)}</td></tr>
          <tr><th scope="row">Vacancy and unpaid rent ({v.vacancyPct}%)</th><td>{neg(a.vacancy)}</td></tr>
          <tr><th scope="row">Operating costs: tax, insurance, HOA, management ({v.managementPct}%) and repairs ({v.maintenancePct}%)</th><td>{neg(a.operating)}</td></tr>
          <tr className={`sum${a.noi < 0 ? ' neg' : ''}`}><th scope="row">Net operating income (NOI)</th><td>{a.noi < 0 ? `−${fmtMoney(Math.round(-a.noi / 12))}` : mo(a.noi)}</td></tr>
          <tr><th scope="row">Reserves for big replacements ({v.capexPct}%)</th><td>{neg(a.reserves)}</td></tr>
          <tr><th scope="row">Debt service: the loan payment{a.debtService > 0 ? '' : ' (no loan)'}</th><td>{neg(a.debtService)}</td></tr>
          <tr className={`sum${a.cashFlow < 0 ? ' neg' : ''}`}><th scope="row">Cash flow</th><td>{a.cashFlow < 0 ? `−${fmtMoney(Math.round(-a.cashFlow / 12))}` : mo(a.cashFlow)}</td></tr>
        </tbody>
      </table>
      <dl className="calc-kv">
        <div><dt>Everything you pay, ready to rent (price, buying costs, liens, title, possession, repairs; not loan fees)</dt><dd>{fmtMoney(Math.round(a.allIn))}</dd></div>
        {a.loan > 0 && <div><dt>Loan principal ({Math.min(v.loanPct, 100)}% of {onPrice ? `${fmtMoney(v.value > 0 ? Math.min(price, v.value) : price)}, the lower of the price and the value` : `the ${fmtMoney(v.value)} value`})</dt><dd>{fmtMoney(Math.round(a.loan))}</dd></div>}
        {a.loan > 0 && <div><dt>Loan fees ({v.loanCostPct}% of principal)</dt><dd>{fmtMoney(Math.round(a.loan * v.loanCostPct / 100))}</dd></div>}
        {a.loan > 0 && <div><dt>Net loan proceeds after loan fees</dt><dd>{fmtMoney(Math.round(a.loan * (1 - v.loanCostPct / 100)))}</dd></div>}
        {!onPrice && a.loan > 0 && <div><dt>Your cash until the refinance closes</dt><dd>{fmtMoney(Math.round(a.allIn))}{v.cashAvailable > 0 && a.allIn > v.cashAvailable && <span className="deal-urgent"> · more than the {fmtMoney(v.cashAvailable)} you can put in</span>}</dd></div>}
        <div><dt>{!onPrice && a.loan > 0 ? 'Your cash left in after the refinance, if approved' : 'Your cash in the deal'}</dt><dd>{a.cashIn > 0 ? fmtMoney(Math.round(a.cashIn)) : 'None: the loan covers it'}{(onPrice || !(a.loan > 0)) && v.cashAvailable > 0 && a.cashIn > v.cashAvailable && <span className="deal-urgent"> · more than the {fmtMoney(v.cashAvailable)} you can put in</span>}</dd></div>
        <div><dt>Cash-on-cash return: yearly cash flow ÷ your cash in</dt><dd>{a.cashOnCash === null ? 'All your cash is back' : pctText(a.cashOnCash)}</dd></div>
        <div><dt>Cap rate on the price: NOI ÷ price</dt><dd>{pctText(a.capOnPrice)}</dd></div>
        <div><dt>Cap rate on everything you pay</dt><dd>{pctText(a.capOnCost)}</dd></div>
        {a.dscr !== null && <div><dt>Income coverage: NOI ÷ loan payments</dt><dd>{a.dscr.toFixed(2)}×{a.dscr < v.minDscr && <span className="deal-urgent"> · below your {v.minDscr}× income-coverage target; check the lender’s separate requirements</span>}</dd></div>}
      </dl>
      </>)}
      <p className="muted small">Uses the rent, costs and loan you entered above; taxes and insurance are counted in operating costs, not in the loan payment. Your cash in doesn’t include reserves you keep in the bank. An estimate, not advice.</p>
    </section>
  );
}

/** What the lenders will see: the conventional 75%-of-rent test and a DSCR lender's ratio, and the refinance wait. */
function LenderView({ v, at: atP, onPrice }: { v: RentInputs; at: PriceAt; onPrice: boolean }) {
  if (!(v.loanPct > 0)) return null;
  const at = atP.price;
  const r = lenderView(v, at, onPrice);
  return (
    <details className="deal-lab hold-sell">
      <summary><span className="summary-h4">How a lender sees this rent</span></summary>
      <p className="small muted">Cash flow is your view. Lenders run their own tests on the {fmtMoney(Math.round(r.loan))} loan, at {atP.label}.</p>
      <dl className="calc-kv">
        <div><dt>Full monthly payment with taxes, insurance and HOA (PITIA)</dt><dd>{fmtMoney(Math.round(r.pitia))}</dd></div>
        <div><dt>Conventional loan: 75% of the rent minus that payment, a month</dt><dd>{r.conventionalNet < 0 ? '−' : ''}{fmtMoney(Math.abs(Math.round(r.conventionalNet)))}</dd></div>
        <div><dt>DSCR-loan ratio: rent ÷ that full payment (looser than income coverage above, because it doesn’t subtract operating costs)</dt><dd>{r.dscr === null ? '—' : r.dscr.toFixed(2)}</dd></div>
      </dl>
      <p className="small">
        {r.conventionalNet < 0 ? 'For a conventional loan, the shortfall counts against your income when the lender figures what you can afford.' : 'For a conventional loan, the rent at least covers this payment for qualifying. A surplus adds to your income only if you have 12 months or more of experience managing rental property; with less, the rent can only offset this payment.'}{' '}
        {r.dscr === null ? '' : r.dscr >= 1.2 ? 'The DSCR ratio is in the range most DSCR lenders like.' : r.dscr >= 1 ? 'Some DSCR lenders accept this ratio, usually at a higher rate or with more down.' : 'This ratio is below what most DSCR lenders accept.'}
      </p>
      <p className="small">
        These are Fannie Mae’s long-term rental rules for a purchase, or a refinance of a rental not yet on your tax return’s Schedule E (Selling Guide B3-3.8-02); other lenders and programs differ. The lender must also document your current housing payment to count any of this rent. For a short-term rental on a one-unit investment property, Fannie Mae counts 50% of the market rent (or, on a refinance, the cash flow on your Schedule E) and any surplus can only offset the payment (B3-3.8-03). Lenders must follow these 2026 rules for applications dated on and after December 1, 2026, and may adopt them sooner, so ask yours which rules it uses.
        {!onPrice && ' Refinancing a cash or hard-money purchase usually waits 6 to 12 months; ask lenders before you buy.'}{' '}
        <a href="#/learn/financing">Getting approved, DSCR loans and refinancing&nbsp;→</a>
      </p>
    </details>
  );
}

const STR_FIELDS: { k: keyof StrInputs; label: string; unit: string }[] = [
  { k: 'nightlyRate', label: 'Nightly rate', unit: '$' },
  { k: 'occupancyPct', label: 'Nights booked', unit: '%' },
  { k: 'avgStayNights', label: 'Average stay', unit: 'nights' },
  { k: 'cleaningFeeCharged', label: 'Cleaning fee guests pay', unit: '$ a stay' },
  { k: 'cleaningCost', label: 'Your cleaning cost', unit: '$ a stay' },
  { k: 'platformFeePct', label: 'Platform fee', unit: '%' },
  { k: 'strManagementPct', label: 'Short-term manager', unit: '%' },
  { k: 'monthlyUtilities', label: 'Utilities, internet, supplies', unit: '$ a month' },
  { k: 'furnishing', label: 'Furniture and setup', unit: '$ once' },
  { k: 'licenseYear', label: 'License and permits', unit: '$ a year' },
];

/** The same home rented by the night: what it earns against the long-term rent, and the occupancy where they're even. */
function StrComparison({ v }: { v: RentInputs }) {
  const [s, setS] = useState<StrInputs>(STR_DEFAULTS);
  const ut = useCalcRegion().state === 'UT';
  // In Utah a short-term rental is taxed on its full value instead of 55% of it (Utah Code 59-2-103).
  const r = strCompare(v, s, ut ? 1 / 0.55 : 1);
  return (
    <details className="deal-lab hold-sell">
      <summary><span className="summary-h4">Rent it by the night instead?</span></summary>
      <p className="small muted">Uses this rental’s taxes, insurance, HOA and repair set-asides. First check that the city, county and HOA allow it, and get a short-term rental insurance quote. <a href="#/learn/after-closing">Can I rent it short-term?&nbsp;→</a></p>
      <div className="row">
        {STR_FIELDS.map((f) => (
          <label key={f.k} className="field">
            <span>{f.label} ({f.unit})</span>
            <NumInput value={s[f.k]} onValue={(n) => setS({ ...s, [f.k]: n ?? 0 })} />
          </label>
        ))}
      </div>
      <dl className="calc-kv">
        <div><dt>Nights booked a year</dt><dd>{r.nights} ({r.stays} stays)</dd></div>
        <div><dt>What guests pay you, a year</dt><dd>{fmtMoney(Math.round(r.gross))}</dd></div>
        <div><dt>Costs, a year</dt><dd>{fmtMoney(Math.round(r.costs))}</dd></div>
        <div><dt>Net operating income by the night, after reserves</dt><dd>{fmtMoney(Math.round(r.noi))}</dd></div>
        <div><dt>Same home rented by the year, after reserves</dt><dd>{fmtMoney(Math.round(r.longTermNoi))}</dd></div>
        <div><dt>Difference a year</dt><dd>{r.difference < 0 ? '−' : '+'}{fmtMoney(Math.abs(Math.round(r.difference)))}</dd></div>
        <div><dt>Nights booked to break even with the long-term rent</dt><dd>{r.breakEvenOccupancyPct === null ? 'Never, at these prices' : `${r.breakEvenOccupancyPct}%`}</dd></div>
        <div><dt>Years to earn back the furniture</dt><dd>{r.furnishingPaybackYears === null ? '—' : r.furnishingPaybackYears}</dd></div>
      </dl>
      <p className="small muted">Before income tax and lodging taxes (guests pay those, usually collected by the platform). Short-term income swings with seasons, reviews and new rules; plan for the slow months.{ut && ' In Utah, a short-term rental loses the 45% residential property-tax exemption: this comparison already counts its property tax on the full value (about 80% more than the long-term rental’s). The long-term rental keeps the exemption only if you file the county assessor’s declaration that it’s a tenant’s main home (Utah Code 59-2-103.5).'}</p>
    </details>
  );
}

/** For longer holds: keep it some years, then sell. The yearly return on your cash (IRR) and the equity multiple. */
function HoldAndSell({ v, onPrice, target = 0 }: { v: RentInputs; onPrice: boolean; /** The target (walk-away) price, used only when there's no price and no value. */ target?: number }) {
  const [h, setH] = useState<HoldSellInputs>(HOLD_SELL_DEFAULTS);
  // The price you'd actually pay; without one, the property's value (not the walk-away price, which would count buying
  // below value as a gain you haven't made). With neither, the target price; with none of them, no result.
  const tgt = Number.isFinite(target) && target > 0 ? Math.round(target) : 0;
  const at = v.atPrice > 0 ? v.atPrice : v.value > 0 ? v.value : tgt;
  const atWhat = v.atPrice > 0 ? 'your price' : v.value > 0 ? 'the property’s value' : 'the target price';
  const r = holdAndSell(v, at, h, onPrice);
  const field = (k: keyof HoldSellInputs, label: string, unit: string) => (
    <label className="field">
      <span>{label} ({unit})</span>
      <NumInput value={h[k]} onValue={(n) => setH({ ...h, [k]: n ?? 0 })} />
    </label>
  );
  return (
    <details className="deal-lab hold-sell">
      <summary><span className="summary-h4">If you keep it and sell later</span></summary>
      <p className="small muted">{at > 0 && <>At {atWhat}, {fmtMoney(at)}. </>}Rent and costs grow together; the loan payment stays the same. Before income tax: depreciation you took is taxed when you sell (see <a href="#/learn/taxes">Taxes from purchase to sale</a>).</p>
      <div className="row">{field('years', 'Years you keep it', 'years')}{field('appreciationPct', 'Value growth a year', '%')}{field('rentGrowthPct', 'Rent growth a year', '%')}{field('sellingCostPct', 'Selling costs', '% of price')}</div>
      {!r ? (
        <p>Enter your price or the appraised value to see a hold-and-sell result.</p>
      ) : r.cashIn > 0 ? (
        <dl className="calc-kv">
          <div><dt>Your cash in</dt><dd>{fmtMoney(Math.round(r.cashIn))}</dd></div>
          <div><dt>Cash flow over {r.years} {r.years === 1 ? 'year' : 'years'}</dt><dd>{fmtMoney(Math.round(r.flows.reduce((a, b) => a + b, 0)))}</dd></div>
          <div><dt>Sale price in year {r.years}</dt><dd>{fmtMoney(Math.round(r.saleValue))}</dd></div>
          <div><dt>After selling costs and the loan payoff ({fmtMoney(Math.round(r.payoff))})</dt><dd>{fmtMoney(Math.round(r.saleNet))}</dd></div>
          <div><dt>Profit before tax</dt><dd>{fmtMoney(Math.round(r.profit))}</dd></div>
          <div><dt>Equity multiple (all cash back ÷ cash in)</dt><dd>{r.equityMultiple === null ? '—' : `${r.equityMultiple.toFixed(2)}×`}</dd></div>
          <div><dt>Yearly return on your cash (IRR)</dt><dd>{pctText(r.irr)}</dd></div>
        </dl>
      ) : (
        <p>None of your own cash stays in at this price, so a return on cash can’t be figured. Look at the cash flow and the sale instead.</p>
      )}
    </details>
  );
}

/** A price the panels are figured at, and how to say which one it is. */
type PriceAt = { price: number; label: string };

function RentDealLab({ v, at: atP, onPrice }: { v: RentInputs; at: PriceAt; onPrice: boolean }) {
  const at = atP.price;
  const rows = rentStress(v, at, onPrice);
  const [ticked, setTicked] = useState<string[]>([]);
  return (
    <div className="deal-lab">
      <h4>Explain this deal at {atP.label}</h4>
      <ul className="deal-explain">{explainRent(v, at, onPrice).map((x) => <li key={x}>{x}</li>)}</ul>
      <h4>Stress test: cash flow per month at {atP.label}</h4>
      <table className="deal-stress">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.monthly < 0 ? 'neg' : undefined}>
              <th scope="row">{r.label}</th>
              <td>{r.monthly < 0 ? `−${fmtMoney(Math.round(-r.monthly))}` : fmtMoney(Math.round(r.monthly))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details className="deal-forgot">
        <summary>What are you forgetting? ({ticked.length} of {OFTEN_FORGOTTEN.length} checked)</summary>
        <p className="muted small">Tick each one you’ve budgeted for, inside your repairs, management or reserves.</p>
        <ul>
          {OFTEN_FORGOTTEN.map((x) => (
            <li key={x}>
              <label>
                <input type="checkbox" checked={ticked.includes(x)} onChange={() => setTicked((t) => (t.includes(x) ? t.filter((y) => y !== x) : [...t, x]))} /> {x}
              </label>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function RentCalculator({ storageKey = 'fsf.calc.rent.v1', exactKey = false, start = {}, regional = false, offer = false }: { storageKey?: string; /** The key already names the deal and kind of purchase. */ exactKey?: boolean; start?: Partial<RentInputs>; regional?: boolean; offer?: boolean }) {
  const rt = useRegionTax(RENT_GROUPS);
  const region = useCalcRegion();
  // In a deal with a state, the example tax and insurance follow that state (a Texas rental's tax is about three
  // times a Nevada one's); they're starting numbers only and give way to anything typed or prefilled.
  const stateStart = regional ? rentalStartFor(region.state, start.value ?? RENT_DEFAULTS.value) : {};
  const examples = { ...RENT_DEFAULTS, ...stateStart, ...(offer ? OFFER_START : {}) };
  // On a change of state, the state's starting tax and insurance replace the old state's (a Texas tax bill is no
  // guide to a Nevada one), except figures the property itself supplied (`start`).
  const stateForce: Partial<RentInputs> = regional ? Object.fromEntries(Object.entries(stateStart).filter(([k]) => !(k in start))) : {};
  const [saved, set, typed, typedKeys] = useSaved<RentInputs>(offer && !exactKey ? offerKey(storageKey) : storageKey, { ...examples, ...start }, regional ? { transferTaxPer500: rt.per500, ...stateForce } : {}, regional ? `${rt.per500}|${region.state}` : '{}');
  const v = offer ? { ...saved, buyerPremiumPct: 0 } : saved;
  const r = rentMaxBid(v, offer);
  const n = rentNoi(v);
  const groups = offer ? forOffer(rt.groups) : rt.groups;
  // Numbers from your plan or the property (`start`) aren't our examples.
  const still = exampleLabels(visibleFields(groups, v), v, examples, typedKeys, new Set([...NOT_EXAMPLES, ...Object.keys(start)]));
  const basics = new Set<keyof RentInputs>(['monthlyRent', 'propertyTaxYear', 'insuranceYear', 'repairs', 'loanPct', 'ratePct']);
  const basicFields = groups.flatMap((g) => g.fields).filter((f) => basics.has(f.k));
  const moreGroups = groups.map((g) => ({ ...g, fields: g.fields.filter((f) => !basics.has(f.k)) }));
  const allExample = !typed && Object.keys(start).length === 0;
  const word = offer ? 'Your offer' : 'Your bid';
  // Which price the panels below are figured at: yours once you enter it, else the target price.
  const at: PriceAt = v.atPrice > 0 ? { price: v.atPrice, label: `${word.toLowerCase()} of ${fmtMoney(v.atPrice)}` } : Number.isFinite(r.maxBid) && r.maxBid > 0 ? { price: r.maxBid, label: `the target price of ${fmtMoney(Math.round(r.maxBid))}` } : { price: v.value, label: `the ${fmtMoney(v.value)} value` };
  return (
    <div className="calc">
      <div className="calc-inputs">
        <ExampleInputs labels={still} all={allExample} />
        <CalcFields groups={[{ title: 'Start with these numbers', fields: [{ k: 'atPrice', label: offer ? 'Your offer' : 'Your bid', unit: '$', hint: '0 leaves your price unset; the target-price estimate is still shown.' }, ...basicFields] }]} values={v} onChange={set} />
        <details className="calc-assumptions"><summary>Review all other costs, loan terms and targets</summary><p className="muted small">These inputs are already included in the estimate, even while this section is closed. Review vacancy, upkeep, replacement reserves, acquisition costs and loan terms before using the result.</p><CalcFields groups={moreGroups} values={v} onChange={set} /></details>
      </div>
      <div className="calc-results">
      <p className="small muted">Returns and cash flow are before income tax. Depreciation and your personal taxes are not included.</p>
        {/* Your actual deal first; the price that would meet your goal second, each with its own heading bar and colour. */}
        <AtThisPrice v={v} start={r.maxBid} onPrice={offer} setPrice={(n) => set('atPrice', n)} word={word} />
        <HoldResults r={r} title={v.atPrice > 0 ? 'Price that meets your target' : 'Walk-away price to keep and rent it'} target={`Gives your ${v.targetCocPct}% cash-on-cash return, based on your numbers. Not a guarantee.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))}, reserves ${fmtMoney(Math.round(n.reserves))}.`} minDscr={v.minDscr} offer={offer} examples={still.length} allExample={allExample} />
        <CashCushion v={v} price={at.price} at={at.label} onPrice={offer} />
        <RentDealLab v={v} at={at} onPrice={offer} />
        <HoldAndSell v={v} onPrice={offer} target={r.maxBid} />
        <LenderView v={v} at={at} onPrice={offer} />
        <StrComparison v={v} />
      </div>
      <StickyResult label={offer ? 'Price that meets your target' : 'Walk-away price'} value={r.noBidWorks ? 'No price works' : Number.isFinite(r.maxBid) ? fmtMoney(r.maxBid) : 'No limit yet'} bad={r.noBidWorks} />
    </div>
  );
}

// ---------------- Commercial income ----------------

const COMMERCIAL_GROUPS: CalcGroup<CommercialInputs>[] = [
  buyGroup<CommercialInputs>('Repairs, tenant improvements, leasing'),
  {
    title: 'Leasing it',
    fields: [
      { k: 'monthlyRent', label: 'Monthly rent, all spaces leased', unit: '$', hint: 'Market rent for each space.' },
      { k: 'otherMonthly', label: 'Other income, per month', unit: '$', hint: 'Parking, signs, storage. Not tenant reimbursements: see below.', more: 'Count each reimbursement once. The cost lines and the operating-cost percentage here are what you pay after tenants reimburse you, so leave reimbursements out of income. (If you’d rather add reimbursements as income, enter the full costs instead; the NOI comes out the same.)' },
      { k: 'vacancyPct', label: 'Vacancy and unpaid rent', unit: '%' },
      { k: 'expensePct', label: 'Operating costs', unit: '%', hint: 'Of rent collected. Or enter them line by line below.', more: 'Taxes, insurance, repairs, management and utilities you pay. It depends on the leases: under triple-net leases tenants pay most of these.', when: (v) => commercialLines(v, 1) === 0 },
      { k: 'leaseUpMonths', label: 'Months to lease it up', unit: 'mo', hint: 'Foreclosed buildings are often empty.' },
      { k: 'monthlyCarry', label: 'Costs while empty, per month', unit: '$' },
      { k: 'reservesYear', label: 'Set aside for replacements, per year', unit: '$', hint: 'Roof, HVAC, paving, and future tenant improvements and leasing commissions.', more: 'Repairs you budget before you buy don’t pay for the next roof or the next tenant’s build-out. This comes out after NOI, so NOI and your cap rate stay the same; cash flow and cash-on-cash return drop. Ask your lender what reserve it underwrites.' },
    ],
  },
  {
    title: 'Operating costs, line by line (optional: replaces the % above, so fill in every line)',
    fields: [
      { k: 'opTaxYear', label: 'Property tax you pay, per year', unit: '$', hint: 'After what tenants reimburse under their leases.', more: 'Read each lease: under a triple-net (NNN) lease the tenant pays its share of taxes, insurance and common-area costs, so your cost is only the vacant spaces’ share. Under a gross lease you pay them. Any line here replaces the percentage above.' },
      { k: 'opInsuranceYear', label: 'Insurance you pay, per year', unit: '$' },
      { k: 'opRepairsYear', label: 'Repairs and upkeep, per year', unit: '$', hint: 'Including common areas, after what tenants reimburse.' },
      { k: 'opUtilitiesYear', label: 'Utilities you pay, per year', unit: '$' },
      { k: 'opManagementPct', label: 'Management', unit: '%', hint: 'Of rent collected.' },
      { k: 'opOtherYear', label: 'Everything else, per year', unit: '$', hint: 'Legal, accounting, leasing fees, licenses.' },
    ],
  },
  loanGroup<CommercialInputs>('Value once leased', 'From the value-by-income helper.'),
  {
    title: 'Your target',
    fields: [
      { k: 'targetCapPct', label: 'Cap rate you require on cost', unit: '%', hint: 'Income ÷ everything you pay (before loan fees).', more: 'Compare with the cap rates a local commercial broker or appraiser sees for this kind of property. Buying below market cap rates leaves no room for surprises.' },
      { k: 'minDscr', label: 'Lender’s minimum coverage', unit: 'x', hint: 'Often 1.25 for commercial.', when: (v) => v.loanPct > 0 },
    ],
  },
];

export function CommercialCalculator({ storageKey = 'fsf.calc.commercial.v1', exactKey = false, start = {}, regional = false, offer = false }: { storageKey?: string; exactKey?: boolean; start?: Partial<CommercialInputs>; regional?: boolean; offer?: boolean }) {
  const ct = useRegionTax(COMMERCIAL_GROUPS);
  const [saved, set, typed, typedKeys] = useSaved<CommercialInputs>(offer && !exactKey ? offerKey(storageKey) : storageKey, { ...COMMERCIAL_DEFAULTS, ...start }, regional ? { transferTaxPer500: ct.per500 } : {});
  const v = offer ? { ...saved, buyerPremiumPct: 0 } : saved;
  const r = commercialMaxBid(v, offer);
  const n = commercialNoi(v);
  const groups = offer ? forOffer(ct.groups) : ct.groups;
  const still = exampleLabels(visibleFields(groups, v), v, COMMERCIAL_DEFAULTS, typedKeys, new Set([...NOT_EXAMPLES, ...Object.keys(start)]));
  const allExample = !typed && Object.keys(start).length === 0;
  return (
    <div className="calc">
      <div className="calc-inputs"><ExampleInputs labels={still} all={allExample} /><CalcFields groups={groups} values={v} onChange={set} /></div>
      <div className="calc-results">
      <p className="small muted">Returns and cash flow are before income tax. Depreciation and your personal taxes are not included.</p>
        <CommercialAtPrice v={v} offer={offer} setPrice={(price) => set('atPrice', price)} target={r.maxBid} />
        {n.byLine && (() => {
          const blank = ([['opTaxYear', 'property tax'], ['opInsuranceYear', 'insurance'], ['opRepairsYear', 'repairs'], ['opUtilitiesYear', 'utilities'], ['opManagementPct', 'management']] as const).filter(([k]) => !(Number(v[k]) > 0)).map(([, label]) => label);
          if (!blank.length) return null;
          const estimate = Math.round((n.collected * Math.min(Number(v.expensePct) || 0, 100)) / 100);
          return <p className="verify" role="status"><strong>Check your cost lines.</strong> Once you enter any line, the lines replace the {v.expensePct}% estimate, and blank lines count as $0. Still blank: {blank.join(', ')}. Your lines total {fmtMoney(Math.round(n.expenses))} a year; the % estimate was {fmtMoney(estimate)}.</p>;
        })()}
        <HoldResults commercial r={r} title="Walk-away price for the income" target={`Yields your ${v.targetCapPct}% cap rate on everything you pay before loan fees, including ${fmtMoney(r.leaseUpCost)} of costs while you lease it up${offer ? ' and the loan payments in those months' : ''}.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))} (${n.byLine ? 'from your line items; any line left at 0 counts as $0, not as the % estimate' : `${v.expensePct}% of rent collected`}).`} minDscr={v.minDscr} offer={offer} examples={still.length} allExample={allExample} headLabel="Walk-away price" />
      </div>
      <StickyResult label="Walk-away price" value={r.noBidWorks ? 'No price works' : Number.isFinite(r.maxBid) ? fmtMoney(r.maxBid) : 'No limit yet'} bad={r.noBidWorks} />
    </div>
  );
}

function CommercialAtPrice({ v, offer, setPrice, target }: { v: CommercialInputs; offer: boolean; setPrice: (n: number) => void; target: number }) {
  const a = v.atPrice > 0 ? commercialAtPrice(v, v.atPrice, offer) : null;
  const word = offer ? 'Your offer' : 'Your bid';
  const meets = a && a.capOnCost !== null && a.capOnCost * 100 >= v.targetCapPct && a.loanOk && a.cashFlow > 0;
  return (
    <section className="calc-at-price" aria-label="Commercial results at your price">
      <PriceHead kind="yours" label={word} price={a?.price ?? null} result={a ? a.cashFlow / 12 : null} note="Your actual price, using the income, costs, lease-up period and loan entered above." />
      <label className="field"><span>{word} ($)</span><NumInput blank max={1e9} value={v.atPrice} onValue={(n) => setPrice(n ?? 0)} /></label>
      {Number.isFinite(target) && target > 0 && <button type="button" className="linkish" onClick={() => setPrice(target)}>Use the walk-away price ({fmtMoney(target)})</button>}
      {!a ? <p>Enter the asking price or your proposed price to compare this property with your targets.</p> : <>
        <p className={meets ? 'notice' : 'caution'}>{meets ? 'Meets your return-on-cost and coverage targets with these numbers.' : 'Misses your return-on-cost or coverage target, or has no positive cash flow.'} Verify the income, costs and loan terms before relying on this result.</p>
        {v.cashAvailable > 0 && (offer ? a.cashIn : a.allIn) > v.cashAvailable && <p className="caution">Your entered cash does not cover this price and the modeled costs.</p>}
        {!offer && a.loan > 0 && <p className="caution">The loan is a later refinance, not cash available at the auction. Until it closes, the full purchase and costs are your cash.</p>}
        <dl className="calc-kv">
          <div><dt>Net operating income, per year</dt><dd>{fmtMoney(Math.round(a.noi))}</dd></div>
          <div><dt>Everything you pay, ready to lease, before loan fees</dt><dd>{fmtMoney(Math.round(a.allIn))}</dd></div>
          <div><dt>Lease-up carrying costs</dt><dd>{fmtMoney(Math.round(a.leaseUpCost))}</dd></div>
          {a.leaseUpDebt > 0 && <div><dt>Loan payments during lease-up (included above)</dt><dd>{fmtMoney(Math.round(a.leaseUpDebt))}</dd></div>}
          <div><dt>Your cash in, including loan fees</dt><dd>{fmtMoney(Math.round(a.cashIn))}</dd></div>
          <div><dt>Debt service, per year</dt><dd>{fmtMoney(Math.round(a.debtService))}</dd></div>
          <div><dt>Replacement reserves, per year</dt><dd>{fmtMoney(Math.round(a.reserves))}</dd></div>
          <div><dt>Cash flow per month, before income tax</dt><dd>{fmtMoney(Math.round(a.cashFlow / 12))}</dd></div>
          <div><dt>Cap rate on purchase price</dt><dd>{pctText(a.capOnPrice)}</dd></div>
          <div><dt>Cap rate on total cost before loan fees</dt><dd>{pctText(a.capOnCost)} (target {v.targetCapPct}%)</dd></div>
          <div><dt>Cash-on-cash return, before income tax</dt><dd>{pctText(a.cashOnCash)}</dd></div>
          {a.dscr !== null && <div><dt>Income coverage (minimum {v.minDscr})</dt><dd>{a.dscr.toFixed(3)}× — {a.loanOk ? 'meets' : 'below'} your minimum</dd></div>}
        </dl>
      </>}
    </section>
  );
}

// ---------------- Lien certificates ----------------

const LIEN_GROUPS: CalcGroup<LienInputs>[] = [
  {
    title: 'The certificate',
    fields: [
      { k: 'price', label: 'Certificate price', unit: '$', hint: 'What you pay for it.' },
      { k: 'fees', label: 'Fees you pay', unit: '$', hint: 'Anything not repaid to you.' },
      { k: 'ratePctMonth', label: 'Interest', unit: '%/mo', hint: 'Up to 1% a month in Nevada; confirm it in the notice of sale.', more: 'Nevada sets the redemption interest at up to 1% a month on the price (NRS 271.595, 271.610). Confirm the rate and terms in the notice of sale.' },
    ],
  },
  {
    title: 'Timing',
    fields: [
      { k: 'monthsToRedeem', label: 'Months until the owner pays', unit: 'mo', hint: 'Most owners redeem.' },
      { k: 'payoutDelayMonths', label: 'Months until you’re paid', unit: 'mo', hint: 'After they redeem; often 1–2.' },
    ],
  },
];

const AZ_LIEN_GROUPS: CalcGroup<LienInputs>[] = [
  {
    title: 'The certificate',
    fields: [
      { k: 'price', label: 'Lien amount you pay', unit: '$', hint: 'The unpaid taxes, interest and fees on the lien.' },
      { k: 'fees', label: 'Fees you pay', unit: '$', hint: 'Up to $10 processing per lien; not repaid.', more: 'The treasurer may charge a processing fee of up to $10 per lien (A.R.S. 42-18116), which the owner doesn’t repay. Paying later years’ taxes adds a $5 fee each time.' },
      { k: 'ratePctMonth', label: 'Interest', unit: '%/mo', hint: 'The rate you win, divided by 12. At most 16% a year (1.33% a month).', more: 'Bidders bid the interest rate down from 16% a year; the lien earns simple interest at the winning rate from the first day of the next month, and part of a month counts as a whole month (A.R.S. 42-18053 and 42-18114).' },
    ],
  },
  {
    title: 'Timing',
    fields: [
      { k: 'monthsToRedeem', label: 'Months until the owner pays', unit: 'mo', hint: 'Most owners redeem.' },
      { k: 'payoutDelayMonths', label: 'Months until you’re paid', unit: 'mo', hint: 'After they redeem.' },
    ],
  },
];

const AZ_LIEN_DEFAULTS: LienInputs = { price: 2_000, fees: 10, ratePctMonth: 0.75, monthsToRedeem: 12, payoutDelayMonths: 1 };

export function LienCalculator({ storageKey }: { storageKey?: string } = {}) {
  const az = useCalcRegion().state === 'AZ';
  // A saved deal keeps its own numbers; an unsaved one uses the draft key, which moves to the deal when it's saved.
  const [v, set, typed, typedKeys] = useSaved<LienInputs>(storageKey ?? (az ? 'fsf.calc.lien.az.v1' : 'fsf.calc.lien.v1'), az ? AZ_LIEN_DEFAULTS : LIEN_DEFAULTS);
  const y = lienYield(v);
  const groups = az ? AZ_LIEN_GROUPS : LIEN_GROUPS;
  const still = exampleLabels(visibleFields(groups, v), v, az ? AZ_LIEN_DEFAULTS : LIEN_DEFAULTS, typedKeys);
  return (
    <div className="calc">
      <div className="calc-inputs"><ExampleInputs labels={still} all={!typed} /><CalcFields groups={groups} values={v} onChange={set} /></div>
      <div className="calc-results">
      <p className="small muted">Returns and cash flow are before income tax. Depreciation and your personal taxes are not included.</p>
        <div className="calc-max" role="status">
          <span>Your yearly yield</span>
          <strong>{pctText(y.yearlyYield)}</strong>
          <small>On the cash you put in, counting the wait until you’re paid. Not a guarantee.</small>
        </div>
        <ExampleResults count={still.length} all={!typed} what="yield" />
        <dl className="calc-kv">
          <div><dt>Interest you’d earn</dt><dd>{fmtMoney(Math.round(y.interest))}</dd></div>
          <div><dt>You’re repaid</dt><dd>{fmtMoney(Math.round(y.payoff))}</dd></div>
          <div><dt>Profit after fees</dt><dd>{fmtMoney(Math.round(y.profit))}</dd></div>
        </dl>
        {az ? (
          <>
            <p className="calc-note small">
              It’s a lien, not the property. The owner can pay it off at any time. After three years (and within ten) you can go to court to foreclose
              the right to redeem; if you don’t act within ten years, the lien expires. <a href="#/learn/forced-sales">How Arizona tax liens work&nbsp;→</a>
            </p>
            <p className="muted small">An estimate, not advice. Confirm the terms with the county treasurer before the February sale.</p>
          </>
        ) : (
          <>
            <p className="calc-note small">
              It’s a certificate, not the property. The owner keeps the home and can pay it off. You can ask for a deed only if they don’t redeem
              in time (120 days, or 2 years if there’s a building). <a href="#/playbooks/sid">How lien certificates work&nbsp;→</a>
            </p>
            <p className="muted small">An estimate, not advice. Later taxes you pay can be added to the certificate with interest if you give the Treasurer written notice.</p>
          </>
        )}
      </div>
      <StickyResult label="Your yearly yield" value={pctText(y.yearlyYield)} />
    </div>
  );
}

// ---------------- Seller financing ----------------

const SELLER_FINANCE_GROUPS: CalcGroup<SellerFinanceInputs>[] = [
  {
    title: 'The seller’s terms',
    fields: [
      { k: 'price', label: 'Price', unit: '$' },
      { k: 'downPct', label: 'Down payment', unit: '%' },
      { k: 'ratePct', label: 'Interest rate', unit: '%/yr' },
      { k: 'amortYears', label: 'Payment figured over', unit: 'yr', hint: 'Often 30 years, even with a balloon.' },
      { k: 'balloonYears', label: 'Balloon due after', unit: 'yr', hint: '0 if it pays off over the term.', more: 'A balloon means the rest of the loan is due at once, years before it would be paid off. Most buyers plan to refinance with a bank by then. If you can’t (rates rose, the value fell, your credit changed), you can lose the property and what you’ve paid in.' },
    ],
  },
  {
    title: 'Compared with a bank loan',
    fields: [
      { k: 'bankDownPct', label: 'Bank’s down payment', unit: '%', hint: 'An investment property: often 20–25%.' },
      { k: 'bankRatePct', label: 'Bank’s rate', unit: '%/yr' },
    ],
  },
];

/** Seller financing next to a bank loan: the payment, the balloon and how you'd pay it, and the cash it saves now. */
export function SellerFinanceCalculator() {
  const [v, set, typed, typedKeys] = useSaved<SellerFinanceInputs>('fsf.calc.sellerfinance.v1', SELLER_FINANCE_DEFAULTS);
  const r = sellerFinance(v);
  const still = exampleLabels(visibleFields(SELLER_FINANCE_GROUPS, v), v, SELLER_FINANCE_DEFAULTS, typedKeys);
  return (
    <div className="calc">
      <div className="calc-inputs"><ExampleInputs labels={still} all={!typed} /><CalcFields groups={SELLER_FINANCE_GROUPS} values={v} onChange={set} /></div>
      <div className="calc-results">
      <p className="small muted">Returns and cash flow are before income tax. Depreciation and your personal taxes are not included.</p>
        <div className={`calc-max${r.balloon > 0 ? ' bad' : ''}`} role="status">
          <span>{r.balloon > 0 ? `Balloon due in year ${r.balloonYears}` : 'Monthly payment to the seller'}</span>
          <strong>{fmtMoney(Math.round(r.balloon > 0 ? r.balloon : r.monthly))}</strong>
          <small>{r.balloon > 0 ? `About ${Math.round(r.balloonPctOfPrice * 100)}% of the price, still owed. Plan now how you’ll pay it: usually a bank refinance, which needs the value, your income and rates to cooperate.` : 'It pays off over the term, with no balloon.'}</small>
        </div>
        <ExampleResults count={still.length} all={!typed} what="payment" />
        <dl className="calc-kv">
          <div><dt>Down payment</dt><dd>{fmtMoney(Math.round(r.down))}</dd></div>
          <div><dt>Monthly payment (principal and interest)</dt><dd>{fmtMoney(Math.round(r.monthly))}</dd></div>
          <div><dt>Interest paid {r.balloon > 0 ? 'before the balloon' : 'over the loan'}</dt><dd>{fmtMoney(Math.round(r.interestPaid))}</dd></div>
          <div><dt>Bank route: down payment</dt><dd>{fmtMoney(Math.round(r.bankDown))}</dd></div>
          <div><dt>Bank route: monthly payment (30 years)</dt><dd>{fmtMoney(Math.round(r.bankMonthly))}</dd></div>
          <div><dt>{r.cashSaved >= 0 ? 'Cash you keep now with the seller’s terms' : 'Extra cash the seller’s terms need up front'}</dt><dd>{fmtMoney(Math.abs(Math.round(r.cashSaved)))}</dd></div>
        </dl>
        <p className="calc-note small">
          Add property taxes and insurance to the payment, and check whether the seller still has a mortgage: a due-on-sale clause can let their lender call the
          loan. Have an attorney or title company prepare the note and deed of trust, record them, and use escrow for payments. <a href="#/learn/creative">Seller financing rules in your state&nbsp;→</a>
        </p>
      </div>
      <StickyResult label={r.balloon > 0 ? 'Balloon due' : 'Monthly payment'} value={fmtMoney(Math.round(r.balloon > 0 ? r.balloon : r.monthly))} bad={r.balloon > 0} />
    </div>
  );
}
