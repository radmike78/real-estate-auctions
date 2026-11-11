import OwlNote from './OwlNote';
import { calculatorInputError, midNumber, parseCalcInput } from './CalcFields';
import { useEffect, useRef, useState } from 'react';
import type { Deal } from '../lib/analyze';
import { flipBudget, flipBudgetLine, flipSaleLine, loadPacket, sameDate, sameEvent, savedNumbers } from '../lib/dealPacket';
import { loadOwned, OWNED_EVENT, ownedSummary, saveOwned, type Owned } from '../lib/owned';
import { fmtMoney } from '../lib/status';
import { firstFullMonth, setDealHome, sidState, trackerAsksHome, certificateFirst, finishedDeal, liveIn, prettyDay, redeemingNow, setDealStage, stageOf, wayOf } from '../lib/dealStage';

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
    window.addEventListener('storage', on);
    return () => { window.removeEventListener(OWNED_EVENT, on); window.removeEventListener('storage', on); };
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

/** The purchase date from its packet (the closing, the deed or the sale), else today. */
/** The earliest finished month (from the purchase on) not yet recorded; '' when every one is in. */
function openMonth(o?: Owned): string {
  const t = new Date();
  const l = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const lm = `${l.getFullYear()}-${String(l.getMonth() + 1).padStart(2, '0')}`;
  const b = o?.boughtOn?.slice(0, 7) ?? '';
  if (!o || !/^\d{4}-\d{2}$/.test(b)) return lm;
  if (b > lm) return ''; // bought this month: nothing is over yet (the note says when)
  for (let [y, m] = firstFullMonth(o), i = 0; i < 1200; i++) {
    const k = `${y}-${String(m).padStart(2, '0')}`;
    if (k > lm) break;
    if (!o.months.some((x) => x.month === k)) return k;
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return '';
}

function boughtDate(d: Deal): string {
  // An auction: you bought it when you paid (the money went in at the sale, not when the deed came).
  if (wayOf(d) !== 'offer') { const pk = loadPacket(`analyzed:${d.id}`); const paid = pk.dates.filter((x) => x.when && x.resolved && sameDate(x.what, 'Payment deadline')).map((x) => x.when).sort().pop() ?? pk.dates.find((x) => x.when && sameEvent(x.what, 'Sale day'))?.when; if (paid && paid <= today()) return paid; }
  const rows = loadPacket(`analyzed:${d.id}`).dates.filter((x) => x.when && (x.resolved || sameEvent(x.what, 'Closing')) && ['Closing', 'Deed recorded', 'Treasurer’s deed recorded', 'Certificate of sale recorded', 'Sale day'].some((n) => sameEvent(x.what, n)));
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
  if (o.sold) return <p className="notice" id="owned-sold" tabIndex={-1} role="status">{flipSaleLine(deal) ?? `Sold on ${o.sold.on} for ${fmtMoney(o.sold.price)}.`} <button type="button" className="linkish" onClick={() => { const { sold: _sold, ...rest } = o; put(rest); setTimeout(() => document.getElementById('owned-sold-on')?.focus(), 0); }}>Undo the sale</button></p>;
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
  // (It opens on the earliest finished month not yet recorded, so an entry never replaces one by accident.)
  const [month, setMonth] = useState(() => openMonth(o));
  // (A month the reader picked by hand, to change it, stays put when another tab records a month.)
  const pickedMonth = useRef(false);
  // (A flip collects no rent: it starts at 0.)
  const [rent, setRent] = useState(deal.plan === 'flip' ? '0' : '');
  // Tracking just started (or the purchase date moved later): the month can't be before the purchase.
  useEffect(() => { const b = o?.boughtOn?.slice(0, 7); if (b && (!month || month < b)) setMonth(openMonth(o)); }, [o?.boughtOn]);
  // The latest month you can record: last month (a month counts once it's over).
  const maxMonth = (() => { const t = new Date(); const l = new Date(t.getFullYear(), t.getMonth() - 1, 1); return `${l.getFullYear()}-${String(l.getMonth() + 1).padStart(2, '0')}`; })();
  const [focusBox, setFocusBox] = useState<'rent' | 'costs' | null>(null);
  const [costs, setCosts] = useState('');
  const [note, setNote] = useState('');
  // Another tab recorded the month shown here: move on to the next open month, unless you've started typing.
  useEffect(() => { if (o && month && !pickedMonth.current && o.months.some((m) => m.month === month) && costs === '' && note === '' && (rent === '' || rent === (deal.plan === 'flip' ? '0' : ''))) setMonth(openMonth(o)); }, [o?.months.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const projected = projectedMonthly(deal);
  const flip = deal.plan === 'flip';
  const budget = flipBudget(deal);
  const budgetLine = flipBudgetLine(deal);
  const put = (next: Owned | null) => {
    // (From storage now, not this page's copy: another tab may have recorded another property since.)
    const copy = { ...loadOwned() };
    if (next) copy[deal.id] = next;
    else delete copy[deal.id];
    saveOwned(copy);
  };
  // A finished deal (passed, or repaid) has nothing to track; an auction not yet won is answered on sale day.
  if (!o && redeemingNow(deal)) return <p className="muted">It was redeemed: nothing to track here. Keep the receipt for your payoff.</p>;
  if (sidState(deal) === 'void') return <p className="muted">Not needed: the sale is void.</p>;
  if (!o && (stageOf(deal) === 'passed' || finishedDeal(deal))) return <p className="muted">{finishedDeal(deal) ? 'It was repaid: nothing more to track here.' : 'You passed on it: nothing to track here.'}</p>;
  if (!o && ['researching', 'offer'].includes(stageOf(deal)) && wayOf(deal) !== 'offer') return <p className="muted">Won it? Answer “did you win?” in Your next action above once the sale is over, and the steps after the sale appear here.</p>;
  if (!o && stageOf(deal) === 'contract' && wayOf(deal) !== 'offer') return <p className="muted">Once you’ve paid and the {certificateFirst(deal) ? 'certificate of sale' : 'deed'} is {certificateFirst(deal) && deal.kind === 'irs' ? 'in hand' : 'recorded'}, mark it in Your next action above; then start tracking its costs here.</p>;
  // An offer before it's under contract: nothing is bought yet.
  if (!o && ['researching', 'offer'].includes(stageOf(deal)) && wayOf(deal) === 'offer') return <p className="muted">Once your offer is accepted and it closes, start tracking it here.</p>;
  if (!o) {
    // At Closed or later you did buy it: start tracking (not "did you buy it?").
    const bought = ['closed', 'owned'].includes(stageOf(deal));
    const ask = bought ? 'Start tracking it to' : 'Did you buy it? Mark it as yours to';
    return (
      <div>
        <p>{flip ? (budgetLine ? `${ask} record what you pay each month for repairs and holding, against your budget from Fix and flip. ${budgetLine}` : `${ask} record what you pay each month for repairs and holding, and compare it yourself with the repairs and holding costs under Fix and flip in Analyze.`) : liveIn(deal) ? `${bought ? 'Start tracking your home to' : 'Did you buy it? Mark it as your home to'} record what it really costs each month (and any rent from a room or unit), against what you planned.` : `${ask} track the real rent and costs each month against the cash flow you planned.`}</p>
        <button type="button" className="btn btn-secondary" onClick={() => { { const start = { boughtOn: boughtDate(deal), months: [] }; put(start); setMonth(openMonth(start as Owned)); } if (!['closed', 'owned'].includes(stageOf(deal))) setDealStage(deal.id, 'closed'); setTimeout(() => document.getElementById('owned-bought-on')?.focus(), 0); }}>{bought ? 'Start tracking it' : 'I bought this property'}</button>
      </div>
    );
  }
  // Redeemed and repaid: no more months to record; what was recorded stays for your taxes.
  if (finishedDeal(deal) && !o.sold) return <p className="notice" role="note">It was redeemed and you were repaid. The {o.months.length} {o.months.length === 1 ? 'month' : 'months'} you recorded stay here for your records and taxes.</p>;
  const s = ownedSummary(o, projected);
  // (Rent recorded on a flip before it had no rent box: still shown, so the totals add up.)
  const flipRent = flip && o.months.some((m) => m.rent > 0);
  // (A flip has no rent box: it records $0, even if the plan changed in another tab.)
  const rentIn = flip ? '0' : rent;
  const negative = parseCalcInput(rentIn) < 0 || parseCalcInput(costs) < 0;
  // A misplaced comma ("250,00") would record a number ten or a hundred times off, so it's refused, not guessed.
  const unreadable = !negative && [rentIn, costs].some((t) => t.trim() !== '' && !!calculatorInputError(t, '$'));
  // Each box's message waits while you're still typing a comma number in it ("1,25" on the way to 1,250).
  const showBad = (t: string, box: 'rent' | 'costs') => t.trim() !== '' && !!calculatorInputError(t, '$') && !(focusBox === box && midNumber(t));
  const add = () => {
    const r = parseCalcInput(rentIn);
    const c = parseCalcInput(costs);
    if (unreadable || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < o.boughtOn.slice(0, 7) || month > maxMonth || !Number.isFinite(r) || !Number.isFinite(c) || r < 0 || c < 0) return;
    // (Saved: the cursor goes back to the month, for the next one.)
    const nextO = { ...o, months: [{ month, rent: Math.max(0, r), costs: Math.max(0, c), note: note.slice(0, 200) }, ...o.months.filter((m) => m.month !== month)].sort((a, b) => b.month.localeCompare(a.month)) };
    // (Every finished month in: focus goes to the line that says so, not an empty box.)
    setTimeout(() => document.getElementById(openMonth(nextO) ? 'owned-month' : 'owned-all-in')?.focus(), 0);
    put(nextO);
    setRent(deal.plan === 'flip' ? '0' : '');
    setCosts('');
    setNote('');
    // Move on to the next finished month not yet recorded, so the next entry doesn't replace one.
    // (Every finished month is in: the month box empties until the next one ends.)
    pickedMonth.current = false;
    setMonth(openMonth(nextO));
  };
  // A home whose recorded rent now covers its costs: ask whether you still live there (never switch it on its own).
  const rentCovers = trackerAsksHome(deal);
  return (
    <div>
      {/^\d{4}-\d{2}$/.test(month) && month > maxMonth && <p className="caution" role="note">That month isn’t over yet: record it once it ends.</p>}
      {month === '' && !o.sold && <p className="muted" id="owned-all-in" tabIndex={-1} role="status">{o.months.length ? 'Every finished month is recorded. Come back once this month ends, or pick an earlier month to change it.' : `Your first full month ends ${prettyDay((() => { const [y, m] = firstFullMonth(o); const t = new Date(y, m, 0); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; })())}. Come back after that to record what it ${liveIn(deal) || deal.plan === 'flip' ? 'cost' : 'brought in and cost'}${Number(o.boughtOn.slice(8, 10)) > 1 ? `, including what you paid from ${prettyDay(o.boughtOn)}` : ''}.`}</p>}
      {wayOf(deal) !== 'offer' && (() => { const s = loadPacket(`analyzed:${deal.id}`).dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when; return s && o.boughtOn < s ? <p className="caution" role="note">You bought it at the {prettyDay(s)} sale: check the Bought on date.</p> : null; })()}
      {!o.months.length && !o.sold && Number(o.boughtOn.slice(8, 10)) > 1 && month === `${firstFullMonth(o)[0]}-${String(firstFullMonth(o)[1]).padStart(2, '0')}` && <p className="muted" role="note">Include what you paid from {prettyDay(o.boughtOn)} in this first full month.</p>}
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
      {!o.sold && <p className="muted">{flip ? (budgetLine ?? 'Record what you pay each month, and compare it yourself with the repairs and holding costs under Fix and flip in Analyze.') : liveIn(deal) && projected === null ? 'Record what your home costs each month (and any rent from a room or unit). Save its numbers in Analyze to compare with your plan.' : projected === null ? 'Renting it out? Save this deal’s numbers in Buy and hold to compare each month with your plan. Fixing it to sell? Record what you pay each month, with $0 rent.' : liveIn(deal) ? `You planned on about ${signed(-projected)} a month to live there${savedNumbers(deal).rent?.noRent ? '' : ' (after any rent you collect)'}${(savedNumbers(deal).rent?.mi ?? 0) > 0 ? `, before mortgage insurance (about ${fmtMoney(Math.round(savedNumbers(deal).rent!.mi))} a month more)` : ''}.` : `You planned on ${signed(projected)} a month of cash flow.`}</p>}
      {o.sold ? <p className="muted">Bought on {prettyDay(o.boughtOn)}. Sold: the months you recorded are below.</p> : <div className="row owned-add">
        <label className="field"><span>Bought on</span><input id="owned-bought-on" type="date" value={o.boughtOn} max={today()} onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && put({ ...o, boughtOn: e.target.value })} /></label>
        {month === '' && !o.months.length ? null : <>
        <label className="field"><span>Month</span><input id="owned-month" type="month" value={month} min={o.boughtOn.slice(0, 7)} max={maxMonth} onChange={(e) => { pickedMonth.current = true; setMonth(e.target.value); }} /></label>
        {!flip && <label className="field"><span>{liveIn(deal) ? 'Rent you collected ($)' : 'Rent collected ($)'}</span><input type="text" inputMode="decimal" value={rent} aria-invalid={showBad(rent, 'rent') || undefined} onFocus={() => setFocusBox('rent')} onBlur={() => setFocusBox(null)} onChange={(e) => setRent(e.target.value)} /></label>}
        <label className="field"><span>Everything you paid ($)</span><input type="text" inputMode="decimal" value={costs} aria-invalid={showBad(costs, 'costs') || undefined} onFocus={() => setFocusBox('costs')} onBlur={() => setFocusBox(null)} onChange={(e) => setCosts(e.target.value)} /></label>
        <label className="field"><span>Note (optional)</span><input type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. water heater replaced" /></label>
        <button type="button" className="btn" disabled={rentIn === '' || costs === '' || negative || unreadable || month < o.boughtOn.slice(0, 7) || month > maxMonth} onClick={add}>{o.months.some((m) => m.month === month) ? 'Replace this month' : 'Add month'}</button>
        {month !== '' && (rentIn === '' || costs === '') && <span className="muted small owned-missing">{flip ? 'Enter what you paid.' : 'Enter the rent (0 if none) and what you paid.'}</span>}
        </>}
      </div>}
      {(showBad(rent, 'rent') || showBad(costs, 'costs')) && <p className="caution small" role="status">Check the rent and costs: use commas only between thousands, like 1,250.</p>}
      {negative && <p className="caution small" role="alert">Enter rent and costs as $0 or more. Record a refund to a tenant as a cost.</p>}
      {!o.sold && <p className="small muted">{liveIn(deal) ? 'Count what you paid that month for the loan, taxes, insurance and HOA. Leave out utilities, repairs and repair savings, so it compares with Analyze’s monthly cost. Rent: only what a room or unit you rent out brought in.' : 'Count everything you paid that month: the loan, taxes, insurance, HOA, repairs, management and utilities, and any money you moved into your repair savings.'}</p>}
      {s.months > 0 ? (
        <>
          <dl className="calc-kv">
            <div><dt>Months recorded</dt><dd>{s.months}</dd></div>
            <div><dt>{flip ? 'Paid, in total' : liveIn(deal) ? (s.actual > 0 ? 'Left over, in total (after rent)' : (o.months.some((m) => m.rent > 0) ? 'What it cost, in total (after any rent)' : 'What it cost, in total')) : 'Actual cash flow, in total'}</dt><dd>{flip ? fmtMoney(Math.round(s.costs)) : liveIn(deal) && s.actual > 0 ? fmtMoney(Math.round(s.actual)) : signed(liveIn(deal) ? -s.actual : s.actual)}</dd></div>
            <div><dt>{flip ? 'Paid, average month' : liveIn(deal) ? (s.averageMonthly > 0 ? 'Left over, average month' : 'Average cost a month') : 'Average month'}</dt><dd>{flip ? fmtMoney(Math.round(s.months ? s.costs / s.months : 0)) : liveIn(deal) && s.averageMonthly > 0 ? fmtMoney(Math.round(s.averageMonthly)) : signed(liveIn(deal) ? -s.averageMonthly : s.averageMonthly)}</dd></div>
            {flip && budget && <div><dt>Paid so far, against your {fmtMoney(Math.round(budget.total))} budget</dt><dd>{fmtMoney(Math.round(s.costs))} {s.costs > budget.total ? `(${fmtMoney(Math.round(s.costs - budget.total))} over)` : `(${fmtMoney(Math.round(budget.total - s.costs))} left)`}</dd></div>}
            {s.gapMonthly !== null && <div><dt>Against your plan, a month</dt><dd>{signed(s.gapMonthly)} {s.gapMonthly < 0 ? '(behind)' : '(ahead)'}</dd></div>}
          </dl>
          {s.gapMonthly !== null && s.gapMonthly < -50 && <p className="caution small" role="note">{liveIn(deal) ? 'It’s costing more than you planned. Look at which costs ran over and whether your savings can carry it.' : <>It’s earning less than you planned. Look at which costs ran over, whether the rent matches new leases nearby, and whether your repair savings can carry it. Review it before you buy the next one.</>}</p>}
          <table className="lesson-table owned-table">
            <thead><tr><th>Month</th>{(!flip || flipRent) && <th>Rent</th>}<th>Paid</th>{!flip && <th>{liveIn(deal) ? 'After rent' : 'Cash flow'}</th>}<th>Note</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {o.months.map((m) => (
                <tr key={m.month}>
                  <td data-label="Month">{monthWords(m.month)}</td>{(!flip || flipRent) && <td data-label="Rent">{fmtMoney(m.rent)}</td>}<td data-label="Paid">{fmtMoney(m.costs)}</td>{!flip && <td data-label={liveIn(deal) ? 'After rent' : 'Cash flow'}>{liveIn(deal) ? (m.rent > m.costs ? `${fmtMoney(m.rent - m.costs)} to spare` : `${fmtMoney(m.costs - m.rent)} cost`) : signed(m.rent - m.costs)}</td>}<td data-label={m.note ? 'Note' : ''}>{m.note}</td>
                  <td><button type="button" className="linkish" aria-label={`Remove ${monthWords(m.month)}`} onClick={() => put({ ...o, months: o.months.filter((x) => x.month !== m.month) })}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        month === '' && !o.months.length ? null : <OwlNote>{flip ? 'No months recorded yet. Add the first month’s costs.' : liveIn(deal) ? 'No months recorded yet. After your first full month in the home, add what it cost, plus any rent from a room or unit (or $0).' : 'No months recorded yet. Add the first one when the rent comes in.'}</OwlNote>
      )}
      {flip && stageOf(deal) === 'owned' && (
        <>
          <h3 className="owned-sold-head">Sold it?</h3>
          <SoldForm o={o} put={put} deal={deal} />
        </>
      )}
      {!o.sold && o.months.length === 0 && stageOf(deal) !== 'owned' && <p><button type="button" className="linkish" onClick={() => { if (!window.confirm('Stop tracking this property, delete its monthly records and move it back to before closing?')) return; put(null); if (['closed', 'owned'].includes(stageOf(deal))) setDealStage(deal.id, 'contract'); }}>I didn’t buy it, stop tracking</button></p>}
    </div>
  );
}
