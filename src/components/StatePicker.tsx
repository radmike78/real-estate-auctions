import { STATES, type StateCode } from '../lib/regions';
import { useMyState } from '../lib/myState';

/** "Your state" chooser, shared across the site: pages then show only that state's rules. */
export default function StatePicker({ label = 'Your state', selection }: { label?: string; selection?: { state: StateCode | null; onChange: (state: StateCode | null) => void } }) {
  const [myState, setMyState] = useMyState();
  const state = selection ? selection.state : myState;
  const setState = selection ? selection.onChange : setMyState;
  return (
    <div className="state-picker" role="group" aria-label={label}>
      <span className="state-picker-label">{label}</span>
      <div className="state-picker-options">
        {STATES.map((s) => (
          <button key={s.code} type="button" aria-pressed={state === s.code} className={state === s.code ? 'on' : ''} onClick={() => setState(s.code as StateCode)}>
            {s.name}
          </button>
        ))}
        <button type="button" aria-pressed={state === null} className={state === null ? 'on' : ''} onClick={() => setState(null)}>
          All states
        </button>
      </div>
    </div>
  );
}
