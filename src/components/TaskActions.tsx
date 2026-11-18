import { clearsOnPostpone, loadPacket, sameDate, type PacketData } from '../lib/dealPacket';
import { dayOf, DEED_ROWS, prettyDay, setDealStage, officialNames, type PlanTask, withRow } from '../lib/dealStage';
import { loadDeals } from '../lib/analyze';
import { markDealStepDone } from '../lib/roadmapState';

/**
 * A task's answer buttons (the packet and My plan): mark a date row handled, or move the deal on ("I won", "It was
 * redeemed"). `edit` changes the deal's packet; `after` puts the cursor on what comes next.
 */
// (Today in the deal's state, so a date recorded from Tokyo is still Nevada's day.)
const todayFor = (dealId: string) => dayOf(loadDeals().find((x) => x.id === dealId), new Date());
// (A step's button that ticks a reader's own row named as one of the sale's dates ("Payment deadline") says it is
//  that date: it's counted as it from then on, so the step doesn't stay.)
const adopts = (dealId: string, row: string) => { const d = loadDeals().find((x) => x.id === dealId); return !!d && officialNames(d).some((n) => n.toLowerCase() === row.trim().toLowerCase()); };

export default function TaskActions({ task, dealId, edit, after, big = false }: { task: PlanTask; dealId: string; edit: (f: (p: PacketData) => PacketData) => void; after: (el: HTMLElement, finished?: boolean) => void; big?: boolean }) {
  // The answer that moves the deal on is the main button when the task is a question.
  const main = `btn${big ? ' big' : ''}`;
  const tick = task.tick;
  const add = task.advance2?.addRow;
  return (
    <>
      {task.redate && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const r = task.redate!; edit((p) => ({ ...p, dates: p.dates.some((x) => sameDate(x, r.row)) ? p.dates.map((x) => (sameDate(x, r.row) ? { ...x, what: r.as ?? x.what, when: r.when, who: x.who || r.who || '', resolved: false } : x)) : [...p.dates, { what: r.as ?? r.row, when: r.when, who: r.who ?? '' }] })); after(el); }}>{task.redate.label}</button>
      )}
      {tick && (
        <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => {
          const el = e.currentTarget;
          edit((p) => {
            // (The row the reminder named, exactly; else the first open row of that kind.)
            // (The site's own row first; a reader's own row of the same name only when there's no site row.)
            const named = (x: PacketData['dates'][number]) => x.what.trim().toLowerCase() === tick.row.trim().toLowerCase() && !x.resolved;
            const own = (x: PacketData['dates'][number]) => !!x.own && !x.as;
            const mine = (x: PacketData['dates'][number]) => !!x.own && !x.as && !!x.notAs;
            // ("Done" on a reader's reminder ticks that reminder, not a site row of the same name.)
            const self = tick.asIs && tick.at !== undefined ? p.dates.findIndex((x) => named(x) && x.when === tick.at && !!x.own === !!tick.ownRow) : -1;
            // (Every open row that counts as this date — the site's, and a reader's that counts as it — a dated one first.)
            const counts = (x: PacketData['dates'][number]) => !x.resolved && ((named(x) && !own(x)) || (!!x.own && !!x.as && (x.as.trim().toLowerCase() === tick.row.trim().toLowerCase() || sameDate(x, tick.row))));
            const dated = p.dates.findIndex((x) => counts(x) && !!x.when);
            const exact = self >= 0 ? self : tick.asIs ? p.dates.findIndex(named) : dated >= 0 ? dated : p.dates.findIndex(counts);
            const kind = exact >= 0 ? -1 : p.dates.findIndex((x) => sameDate(x, tick.row) && !x.resolved);
            const i = exact >= 0 ? exact : kind >= 0 ? kind : p.dates.findIndex((x) => named(x) && (tick.asIs || !mine(x)));
            const adopt = !tick.asIs && adopts(dealId, tick.row);
            // (An event with no date yet, such as the payoff, is dated today.)
            const rows = i < 0 ? (p.dates.some((x) => sameDate(x, tick.row)) ? p.dates : [...p.dates, { what: tick.row, when: tick.when ?? (tick.noDate ? '' : todayFor(dealId)), who: tick.who ?? '', resolved: true }]) : p.dates.map((x, j) => (j === i || (!tick.asIs && exact >= 0 && counts(x)) || (adopt && j !== i && own(x) && !mine(x) && named(x)) ? { ...x, ...(own(x) && !mine(x) && adopt ? { as: tick.row } : {}), resolved: true, when: tick.setWhen || x.when || (j !== i ? p.dates[i].when : '') || tick.when || (tick.noDate ? '' : todayFor(dealId)), who: x.who || tick.who || '' } : x));
            const kept = tick.drops ? rows.filter((x) => !(sameDate(x, tick.drops!) && !x.when)) : rows;
            return { ...p, dates: tick.closes ? kept.map((x) => (sameDate(x, tick.closes!) ? { ...x, resolved: true } : x)) : kept };
          });
          if (tick.step) markDealStepDone(`analyzed:${dealId}`, tick.step);
          if (tick.then) setDealStage(dealId, tick.then);
          after(el, tick.then === 'passed');
        }}>{tick.label}</button>
      )}
      {task.advance && <button type="button" className={task.answer ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const ticks = task.advance!.ticks; const who = task.advance!.tickWho ?? ''; const on = task.advance!.tickWhen ?? todayFor(dealId); /* (A recording row already dated as expected: the windows count from the real recording day, so ask which it is.) */ const dk = loadDeals().find((x) => x.id === dealId); const deedNames = dk?.state === 'NV' && dk.kind === 'trustee' ? DEED_ROWS.trustee : dk?.state === 'NV' && dk.kind === 'taxSale' ? DEED_ROWS.tax : []; const pk0 = loadPacket(`analyzed:${dealId}`); /* (A row of this kind already marked handled with its date: that's the recording; other dates are left alone.) */ const doneOn = ticks?.length ? pk0.dates.find((x) => ticks.some((n) => sameDate(x, n)) && x.resolved && !!x.when)?.when : undefined; const expOk = (x: PacketData['dates'][number]) => ticks!.some((n) => sameDate(x, n)) && deedNames.some((r) => sameDate(x, r)) && !!x.when && !x.resolved && x.when !== on; /* (the reader's own date first: they typed it) */ const exp = ticks?.length && !doneOn ? pk0.dates.find((x) => expOk(x) && !!x.own) ?? pk0.dates.find(expOk) : undefined; const later = !!exp && exp.when > on; if (exp && !window.confirm(later ? `The date in Key dates for “${exp.what}” (${prettyDay(exp.when)}) is after today. If it was recorded today (${prettyDay(on)}), choose OK. If it isn’t recorded yet, choose Cancel and mark it once it is.` : `Was it recorded on ${prettyDay(exp.when)}, the date in Key dates for “${exp.what}”? ${dk?.kind === 'trustee' ? 'The 30-day challenge window counts from the recording day.' : 'The 2-year recovery-suit window’s earliest end is worked out from the recording day.'} Choose OK if so, or Cancel to enter the actual recording date in Key dates first.`)) return; if (ticks?.length) edit((p) => { const has = p.dates.some((x) => sameDate(x, ticks[0])); const today = todayFor(dealId); const isExp = (x: PacketData['dates'][number]) => !!exp && x.what === exp.what && x.when === exp.when && !x.resolved; /* (Dates already marked handled are kept; a future date changes to today only on the row the reader just confirmed; another future one stays open.) */ const rows = p.dates.map((x) => (ticks.some((n) => sameDate(x, n)) && !(x.resolved) && !(doneOn && !!x.when && x.when !== doneOn) && !(exp && !later && !!x.when && x.when !== exp.when) && !(!!x.when && x.when > today && !(later && isExp(x))) ? { ...x, resolved: true, when: later && isExp(x) ? on : x.when || (exp && !later ? exp.when : on), who: x.who || who } : x)); return { ...p, dates: has ? rows : [...rows, { what: ticks[0], when: on, who, resolved: true }] }; }); setDealStage(dealId, task.advance!.stage); after(el, task.advance!.stage === 'passed'); }}>{task.advance.label}</button>}
      {task.record && (
        <button type="button" className={task.answer && !task.advance && !task.tick ? main : 'btn btn-secondary'} onClick={(e) => { const el = e.currentTarget; const r = task.record!; edit((p) => { const rows = r.replace ? [...p.dates.filter((x) => !sameDate(x, r.row.what)), { ...r.row }] : p.dates.some((x) => sameDate(x, r.row.what)) ? p.dates.map((x) => (sameDate(x, r.row.what) && r.row.resolved ? { ...x, when: x.when || r.row.when, who: x.who || r.row.who, resolved: true } : x)) : [...p.dates, { ...r.row }]; return { ...p, dates: r.closes ? rows.map((x) => (x.what === r.closes ? { ...x, resolved: true } : x)) : rows }; }); if (r.step) markDealStepDone(`analyzed:${dealId}`, r.step); after(el); }}>{task.record.label}</button>
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
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; edit((p) => { const was = p.dates.find((x) => sameDate(x, 'Sale day') && x.when); return { ...p, postponedSale: true, calendarReviewedFor: undefined, dates: [...p.dates.map((x) => (clearsOnPostpone(x) ? { ...x, when: '', resolved: undefined } : x)), ...p.dates.filter((x) => /^Sealed bid and full payment due/i.test(x.what) && x.resolved).map((x) => ({ when: x.when, what: 'Sealed bid sent (before the sale was postponed)', who: x.who || 'You', resolved: true })), ...(was ? [{ when: was.when, what: (() => { const k = p.dates.filter((x) => /^Sale postponed/.test(x.what)).length; return k === 0 ? 'Sale postponed (the original sale day)' : `Sale postponed (${k + 1}${k === 1 ? 'nd' : k === 2 ? 'rd' : 'th'} time)`; })(), who: was.who || 'Whoever runs the sale', resolved: true }] : [])] }; }); after(el); }}>{task.postpone.label}</button>
      )}
      {task.undo && (
        <button type="button" className="btn btn-secondary" onClick={(e) => { const el = e.currentTarget; const u = task.undo!; edit((p) => { const kept = p.dates.filter((x) => !sameDate(x, u.removeRow)); return { ...p, dates: [...kept, ...(u.addRow && !kept.some((x) => sameDate(x, u.addRow!.what)) ? [{ ...u.addRow }] : [])] }; }); if (u.then) setDealStage(dealId, u.then); after(el); }}>{task.undo.label}</button>
      )}
    </>
  );
}
