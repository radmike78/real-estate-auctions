import { useEffect, useState } from 'react';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import PathNext from './PathNext';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { COUNTY_PAGES, NATIONAL_OFFICIAL, OTHER_SITES, WHERE_TO_LOOK, countyKey, type DealSource } from '../lib/findDeals';
import { useMarkStep } from '../lib/path';

const AREA_KEY = 'deedowl.area.v1';

function loadArea(): { state: StateCode; county: string } {
  try {
    const v = JSON.parse(localStorage.getItem(AREA_KEY) ?? 'null');
    const st = v && stateByCode(v.state);
    if (st && st.counties.includes(v.county)) return { state: st.code, county: v.county };
  } catch {
    /* fall through to the default */
  }
  return { state: 'NV', county: 'Clark' };
}

function SourceCard({ s }: { s: DealSource }) {
  const ext = s.url.startsWith('https://');
  return (
    <li>
      <a className="deal-source" href={s.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <strong>{s.name}{ext ? ' ↗' : ' →'}</strong>
        <span>{s.what}</span>
      </a>
    </li>
  );
}

/** Step 5 of the path: where to look for deals in a state and county. */
export default function FindDealsPage() {
  useMarkStep('deals');
  const [area, setArea] = useState(loadArea);
  useEffect(() => {
    try {
      localStorage.setItem(AREA_KEY, JSON.stringify(area));
    } catch {
      /* private mode: the choice isn't kept */
    }
  }, [area]);
  const st = stateByCode(area.state)!;
  const local = COUNTY_PAGES[countyKey(area.state, area.county)];
  const place = `${countyName(area.county)}, ${st.name}`;

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 5 of 6</span>}
        title={<>Find <span className="grad">deals</span></>}
        sub="Where to look for properties in your area, starting with the official sellers."
      >
        <div className="area-picker">
          <label className="field">
            <span>State</span>
            <select value={area.state} onChange={(e) => { const s = stateByCode(e.target.value)!; setArea({ state: s.code, county: s.counties[0] }); }}>
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>County</span>
            <select value={area.county} onChange={(e) => setArea({ ...area, county: e.target.value })}>
              {st.counties.map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
            </select>
          </label>
        </div>
      </PageHero>

      <h2 className="section-title">Official sources</h2>
      <p className="muted">Government agencies, Fannie Mae and Freddie Mac, and the banks that own the homes: the sellers themselves.</p>

      <h3>In {place}</h3>
      {local ? (
        <ul className="deal-sources">{local.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
      ) : (
        <>
          <OwlNote>We’re still gathering {place}’s tax-sale office, auction schedule and local rules. Until then, these are the official sellers to look for there.</OwlNote>
          <ul className="where-to-look">
            {WHERE_TO_LOOK.map((w) => <li key={w.title}><strong>{w.title}.</strong> {w.what}</li>)}
          </ul>
        </>
      )}

      <h3>Across {st.name} and nationwide</h3>
      <ul className="deal-sources">{NATIONAL_OFFICIAL.map((s) => <SourceCard key={s.name} s={s} />)}</ul>

      <h2 className="section-title">Other sites</h2>
      <p className="other-sites-note">
        <strong>Not the official seller.</strong> These listing sites and private auction companies can help you find properties, but listings may be
        out of date or already sold, and auction companies add their own fees. Confirm every property with the seller, and read each site’s terms.
      </p>
      {OTHER_SITES.map((g) => (
        <section key={g.group}>
          <h3>{g.group}</h3>
          <ul className="deal-sources other">{g.sites.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
        </section>
      ))}

      <PathNext step="deals" />
    </main>
  );
}
