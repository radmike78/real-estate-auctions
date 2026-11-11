import { useEffect, useState } from 'react';
import { DEAL_STAGES, type Deal, type DealStage } from '../lib/analyze';
import { stageLabel } from '../lib/dealStage';

/**
 * "Where it stands": picking a stage doesn't move the deal on its own (an arrow key in a closed menu would), so a
 * "Move it" button commits the choice.
 */
export default function StageSelect({ stage, deal, onMove }: { stage: DealStage; deal: Deal; onMove: (st: DealStage) => void }) {
  const [pick, setPick] = useState<DealStage>(stage);
  // (Moved elsewhere, by a task button or another tab: the menu follows.)
  useEffect(() => setPick(stage), [stage]);
  return (
    <>
      <select value={pick} onChange={(e) => setPick(e.target.value as DealStage)}>
        {DEAL_STAGES.map((st) => <option key={st} value={st}>{stageLabel(st, deal)}</option>)}
      </select>
      {pick !== stage && (
        <span className="stage-move">
          <button type="button" className="btn btn-secondary" onClick={() => onMove(pick)}>Move it to “{stageLabel(pick, deal)}”</button>{' '}
          <button type="button" className="linkish" onClick={() => setPick(stage)}>Cancel</button>
        </span>
      )}
    </>
  );
}
