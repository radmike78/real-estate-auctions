import { useEffect, useId, useState } from 'react';
import { BLANK_INPUTS, clampInput, costsAtBid, INPUT_MAX, maxSafeBid, profitAtBid, sanitizeInputs, stressTests, type BidInputs } from '../lib/bidCalc';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';

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
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500 of value, rounded up to the next $500.' },
    ],
  },
  {
    title: 'Holding and financing',
    fields: [
      { k: 'holdingMonths', label: 'Months until sold', unit: 'mo', hint: 'Include any redemption period. After a tax sale, resale may wait for a quiet title action or the 2-year window after the Treasurer’s deed (NRS 361.600).' },
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
    return sanitizeInputs(JSON.parse(localStorage.getItem(KEY(id)) ?? 'null'), defaults);
  } catch {
    return defaults;
  }
}

/** Sets the calculator's resale value for a property (used by the commercial income calculator). */
export function setSavedExitValue(id: string, defaults: BidInputs, exitValue: number) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify({ ...load(id, defaults), exitValue }));
  } catch {
    /* storage unavailable: the value just isn't carried over */
  }
}

/** Saved max bid for a property (used by My deals), if the buyer has run the calculator. */
export function savedMaxBid(id: string): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    return saved && typeof saved === 'object' ? maxSafeBid(sanitizeInputs(saved, BLANK_INPUTS)).maxBid : null;
  } catch {
    return null;
  }
}

const pct = (profit: number, exit: number) => (exit > 0 ? ` (${Math.round((profit / exit) * 100)}% of resale value)` : '');
// Typed text becomes a number: empty or invalid counts as 0, negatives are not allowed.
const toNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function BidCalculator({ propertyId, defaults = BLANK_INPUTS, openingBid, headingLevel = 3, commercial = false }: { propertyId?: string; defaults?: BidInputs; openingBid?: number | null; headingLevel?: 2 | 3; commercial?: boolean }) {
  const hintFor = (f: Field) => (commercial && f.k === 'exitValue' ? 'For commercial property, use the value by income above.' : f.hint);
  const uid = useId();
  // The pinned max-bid bar (phones) steps aside once the full results are on screen, so it never covers them.
  const [resultsVisible, setResultsVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(`${uid}-results`);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [uid]);
  const [i, setI] = useState<BidInputs>(() => load(propertyId, defaults));
  // What the person typed, so a field can be cleared while editing.
  const [draft, setDraft] = useState<Partial<Record<keyof BidInputs, string>>>({});
  const [bidText, setBidText] = useState<string>(openingBid ? String(openingBid) : '');
  const bid = Math.min(toNum(bidText), 1e10);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const set = (k: keyof BidInputs, text: string) => {
    trackAction('calculator_used', true);
    setDraft((d) => ({ ...d, [k]: text }));
    const v = clampInput(k, toNum(text));
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
  };
  const r = maxSafeBid(i);
  const tests = stressTests(i);
  // No resale value yet (e.g. a listing with no estimate): ask for one instead of saying "no bid works".
  const needsValue = !(i.exitValue > 0);
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
              <div key={f.k} className="calc-field">
                <label className="calc-label" htmlFor={`${uid}-${f.k}`}>{f.label}</label>
                <span className="calc-input">
                  {f.unit === '$' && <i aria-hidden>$</i>}
                  <input
                    id={`${uid}-${f.k}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={INPUT_MAX[f.k]}
                    step="any"
                    value={draft[f.k] ?? String(i[f.k])}
                    aria-describedby={hintFor(f) ? `${uid}-${f.k}-hint` : undefined}
                    onChange={(e) => set(f.k, e.target.value)}
                    onBlur={() => setDraft((d) => ({ ...d, [f.k]: undefined }))}
                  />
                  {f.unit !== '$' && <i aria-hidden>{f.unit === '$/500' ? 'per $500' : f.unit === 'mo' ? 'months' : '%'}</i>}
                </span>
                {hintFor(f) && <small className="muted" id={`${uid}-${f.k}-hint`}>{hintFor(f)}</small>}
              </div>
            ))}
          </fieldset>
        ))}
        {propertyId && (
          <button type="button" className="linkish" onClick={() => { try { localStorage.removeItem(KEY(propertyId)); } catch { /* ignore */ } setI(defaults); setDraft({}); }}>
            Reset to our starting estimates
          </button>
        )}
      </div>

      <div className="calc-results" id={`${uid}-results`}>
        {needsValue ? (
          <div className="calc-max" role="status">
            <span>Your maximum bid</span>
            <strong>Enter a resale value</strong>
            <small>{propertyId ? 'We don’t estimate values for listings from the official list. ' : ''}Use recent sold prices of similar nearby properties, as they’d be after repairs.</small>
          </div>
        ) : (
        <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
          <span>Your maximum bid</span>
          <strong>{r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
          <small>{r.noBidWorks ? 'Even at $0, costs leave less than your target profit. Walk away or change your plan.' : `Leaves your ${i.targetProfitPct}% profit target after every cost below, based on your numbers. Not a guarantee.`}</small>
        </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <dl className="calc-kv">
            <div><dt>Break-even bid (zero profit)</dt><dd>{fmtMoney(r.breakEvenBid)}</dd></div>
            <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>
            <div><dt>Total cash in the deal</dt><dd>{fmtMoney(r.cashToStabilize)}</dd></div>
          </dl>
        )}

        <div className="calc-field calc-bid">
          <label className="calc-label" htmlFor={`${uid}-bid`}>Check a bid</label>
          <span className="calc-input"><i aria-hidden>$</i><input id={`${uid}-bid`} type="number" inputMode="decimal" min={0} step="any" value={bidText} placeholder="e.g. the opening bid" onChange={(e) => { trackAction('calculator_used', true); setBidText(e.target.value); }} /></span>
        </div>
        {atBid && profit !== null && !needsValue && (
          <div className={`calc-verdict ${over ? 'bad' : 'good'}`} role="status">
            {over ? (
              <><strong>Above your maximum.</strong> At {fmtMoney(bid)} this deal no longer meets your target. Profit would be {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}. Stop bidding.</>
            ) : (
              <><strong>Within your maximum.</strong> Estimated profit {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}.</>
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

        <H>If things go worse than planned</H>
        <table className="calc-stress">
          <thead><tr><th>Scenario</th><th className="num">Max bid</th></tr></thead>
          <tbody>{tests.map((t) => <tr key={t.label}><td>{t.label}</td><td className="num">{needsValue ? '—' : t.maxBid > 0 ? fmtMoney(t.maxBid) : 'No bid works'}</td></tr>)}</tbody>
        </table>
        <p className="muted small">An estimate to help you set a limit before the sale, not advice. Replace every starting number with your own comps, bids and quotes.</p>
      </div>

      {/* On phones the results sit below every input, so keep the answer in view while typing. */}
      <button type="button" hidden={resultsVisible} className={`calc-sticky${r.noBidWorks ? ' bad' : ''}`} onClick={() => document.getElementById(`${uid}-results`)?.scrollIntoView({ behavior: 'smooth' })}>
        <span>Max bid</span>
        <strong>{needsValue ? 'Enter a resale value' : r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
        <span className="calc-sticky-go">See details ↓</span>
      </button>
    </div>
  );
}
