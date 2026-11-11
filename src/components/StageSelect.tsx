import { useEffect, useRef, useState } from 'react';
import { DEAL_STAGES, type Deal, type DealStage } from '../lib/analyze';
import { beforeDeed, earlyMoveNote, openDeedChecks, prettyDay, stageLabel } from '../lib/dealStage';

/**
 * "Where it stands": picking a stage doesn't move the deal on its own (an arrow key in a closed menu would), so a
 * "Move it" button commits the choice. The buttons sit outside the label, so the menu's name is only its label.
 */
export default function StageSelect({ stage, deal, onMove }: { stage: DealStage; deal: Deal; onMove: (st: DealStage) => void }) {
  const [pick, setPick] = useState<DealStage>(stage);
  const menu = useRef<HTMLSelectElement>(null);
  // (A certificate-first deal without its deed: moving it to the owner stage gets a caution.)
  const wait = beforeDeed(deal);
  const today = new Date().toLocaleDateString('en-CA');
  // (Moved elsewhere, by a task button or another tab, or another property shown: the menu follows.)
  useEffect(() => setPick(stage), [stage, deal.id]);
  // (The buttons go away once pressed: focus returns to the menu, not the page.)
  // (Unless the move took focus somewhere on purpose, such as the note naming the next property.)
  const back = () => setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) menu.current?.focus(); }, 50);
  return (
    <>
      <label className="field">
        <span>Where it stands</span>
        <select ref={menu} value={pick} onChange={(e) => setPick(e.target.value as DealStage)}>
          {DEAL_STAGES.map((st) => <option key={st} value={st}>{stageLabel(st, deal)}</option>)}
        </select>
      </label>
      {pick !== stage && (
        <span className="stage-move">
          {earlyMoveNote(deal, pick) && <span className="caution" role="note" style={{ display: 'block' }}>{earlyMoveNote(deal, pick)} </span>}
          {pick === 'owned' && !wait && stage === 'closed' && openDeedChecks(deal) && <span className="caution" role="note" style={{ display: 'block' }}>Its Deed-recorded checks aren’t done yet: possession, title and any challenge or recovery window. Finish them before you remodel or sell. </span>}
          {pick === 'owned' && wait && <span className="caution" role="note" style={{ display: 'block' }}>{wait === 'unknown' ? 'You don’t have the deed yet, and someone may still redeem. Repairs or a sale before the deed put that money at risk if someone redeems.*' : wait < today ? `The redemption period ended on ${prettyDay(wait)}, but the deed isn’t marked yet: confirm no one redeemed and get the deed first.` : `The redemption period runs until ${prettyDay(wait)}, and you don’t have the deed yet. Repairs or a sale before then put that money at risk if someone redeems.*`} </span>}
          <button type="button" className="btn btn-secondary" onClick={() => { onMove(pick); back(); }}>Move it to “{stageLabel(pick, deal)}”</button>{' '}
          <button type="button" className="linkish" onClick={() => { setPick(stage); back(); }}>Cancel</button>
        </span>
      )}
    </>
  );
}
