import { useEffect, useId, useState } from 'react';
import { BLANK_INPUTS, START_INPUTS, maxBidSteps, clampInput, costsAtBid, GRID_REPAIR_STEPS, GRID_VALUE_STEPS, INPUT_MAX, maxSafeBid, profitAtBid, redemptionOutcome, REDEMPTION_RULES, requiredProfit, ruleOf, sanitizeInputs, stressGrid, totalMonths, type BidInputs, type RedemptionRule } from '../lib/bidCalc';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';

const KEY = (id: string) => `fsf.bid.${id}.v1`;

type Field = {
  k: keyof BidInputs;
  label: string;
  unit: '$' | '%' | 'mo' | '$/500' | '%/yr';
  /** One short line under the field. */
  hint?: string;
  /** Longer explanation, behind a "?" so every field stays the same height. */
  more?: string;
  /** Shown in Quick mode too. */
  quick?: boolean;
  /** Only shown when this returns true (e.g. loan terms once something is financed). */
  when?: (i: BidInputs) => boolean;
};
// In the order a buyer meets them: buying it, fixing it, holding it, then selling it and the profit you want.
// The walk-away price still works back from the resale value, so every group counts.
const GROUPS: { title: string; fields: Field[]; redemption?: boolean }[] = [
  {
    title: 'The deal',
    fields: [
      { k: 'minimumBid', label: 'Opening (minimum) bid', unit: '$', hint: 'From the auction listing.', quick: true, more: 'The lowest bid the auction will accept, stated in the listing or notice of sale. Your maximum is worked out from the resale value and every cost; the results show how much room that leaves above the opening bid.' },
      { k: 'exitValue', label: 'Resale value after repairs', unit: '$', hint: 'Conservative sold comps, not list prices.', quick: true },
      { k: 'targetProfitPct', label: 'Profit you want', unit: '%', hint: 'Of the resale value. 15–20% is common.', quick: true },
      { k: 'targetProfitMin', label: 'And at least', unit: '$', hint: 'A dollar minimum. Leave 0 for none.' },
      { k: 'cashAvailable', label: 'Cash you can bring', unit: '$', hint: 'For auction day. Leave 0 for no limit.', quick: true, more: 'Most auctions want the full price in certified funds the same day or within a day. Your walk-away price never goes above what this cash covers, including any buyer’s premium.' },
    ],
  },
  {
    title: 'Buying it',
    fields: [
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.', more: 'Real property transfer tax is $2.55 for each $500 of value or fraction of $500 in Clark County. Some transfers are exempt; ask the Recorder or your title company.' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'Confirm with a title search.', quick: true },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$' },
      { k: 'possession', label: 'Getting possession', unit: '$', hint: 'Eviction attorney, relocation, locks.' },
    ],
  },
  {
    title: 'Fixing it up',
    fields: [
      { k: 'repairs', label: 'Repairs', unit: '$', hint: 'Often no inside look before an auction.', quick: true },
      { k: 'contingencyPct', label: 'Repair contingency', unit: '%', hint: 'A cushion for surprises.' },
    ],
  },
  {
    title: 'Holding and financing',
    redemption: true,
    fields: [
      { k: 'redemptionMonths', label: 'Redemption wait', unit: 'mo', hint: 'Hold off on repairs until it ends.', more: 'After some sales the former owner (and sometimes lenders) can buy the property back by repaying your price plus interest. Repairs you make before then are not repaid.' },
      { k: 'redemptionRatePct', label: 'Interest a redemption pays you', unit: '%/yr', hint: 'Set by the kind of sale.', when: (i) => i.redemptionMonths > 0 },
      { k: 'holdingMonths', label: 'Months to fix and sell', unit: 'mo', hint: 'After any redemption wait.', more: 'After a tax sale, resale may wait for a quiet title action or the 2-year window after the Treasurer’s deed (NRS 361.600).' },
      { k: 'monthlyCarry', label: 'Monthly holding costs', unit: '$', hint: 'Taxes, insurance, utilities, HOA.' },
      { k: 'financedPct', label: 'Share financed after purchase', unit: '%', hint: 'Auctions need cash on the day.' },
      { k: 'interestRatePct', label: 'Interest rate (yearly)', unit: '%', when: (i) => i.financedPct > 0 },
      { k: 'pointsPct', label: 'Lender points', unit: '%', when: (i) => i.financedPct > 0 },
    ],
  },
  {
    title: 'Selling it',
    fields: [{ k: 'sellingCostPct', label: 'Cost to sell', unit: '%', hint: 'Agent commission plus closing costs.' }],
  },
];

