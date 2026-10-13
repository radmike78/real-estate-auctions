import { getMode } from '../lib/journey';
import { PATH, type StepKey } from '../lib/path';
import { planNow } from '../lib/planNext';

/** "Next step" link at the bottom of each step's page: My plan's next task when guided, else the next of the six steps. */
export default function PathNext({ step }: { step: StepKey }) {
  if (getMode() === 'guided') {
    const plan = planNow();
    return (
      <nav className="path-next" aria-label="Next step">
        <span className="muted">Next: {plan.context}</span>
        <a className="btn" href={plan.task.href}>{plan.task.label}&nbsp;→</a>
      </nav>
    );
  }
  const i = PATH.findIndex((s) => s.key === step);
  const next = PATH[i + 1];
  if (!next) return null;
  return (
    <nav className="path-next" aria-label="Next step">
      <span className="muted">Next: step {next.n} of {PATH.length}</span>
      <a className="btn" href={next.href}>{next.label}&nbsp;→</a>
    </nav>
  );
}
