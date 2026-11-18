import { clearsOnPostpone, loadPacket, sameDate, type PacketData } from '../lib/dealPacket';
import { dayOf, DEED_ROWS, prettyDay, setDealStage, type PlanTask, withRow } from '../lib/dealStage';
import { loadDeals } from '../lib/analyze';
import { markDealStepDone } from '../lib/roadmapState';

/**
 * A task's answer buttons (the packet and My plan): mark a date row handled, or move the deal on ("I won", "It was
 * redeemed"). `edit` changes the deal's packet; `after` puts the cursor on what comes next.
 */
// (Today in the deal's state, so a date recorded from Tokyo is still Nevada's day.)
const todayFor = (dealId: string) => dayOf(loadDeals().find((x) => x.id === dealId), new Date());

export default function TaskActions({ task, dealId, edit, after, big = false }: { task: PlanTask; dealId: string; edit: (f: (p: PacketData) => PacketData) => void; after: (el: HTMLElement, finished?: boolean) => void; big?: boolean }) {
  // The answer that moves the deal on is the main button when the task is a question.
  const main = `btn${big ? ' big' : ''}`;
  const tick = task.tick;
  const add = task.advance2?.addRow;
  return (
    <>
      {task.redate && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const r = task.redate!; edit((p) => ({ ...p, dates: p.dates.some((x) => sameDate(x.what, r.row)) ? p.dates.map((x) => (sameDate(x.what, r.row) ? { ...x, what: r.as ?? x.what, when: r.when, who: x.who || r.who || '', resolved: false } : x)) : [...p.dates, { what: r.as ?? r.row, when: r.when, who: r.who ?? '' }] })); after(el); }}>{task.redate.label}</button>
      )}
      {tick && (
        <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => {
          const el = e.currentTarget;
          edit((p) => {
            // (The row the reminder named, exactly; else the first open row of that kind.)
            const exact = p.dates.findIndex((x) => x.what === tick.row && !x.resolved);
            const i = exact >= 0 ? exact : p.dates.findIndex((x) => sameDate(x.what, tick.row) && !x.resolved);
            // (An event with no date yet, such as the payoff, is dated today.)
            const rows = i < 0 ? (p.dates.some((x) => sameDate(x.what, tick.row)) ? p.dates : [...p.dates, { what: tick.row, when: tick.when ?? (tick.noDate ? '' : todayFor(dealId)), who: tick.who ?? '', resolved: true }]) : p.dates.map((x, j) => (j === i ? { ...x, resolved: true, when: tick.setWhen || x.when || tick.when || (tick.noDate ? '' : todayFor(dealId)), who: x.who || tick.who || '' } : x));
            const kept = tick.drops ? rows.filter((x) => !(sameDate(x.what, tick.drops!) && !x.when)) : rows;
            return { ...p, dates: tick.closes ? kept.map((x) => (sameDate(x.what, tick.closes!) ? { ...x, resolved: true } : x)) : kept };
          });
          if (tick.step) markDealStepDone(`analyzed:${dealId}`, tick.step);
          if (tick.then) setDealStage(dealId, tick.then);
          after(el, tick.then === 'passed');
        }}>{tick.label}</button>
      )}
      {task.advance && <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const ticks = task.advance!.ticks; const who = task.advance!.tickWho ?? ''; const on = task.advance!.tickWhen ?? todayFor(dealId); /* (A recording row already dated as expected: the windows count from the real recording day, so ask which it is.) */ const dk = loadDeals().find((x) => x.id === dealId); const deedNames = dk?.state === 'NV' && dk.kind === 'trustee' ? DEED_ROWS.trustee : dk?.state === 'NV' && dk.kind === 'taxSale' ? DEED_ROWS.tax : []; const exp = ticks?.length ? loadPacket(`analyzed:${dealId}`).dates.find((x) => ticks.some((n) => sameDate(x.what, n)) && deedNames.some((r) => sameDate(x.what, r)) && !!x.when && !x.resolved && x.when !== on) : undefined; const later = !!exp && exp.when > on; if (exp && !window.confirm(later ? `The date in Key dates for “${exp.what}” (${prettyDay(exp.when)}) is after today. If it was recorded today (${prettyDay(on)}), choose OK. If it isn’t recorded yet, choose Cancel and mark it once it is.` : `Was it recorded on ${prettyDay(exp.when)}, the date in Key dates for “${exp.what}”? ${dk?.kind === 'trustee' ? 'The 30-day challenge window counts from the recording day.' : 'The 2-year recovery-suit window’s earliest end is worked out from the recording day.'} Choose OK if so, or Cancel to enter the actual recording date in Key dates first.`)) return; if (ticks?.length) edit((p) => { const has = p.dates.some((x) => sameDate(x.what, ticks[0])); const rows = p.dates.map((x) => (ticks.some((n) => sameDate(x.what, n)) ? { ...x, resolved: true, when: (later && exp && x.what === exp.what) || (!!x.when && x.when > on) ? on : x.when || on, who: x.who || who } : x)); return { ...p, dates: has ? rows : [...rows, { what: ticks[0], when: on, who, resolved: true }] }; }); setDealStage(dealId, task.advance!.stage); after(el, task.advance!.stage === 'passed'); }}>{task.advance.label}</button>}
      {task.record && (
        <button type="button" className={task.answer && !task.advance && !task.tick ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const r = task.record!; edit((p) => { const rows = r.replace ? [...p.dates.filter((x) => !sameDate(x.what, r.row.what)), { ...r.row }] : p.dates.some((x) => sameDate(x.what, r.row.what)) ? p.dates.map((x) => (sameDate(x.what, r.row.what) && r.row.resolved ? { ...x, when: x.when || r.row.when, who: x.who || r.row.who, resolved: true } : x)) : [...p.dates, { ...r.row }]; return { ...p, dates: r.closes ? rows.map((x) => (x.what === r.closes ? { ...x, resolved: true } : x)) : rows }; }); if (r.step) markDealStepDone(`analyzed:${dealId}`, r.step); after(el); }}>{task.record.label}</button>
      )}
      {task.advance2 && (
        <button type="button" className="btn btn-secondary" onClick={(e) => {
          const el = e.currentTarget;
          if (add) edit((p) => ({ ...p, dates: withRow(p.dates, add) }));
          setDealStage(dealId, task.advance2!.stage);
          after(el, task.advance2!.stage === 'passed');
        }}>{task.advance2.label}</button>
      )}
      {task.postpone && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; edit((p) => { const was = p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when); return { ...p, postponedSale: true, calendarReviewedFor: undefined, dates: [...p.dates.map((x) => (clearsOnPostpone(x.what) ? { ...x, when: '', resolved: undefined } : x)), ...p.dates.filter((x) => /^Sealed bid and full payment due/i.test(x.what) && x.resolved).map((x) => ({ when: x.when, what: 'Sealed bid sent (before the sale was postponed)', who: x.who || 'You', resolved: true })), ...(was ? [{ when: was.when, what: (() => { const k = p.dates.filter((x) => /^Sale postponed/.test(x.what)).length; return k === 0 ? 'Sale postponed (the original sale day)' : `Sale postponed (${k + 1}${k === 1 ? 'nd' : k === 2 ? 'rd' : 'th'} time)`; })(), who: was.who || 'Whoever runs the sale', resolved: true }] : [])] }; }); after(el); }}>{task.postpone.label}</button>
      )}
      {task.undo && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const u = task.undo!; edit((p) => { const kept = p.dates.filter((x) => !sameDate(x.what, u.removeRow)); return { ...p, dates: [...kept, ...(u.addRow && !kept.some((x) => sameDate(x.what, u.addRow!.what)) ? [{ ...u.addRow }] : [])] }; }); if (u.then) setDealStage(dealId, u.then); after(el); }}>{task.undo.label}</button>
      )}
    </>
  );
}
