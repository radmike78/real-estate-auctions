import { calculatorInputError, midNumber, parseCalcInput } from './CalcFields';
import { useEffect, useState } from 'react';
import type { Deal } from '../lib/analyze';
import { flipBudget, flipBudgetLine, flipSaleLine, loadPacket, sameEvent, savedNumbers } from '../lib/dealPacket';
import { loadOwned, OWNED_EVENT, ownedSummary, saveOwned, type Owned } from '../lib/owned';
import { fmtMoney } from '../lib/status';
import { setDealHome, sidState, trackerAsksHome, certificateFirst, finishedDeal, liveIn, prettyDay, redeemingNow, setDealStage, stageOf, wayOf } from '../lib/dealStage';

/** The monthly cash flow the deal was bought on, from its Keep and rent numbers (null without them). */
export function projectedMonthly(d: Deal): number | null {
  const n = savedNumbers(d);
  if (n.rent) return n.rent.monthly;
  return null;
}

export function useOwned(): Record<string, Owned> {
  const [all, setAll] = useState(loadOwned);
  useEffect(() => {
    const on = () => setAll(loadOwned());
    window.addEventListener(OWNED_EVENT, on);
    return () => window.removeEventListener(OWNED_EVENT, on);
  }, []);
  return all;
}

/** "2027-01" -> "Jan 2027". */
const monthWords = (m: string) => (/^\d{4}-\d{2}$/.test(m) ? new Date(`${m}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : m);
const signed = (n: number) => `${n < 0 ? '−' : ''}${fmtMoney(Math.abs(Math.round(n)))}`;
// Today in this browser's own time zone (toISOString would give the UTC date, a day ahead in the evening).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** The purchase date from its packet (the closing, the deed or the sale), else today. */
function boughtDate(d: Deal): string {
  const rows = loadPacket(`analyzed:${d.id}`).dates.filter((x) => x.when && x.resolved && ['Closing', 'Deed recorded', 'Treasurer’s deed recorded', 'Certificate of sale recorded', 'Sale day'].some((n) => sameEvent(x.what, n)));
  const latest = rows.map((x) => x.when).sort().pop();
  return latest && latest <= today() ? latest : today();
}

/** A flip's sale, once it's at "Fixing and selling": the closing date and price, which finish the deal (its last task). */
function SoldForm({ o, put, deal }: { o: Owned; put: (next: Owned | null) => void; deal: Deal }) {
  const [on, setOn] = useState(o.sold?.on ?? today());
  const [price, setPrice] = useState(o.sold ? String(o.sold.price) : '');
  const p = parseCalcInput(price);
  // A misplaced comma ("430,00") would record a price ten times off: refused, as in the monthly form.
  const [priceFocus, setPriceFocus] = useState(false);
  const priceBad = price.trim() !== '' && !!calculatorInputError(price, '$');
  const priceWhy = price.trim() === '' ? 'Enter the sale price.' : priceBad ? (priceFocus && midNumber(price) ? 'Finish typing the price (commas only between thousands, like 430,000).' : 'Check the sale price: use commas only between thousands, like 430,000.') : !(p > 0) ? 'Enter the sale price.' : '';
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(on);
  // A closing that hasn't happened yet, or before you bought it, doesn't finish the deal.
  const dateWhy = !dateOk ? 'Enter the closing date.' : on > today() ? 'Record the sale once it has closed: the closing date can’t be in the future.' : on < o.boughtOn ? `The closing date can’t be before you bought it (${prettyDay(o.boughtOn)}).` : '';
  const ok = dateOk && !dateWhy && !priceBad && Number.isFinite(p) && p > 0;
  if (o.sold) return <p className="notice" id="owned-sold" tabIndex={-1} role="status">{flipSaleLine(deal) ?? `Sold on ${o.sold.on} for ${fmtMoney(o.sold.price)}.`} <button type="button" className="linkish" onClick={() => { const { sold: _sold, ...rest } = o; put(rest); setTimeout(() => document.getElementById('owned-sold-on')?.focus(), 0); }}>Undo</button></p>;
  return (
    <>
      <div className="row owned-add">
        <label className="field"><span>Sold on (closing date)</span><input id="owned-sold-on" type="date" value={on} max={today()} min={o.boughtOn} aria-describedby={dateWhy ? 'owned-sold-why' : undefined} onChange={(e) => setOn(e.target.value)} /></label>
        <label className="field"><span>Sale price ($)</span><input type="text" inputMode="decimal" value={price} aria-invalid={(priceBad && !(priceFocus && midNumber(price))) || undefined} aria-describedby={dateWhy || priceWhy ? 'owned-sold-why' : undefined} onFocus={() => setPriceFocus(true)} onBlur={() => setPriceFocus(false)} onChange={(e) => setPrice(e.target.value)} /></label>
        <button type="button" className="btn btn-secondary" disabled={!ok} onClick={() => { put({ ...o, sold: { on, price: p } }); setTimeout(() => document.getElementById('owned-sold')?.focus(), 0); }}>It sold: record the sale</button>
      </div>
      {(dateWhy || priceWhy) && <p className="muted small" id="owned-sold-why" role="status">{dateWhy || priceWhy}</p>}
    </>
  );
}

/**
 * After you buy: record each month's rent and costs, and see them against the cash flow you planned. The numbers you
 * bought on stay as they were; this shows how the property is really doing.
 */
export default function OwnedTracker({ deal }: { deal: Deal }) {
  const all = useOwned();
  const o = all[deal.id];
  const [month, setMonth] = useState(thisMonth);
  const [rent, setRent] = useState('');
  const [focusBox, setFocusBox] = useState<'rent' | 'costs' | null>(null);
  const [costs, setCosts] = useState('');
  const [note, setNote] = useState('');
  const projected = projectedMonthly(deal);
  const flip = deal.plan === 'flip';
  const budget = flipBudget(deal);
  const budgetLine = flipBudgetLine(deal);
  const put = (next: Owned | null) => {
    const copy = { ...all };
    if (next) copy[deal.id] = next;
    else delete copy[deal.id];
    saveOwned(copy);
  };
  // A finished deal (passed, or repaid) has nothing to track; an auction not yet won is answered on sale day.
  if (!o && redeemingNow(deal)) return <p className="muted">It was redeemed: nothing to track here. Keep the receipt for your payoff.</p>;
  if (!o && (stageOf(deal) === 'passed' || finishedDeal(deal))) return <p className="muted">{finishedDeal(deal) ? 'It was repaid: nothing more to track here.' : 'You passed on it: nothing to track here.'}</p>;
  if (!o && ['researching', 'offer'].includes(stageOf(deal)) && wayOf(deal) !== 'offer') return <p className="muted">Won it? Answer “did you win?” in Your next action above once the sale is over, and the steps after the sale appear here.</p>;
  if (!o && sidState(deal) === 'void') return <p className="muted">Not needed: the Treasurer said the sale is void.</p>;
  if (!o && stageOf(deal) === 'contract' && wayOf(deal) !== 'offer') return <p className="muted">Once you’ve paid and the {certificateFirst(deal) ? 'certificate of sale' : 'deed'} is {certificateFirst(deal) && deal.kind === 'irs' ? 'in hand' : 'recorded'}, mark it in Your next action above; then start tracking its costs here.</p>;
  if (!o) {
    // At Closed or later you did buy it: start tracking (not "did you buy it?").
    const bought = ['closed', 'owned'].includes(stageOf(deal));
    const ask = bought ? 'Start tracking it to' : 'Did you buy it? Mark it as yours to';
    return (
      <div>
        <p>{flip ? (budgetLine ? `${ask} record what you pay each month for repairs and holding, against your budget from Fix and flip. ${budgetLine}` : `${ask} record what you pay each month for repairs and holding, and compare it yourself with the repairs and holding costs under Fix and flip in Analyze.`) : liveIn(deal) ? `${bought ? 'Start tracking your home to' : 'Did you buy it? Mark it as your home to'} record what it really costs each month (and any rent from a room or unit), against what you planned.` : `${ask} track the real rent and costs each month against the cash flow you planned.`}</p>
        <button type="button" className="btn btn-secondary" onClick={() => { put({ boughtOn: boughtDate(deal), months: [] }); if (!['closed', 'owned'].includes(stageOf(deal))) setDealStage(deal.id, 'closed'); setTimeout(() => document.getElementById('owned-bought-on')?.focus(), 0); }}>{bought ? 'Start tracking it' : 'I bought this property'}</button>
      </div>
    );
  }
  // Redeemed and repaid: no more months to record; what was recorded stays for your taxes.
  if (finishedDeal(deal) && !o.sold) return <p className="notice" role="note">It was redeemed and you were repaid. The {o.months.length} {o.months.length === 1 ? 'month' : 'months'} you recorded stay here for your records and taxes.</p>;
  const s = ownedSummary(o, projected);
  const negative = parseCalcInput(rent) < 0 || parseCalcInput(costs) < 0;
  // A misplaced comma ("250,00") would record a number ten or a hundred times off, so it's refused, not guessed.
  const unreadable = !negative && [rent, costs].some((t) => t.trim() !== '' && !!calculatorInputError(t, '$'));
  // Each box's message waits while you're still typing a comma number in it ("1,25" on the way to 1,250).
  const showBad = (t: string, box: 'rent' | 'costs') => t.trim() !== '' && !!calculatorInputError(t, '$') && !(focusBox === box && midNumber(t));
  const add = () => {
    const r = parseCalcInput(rent);
    const c = parseCalcInput(costs);
    if (unreadable || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < o.boughtOn.slice(0, 7) || !Number.isFinite(r) || !Number.isFinite(c) || r < 0 || c < 0) return;
    // (Saved: the cursor goes back to the month, for the next one.)
    setTimeout(() => document.getElementById('owned-month')?.focus(), 0);
    put({ ...o, months: [{ month, rent: Math.max(0, r), costs: Math.max(0, c), note: note.slice(0, 200) }, ...o.months.filter((m) => m.month !== month)].sort((a, b) => b.month.localeCompare(a.month)) });
    setRent('');
    setCosts('');
    setNote('');
    // Move on to the month after the one just added, so the next entry doesn't replace it.
    const [y, mo] = month.split('-').map(Number);
    setMonth(mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`);
  };
  // A home whose recorded rent now covers its costs: ask whether you still live there (never switch it on its own).
  const rentCovers = trackerAsksHome(deal);
  return (
    <div>
      {/^\d{4}-\d{2}$/.test(month) && month < o.boughtOn.slice(0, 7) && <p className="caution" role="note">That month is before you bought it ({prettyDay(o.boughtOn)}): pick a later month.</p>}
      {o.months.some((m) => m.month < o.boughtOn.slice(0, 7)) && <p className="caution" role="note">{o.months.filter((m) => m.month < o.boughtOn.slice(0, 7)).map((m) => monthWords(m.month)).join(', ')} {o.months.filter((m) => m.month < o.boughtOn.slice(0, 7)).length === 1 ? 'is' : 'are'} before the date you bought it ({prettyDay(o.boughtOn)}): remove {o.months.filter((m) => m.month < o.boughtOn.slice(0, 7)).length === 1 ? 'it' : 'them'} or check the date.</p>}
      {!rentCovers && deal.home === 'live' && deal.homeFrom !== 'plan' && s.months > 0 && s.rent > 0 && s.rent >= s.costs && <p className="muted small">Rent now covers this home’s costs. Still your home? You can change it under “Your plan and buy box”.</p>}
      {rentCovers && (
        <fieldset className="packet-fit">
          <legend>Rent now covers this home’s costs. Do you still live there?</legend>
          <label className="check"><input type="radio" name={`still-home-${deal.id}`} onChange={() => { setDealHome(deal.id, 'live'); setTimeout(() => { const h = document.getElementById('packet-owned'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }, 0); }} /> Yes, it’s my home</label>
          <label className="check"><input type="radio" name={`still-home-${deal.id}`} onChange={() => { setDealHome(deal.id, 'rent'); setTimeout(() => { const h = document.getElementById('packet-owned'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }, 0); }} /> No, it’s a rental now</label>
        </fieldset>
      )}
      {!o.sold && <p className="muted">{flip ? (budgetLine ?? 'Record what you pay each month, with $0 rent, and compare it yourself with the repairs and holding costs under Fix and flip in Analyze.') : liveIn(deal) && projected === null ? 'Record what your home costs each month (and any rent from a room or unit). Save its numbers in Analyze to compare with your plan.' : projected === null ? 'Renting it out? Save this deal’s numbers in Buy and hold to compare each month with your plan. Fixing it to sell? Record what you pay each month, with $0 rent.' : liveIn(deal) ? `You planned on about ${signed(-projected)} a month to live there (after any rent you collect).` : `You planned on ${signed(projected)} a month of cash flow.`}</p>}
      {o.sold ? <p className="muted">Bought on {prettyDay(o.boughtOn)}. Sold: the months you recorded are below.</p> : <div className="row owned-add">
        <label className="field"><span>Bought on</span><input id="owned-bought-on" type="date" value={o.boughtOn} max={today()} onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && put({ ...o, boughtOn: e.target.value })} /></label>
        <label className="field"><span>Month</span><input id="owned-month" type="month" value={month} min={o.boughtOn.slice(0, 7)} onChange={(e) => setMonth(e.target.value)} /></label>
        <label className="field"><span>{liveIn(deal) ? 'Rent from a room or unit ($)' : 'Rent collected ($)'}</span><input type="text" inputMode="decimal" value={rent} aria-invalid={showBad(rent, 'rent') || undefined} onFocus={() => setFocusBox('rent')} onBlur={() => setFocusBox(null)} onChange={(e) => setRent(e.target.value)} /></label>
        <label className="field"><span>Everything you paid ($)</span><input type="text" inputMode="decimal" value={costs} aria-invalid={showBad(costs, 'costs') || undefined} onFocus={() => setFocusBox('costs')} onBlur={() => setFocusBox(null)} onChange={(e) => setCosts(e.target.value)} /></label>
        <label className="field"><span>Note (optional)</span><input type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. water heater replaced" /></label>
        <button type="button" className="btn" disabled={rent === '' || costs === '' || negative || unreadable || month < o.boughtOn.slice(0, 7)} onClick={add}>{o.months.some((m) => m.month === month) ? 'Replace this month' : 'Add month'}</button>
      </div>}
      {(showBad(rent, 'rent') || showBad(costs, 'costs')) && <p className="caution small" role="status">Check the rent and costs: use commas only between thousands, like 1,250.</p>}
      {negative && <p className="caution small" role="alert">Enter rent and costs as $0 or more. Record a refund to a tenant as a cost.</p>}
      {!o.sold && <p className="small muted">Count everything you paid that month: the loan, taxes, insurance, HOA, repairs, management and utilities, and any money you moved into your repair savings.</p>}
      {s.months > 0 ? (
        <>
          <dl className="calc-kv">
            <div><dt>Months recorded</dt><dd>{s.months}</dd></div>
            <div><dt>{liveIn(deal) ? 'What it cost, in total (after any rent)' : 'Actual cash flow, in total'}</dt><dd>{liveIn(deal) && s.actual > 0 ? `${fmtMoney(Math.round(s.actual))} to spare` : signed(liveIn(deal) ? -s.actual : s.actual)}</dd></div>
            <div><dt>{liveIn(deal) ? 'Average cost a month' : 'Average month'}</dt><dd>{liveIn(deal) && s.averageMonthly > 0 ? `${fmtMoney(Math.round(s.averageMonthly))} to spare` : signed(liveIn(deal) ? -s.averageMonthly : s.averageMonthly)}</dd></div>
            {flip && budget && <div><dt>Paid so far, against your {fmtMoney(Math.round(budget.total))} budget</dt><dd>{fmtMoney(Math.round(s.costs))} {s.costs > budget.total ? `(${fmtMoney(Math.round(s.costs - budget.total))} over)` : `(${fmtMoney(Math.round(budget.total - s.costs))} left)`}</dd></div>}
            {s.gapMonthly !== null && <div><dt>Against your plan, a month</dt><dd>{signed(s.gapMonthly)} {s.gapMonthly < 0 ? '(behind)' : '(ahead)'}</dd></div>}
          </dl>
          {s.gapMonthly !== null && s.gapMonthly < -50 && <p className="caution small" role="note">{liveIn(deal) ? 'It’s costing more than you planned. Look at which costs ran over and whether your savings can carry it.' : <>It’s earning less than you planned. Look at which costs ran over, whether the rent matches new leases nearby, and whether your repair savings can carry it. Review it before you buy the next one.</>}</p>}
          <table className="lesson-table owned-table">
            <thead><tr><th>Month</th><th>Rent</th><th>Paid</th><th>{liveIn(deal) ? 'After rent' : 'Cash flow'}</th><th>Note</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {o.months.map((m) => (
                <tr key={m.month}>
                  <td data-label="Month">{monthWords(m.month)}</td><td data-label="Rent">{fmtMoney(m.rent)}</td><td data-label="Paid">{fmtMoney(m.costs)}</td><td data-label={liveIn(deal) ? 'After rent' : 'Cash flow'}>{liveIn(deal) ? (m.rent > m.costs ? `${fmtMoney(m.rent - m.costs)} to spare` : `${fmtMoney(m.costs - m.rent)} cost`) : signed(m.rent - m.costs)}</td><td data-label={m.note ? 'Note' : ''}>{m.note}</td>
                  <td><button type="button" className="linkish" aria-label={`Remove ${monthWords(m.month)}`} onClick={() => put({ ...o, months: o.months.filter((x) => x.month !== m.month) })}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>{flip ? 'No months recorded yet. Add the first month’s costs, with $0 rent.' : liveIn(deal) ? 'No months recorded yet. After your first full month in the home, add what it cost, plus any rent from a room or unit (or $0).' : 'No months recorded yet. Add the first one when the rent comes in.'}</p>
      )}
      {flip && stageOf(deal) === 'owned' && (
        <>
          <h3 className="owned-sold-head">Sold it?</h3>
          <SoldForm o={o} put={put} deal={deal} />
        </>
      )}
      {!o.sold && <p><button type="button" className="linkish" onClick={() => { if (!window.confirm('Stop tracking this property, delete its monthly records and move it back to before closing?')) return; put(null); if (['closed', 'owned'].includes(stageOf(deal))) setDealStage(deal.id, 'contract'); }}>I didn’t buy it, stop tracking</button></p>}
    </div>
  );
}