const MODE_KEY = 'fsf.bid.mode.v1';
const loadMode = (): 'quick' | 'detailed' => {
  try {
    return localStorage.getItem(MODE_KEY) === 'quick' ? 'quick' : 'detailed';
  } catch {
    return 'detailed';
  }
};

function load(id: string | undefined, defaults: BidInputs): BidInputs {
  if (!id) return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    const out = sanitizeInputs(saved, defaults);
    // Saved before the redemption wait had its own field: its months already include the wait.
    if (saved && typeof saved === 'object' && !('redemptionMonths' in saved)) return { ...out, redemptionMonths: 0, redemptionRatePct: 0, redemptionDaily: 0 };
    return out;
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

const yr = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}% a year`);
const unitText = (u: Field['unit']) => (u === '$/500' ? 'per $500' : u === 'mo' ? 'months' : u === '%/yr' ? '% a year' : '%');

export default function BidCalculator({ propertyId, defaults = START_INPUTS, openingBid, headingLevel = 3, commercial = false }: { propertyId?: string; defaults?: BidInputs; openingBid?: number | null; headingLevel?: 2 | 3; commercial?: boolean }) {
  const hintFor = (f: Field) => (commercial && f.k === 'exitValue' ? 'Use the value by income above.' : f.hint);
  const uid = useId();
  // The pinned walk-away bar (phones) steps aside once the full results are on screen, so it never covers them.
  const [resultsVisible, setResultsVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(`${uid}-results`);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [uid]);
  // The listing's opening bid is the starting point (older saved inputs didn't have it).
  const [i, setI] = useState<BidInputs>(() => {
    const v = load(propertyId, defaults);
    return !v.minimumBid && openingBid ? { ...v, minimumBid: openingBid } : v;
  });
  const [mode, setModeState] = useState<'quick' | 'detailed'>(loadMode);
  const setMode = (m: 'quick' | 'detailed') => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage unavailable */
    }
  };
  // What the person typed, so a field can be cleared while editing.
  const [draft, setDraft] = useState<Partial<Record<keyof BidInputs, string>>>({});
  const [bidText, setBidText] = useState<string>('');
  const bid = Math.min(toNum(bidText), 1e10);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const save = (next: BidInputs) => {
    if (!propertyId) return;
    try {
      localStorage.setItem(KEY(propertyId), JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };
  const update = (patch: Partial<BidInputs>) =>
    setI((cur) => {
      const next = { ...cur, ...patch };
      save(next);
      return next;
    });
  const set = (k: keyof BidInputs, text: string) => {
    trackAction('calculator_used', true);
    setDraft((d) => ({ ...d, [k]: text }));
    update({ [k]: clampInput(k, toNum(text)) });
  };
  const pickRule = (rule: RedemptionRule) => {
    const r = REDEMPTION_RULES[rule];
    setDraft((d) => ({ ...d, redemptionMonths: undefined, redemptionRatePct: undefined }));
    update({ redemptionMonths: r.months, redemptionRatePct: r.ratePct, redemptionDaily: r.daily });
  };
  const r = maxSafeBid(i);
  const grid = stressGrid(i);
  const slower = maxSafeBid({ ...i, holdingMonths: i.holdingMonths + 3 }).profitBid;
  const redeemed = redemptionOutcome(i, bid > 0 ? bid : r.maxBid);
  // No resale value yet (e.g. a listing with no estimate): ask for one instead of saying "no bid works".
  const needsValue = !(i.exitValue > 0);
  const atBid = bid > 0 ? costsAtBid(i, bid) : null;
  const profit = bid > 0 ? profitAtBid(i, bid) : null;
  const over = bid > 0 && bid > r.maxBid;
  const target = requiredProfit(i);
  const steps = maxBidSteps(i);
  const atOpening = i.minimumBid > 0 ? profitAtBid(i, i.minimumBid) : 0;
  // The deal itself fails at the opening bid, or only the cash you entered falls short of it.
  const dealFails = i.minimumBid > 0 && r.profitBid < i.minimumBid;
  const openingCash = i.minimumBid * (1 + i.buyerPremiumPct / 100);
  const cashShort = !dealFails && i.minimumBid > 0 && i.cashAvailable > 0 && i.cashAvailable < openingCash;
  const shown = (f: Field) => (mode === 'detailed' || f.quick) && (!f.when || f.when(i));

  return (
    <div className="calc">
      <div className="calc-inputs">
        <div className="calc-mode" role="group" aria-label="How many numbers to enter">
          <button type="button" aria-pressed={mode === 'quick'} className={mode === 'quick' ? 'on' : ''} onClick={() => setMode('quick')}>Quick</button>
          <button type="button" aria-pressed={mode === 'detailed'} className={mode === 'detailed' ? 'on' : ''} onClick={() => setMode('detailed')}>Detailed</button>
          <span className="small muted">{mode === 'quick' ? 'The deal, repairs and liens. Everything else uses the starting estimates.' : 'The deal first, then every cost in the order you’d meet it.'}</span>
        </div>
        {GROUPS.map((g) => {
          const fields = g.fields.filter(shown);
          if (!fields.length) return null;
          return (
            <fieldset key={g.title} className="calc-group">
              <legend>{g.title}</legend>
              {g.redemption && mode === 'detailed' && (
                <label className="calc-rule">
                  <span className="calc-label">Kind of sale</span>
                  <select value={ruleOf(i)} onChange={(e) => e.target.value !== 'custom' && pickRule(e.target.value as RedemptionRule)}>
                    {Object.entries(REDEMPTION_RULES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    {ruleOf(i) === 'custom' && <option value="custom">Your own numbers</option>}
                  </select>
                  <small className="muted">Fills in the redemption wait and interest. Confirm them in the sale’s official notice.</small>
                </label>
              )}
              <div className="calc-grid">
                {fields.map((f) => (
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
                      {f.unit !== '$' && <i aria-hidden>{unitText(f.unit)}</i>}
                    </span>
                    <span className="calc-hint">
                      {hintFor(f) && <small className="muted" id={`${uid}-${f.k}-hint`}>{hintFor(f)}</small>}
                      {f.more && (
                        <details className="calc-more">
                          <summary aria-label={`More about ${f.label}`}>?</summary>
                          <p className="small">{f.more}</p>
                        </details>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </fieldset>
          );
        })}
        {propertyId && (
          <button type="button" className="linkish" onClick={() => { try { localStorage.removeItem(KEY(propertyId)); } catch { /* ignore */ } setI(defaults); setDraft({}); }}>
            Reset to our starting estimates
          </button>
        )}
      </div>

      <div className="calc-results" id={`${uid}-results`}>
        {needsValue ? (
          <div className="calc-max" role="status">
            <span>Walk-away price</span>
            <strong>Enter a resale value</strong>
            <small>{propertyId ? 'We don’t estimate values for listings from the official list. ' : 'Start with the opening bid from the listing, then the costs. '}The resale value comes from recent sold prices of similar nearby properties, as they’d be after repairs.</small>
          </div>
        ) : (
          cashShort ? (
          <div className="calc-max bad" role="status">
            <span>Walk-away price</span>
            <strong>Not enough cash</strong>
            <small>You’d need at least {fmtMoney(Math.ceil(openingCash))} on auction day for the opening bid. The deal itself allows bids up to {fmtMoney(r.profitBid)}.</small>
          </div>
          ) : (
          <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
            <span>Walk-away price: stop bidding here</span>
            <strong>{r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
            <small>
              {r.noBidWorks
                ? 'Even at $0, costs leave less than your profit target. Walk away or change your plan.'
                : r.limitedBy === 'cash'
                  ? `Set by the cash you can bring. Your profit target alone would allow ${fmtMoney(r.profitBid)}.`
                  : `Leaves your ${fmtMoney(Math.round(target))} profit target after every cost, based on your numbers. Not a guarantee.`}
            </small>
          </div>
          )
        )}
        {!needsValue && i.minimumBid > 0 && (
          <div className={`calc-verdict ${dealFails || cashShort ? 'bad' : 'good'}`} role="status">
            {dealFails ? (
              <><strong>Doesn’t work at the opening bid.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, below your {fmtMoney(Math.round(target))} target. Skip this one or change your plan.</>
            ) : cashShort ? (
              <><strong>Your cash doesn’t cover the opening bid.</strong> The deal works (about {fmtMoney(Math.round(atOpening))} profit at {fmtMoney(i.minimumBid)}), but you’d need {fmtMoney(Math.ceil(openingCash))} on auction day and entered {fmtMoney(i.cashAvailable)}.</>
            ) : (
              <><strong>{fmtMoney(r.maxBid - i.minimumBid)} of room above the opening bid.</strong> The listing starts at {fmtMoney(i.minimumBid)}; stop at {fmtMoney(r.maxBid)}. At the opening bid your profit would be about {fmtMoney(Math.round(atOpening))}.</>
            )}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <div className="calc-steps">
            <strong>How we got your maximum</strong>
            <dl className="calc-kv">
              {steps.map((st, n) => <div key={st.label} className={n === 0 ? 'first' : ''}><dt>{st.label}</dt><dd>{n === 0 ? fmtMoney(st.amount) : `− ${fmtMoney(-st.amount)}`}</dd></div>)}
              <div className="total"><dt>{r.limitedBy === 'cash' ? 'Most the deal allows' : 'Your maximum bid'}</dt><dd>{fmtMoney(r.profitBid)}</dd></div>
            </dl>
            {r.limitedBy === 'cash' && <p className="small muted">The cash you can bring sets your walk-away price lower than this.</p>}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <dl className="calc-kv">
            <div><dt>Cash needed on auction day</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>
            <div><dt>Total cash in the deal</dt><dd>{fmtMoney(r.cashToStabilize)}</dd></div>
            <div><dt>Profit at this price</dt><dd>{fmtMoney(Math.round(r.profit))}</dd></div>
            <div><dt>Return on your cash, per year</dt><dd>{yr(r.yearlyReturn)}</dd></div>
            <div><dt>Break-even bid (zero profit)</dt><dd>{fmtMoney(r.breakEvenBid)}</dd></div>
          </dl>
        )}
        {!r.noBidWorks && !needsValue && r.yearlyReturn !== null && totalMonths(i) > 12 && (
          <p className="calc-note small">This deal ties up your cash for {Math.round(totalMonths(i))} months, so compare the return per year with your other options, not just the profit.</p>
        )}
        {redeemed && !needsValue && (
          <div className="calc-note">
            <strong>If the owner redeems</strong>
            <p className="small">
              At the end of the {Math.round(i.redemptionMonths)}-month wait you’d get back about {fmtMoney(Math.round(redeemed.repaid))} on a {fmtMoney(bid > 0 ? bid : r.maxBid)} bid. By then you’d have spent about {fmtMoney(Math.round(redeemed.spent))}, so you’d {redeemed.net >= 0 ? `come out about ${fmtMoney(Math.round(redeemed.net))} ahead` : `be about ${fmtMoney(Math.round(-redeemed.net))} short`}. Some rules also repay taxes and assessments you paid; repairs aren’t repaid.
            </p>
          </div>
        )}

        {!needsValue && (
        <>
        <div className="calc-field calc-bid">
          <label className="calc-label" htmlFor={`${uid}-bid`}>Check a bid</label>
          <span className="calc-input"><i aria-hidden>$</i><input id={`${uid}-bid`} type="number" inputMode="decimal" min={0} step="any" value={bidText} placeholder="e.g. a bid you expect to beat" onChange={(e) => { trackAction('calculator_used', true); setBidText(e.target.value); }} /></span>
        </div>
        {atBid && profit !== null && !needsValue && (
          <div className={`calc-verdict ${over ? 'bad' : 'good'}`} role="status">
            {over ? (
              <><strong>Above your walk-away price.</strong> At {fmtMoney(bid)} this deal no longer meets your {r.limitedBy === 'cash' && bid <= r.profitBid ? 'cash limit' : 'target'}. Profit would be {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}. Stop bidding.</>
            ) : (
              <><strong>Within your walk-away price.</strong> Estimated profit {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}.</>
            )}
          </div>
        )}
        {atBid && (
          <details className="calc-breakdown">
            <summary>Every cost at {fmtMoney(bid)}</summary>
            <dl className="calc-kv">
              {([
                ['Bid', atBid.bid], ["Buyer's premium", atBid.premium], ['Transfer tax', atBid.transferTax], ['Liens that stay', atBid.survivingLiens],
                ['Title, attorney, quiet title', atBid.titleLegal], ['Getting possession', atBid.possession], ['Repairs + contingency', atBid.repairs],
                ['Holding costs', atBid.holding], ['Financing', atBid.financing], ['Selling costs', atBid.selling],
              ] as const).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{fmtMoney(Math.round(v))}</dd></div>)}
              <div className="total"><dt>Total</dt><dd>{fmtMoney(Math.round(atBid.total))}</dd></div>
            </dl>
          </details>
        )}

        <H>If things go differently</H>
        <p className="small muted calc-grid-note">Highest bid that still meets your profit target if the resale value (rows) or repairs (columns) come in differently{i.cashAvailable > 0 ? ', before your cash limit' : ''}.</p>
        <div className="table-wrap">
          <table className="calc-stress calc-grid-table">
            <thead>
              <tr><th scope="col">Value \ Repairs</th>{GRID_REPAIR_STEPS.map((c) => <th key={c} scope="col" className="num">{c === 0 ? 'As entered' : `+${c}%`}</th>)}</tr>
            </thead>
            <tbody>
              {GRID_VALUE_STEPS.map((v, row) => (
                <tr key={v}>
                  <th scope="row">{v === 0 ? 'As entered' : v > 0 ? `+${v}%` : `−${-v}%`}</th>
                  {grid[row].map((m, col) => <td key={col} className={`num${v === 0 && GRID_REPAIR_STEPS[col] === 0 ? ' here' : ''}`}>{needsValue ? '—' : m > 0 ? fmtMoney(m) : 'None'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!needsValue && <p className="small">If it takes 3 months longer: <strong>{slower > 0 ? fmtMoney(slower) : 'no bid works'}</strong>.</p>}
        </>
        )}
        <p className="muted small">An estimate to help you set a limit before the sale, not advice. Replace every starting number with your own comps, bids and quotes.</p>
      </div>

      {/* On phones the results sit below every input, so keep the answer in view while typing. */}
      <button type="button" hidden={resultsVisible} className={`calc-sticky${r.noBidWorks ? ' bad' : ''}`} onClick={() => document.getElementById(`${uid}-results`)?.scrollIntoView({ behavior: 'smooth' })}>
        <span>Walk away at</span>
        <strong>{needsValue ? 'Enter a resale value' : cashShort ? 'Not enough cash' : r.noBidWorks ? 'No bid works' : fmtMoney(r.maxBid)}</strong>
        <span className="calc-sticky-go">See details ↓</span>
      </button>
    </div>
  );
}
