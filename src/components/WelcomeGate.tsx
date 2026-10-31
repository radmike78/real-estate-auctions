import { useRef, useState } from 'react';
import PageHero from './PageHero';
import { IconCheckList, IconShield, IconStar } from './Icons';
import StatePicker from './StatePicker';
import { useMyState } from '../lib/myState';
import type { StateCode } from '../lib/regions';
import { setMode } from '../lib/journey';
import { navigate } from '../lib/nav';
import { planNow } from '../lib/planNext';
import { acknowledgeWelcome } from './RoleNotice';

/**
 * The first page a new visitor sees, until a state is chosen: the welcome, the five states and the two ways to start.
 * It replaces the welcome dialog, so the question is asked once.
 */
export default function WelcomeGate() {
  const [, setMyState] = useMyState();
  const [pick, setPick] = useState<StateCode | null>(null);
  const [needPick, setNeedPick] = useState(false);
  const startRef = useRef<HTMLElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const go = (guided: boolean) => {
    if (!pick) {
      setNeedPick(true);
      pickerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      return;
    }
    setMyState(pick);
    acknowledgeWelcome();
    setMode(guided ? 'guided' : 'explore');
    if (guided) navigate(planNow().task.href);
  };
  return (
    <main className="page welcome-gate">
      <PageHero
        title={<>Welcome to <span className="grad">DeedOwl</span></>}
        sub="Learn real estate investing step by step, practice on made-up deals, then find and check real ones from official sources. Free."
      />
      <section aria-labelledby="welcome-state-head">
        <h2 id="welcome-state-head">1. Where do you want to invest?</h2>
        <p>Choose one state. Lessons, sale rules and practice then show that state. You can change it any time from the header.</p>
        <div ref={pickerRef}>
          <StatePicker label="Your investing state" selection={{ state: pick, onChange: (s) => { setPick(s); setNeedPick(false); requestAnimationFrame(() => startRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); } }} />
        </div>
        <p className="muted">County and city rules can differ within a state. Federal rules are labeled where they apply.</p>
      </section>
      <section aria-labelledby="welcome-start-head" ref={startRef}>
        <h2 id="welcome-start-head">2. How do you want to start?</h2>
        <div className="row welcome-gate-actions">
          <button type="button" className="btn" onClick={() => go(true)}>I’m new: guide me step by step</button>
          <button type="button" className="btn btn-secondary" onClick={() => go(false)}>I know the basics: let me explore</button>
        </div>
        <p className="muted">Guided starts with a few questions about your goal and cash (about 2 minutes), then the first lessons and a made-up property to practice on. Explore opens the home page with every tool.</p>
        {needPick && <p className="note" role="alert">Choose a state above first.</p>}
        <p className="hero-foot welcome-trust">
          <span className="hero-trust"><IconStar /> Free, no sign-up</span>
          <span className="hero-trust"><IconShield /> Official sources first</span>
          <span className="hero-trust"><IconCheckList /> We never take bids or money</span>
        </p>
      </section>
    </main>
  );
}

/**
 * A visitor who arrives on a lesson, guide or tool (from a search, say) sees that page right away, with this one-line
 * state choice above it instead of the full welcome. Pages show general guidance until a state is chosen.
 */
export function StateBar() {
  const [, setMyState] = useMyState();
  return (
    <div className="state-bar" role="region" aria-label="Choose your state">
      <StatePicker label="Choose your state to see its rules:" selection={{ state: null, onChange: (s) => { if (s) { setMyState(s); acknowledgeWelcome(); } } }} />
    </div>
  );
}
