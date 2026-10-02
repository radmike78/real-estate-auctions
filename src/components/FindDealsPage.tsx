import { useEffect, useState, type ReactNode } from 'react';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import PathNext from './PathNext';
import { IconBank, IconHome, IconLayers, IconSearch, IconSteps, IconFile } from './Icons';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { COUNTY_PAGES, nationalOfficialFor, OFFICE_LABELS, OTHER_SITES, STATE_SALES, WHERE_TO_LOOK, countyKey, type DealSource } from '../lib/findDeals';
import { COUNTY_OFFICES } from '../lib/countyOffices';
import { useMarkStep } from '../lib/path';
import { getMyState, setMyState, useMyState } from '../lib/myState';

const AREA_KEY = 'deedowl.area.v1';

const DEFAULT_COUNTY: Record<StateCode, string> = { NV: 'Clark', CA: 'Los Angeles', AZ: 'Maricopa', UT: 'Salt Lake' };

/** The saved county, in the visitor's chosen state when they have one. */
function loadArea(): { state: StateCode; county: string } {
  const mine = getMyState();
  try {
    const v = JSON.parse(localStorage.getItem(AREA_KEY) ?? 'null');
    const st = v && stateByCode(v.state);
    if (st && st.counties.includes(v.county) && (!mine || mine === st.code)) return { state: st.code, county: v.county };
  } catch {
    /* fall through to the default */
  }
  const state = mine ?? 'NV';
  return { state, county: DEFAULT_COUNTY[state] };
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
/** One group of sources: its own panel, with a colored header bar, an icon and a large title, so groups are easy to tell apart. */
function Band({ tone, icon, title, sub, children }: { tone: 'county' | 'site' | 'rules' | 'national' | 'other'; icon: ReactNode; title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className={`deal-band tone-${tone}`}>
      <header className="band-head">
        <span className="band-icon" aria-hidden>{icon}</span>
        <div>
          <h3>{title}</h3>
          {sub && <p>{sub}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export default function FindDealsPage() {
  useMarkStep('deals');
  const [area, setArea] = useState(loadArea);
  const [mine] = useMyState();
  // Choosing a state anywhere else on the site moves Find Deals to it.
  useEffect(() => {
    if (mine && mine !== area.state) setArea({ state: mine, county: DEFAULT_COUNTY[mine] });
  }, [mine]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      localStorage.setItem(AREA_KEY, JSON.stringify(area));
    } catch {
      /* private mode: the choice isn't kept */
    }
  }, [area]);
  const st = stateByCode(area.state)!;
  const local = COUNTY_PAGES[countyKey(area.state, area.county)];
  const offices = COUNTY_OFFICES[countyKey(area.state, area.county)];
  const officeCards: DealSource[] = offices
    ? OFFICE_LABELS.flatMap((o) => {
        const x = offices[o.key];
        if (!x) return [];
        // Two offices can share a page (a combined assessor-recorder); list it once.
        return [{ name: o.name, url: x.url, what: x.note ? `${o.what} ${x.note}` : o.what }];
      }).filter((c, i, all) => all.findIndex((d) => d.url === c.url) === i)
    : [];
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
            <select value={area.state} onChange={(e) => { const s = stateByCode(e.target.value)!; setArea({ state: s.code, county: DEFAULT_COUNTY[s.code] }); setMyState(s.code); }}>
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

      <Band tone="county" icon={<IconFile />} title={`County offices: ${place}`} sub="The county’s own pages for tax sales, records and sheriff’s sales.">
        {officeCards.length > 0 ? (
          <ul className="deal-sources">{officeCards.map((s) => <SourceCard key={s.url} s={s} />)}</ul>
        ) : (
          <>
            <OwlNote>We’re still gathering {place}’s tax-sale office and records. Until then, these are the official sellers to look for there.</OwlNote>
            <ul className="where-to-look">
              {WHERE_TO_LOOK.map((w) => <li key={w.title}><strong>{w.title}.</strong> {w.what}</li>)}
            </ul>
          </>
        )}
      </Band>
      {local && (
        <Band tone="site" icon={<IconLayers />} title={`On DeedOwl for ${countyName(area.county)}`} sub="Live sale lists and step-by-step guides on this site.">
          <ul className="deal-sources">{local.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
        </Band>
      )}
      <Band tone="rules" icon={<IconSteps />} title={`How sales work in ${st.name}`}>
        <ul className="state-sales-list">{STATE_SALES[area.state].map((t) => <li key={t}>{t}</li>)}</ul>
        <a className="band-link" href="#/learn/forced-sales">Read the lesson on forced sales →</a>
      </Band>
      <Band tone="national" icon={<IconBank />} title={`Across ${st.name} and nationwide`} sub="Federal agencies, Fannie Mae and Freddie Mac, and banks selling homes they own.">
        <ul className="deal-sources">{nationalOfficialFor(st.name).map((s) => <SourceCard key={s.name} s={s} />)}</ul>
      </Band>

      <h2 className="section-title">Other sites</h2>
      <p className="other-sites-note">
        <strong>Not the official seller.</strong> These listing sites and private auction companies can help you find properties, but listings may be
        out of date or already sold, and auction companies add their own fees. Confirm every property with the seller, and read each site’s terms.
      </p>
      {OTHER_SITES.map((g, i) => (
        <Band key={g.group} tone="other" icon={[<IconHome key="h" />, <IconSearch key="s" />, <IconBank key="b" />][i % 3]} title={g.group}>
          <ul className="deal-sources other">{g.sites.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
        </Band>
      ))}

      <PathNext step="deals" />
    </main>
  );
}
