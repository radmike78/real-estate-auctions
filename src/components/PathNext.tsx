import { getMode } from '../lib/journey';
import { PATH, type StepKey } from '../lib/path';
import { planNow } from '../lib/planNext';

/** "Next step" link at the bottom of each step's page: My plan's next task when guided, else the next of the six steps. */
export default function PathNext({ step }: { step: StepKey }) {
  if (getMode() === 'guided') {
    const plan = planNow();
    const here = PATH.find((s) => s.key === step)?.href;
    // The plan's task is done on this very page (Find deals, Your team): say so, instead of a link that goes to My plan
    // and straight back.
    const page = (h?: string) => h?.split('?')[0];
    // The roadmap is done and its last task (Find your next property) is this page, or Analyze: nothing to link to.
    if (plan.task.key === 'next-deal' && (step === 'analyze' || page(plan.task.href) === here)) return null;
    // A property's own task done on this page (enter its numbers): it ticks itself, so just say so.
    if (here && plan.source === 'deal' && page(plan.task.href) === here) {
      if (step !== 'analyze') return null; // you're on it, and only Analyze ticks a property's task by itself
      return <nav className="path-next" aria-label="Next step"><span className="muted">You’re on your next step: {plan.task.label}. It’s marked done once you’ve entered it here.</span></nav>;
    }
    // Practice is rehearsal: a real task that links to it ("Register and bid") still happens at the real sale.
    if (here && step !== 'practice' && page(plan.task.support[0]?.href) === here) {
      return (
        <nav className="path-next" aria-label="Next step">
          <span className="muted">You’re on your next step: {plan.task.label}. When you have {plan.task.produces}, mark it done in My plan.</span>
          <a className="btn btn-secondary" href={plan.task.href}>Mark it done in My plan&nbsp;→</a>
        </nav>
      );
    }
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
