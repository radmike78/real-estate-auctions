import { IconBank, IconBadge, IconCalc, IconCheckList, IconFile, IconLayers, IconShield, IconStar } from './Icons';

import { PATH, useStepsSeen } from '../lib/path';
import { currentProgress, setMode, unfinished, useJourney } from '../lib/journey';
import { roadmapProgress } from '../lib/roadmapState';
import { HomeArea } from './AreaPicker';
import PlanNext, { ContinueButton } from './PlanNext';
import { planNow } from '../lib/planNext';


// Straight to the tools and references, for "I know the basics".
const EXPLORE = [
  { href: '#/analyze', icon: <IconCalc />, title: 'Analyze a deal', what: 'Your maximum bid or offer, with every cost' },
  { href: '#/playbooks', icon: <IconFile />, title: 'Sale guides', what: 'Tax, foreclosure, sheriff, HOA, IRS and bank-owned sales, by state' },
  { href: '#/find-deals', icon: <IconBank />, title: 'Find deals', what: 'Official sellers and sale lists for your county' },
  { href: '#/live', icon: <IconLayers />, title: 'Live tax sales', what: 'Upcoming county sales, plus Clark County and IRS parcels' },
  { href: '#/pros', icon: <IconBadge />, title: 'Your team', what: 'Who you need, what to ask, and how to check a license' },
  { href: '#/practice', icon: <IconCheckList />, title: 'All practice', what: 'Full practice purchases and more than 40 drills' },
];

// The homepage starts with an optional choice: be guided one step at a time, or go straight to the tools. The six-
// step path below always lists everything. All of it is kept only in this browser.
export default function HomePage() {
  const seen = useStepsSeen();
  const { mode, last: lastOpened } = useJourney();
  const progress = currentProgress();
  const last = unfinished(lastOpened, progress);
  const { total } = roadmapProgress();
  // The one Continue on the site is My plan's next task (planNext.ts); the last page you had open is a plain "Back to".
  const plan = planNow();
  const continueLink = last && last.href !== plan.task.href && (
    <a className="btn big btn-secondary" href={last.href}>Back to {last.label}&nbsp;→</a>
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
                <strong>I’m new: guide me&nbsp;→</strong>
                <span>One fictional property, short decisions, and a workbook that grows as you learn.</span>
              </button>
              <button type="button" className="start-card" onClick={() => setMode('explore')}>
                <strong>I know the basics: let me explore&nbsp;→</strong>
                <span>Go straight to the calculators, sale guides, deal sources and your team.</span>
              </button>
            </div>
          )}
          {!mode && continueLink && <div className="hero-ctas">{continueLink}</div>}

          {mode === 'guided' && (
            <div className="guided-next">
              {/* One row of actions, one short line of why: no stack of separate lines before the six steps. */}
              <div className="hero-ctas">
                <ContinueButton task={plan.task} dealId={plan.deal?.id} onPlan={false} label={`Continue: ${plan.task.label}`} />
                {continueLink}
              </div>
              <p>{plan.task.key === 'practice-deal' ? <><strong>Learn by doing:</strong> {plan.task.text}</> : <><strong>You’ll have:</strong> {plan.task.produces}.</>}</p>
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
        {/* My plan's next step, the same one as the Continue above and in My plan: the progress that counts. */}
        <PlanNext variant="home" />
        <h3 className="progress-kinds-head">How DeedOwl counts your progress</h3>
        <ul className="progress-kinds" aria-label="How DeedOwl counts progress">
          <li><strong>My plan ({total} roadmap tasks)</strong> The real work of an actual purchase, and the one place your next step comes from. This is the progress that counts.</li>
          <li><strong>Build your first deal</strong> Short decisions on one fictional property. Your workbook records skills practiced; My plan tracks the work on a real investment.</li>
          <li><strong>Lessons and practice missions</strong> Supporting activities: each plan task links the ones that help with it. Missions are rehearsal on made-up deals; finishing them builds skill, but doesn’t mean you’re ready to buy.</li>
        </ul>
      </section>
    </main>
  );
}
