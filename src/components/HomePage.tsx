import StatePicker from './StatePicker';
import { IconBank, IconBadge, IconCalc, IconCheckList, IconFile, IconLayers, IconShield, IconStar } from './Icons';
import { PATH, useStepsSeen } from '../lib/path';
import { currentProgress, GUIDED, guidedNext, setMode, unfinished, useJourney } from '../lib/journey';
import { roadmapProgress } from './ToolkitPage';

// Straight to the tools and references, for "I know the basics".
const EXPLORE = [
  { href: '#/analyze', icon: <IconCalc />, title: 'Analyze a deal', what: 'Your maximum bid or offer, with every cost' },
  { href: '#/playbooks', icon: <IconFile />, title: 'Sale guides', what: 'Tax, foreclosure, sheriff, HOA, IRS and bank-owned sales, by state' },
  { href: '#/find-deals', icon: <IconBank />, title: 'Find deals', what: 'Official sellers and sale lists for your county' },
  { href: '#/live', icon: <IconLayers />, title: 'Live tax sales', what: 'Clark County parcels, checked against the official lists' },
  { href: '#/pros', icon: <IconBadge />, title: 'Your team', what: 'Who you need, what to ask, and how to check a license' },
  { href: '#/practice', icon: <IconCheckList />, title: 'All practice', what: 'Full practice purchases and 42 drills' },
];

// The homepage starts with an optional choice: be guided one step at a time, or go straight to the tools. The six-
// step path below always lists everything. All of it is kept only in this browser.
export default function HomePage() {
  const seen = useStepsSeen();
  const { mode, last: lastOpened } = useJourney();
  const progress = currentProgress();
  const next = guidedNext(progress);
  const last = unfinished(lastOpened, progress);
  const { done, total } = roadmapProgress();
  const continueLink = last && (
    <a className="btn big btn-secondary" href={last.href}>Continue where you left off: {last.label} →</a>
  );

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
          <p className="hero-sub">Lessons, practice purchases and deal tools for foreclosures, tax sales, bank-owned homes and regular listings. We teach the process; you buy directly from the official seller.</p>

          {!mode && (
            <div className="start-choice" role="group" aria-label="How do you want to start?">
              <button type="button" className="start-card" onClick={() => setMode('guided')}>
                <strong>I’m new: guide me →</strong>
                <span>One step at a time: a short introduction, a worked example, then your first practice exercise.</span>
              </button>
              <button type="button" className="start-card" onClick={() => setMode('explore')}>
                <strong>I know the basics: let me explore →</strong>
                <span>Go straight to the calculators, sale guides, deal sources and your team.</span>
              </button>
            </div>
          )}
          {!mode && continueLink && <div className="hero-ctas">{continueLink}</div>}

          {mode === 'guided' && (
            <div className="guided-next">
              {next ? (
                <>
                  <span className="guided-count">Your guided path · step {next.n} of {GUIDED.length}</span>
                  <a className="btn big" href={next.step.href}>{next.step.label} →</a>
                  <p>{next.step.why}</p>
                </>
              ) : (
                <>
                  <span className="guided-count">You finished the starter path</span>
                  <a className="btn big" href="#/practice">Try a full practice purchase →</a>
                  <p>Next, buy a fictional property step by step, from research to the day after the sale.</p>
                </>
              )}
              {continueLink && last?.href !== next?.step.href && <div className="hero-ctas">{continueLink}</div>}
            </div>
          )}

          {mode === 'explore' && (
            <>
              {continueLink && <div className="hero-ctas">{continueLink}</div>}
              <ul className="explore-grid" aria-label="Go straight to">
                {EXPLORE.map((x) => (
                  <li key={x.href}>
                    <a href={x.href}>
                      <span className="explore-icon" aria-hidden>{x.icon}</span>
                      <strong>{x.title}</strong>
                      <span>{x.what}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <ul className="browse-trust" aria-label="Why trust it">
            <li><IconStar /> Free to use, no sign-up</li>
            <li><IconShield /> Official sources first</li>
            <li><IconCheckList /> We never take bids or money</li>
          </ul>
          <p className="start-switch">
            {mode && (
              <>
                {mode === 'guided' ? 'Prefer to find your own way? ' : 'New to this? '}
                <button type="button" className="linkish" onClick={() => setMode(mode === 'guided' ? 'explore' : 'guided')}>
                  {mode === 'guided' ? 'Explore on your own' : 'Get guided step by step'}
                </button>
                {' · '}
              </>
            )}
            {/* A button, not an #anchor: the site's routes live in the URL hash. */}
            <button type="button" className="linkish" onClick={() => document.getElementById('everything')?.scrollIntoView({ behavior: 'smooth' })}>Browse everything ↓</button>
          </p>
        </div>
      </section>

      <section className="path" id="everything" aria-labelledby="path-head">
        <StatePicker label="Where do you invest?" />
        <h2 id="path-head">Everything, in six steps</h2>
        <ol className="path-steps">
          {PATH.map((s) => {
            const opened = seen.includes(s.key);
            return (
              <li key={s.key}>
                <a className={`path-step${opened ? ' done' : ''}`} href={s.href}>
                  <span className="path-n" aria-hidden>{opened ? '✓' : s.n}</span>
                  <span className="path-body">
                    <strong>{s.label}</strong>
                    <span>{s.blurb}</span>
                  </span>
                  {opened && <span className="sr-only"> (opened)</span>}
                  <span className="path-go" aria-hidden>→</span>
                </a>
              </li>
            );
          })}
        </ol>
        <a className="roadmap-card" href="#/toolkit">
          <strong>Your investing roadmap: {done} of {total} steps</strong>
          <span>A checklist from first idea to closing, plus a buy box to keep you focused.</span>
          <span className="decide-bar" aria-hidden><span style={{ width: `${Math.round((done / total) * 100)}%` }} /></span>
        </a>
      </section>
    </main>
  );
}
