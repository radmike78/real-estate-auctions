import { useState } from 'react';
import { BLANK_INPUTS, costsAtBid, maxSafeBid, profitAtBid, stressTests, type BidInputs } from '../lib/bidCalc';
import { fmtMoney } from '../lib/status';

const KEY = (id: string) => `fsf.bid.${id}.v1`;

type Field = { k: keyof BidInputs; label: string; unit: '$' | '%' | 'mo' | '$/500'; hint?: string };
const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'What it will be worth',
    fields: [
      { k: 'exitValue', label: 'Resale value after repairs', unit: '$', hint: 'Use conservative sold comps, not the list price or our estimate.' },
      { k: 'sellingCostPct', label: 'Cost to sell', unit: '%', hint: 'Agent commission plus closing costs.' },
    ],
  },
  {
    title: 'Costs you take on',
    fields: [
      { k: 'repairs', label: 'Repairs', unit: '$', hint: 'Usually no interior inspection before an auction.' },
      { k: 'contingencyPct', label: 'Repair contingency', unit: '%' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'From the Liens section. Confirm with a title search.' },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$' },
      { k: 'possession', label: 'Getting possession', unit: '$', hint: 'Eviction attorney, relocation, new locks.' },
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.' },
    ],
  },
  {
    title: 'Holding and financing',
    fields: [
      { k: 'holdingMonths', label: 'Months until sold', unit: 'mo', hint: 'Include any redemption period.' },
      { k: 'monthlyCarry', label: 'Monthly holding costs', unit: '$', hint: 'Taxes, insurance, utilities, HOA.' },
      { k: 'financedPct', label: 'Share financed after purchase', unit: '%', hint: 'Auctions need cash on the day; a loan usually comes after.' },
      { k: 'interestRatePct', label: 'Interest rate (yearly)', unit: '%' },
      { k: 'pointsPct', label: 'Lender points', unit: '%' },
    ],
  },
  {
    title: 'Your target',
    fields: [{ k: 'targetProfitPct', label: 'Profit you require', unit: '%', hint: 'Share of the resale value. 15–20% is common for flips.' }],
  },
];

function load(id: string | undefined, defaults: BidInputs): BidInputs {
  if (!id) return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    return saved && typeof saved === 'object' ? { ...defaults, ...saved } : defaults;
  } catch {
    return defaults;
  }
}

/** Saved max bid for a property (used by My deals), if the buyer has run the calculator. */
export function savedMaxBid(id: string): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    return saved ? maxSafeBid({ ...BLANK_INPUTS, ...saved }).maxBid : null;
  } catch {
    return null;
  }
}

export default function BidCalculator({ propertyId, defaults = BLANK_INPUTS, openingBid }: { propertyId?: string; defaults?: BidInputs; openingBid?: number | null }) {
  const [i, setI] = useState<BidInputs>(() => load(propertyId, defaults));
  const [bid, setBid] = useState<number>(openingBid ?? 0);
  const set = (k: keyof BidInputs, v: number) =>
    setI((cur) => {
      const next = { ...cur, [k]: v };
      if (propertyId) {
        try {
          localStorage.setItem(KEY(propertyId), JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
      }
      return next;
    });
  const r = maxSafeBid(i);
  const tests = stressTests(i);
  const atBid = bid > 0 ? costsAtBid(i, bid) : null;
  const profit = bid > 0 ? profitAtBid(i, bid) : null;
  const over = bid > 0 && bid > r.maxBid;

  return (
    <div className="calc">
      <div className="calc-inputs">
        {GROUPS.map((g) => (
          <fieldset key={g.title} className="calc-group">
            <legend>{g.title}</legend>
            {g.fields.map((f) => (
              <label key={f.k} className="calc-field">
                <span className="calc-label">{f.label}</span>
                <span className="calc-input">
                  {f.unit === '$' && <i aria-hidden>$</i>}
                  <input type="number" inputMode="decimal" min={0} step="any" value={Number.isFinite(i[f.k]) ? i[f.k] : 0} onChange={(e) => set(f.k, Number(e.target.value))} />
                  {f.unit !== '$' && <i aria-hidden>{f.unit === '$/500' ? 'per $500' : f.unit === 'mo' ? 'months' : '%'}</i>}
                </span>
                {f.hint && <small className="muted">{f.hint}</small>}
              </label>
            ))}
          </fieldset>
        ))}
        {propertyId && (
          <button type="button" className="linkish" onClick={() => { try { localStorage.removeItem(KEY(propertyId)); } catch { /* ignore */ } setI(defaults); }}>
            Reset to our starting estimates
          </button>
        )}
      </div>

      <div className="calc-results" aria-live="polite">
        <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`}>
          <span>Your maximum safe bid</span>
          <strong>{r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
          <small>{r.noBidWorks ? 'Even at $0, costs leave less than your target profit. Walk away or change your plan.' : `Leaves your ${i.targetProfitPct}% target after every cost below.`}</small>
        </div>
        <dl className="calc-kv">
          <div><dt>Break-even bid (zero profit)</dt><dd>{fmtMoney(r.breakEvenBid)}</dd></div>
          <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>
          <div><dt>Total cash in the deal</dt><dd>{fmtMoney(r.cashToStabilize)}</dd></div>
        </dl>

        <label className="calc-field calc-bid">
          <span className="calc-label">Check a bid</span>
          <span className="calc-input"><i aria-hidden>$</i><input type="number" min={0} step="any" value={bid || ''} placeholder="e.g. the opening bid" onChange={(e) => setBid(Number(e.target.value))} /></span>
        </label>
        {atBid && profit !== null && (
          <div className={`calc-verdict ${over ? 'bad' : 'good'}`} role="status">
            {over ? (
              <><strong>Above your maximum.</strong> At {fmtMoney(bid)} this deal no longer meets your target. Profit would be {fmtMoney(Math.round(profit))} ({Math.round((profit / i.exitValue) * 100)}%). Stop bidding.</>
            ) : (
              <><strong>Within your maximum.</strong> Estimated profit {fmtMoney(Math.round(profit))} ({Math.round((profit / i.exitValue) * 100)}% of resale value).</>
            )}
          </div>
        )}
        {atBid && (
          <details className="calc-breakdown">
            <summary>Every cost at {fmtMoney(bid)}</summary>
            <dl className="calc-kv">
              {([
                ['Bid', atBid.bid], ["Buyer's premium", atBid.premium], ['Transfer tax', atBid.transferTax], ['Repairs + contingency', atBid.repairs],
                ['Liens that stay', atBid.survivingLiens], ['Title, attorney, quiet title', atBid.titleLegal], ['Getting possession', atBid.possession],
                ['Holding costs', atBid.holding], ['Financing', atBid.financing], ['Selling costs', atBid.selling],
              ] as const).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{fmtMoney(Math.round(v))}</dd></div>)}
              <div className="total"><dt>Total</dt><dd>{fmtMoney(Math.round(atBid.total))}</dd></div>
            </dl>
          </details>
        )}

        <h3>If things go worse than planned</h3>
        <table className="calc-stress">
          <thead><tr><th>Scenario</th><th className="num">Max safe bid</th></tr></thead>
          <tbody>{tests.map((t) => <tr key={t.label}><td>{t.label}</td><td className="num">{t.maxBid > 0 ? fmtMoney(t.maxBid) : 'No bid works'}</td></tr>)}</tbody>
        </table>
        <p className="muted small">An estimate to help you set a limit before the sale, not advice. Replace every starting number with your own comps, bids and quotes.</p>
      </div>
    </div>
  );
}
