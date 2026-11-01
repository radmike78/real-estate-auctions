// "Where are you buying?": the visitor's state, then (optionally) their city. A city in more than one county asks
// which county. Saves to the visitor's area (myArea.ts), which the rest of the site follows.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { areaLabel, areaLong, useMyArea, type Area } from '../lib/myArea';
import { loadPlaces, matchPlaces, type Place } from '../lib/places';
import { STATES, countyName, type StateCode } from '../lib/regions';
import { useModal } from '../lib/useModal';

export function AreaPicker({ onDone, doneLabel = 'Done', extra, optional = false }: { onDone?: () => void; doneLabel?: string; extra?: ReactNode; /** The done button works with no state chosen (it just closes). */ optional?: boolean }) {
  const [area, setArea] = useMyArea();
  const [state, setState] = useState<StateCode | null>(area?.state ?? null);
  const [typed, setTyped] = useState(area?.city ?? '');
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [picked, setPicked] = useState<Place | null>(null);
  // The county of a city picked from the list, and, apart from it, a county chosen on its own (no city).
  const [county, setCounty] = useState<string | null>(area?.city ? area.county : null);
  const [countyOnly, setCountyOnly] = useState<string | null>(area && !area.city ? area.county : null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    let alive = true;
    setPlaces(null);
    loadPlaces(state).then((p) => {
      if (!alive) return;
      setPlaces(p);
      // The saved city, if it's still on the list: the box, the pick and its county together (also on coming back to
      // this state after looking at another).
      if (area?.state === state && area.city) {
        const pk = p.find((x) => x.name === area.city && (!area.county || x.counties.includes(area.county))) ?? null;
        setPicked(pk);
        if (pk) { setTyped(pk.name); setCounty(area.county); }
      }
    });
    return () => {
      alive = false;
    };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const matches = places && open && !picked ? matchPlaces(places, typed) : [];
  const choose = (p: Place) => {
    setPicked(p);
    setTyped(p.name);
    // A city in more than one county: the visitor says which county the property is in (deeds, courts and sales
    // go by county), rather than us picking the first one.
    setCounty(p.counties.length === 1 ? p.counties[0] : null);
    setOpen(false);
  };
  const st = STATES.find((x) => x.code === state);
  // A city typed but not picked from the list is unfinished: pick it, or clear the box (never save an older county).
  const unfinished = !!places && !picked && typed.trim().length > 0;
  const needsCounty = !!picked && picked.counties.length > 1 && !(county && picked.counties.includes(county));
  const save = () => {
    if (!state) {
      if (optional) onDone?.();
      return;
    }
    if (needsCounty || unfinished) return;
    // Cities still loading, same state: nothing was changed here, so keep the saved area as it is.
    if (!places && area?.state === state && countyOnly === (area.city ? null : area.county)) { onDone?.(); return; }
    // A city (and its county), or just a county, or just the state.
    const a: Area = picked && county ? { state, city: picked.name, county } : !picked && countyOnly && st?.counties.includes(countyOnly) ? { state, city: null, county: countyOnly } : { state, city: null, county: null };
    setArea(a);
    onDone?.();
  };

  return (
    <div className="area-pick">
      <fieldset className="area-states">
        <legend>Your state</legend>
        {STATES.map((s) => (
          <button key={s.code} type="button" aria-pressed={state === s.code} className={state === s.code ? 'on' : ''}
            onClick={() => { if (state !== s.code) { setState(s.code as StateCode); setPicked(null); setTyped(''); setCounty(null); setCountyOnly(null); } }}>
            {s.name}
          </button>
        ))}
      </fieldset>
      {state && (
        <div className="area-city">
          <label className="field">
            <span>Your city or town <span className="muted">(optional)</span></span>
            <input
              ref={input}
              role="combobox"
              aria-expanded={matches.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={matches.length ? `${listId}-${active}` : undefined}
              autoComplete="off"
              placeholder={places ? 'Start typing, e.g. Henderson' : 'Loading cities…'}
              disabled={!places}
              value={typed}
              onChange={(e) => { setTyped(e.target.value); if (picked) setCounty(null); /* that city's county goes with it */ setPicked(null); setOpen(true); setActive(0); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (!matches.length) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); choose(matches[active]); }
                else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
              }}
            />
          </label>
          {matches.length > 0 && (
            <ul id={listId} role="listbox" className="area-options">
              {matches.map((p, i) => (
                <li key={`${p.name}-${p.counties.join()}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                  className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); choose(p); }}>
                  <strong>{p.name}</strong> <span className="muted">{p.counties.map(countyName).join(' and ')}</span>
                </li>
              ))}
            </ul>
          )}
          {places && open && !picked && typed.trim().length > 1 && !matches.length && (
            <p className="small muted">No city by that name in {STATES.find((s) => s.code === state)?.name}. Check the spelling, or clear the box to skip it.</p>
          )}
          {!picked && st && !typed.trim() && (
            <label className="field">
              <span>Or just your county <span className="muted">(optional)</span></span>
              <select value={countyOnly && st.counties.includes(countyOnly) ? countyOnly : ''} onChange={(e) => setCountyOnly(e.target.value || null)}>
                <option value="">Not chosen</option>
                {st.counties.map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
              </select>
            </label>
          )}
          {picked && picked.counties.length > 1 && (
            <fieldset className="area-county">
              <legend>{picked.name} is in more than one county. Which county is the property in?</legend>
              <p className="small muted">Deeds, tax sales and courts go by county. Not sure? The appraisal district or tax bill for the address shows it.</p>
              {picked.counties.map((c) => (
                <label key={c} className="check"><input type="radio" name="area-county" checked={county === c} onChange={() => setCounty(c)} /> {countyName(c)}</label>
              ))}
            </fieldset>
          )}
        </div>
      )}
      <div className="row">
        <button type="button" className="btn" disabled={(!state && !optional) || needsCounty || unfinished} onClick={save}>{doneLabel}</button>
        {needsCounty && <span className="small muted">Choose the county first.</span>}
        {unfinished && !needsCounty && <span className="small muted">Choose a city from the list, or clear the city box.</span>}
        {extra ?? (area && <button type="button" className="btn btn-secondary" onClick={() => { setArea(null); onDone?.(); }}>Clear my area</button>)}
      </div>
    </div>
  );
}

/** "Your area" in the header: shows the chosen city (or state) and opens the picker. */
export function AreaButton() {
  const [area] = useMyArea();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="area-btn" onClick={() => setOpen(true)} aria-label={area ? `Your area: ${areaLabel(area)}. Change` : 'Choose your area'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        <span className="area-long">{area ? areaLabel(area) : 'Your area'}</span>
        {area && <span className="area-code" aria-hidden>{area.state}</span>}
      </button>
      {open && <AreaDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export function AreaDialog({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useModal(box, onClose);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);
  // Rendered on the page body: the header's blur effect would otherwise trap the dialog inside the header bar.
  return createPortal(
    <div className="role-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} className="role-dialog area-dialog" role="dialog" aria-modal="true" aria-labelledby="area-title">
        <h2 id="area-title">Where are you buying?</h2>
        <p className="small muted">We’ll show the rules, official sources and local professionals for your area. It’s kept only in this browser.</p>
        <AreaPicker onDone={onClose} />
      </div>
    </div>,
    document.body,
  );
}

/** "Your area: Henderson (Clark County) · Change": the saved area, on pages that use it, with a way to switch. */
export function AreaLine({ what, county = false }: { what: string; /** Asks for a county until one is chosen (the "Pick a county" step). */ county?: boolean }) {
  const [area] = useMyArea();
  const [open, setOpen] = useState(false);
  if (county) return (
    <p className="area-line">
      {area?.county ? <>Your area: <strong>{areaLong(area)}</strong>. {what}</> : area ? <>Your area: <strong>{areaLong(area)}</strong>, no county yet. Your county decides the sources, rules and checklists you see.</> : <>Your county decides the sources, rules and checklists you see.</>}{' '}
      <button type="button" className="linkish" onClick={() => setOpen(true)}>{area?.county ? 'Change' : 'Choose your county'}</button>
      {open && <AreaDialog onClose={() => setOpen(false)} />}
    </p>
  );
  return (
    <p className="area-line">
      {area ? <>Your area: <strong>{areaLong(area)}</strong>. {what}</> : <>Choose your city or county to see {what.replace(/^Showing /, '').replace(/\.$/, '')}.</>}{' '}
      <button type="button" className="linkish" onClick={() => setOpen(true)}>{area ? 'Change' : 'Choose your area'}</button>
      {open && <AreaDialog onClose={() => setOpen(false)} />}
    </p>
  );
}
