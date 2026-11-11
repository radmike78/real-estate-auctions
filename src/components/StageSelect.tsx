import { useEffect, useRef, useState } from 'react';
import { DEAL_STAGES, type Deal, type DealStage } from '../lib/analyze';
import { stageLabel } from '../lib/dealStage';

/**
 * "Where it stands": picking a stage doesn't move the deal on its own (an arrow key in a closed menu would), so a
 * "Move it" button commits the choice. The buttons sit outside the label, so the menu's name is only its label.
 */
export default function StageSelect({ stage, deal, onMove }: { stage: DealStage; deal: Deal; onMove: (st: DealStage) => void }) {
  const [pick, setPick] = useState<DealStage>(stage);
  const menu = useRef<HTMLSelectElement>(null);
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
          <button type="button" className="btn btn-secondary" onClick={() => { onMove(pick); back(); }}>Move it to “{stageLabel(pick, deal)}”</button>{' '}
          <button type="button" className="linkish" onClick={() => { setPick(stage); back(); }}>Cancel</button>
        </span>
      )}
    </>
  );
}
