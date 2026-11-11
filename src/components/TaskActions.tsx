import { clearsOnPostpone, sameDate, type PacketData } from '../lib/dealPacket';
import { setDealStage, type PlanTask } from '../lib/dealStage';
import { markDealStepDone } from '../lib/roadmapState';

/**
 * A task's answer buttons (the packet and My plan): mark a date row handled, or move the deal on ("I won", "It was
 * redeemed"). `edit` changes the deal's packet; `after` puts the cursor on what comes next.
 */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

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
            const rows = i < 0 ? (p.dates.some((x) => sameDate(x.what, tick.row)) ? p.dates : [...p.dates, { what: tick.row, when: tick.when ?? (tick.noDate ? '' : today()), who: tick.who ?? '', resolved: true }]) : p.dates.map((x, j) => (j === i ? { ...x, resolved: true, when: tick.setWhen || x.when || tick.when || (tick.noDate ? '' : today()), who: x.who || tick.who || '' } : x));
            const kept = tick.drops ? rows.filter((x) => !(sameDate(x.what, tick.drops!) && !x.when)) : rows;
            return { ...p, dates: tick.closes ? kept.map((x) => (sameDate(x.what, tick.closes!) ? { ...x, resolved: true } : x)) : kept };
          });
          if (tick.step) markDealStepDone(`analyzed:${dealId}`, tick.step);
          if (tick.then) setDealStage(dealId, tick.then);
          after(el, tick.then === 'passed');
        }}>{tick.label}</button>
      )}
      {task.advance && <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const ticks = task.advance!.ticks; const who = task.advance!.tickWho ?? ''; if (ticks?.length) edit((p) => { const has = p.dates.some((x) => sameDate(x.what, ticks[0])); const rows = p.dates.map((x) => (ticks.some((n) => sameDate(x.what, n)) ? { ...x, resolved: true, when: x.when || today(), who: x.who || who } : x)); return { ...p, dates: has ? rows : [...rows, { what: ticks[0], when: today(), who, resolved: true }] }; }); setDealStage(dealId, task.advance!.stage); after(el, task.advance!.stage === 'passed'); }}>{task.advance.label}</button>}
      {task.record && (
        <button type="button" className={task.answer && !task.advance && !task.tick ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const r = task.record!; edit((p) => { const rows = p.dates.some((x) => sameDate(x.what, r.row.what)) ? p.dates.map((x) => (sameDate(x.what, r.row.what) && r.row.resolved ? { ...x, when: x.when || r.row.when, who: x.who || r.row.who, resolved: true } : x)) : [...p.dates, { ...r.row }]; return { ...p, dates: r.closes ? rows.map((x) => (x.what === r.closes ? { ...x, resolved: true } : x)) : rows }; }); if (r.step) markDealStepDone(`analyzed:${dealId}`, r.step); after(el); }}>{task.record.label}</button>
      )}
      {task.advance2 && (
        <button type="button" className="btn btn-secondary" onClick={(e) => {
          const el = e.currentTarget;
          if (add) edit((p) => ({ ...p, dates: p.dates.some((x) => sameDate(x.what, add.what)) ? p.dates : [...p.dates, { ...add }] }));
          setDealStage(dealId, task.advance2!.stage);
          after(el, task.advance2!.stage === 'passed');
        }}>{task.advance2.label}</button>
      )}
      {task.postpone && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; edit((p) => { const was = p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when); return { ...p, postponedSale: true, calendarReviewedFor: undefined, dates: [...p.dates.map((x) => (clearsOnPostpone(x.what) ? { ...x, when: '', resolved: undefined } : x)), ...(was ? [{ when: was.when, what: (() => { const k = p.dates.filter((x) => /^Sale postponed/.test(x.what)).length; return k === 0 ? 'Sale postponed (the original sale day)' : `Sale postponed (${k + 1}${k === 1 ? 'nd' : k === 2 ? 'rd' : 'th'} time)`; })(), who: was.who || 'Whoever runs the sale', resolved: true }] : [])] }; }); after(el); }}>{task.postpone.label}</button>
      )}
      {task.undo && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const u = task.undo!; edit((p) => { const kept = p.dates.filter((x) => !sameDate(x.what, u.removeRow)); return { ...p, dates: [...kept, ...(u.addRow && !kept.some((x) => sameDate(x.what, u.addRow!.what)) ? [{ ...u.addRow }] : [])] }; }); if (u.then) setDealStage(dealId, u.then); after(el); }}>{task.undo.label}</button>
      )}
    </>
  );
}
