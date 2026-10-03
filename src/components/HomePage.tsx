import StatePicker from './StatePicker';
import { IconCheckList, IconShield, IconStar } from './Icons';
import { PATH, useStepsSeen } from '../lib/path';
import { FIRST_DEAL } from '../lib/toolkit';
import { roadmapDone } from './ToolkitPage';

// The homepage is the path: six steps from the first lesson to a first deal. Progress (steps opened) is kept only
// in this browser.
export default function HomePage() {
  const seen = useStepsSeen();
  const next = PATH.find((s) => !seen.includes(s.key)) ?? PATH[0];
  const started = seen.length > 0;
  const done = roadmapDone().length;

  return (
    <main className="home">
      <section className="hero simple-hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <span className="eyebrow"><span className="live-dot" aria-hidden /> Nevada · California · Arizona · Utah</span>
          <h1>
            Become a real estate investor, <span className="grad">step by step.</span>
          </h1>
          <p className="hero-tagline">Learn it, practice it, then find and analyze real deals.</p>
          <p className="hero-sub">Six steps from your first lesson to your first deal. We teach the process; you buy directly from the official seller.</p>
          <div className="hero-ctas">
            <a className="btn big" href={next.href}>{started ? `Continue: ${next.label} →` : 'Start with step 1: Learn →'}</a>
            {!started && <a className="btn big btn-secondary" href="#/practice">Try a practice purchase</a>}
          </div>
        </div>
      </section>

      <section className="path" aria-labelledby="path-head">
        <StatePicker label="Where do you invest?" />
        <h2 id="path-head">Your path</h2>
        <ol className="path-steps">
          {PATH.map((s) => {
            const done = seen.includes(s.key);
            return (
              <li key={s.key}>
                <a className={`path-step${done ? ' done' : ''}`} href={s.href}>
                  <span className="path-n" aria-hidden>{done ? '✓' : s.n}</span>
                  <span className="path-body">
                    <strong>{s.label}</strong>
                    <span>{s.blurb}</span>
                  </span>
                  {done && <span className="sr-only"> (opened)</span>}
                  <span className="path-go" aria-hidden>→</span>
                </a>
              </li>
            );
          })}
        </ol>
        <a className="roadmap-card" href="#/toolkit">
          <strong>Your first deal: {done} of {FIRST_DEAL.length} steps</strong>
          <span>A checklist from first idea to closing, plus a buy box to keep you focused.</span>
          <span className="decide-bar" aria-hidden><span style={{ width: `${Math.round((done / FIRST_DEAL.length) * 100)}%` }} /></span>
        </a>
        <ul className="browse-trust" aria-label="Why trust it">
          <li><IconStar /> Free to use, no sign-up</li>
          <li><IconShield /> Official sources first</li>
          <li><IconCheckList /> We never take bids or money</li>
        </ul>
      </section>
    </main>
  );
}
