// A search box for a city or town in one state, from the Census list (src/data/places). Picking one calls `onPick`
// and clears the box. Used on the application (cities served) and the dashboard (ad areas).
import { useEffect, useId, useState, type ReactNode } from 'react';
import { loadPlaces, matchPlaces, type Place } from '../lib/places';
import { countyName, type StateCode } from '../lib/regions';

export default function PlaceCombobox({ state, label, hint, onPick, keep = () => true, disabled = false }: {
  state: StateCode;
  label: ReactNode;
  hint?: string;
  onPick: (p: Place) => void;
  /** Which places to offer (e.g. not ones already chosen). */
  keep?: (p: Place) => boolean;
  disabled?: boolean;
}) {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [typed, setTyped] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  useEffect(() => {
    let alive = true;
    setPlaces(null);
    loadPlaces(state).then((p) => alive && setPlaces(p));
    return () => {
      alive = false;
    };
  }, [state]);
  const matches = matchPlaces((places ?? []).filter(keep), typed);
  const pick = (p: Place) => {
    onPick(p);
    setTyped('');
    setActive(0);
  };
  return (
    <div className="field place-combo">
      <label htmlFor={`${listId}-in`}>{label}</label>
      <input
        id={`${listId}-in`}
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches.length ? `${listId}-${active}` : undefined}
        autoComplete="off"
        disabled={!places || disabled}
        placeholder={places ? 'Start typing a city or town' : 'Loading cities…'}
        value={typed}
        onChange={(e) => { setTyped(e.target.value); setActive(0); }}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); pick(matches[active]); }
          else if (e.key === 'Escape') { e.stopPropagation(); setTyped(''); }
        }}
      />
      {matches.length > 0 && (
        <ul id={listId} role="listbox" className="area-options">
          {matches.map((p, i) => (
            <li key={`${p.name}-${p.counties.join()}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(p); }}>
              <strong>{p.name}</strong> <span className="muted">{p.counties.map(countyName).join(' and ')}</span>
            </li>
          ))}
        </ul>
      )}
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}
