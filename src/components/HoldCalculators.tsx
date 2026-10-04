import { useEffect, useState } from 'react';
import type { BidInputs } from '../lib/bidCalc';
import { COMMERCIAL_DEFAULTS, commercialMaxBid, commercialNoi, explainRent, rentStress, LIEN_DEFAULTS, lienYield, RENT_DEFAULTS, rentAtPrice, rentEmptyMonths, rentMaxBid, rentNoi, sanitizeNumbers, type BuyInputs, type CommercialInputs, type HoldResult, type LienInputs, type LoanInputs, type RentInputs } from '../lib/holdCalc';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';
import CalcFields, { type CalcGroup } from './CalcFields';
import { useCalcRegion } from './calcRegion';
import { propertyTaxHint, transferTaxFor } from '../lib/stateCosts';

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
function useSaved<T extends object>(key: string, defaults: T, force: Partial<T> = {}): [T, (k: keyof T & string, v: number) => void] {
  // `force` holds the region's values (its transfer tax). They replace saved numbers only when the region changes,
  // so a number the user typed survives switching tabs and reloading.
  const sig = JSON.stringify(force);
  const [v, setV] = useState<T>(() => {
    try {
      const saved = sanitizeNumbers(JSON.parse(localStorage.getItem(key) ?? 'null'), defaults);
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
  }, [key, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof T & string, n: number) => {
    trackAction('calculator_used', true);
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
  return [v, set];
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
      { k: 'cashAvailable', label: 'Cash you can bring', unit: '$', hint: 'For auction day. Leave 0 for no limit.' },
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'Confirm with a title search.' },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$' },
      { k: 'possession', label: 'Getting possession', unit: '$', hint: 'Eviction attorney, relocation, locks.' },
      { k: 'repairs', label: repairsLabel, unit: '$', hint: 'To make it ready to rent.' },
      { k: 'contingencyPct', label: 'Contingency', unit: '%', hint: 'A cushion for surprises.' },
    ] as CalcGroup<T>['fields'],
  };
}

/** For a listed or bank-owned home: no auction cash limit or buyer's premium, and closing words instead of auction words. */
function forOffer<T>(groups: CalcGroup<T>[]): CalcGroup<T>[] {
  const relabel: Record<string, { label?: string; hint?: string; more?: string }> = {
    survivingLiens: { label: 'Liens you’d have to pay', hint: 'Usually paid off at closing. Check the title report.' },
    titleLegal: { label: 'Title insurance, escrow and attorney' },
    possession: { hint: 'Only if a tenant or the owner stays after closing.' },
    loanPct: { hint: 'A loan when you buy, or a refinance later. 0 for all cash.', more: 'Lenders set their own limits; ask yours what they’d lend on this property and when.' },
  };
  return groups.map((g) => ({
    ...g,
    fields: g.fields.filter((f) => f.k !== 'cashAvailable' && f.k !== 'buyerPremiumPct').map((f) => ({ ...f, ...relabel[f.k as string] })) as CalcGroup<T>['fields'],
  }));
}

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

function HoldResults({ r, title, target, noiNote, minDscr, offer = false }: { r: HoldResult; title: string; target: string; noiNote: string; minDscr: number; offer?: boolean }) {
  return (
    <>
      <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
        <span>{title}</span>
        <strong>{r.noBidWorks ? (offer ? 'No offer works' : 'No bid works') : Number.isFinite(r.maxBid) ? fmtMoney(r.maxBid) : 'No limit yet'}</strong>
        <small>{r.noBidWorks ? 'The income doesn’t cover the costs and your target at any price. Walk away or change your plan.' : !Number.isFinite(r.maxBid) ? 'Enter the return you want, or the cash you can bring, to get a walk-away price.' : r.limitedBy === 'cash' ? 'Set by the cash you can bring.' : target}</small>
      </div>
      {!r.noBidWorks && Number.isFinite(r.maxBid) && (
        <dl className="calc-kv">
          {!offer && <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>}
          <div><dt>Everything you pay, ready to rent</dt><dd>{fmtMoney(Math.round(r.allIn))}</dd></div>
          <div><dt>Net operating income (NOI), per year: after operating costs{r.reserves > 0 ? ', before reserves' : ''} and before the loan</dt><dd>{fmtMoney(Math.round(r.noi))}</dd></div>
          {r.reserves > 0 && <div><dt>Reserves for big replacements, per year</dt><dd>{fmtMoney(Math.round(r.reserves))}</dd></div>}
          <div><dt>Return on everything you pay (cap rate on cost)</dt><dd>{pctText(r.capOnCost)}</dd></div>
          {r.debtService > 0 && <div><dt>Debt service: loan payments, per year</dt><dd>{fmtMoney(Math.round(r.debtService))}</dd></div>}
          <div><dt>Cash flow, per month: NOI minus {r.reserves > 0 ? 'reserves and ' : ''}loan payments</dt><dd>{fmtMoney(Math.round(r.cashFlow / 12))}</dd></div>
          {r.debtService > 0 && <div><dt>Your cash left in the deal</dt><dd>{r.cashLeft > 0 ? fmtMoney(Math.round(r.cashLeft)) : 'None: the loan repays it'}</dd></div>}
          <div><dt>Cash-on-cash return</dt><dd>{r.cashOnCash === null ? 'All your cash is back' : pctText(r.cashOnCash)}</dd></div>
          {r.dscr !== null && <div><dt>Loan coverage (DSCR): NOI ÷ loan payments. Lenders define it differently.</dt><dd>{r.dscr.toFixed(2)}×</dd></div>}
        </dl>
      )}
      {r.dscr !== null && !r.loanOk && (
        <p className="calc-note small">The income covers the loan payment only {r.dscr.toFixed(2)} times. Many lenders want at least {minDscr.toFixed(2)}, so a smaller loan may be all you can get.</p>
      )}
      <p className="muted small">{noiNote} An estimate to help you set a limit before the sale, not advice.</p>
    </>
  );
}

