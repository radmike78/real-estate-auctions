import { PATH, type StepKey } from '../lib/path';

/** "Next step" link at the bottom of each step's page. */
export default function PathNext({ step }: { step: StepKey }) {
  const i = PATH.findIndex((s) => s.key === step);
  const next = PATH[i + 1];
  if (!next) return null;
  return (
    <nav className="path-next" aria-label="Next step">
      <span className="muted">Next: step {next.n} of {PATH.length}</span>
      <a className="btn" href={next.href}>{next.label} →</a>
    </nav>
  );
}
