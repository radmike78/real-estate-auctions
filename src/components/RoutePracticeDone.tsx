import { useEffect, useRef, useState } from 'react';
import { routePractice } from '../lib/planNext';
import { markStepDone, planPath, practiceDoneElsewhere, PRACTICE_NAME, roadmapDone } from '../lib/roadmapState';

/**
 * On the auction and lien routes, a finished practice run or drill can be My plan's practice part 2: says so, and lets
 * the reader mark that step done (every time, whatever it was before). `fits` says whether this work is the route's
 * practice: given the route step's id ('a-practice' or 'c-practice').
 */
export default function RoutePracticeDone({ fits, what }: { fits: (stepId: string) => boolean; what: string }) {
  const own = routePractice(planPath());
  // Done means the route's own step is ticked in My plan (not the rental case or "doesn't apply").
  // (Or counted done by another practice, as My plan counts it.)
  const ownDone = () => !!own && (roadmapDone().includes(own.id) || !!practiceDoneElsewhere(own.id));
  const [marked, setMarked] = useState(ownDone);
  const [justMarked, setJustMarked] = useState(false);
  const back = useRef<HTMLAnchorElement>(null);
  // After the click, focus moves to the way back (the button it replaced is gone).
  useEffect(() => { if (justMarked && marked) back.current?.focus(); }, [justMarked, marked]);
  if (!own || !fits(own.id)) return null;
  return (
    <div className="notice">
      {!marked && <p>This {what} is part of practice part 2 in My plan, “{own.title}”. Before you mark it done, check the step’s own test: {own.doneWhen}{' '}
        <button type="button" className="btn btn-secondary" onClick={() => { markStepDone(own.id); setMarked(ownDone()); setJustMarked(true); }}>Mark it done in My plan</button>
      </p>}
      {/* One status line, kept on the page, so the change is announced. */}
      <p role="status" className={marked ? undefined : 'sr-only'}>{marked ? <>{(() => { const el = practiceDoneElsewhere(own.id); return el ? <>Practice part 2 is done in My plan, with {PRACTICE_NAME[el]}.</> : <>Practice part 2, “{own.title}”, is done in My plan.</>; })()} <a ref={back} href="#/toolkit">Back to My plan</a></> : null}</p>
    </div>
  );
}
