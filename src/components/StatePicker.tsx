import { STATES, type StateCode } from '../lib/regions';
import { useMyState } from '../lib/myState';

/** "Your state" chooser, shared across the site: pages then show only that state's rules. */
export default function StatePicker({ label = 'Your state' }: { label?: string }) {
  const [state, setState] = useMyState();
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
