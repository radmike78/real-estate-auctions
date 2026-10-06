import { IconBank, IconBadge, IconCalc, IconCheckList, IconFile, IconLayers, IconShield, IconStar } from './Icons';
import { loadCase } from '../practice/caseProgress';

import { PATH, useStepsSeen } from '../lib/path';
import { currentProgress, GUIDED, guidedNext, setMode, unfinished, useJourney } from '../lib/journey';
import { roadmapProgress } from './ToolkitPage';
import { HomeArea } from './AreaPicker';

/** Once the practice purchase is under way, the next place to go is your own plan. */
const caseStarted = () => loadCase().done.length > 0;

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
          <HomeArea />
          <h1>
            Become a real estate investor, <span className="grad">step by step.</span>
          </h1>
          <p className="hero-sub">Learn it, practice it, then find and analyze real deals, from foreclosures and tax sales to bank-owned homes. You always buy from the official seller.</p>

          {!mode && (
            <div className="start-choice" role="group" aria-label="How do you want to start?">
              <button type="button" className="start-card" onClick={() => setMode('guided')}>
                <strong>I’m new: guide me →</strong>
                <span>One step at a time: a worked example, your first practice exercise, then a short introduction.</span>
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
              {/* One row of actions, one short line of why: no stack of separate lines before the six steps. */}
              <div className="hero-ctas">
                {next ? (
                  <a className="btn big" href={next.step.href}><span className="guided-count">{next.n} of {GUIDED.length}</span> {next.step.label} →</a>
                ) : (
                  caseStarted() ? <a className="btn big" href="#/toolkit">Open My plan →</a> : <a className="btn big" href="#/practice/case">Try the full practice purchase →</a>
                )}
                {continueLink && last?.href !== next?.step.href && continueLink}
              </div>
              <p>{next ? <><strong>Getting started:</strong> {next.step.why}</> : 'You finished the starter path. Next, buy a fictional rental from budget to keys.'}</p>
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

          <p className="hero-foot">
            <span className="hero-trust"><IconStar /> Free, no sign-up</span>
            <span className="hero-trust"><IconShield /> Official sources first</span>
            <span className="hero-trust"><IconCheckList /> We never take bids or money</span>
            {mode && (
              <button type="button" className="linkish" onClick={() => setMode(mode === 'guided' ? 'explore' : 'guided')}>
                {mode === 'guided' ? 'Explore on your own' : 'Get guided step by step'}
              </button>
            )}
          </p>
        </div>
      </section>

      <section className="path" id="everything" aria-labelledby="path-head">
        <h2 id="path-head">Everything, in six steps</h2>
        <ol className="path-steps">
          {PATH.map((s) => {
            const opened = seen.includes(s.key);
            return (
              <li key={s.key}>
                {/* Opening a step isn't finishing it: a visited step keeps its number and says "Visited", and only the
                    roadmap below counts real progress. */}
                <a className={`path-step${opened ? ' visited' : ''}`} href={s.href}>
                  <span className="path-n" aria-hidden>{s.n}</span>
                  <span className="path-body">
                    <strong>{s.label}</strong>
                    <span>{s.blurb}</span>
                    {opened && <span className="path-visited">Visited</span>}
                  </span>
                  <span className="path-go" aria-hidden>→</span>
                </a>
              </li>
            );
          })}
        </ol>
        <a className="roadmap-card" href="#/toolkit">
          <strong>Your investing roadmap: {done} of {total} real-world tasks done</strong>
          <span>The real work of buying, from first idea to closing, plus a buy box to keep you focused. This is the progress that counts.</span>
          <span className="decide-bar" aria-hidden><span style={{ width: `${Math.round((done / total) * 100)}%` }} /></span>
        </a>
      </section>
    </main>
  );
}
