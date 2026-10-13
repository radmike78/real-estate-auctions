import { useState } from 'react';
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
  const go = (guided: boolean) => {
    if (!pick) return;
    setMyState(pick);
    acknowledgeWelcome();
    if (guided) {
      setMode('guided');
      navigate(planNow().task.href);
    }
  };
  return (
    <main className="page welcome-gate">
      <h1>Welcome to DeedOwl</h1>
      <p className="role-lead">DeedOwl teaches you, step by step, how to find, check and buy real estate, from listed homes to auctions, with properties from official sources.</p>
      <h2>Where do you want to invest?</h2>
      <p>Choose one state to see its lessons, local guidance and practice. You can change it later.</p>
      <StatePicker label="Choose your investing state" selection={{ state: pick, onChange: setPick }} />
      <p className="muted">County and city rules can differ within a state. Federal guidance will be labeled where it applies.</p>
      <div className="row welcome-gate-actions">
        <button type="button" className="btn" disabled={!pick} onClick={() => go(true)}>Try the first decision</button>
        <button type="button" className="btn btn-secondary" disabled={!pick} onClick={() => go(false)}>Explore the website first</button>
      </div>
      {!pick && <p className="muted" role="status">Pick a state to continue.</p>}
    </main>
  );
}