// ---------------- Rent / hold ----------------

const RENT_GROUPS: CalcGroup<RentInputs>[] = [
  buyGroup<RentInputs>(),
  {
    title: 'Renting it',
    fields: [
      { k: 'monthlyRent', label: 'Monthly rent', unit: '$', hint: 'From rented comparables nearby.' },
      { k: 'vacancyPct', label: 'Vacancy and unpaid rent', unit: '%', hint: '5–8% is common for homes.' },
      { k: 'propertyTaxYear', label: 'Property tax, per year', unit: '$' },
      { k: 'insuranceYear', label: 'Insurance, per year', unit: '$', hint: 'A landlord policy.' },
      { k: 'hoaMonthly', label: 'HOA dues, per month', unit: '$' },
      { k: 'managementPct', label: 'Property management', unit: '%', hint: 'Of rent collected. 0 if you manage it.' },
      { k: 'maintenancePct', label: 'Repairs and upkeep', unit: '%', hint: 'Of rent collected.' },
      { k: 'capexPct', label: 'Big-item reserves', unit: '%', hint: 'Roof, HVAC, water heater.', more: 'Money set aside each month for large replacements. Leaving it out is the most common way rental numbers look better than they are.' },
    ],
  },
  loanGroup<RentInputs>('Value after repairs', 'For the loan amount. Use sold comps.'),
  {
    title: 'Your target',
    fields: [
      { k: 'targetCocPct', label: 'Cash-on-cash return you want', unit: '%', hint: 'Yearly cash flow ÷ your cash in the deal.' },
      { k: 'minDscr', label: 'Lender’s minimum coverage', unit: 'x', hint: 'Income ÷ loan payment. Often 1.2–1.25.', when: (v) => v.loanPct > 0 },
      { k: 'reserveCash', label: 'Cash you’ll still have after buying', unit: '$', hint: 'Savings left after closing and repairs.', more: 'Beginners run out of cash before they run out of deals. This shows how many months you could keep paying with no rent coming in.' },
    ],
  },
];

