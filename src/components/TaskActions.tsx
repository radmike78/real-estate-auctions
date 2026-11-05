import { sameDate, type PacketData } from '../lib/dealPacket';
import { setDealStage, type PlanTask } from '../lib/dealStage';

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
      {tick && (
        <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => {
          const el = e.currentTarget;
          edit((p) => {
            const i = p.dates.findIndex((x) => sameDate(x.what, tick.row) && !x.resolved);
            // (An event with no date yet, such as the payoff, is dated today.)
            const rows = i < 0 ? (p.dates.some((x) => sameDate(x.what, tick.row)) ? p.dates : [...p.dates, { what: tick.row, when: today(), who: tick.who ?? '', resolved: true }]) : p.dates.map((x, j) => (j === i ? { ...x, resolved: true, when: x.when || today(), who: x.who || tick.who || '' } : x));
            return { ...p, dates: tick.closes ? rows.map((x) => (sameDate(x.what, tick.closes!) ? { ...x, resolved: true } : x)) : rows };
          });
          if (tick.then) setDealStage(dealId, tick.then);
          after(el, tick.then === 'passed');
        }}>{tick.label}</button>
      )}
      {task.advance && <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const ticks = task.advance!.ticks; const who = task.advance!.tickWho ?? ''; if (ticks?.length) edit((p) => { const has = p.dates.some((x) => ticks.some((n) => sameDate(x.what, n))); const rows = p.dates.map((x) => (ticks.some((n) => sameDate(x.what, n)) ? { ...x, resolved: true, when: x.when || today(), who: x.who || who } : x)); return { ...p, dates: has ? rows : [...rows, { what: ticks[0], when: today(), who, resolved: true }] }; }); setDealStage(dealId, task.advance!.stage); after(el, task.advance!.stage === 'passed'); }}>{task.advance.label}</button>}
      {task.advance2 && (
        <button type="button" className="btn btn-secondary" onClick={(e) => {
          const el = e.currentTarget;
          if (add) edit((p) => ({ ...p, dates: p.dates.some((x) => sameDate(x.what, add.what)) ? p.dates : [...p.dates, { ...add }] }));
          setDealStage(dealId, task.advance2!.stage);
          after(el, task.advance2!.stage === 'passed');
        }}>{task.advance2.label}</button>
      )}
      {task.redate && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const r = task.redate!; edit((p) => ({ ...p, dates: p.dates.map((x) => (sameDate(x.what, r.row) ? { ...x, when: r.when, resolved: false } : x)) })); after(el); }}>{task.redate.label}</button>
      )}
      {task.undo && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const u = task.undo!; edit((p) => ({ ...p, dates: [...p.dates.filter((x) => !sameDate(x.what, u.removeRow)), ...(u.addRow && !p.dates.some((x) => sameDate(x.what, u.addRow!.what)) ? [{ ...u.addRow }] : [])] })); after(el); }}>{task.undo.label}</button>
      )}
    </>
  );
}
