import { useState } from 'react';
import type { BidInputs } from '../lib/bidCalc';
import { COMMERCIAL_DEFAULTS, commercialMaxBid, commercialNoi, LIEN_DEFAULTS, lienYield, RENT_DEFAULTS, rentMaxBid, rentNoi, sanitizeNumbers, type BuyInputs, type CommercialInputs, type HoldResult, type LienInputs, type LoanInputs, type RentInputs } from '../lib/holdCalc';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';
import CalcFields, { type CalcGroup } from './CalcFields';

const pctText = (x: number | null) => (x === null ? '—' : `${(Math.round(x * 1000) / 10).toLocaleString()}%`);

/** Inputs kept in this browser (per property when there is one); rebuilt safely from storage. */
function useSaved<T extends object>(key: string, defaults: T): [T, (k: keyof T & string, v: number) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      return sanitizeNumbers(JSON.parse(localStorage.getItem(key) ?? 'null'), defaults);
    } catch {
      return defaults;
    }
  });
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

function HoldResults({ r, title, target, noiNote, minDscr }: { r: HoldResult; title: string; target: string; noiNote: string; minDscr: number }) {
  return (
    <>
      <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
        <span>{title}</span>
        <strong>{r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
        <small>{r.noBidWorks ? 'The income doesn’t cover the costs and your target at any price. Walk away or change your plan.' : r.limitedBy === 'cash' ? 'Set by the cash you can bring.' : target}</small>
      </div>
      {!r.noBidWorks && (
        <dl className="calc-kv">
          <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>
          <div><dt>Everything you pay, ready to rent</dt><dd>{fmtMoney(Math.round(r.allIn))}</dd></div>
          <div><dt>Net operating income, per year</dt><dd>{fmtMoney(Math.round(r.noi))}</dd></div>
          <div><dt>Return on everything you pay (cap rate on cost)</dt><dd>{pctText(r.capOnCost)}</dd></div>
          {r.debtService > 0 && <div><dt>Loan payments, per year</dt><dd>{fmtMoney(Math.round(r.debtService))}</dd></div>}
          <div><dt>Cash flow, per month</dt><dd>{fmtMoney(Math.round(r.cashFlow / 12))}</dd></div>
          {r.debtService > 0 && <div><dt>Your cash left in the deal</dt><dd>{r.cashLeft > 0 ? fmtMoney(Math.round(r.cashLeft)) : 'None: the loan repays it'}</dd></div>}
          <div><dt>Cash-on-cash return</dt><dd>{r.cashOnCash === null ? 'All your cash is back' : pctText(r.cashOnCash)}</dd></div>
          {r.dscr !== null && <div><dt>Loan coverage (DSCR)</dt><dd>{r.dscr.toFixed(2)}×</dd></div>}
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
    ],
  },
];

export function RentCalculator({ storageKey = 'fsf.calc.rent.v1', start = {} }: { storageKey?: string; start?: Partial<RentInputs> }) {
  const [v, set] = useSaved<RentInputs>(storageKey, { ...RENT_DEFAULTS, ...start });
  const r = rentMaxBid(v);
  const n = rentNoi(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={RENT_GROUPS} values={v} onChange={set} /></div>
      <div className="calc-results">
        <HoldResults r={r} title="Walk-away price to keep and rent it" target={`Gives your ${v.targetCocPct}% cash-on-cash return, based on your numbers. Not a guarantee.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))}.`} minDscr={v.minDscr} />
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

export function CommercialCalculator({ storageKey = 'fsf.calc.commercial.v1', start = {} }: { storageKey?: string; start?: Partial<CommercialInputs> }) {
  const [v, set] = useSaved<CommercialInputs>(storageKey, { ...COMMERCIAL_DEFAULTS, ...start });
  const r = commercialMaxBid(v);
  const n = commercialNoi(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={COMMERCIAL_GROUPS} values={v} onChange={set} /></div>
      <div className="calc-results">
        <HoldResults r={r} title="Walk-away price for the income" target={`Yields your ${v.targetCapPct}% cap rate on everything you pay, including ${fmtMoney(r.leaseUpCost)} of costs while you lease it up.`} noiNote={`Rent collected ${fmtMoney(Math.round(n.collected))} a year, operating costs ${fmtMoney(Math.round(n.expenses))}.`} minDscr={v.minDscr} />
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

export function LienCalculator() {
  const [v, set] = useSaved<LienInputs>('fsf.calc.lien.v1', LIEN_DEFAULTS);
  const y = lienYield(v);
  return (
    <div className="calc">
      <div className="calc-inputs"><CalcFields groups={LIEN_GROUPS} values={v} onChange={set} /></div>
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
        <p className="calc-note small">
          It’s a certificate, not the property. The owner keeps the home and can pay it off. You can ask for a deed only if they don’t redeem
          in time (120 days, or 2 years if there’s a building). <a href="#/playbooks/sid">How lien certificates work →</a>
        </p>
        <p className="muted small">An estimate, not advice. Later taxes you pay can be added to the certificate with interest if you give the Treasurer written notice.</p>
      </div>
    </div>
  );
}