/** How long savings carry the rental with no rent: the payments don't stop when a unit is empty. */
function CashCushion({ v }: { v: RentInputs }) {
  const e = rentEmptyMonths(v);
  if (e.monthly <= 0) return null;
  if (e.months === null) return <p className="calc-note small">Enter the cash you’ll still have after buying to see how many months you could pay {fmtMoney(Math.round(e.monthly))} a month in loan, tax, insurance and HOA costs with no rent coming in.</p>;
  const short = e.months < 6;
  return (
    <p className={`calc-note small${short ? ' warn' : ''}`}>
      <strong>With no rent, your cash lasts about {e.months.toLocaleString()} months.</strong> That pays {fmtMoney(Math.round(e.monthly))} a month in loan, tax, insurance and HOA costs.
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
function AtThisPrice({ v, start }: { v: RentInputs; start: number }) {
  const walkAway = Number.isFinite(start) && start > 0 ? Math.round(start) : 0;
  const [price, setPrice] = useState(walkAway);
  const a = rentAtPrice(v, price);
  const mo = (n: number) => fmtMoney(Math.round(n / 12));
  const neg = (n: number) => (n > 0 ? `−${mo(n)}` : mo(0));
  return (
    <section className="at-price" aria-labelledby="at-price-head">
      <h4 id="at-price-head">At this price</h4>
      <label className="field">
        <span>Price you’d pay ($)</span>
        <input type="number" inputMode="numeric" min={0} max={1e9} step={1000} value={price || ''} onChange={(e) => { const n = Number(e.target.value); setPrice(Number.isFinite(n) ? Math.min(1e9, Math.max(0, n)) : 0); }} />
      </label>
      {walkAway > 0 && price !== walkAway && <button type="button" className="linkish" onClick={() => setPrice(walkAway)}>Use the walk-away price ({fmtMoney(walkAway)})</button>}
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
        <div><dt>Everything you pay, ready to rent (price, buying costs, liens, title, possession, repairs)</dt><dd>{fmtMoney(Math.round(a.allIn))}</dd></div>
        {a.loan > 0 && <div><dt>Loan ({Math.min(v.loanPct, 100)}% of the {fmtMoney(v.value)} value, after {v.loanCostPct}% loan costs)</dt><dd>{fmtMoney(Math.round(a.loan * (1 - v.loanCostPct / 100)))}</dd></div>}
        <div><dt>Your cash in the deal</dt><dd>{a.cashIn > 0 ? fmtMoney(Math.round(a.cashIn)) : 'None: the loan covers it'}</dd></div>
        <div><dt>Cash-on-cash return: yearly cash flow ÷ your cash in</dt><dd>{a.cashOnCash === null ? 'All your cash is back' : pctText(a.cashOnCash)}</dd></div>
        <div><dt>Cap rate on the price: NOI ÷ price</dt><dd>{pctText(a.capOnPrice)}</dd></div>
        <div><dt>Cap rate on everything you pay</dt><dd>{pctText(a.capOnCost)}</dd></div>
        {a.dscr !== null && <div><dt>Loan coverage (DSCR): NOI ÷ loan payments</dt><dd>{a.dscr.toFixed(2)}×</dd></div>}
      </dl>
      <p className="muted small">Uses the rent, costs and loan you entered above; taxes and insurance are counted in operating costs, not in the loan payment. Your cash in doesn’t include reserves you keep in the bank. An estimate, not advice.</p>
    </section>
  );
}

function RentDealLab({ v, start }: { v: RentInputs; start: number }) {
  const rows = rentStress(v);
  const [ticked, setTicked] = useState<string[]>([]);
  return (
    <div className="deal-lab">
      <AtThisPrice v={v} start={start} />
      <h4>Explain this deal</h4>
      <ul className="deal-explain">{explainRent(v).map((x) => <li key={x}>{x}</li>)}</ul>
      <h4>Stress test: cash flow per month</h4>
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

export function RentCalculator({ storageKey = 'fsf.calc.rent.v1', start = {}, regional = false, offer = false }: { storageKey?: string; start?: Partial<RentInputs>; regional?: boolean; offer?: boolean }) {
  const rt = useRegionTax(RENT_GROUPS);
  const [saved, set] = useSaved<RentInputs>(storageKey, { ...RENT_DEFAULTS, ...start }, regional ? { transferTaxPer500: rt.per500 } : {});
  const v = offer ? { ...saved, cashAvailable: 0, buyerPremiumPct: 0 } : saved;
  const r = rentMaxBid(v);
  const n = rentNoi(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={offer ? forOffer(rt.groups) : rt.groups} values={v} onChange={set} /></div>
      <div className="calc-results">
        <HoldResults r={r} title="Walk-away price to keep and rent it" target={`Gives your ${v.targetCocPct}% cash-on-cash return, based on your numbers. Not a guarantee.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))}, reserves ${fmtMoney(Math.round(n.reserves))}.`} minDscr={v.minDscr} offer={offer} />
        <CashCushion v={v} />
        <RentDealLab v={v} start={r.maxBid} />
      </div>
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
      { k: 'otherMonthly', label: 'Other income, per month', unit: '$', hint: 'Parking, signs, reimbursements.' },
      { k: 'vacancyPct', label: 'Vacancy and unpaid rent', unit: '%' },
      { k: 'expensePct', label: 'Operating costs', unit: '%', hint: 'Of rent collected.', more: 'Taxes, insurance, repairs, management and utilities you pay. It depends on the leases: under triple-net leases tenants pay most of these.' },
      { k: 'leaseUpMonths', label: 'Months to lease it up', unit: 'mo', hint: 'Foreclosed buildings are often empty.' },
      { k: 'monthlyCarry', label: 'Costs while empty, per month', unit: '$' },
    ],
  },
  loanGroup<CommercialInputs>('Value once leased', 'From the value-by-income helper.'),
  {
    title: 'Your target',
    fields: [
      { k: 'targetCapPct', label: 'Cap rate you require on cost', unit: '%', hint: 'Income ÷ everything you pay.', more: 'Compare with the cap rates a local commercial broker or appraiser sees for this kind of property. Buying below market cap rates leaves no room for surprises.' },
      { k: 'minDscr', label: 'Lender’s minimum coverage', unit: 'x', hint: 'Often 1.25 for commercial.', when: (v) => v.loanPct > 0 },
    ],
  },
];

export function CommercialCalculator({ storageKey = 'fsf.calc.commercial.v1', start = {}, regional = false, offer = false }: { storageKey?: string; start?: Partial<CommercialInputs>; regional?: boolean; offer?: boolean }) {
  const ct = useRegionTax(COMMERCIAL_GROUPS);
  const [saved, set] = useSaved<CommercialInputs>(storageKey, { ...COMMERCIAL_DEFAULTS, ...start }, regional ? { transferTaxPer500: ct.per500 } : {});
  const v = offer ? { ...saved, cashAvailable: 0, buyerPremiumPct: 0 } : saved;
  const r = commercialMaxBid(v);
  const n = commercialNoi(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={offer ? forOffer(ct.groups) : ct.groups} values={v} onChange={set} /></div>
      <div className="calc-results">
        <HoldResults r={r} title="Walk-away price for the income" target={`Yields your ${v.targetCapPct}% cap rate on everything you pay, including ${fmtMoney(r.leaseUpCost)} of costs while you lease it up.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))}.`} minDscr={v.minDscr} offer={offer} />
      </div>
    </div>
  );
}

// ---------------- Lien certificates ----------------

const LIEN_GROUPS: CalcGroup<LienInputs>[] = [
  {
    title: 'The certificate',
    fields: [
      { k: 'price', label: 'Certificate price', unit: '$', hint: 'What you pay for it.' },
      { k: 'fees', label: 'Fees you pay', unit: '$', hint: 'Anything not repaid to you.' },
      { k: 'ratePctMonth', label: 'Interest', unit: '%/mo', hint: '1% a month in Nevada (NRS 271.610).', more: 'The buyer is entitled to 1% a month on the price (NRS 271.610). Confirm the rate and terms in the notice of sale.' },
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

export function LienCalculator() {
  const az = useCalcRegion().state === 'AZ';
  const [v, set] = useSaved<LienInputs>(az ? 'fsf.calc.lien.az.v1' : 'fsf.calc.lien.v1', az ? AZ_LIEN_DEFAULTS : LIEN_DEFAULTS);
  const y = lienYield(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={az ? AZ_LIEN_GROUPS : LIEN_GROUPS} values={v} onChange={set} /></div>
      <div className="calc-results">
        <div className="calc-max" role="status">
          <span>Your yearly yield</span>
          <strong>{pctText(y.yearlyYield)}</strong>
          <small>On the cash you put in, counting the wait until you’re paid. Not a guarantee.</small>
        </div>
        <dl className="calc-kv">
          <div><dt>Interest you’d earn</dt><dd>{fmtMoney(Math.round(y.interest))}</dd></div>
          <div><dt>You’re repaid</dt><dd>{fmtMoney(Math.round(y.payoff))}</dd></div>
          <div><dt>Profit after fees</dt><dd>{fmtMoney(Math.round(y.profit))}</dd></div>
        </dl>
        {az ? (
          <>
            <p className="calc-note small">
              It’s a lien, not the property. The owner can pay it off at any time. After three years (and within ten) you can go to court to foreclose
              the right to redeem; if you don’t act within ten years, the lien expires. <a href="#/learn/forced-sales">How Arizona tax liens work →</a>
            </p>
            <p className="muted small">An estimate, not advice. Confirm the terms with the county treasurer before the February sale.</p>
          </>
        ) : (
          <>
            <p className="calc-note small">
              It’s a certificate, not the property. The owner keeps the home and can pay it off. You can ask for a deed only if they don’t redeem
              in time (120 days, or 2 years if there’s a building). <a href="#/playbooks/sid">How lien certificates work →</a>
            </p>
            <p className="muted small">An estimate, not advice. Later taxes you pay can be added to the certificate with interest if you give the Treasurer written notice.</p>
          </>
        )}
      </div>
    </div>
  );
}
