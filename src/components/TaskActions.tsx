import { sameDate, type PacketData } from '../lib/dealPacket';
import { setDealStage, type PlanTask } from '../lib/dealStage';

/**
 * A task's answer buttons (the packet and My plan): mark a date row handled, or move the deal on ("I won", "It was
 * redeemed"). `edit` changes the deal's packet; `after` puts the cursor on what comes next.
 */
export default function TaskActions({ task, dealId, edit, after, big = false }: { task: PlanTask; dealId: string; edit: (f: (p: PacketData) => PacketData) => void; after: (el: HTMLElement) => void; big?: boolean }) {
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
            return i < 0 ? p : { ...p, dates: p.dates.map((x, j) => (j === i ? { ...x, resolved: true } : x)) };
          });
          if (tick.then) setDealStage(dealId, tick.then);
          after(el);
        }}>{tick.label}</button>
      )}
      {task.advance && <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; setDealStage(dealId, task.advance!.stage); after(el); }}>{task.advance.label}</button>}
      {task.advance2 && (
        <button type="button" className="btn btn-secondary" onClick={(e) => {
          const el = e.currentTarget;
          if (add) edit((p) => (p.dates.some((x) => sameDate(x.what, add.what)) ? p : { ...p, dates: [...p.dates, { ...add }] }));
          setDealStage(dealId, task.advance2!.stage);
          after(el);
        }}>{task.advance2.label}</button>
      )}
    </>
  );
}
