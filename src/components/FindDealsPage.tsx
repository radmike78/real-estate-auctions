import { type ReactNode } from 'react';
import NarrowDown from './NarrowDown';
import { findDealsConfig } from '../lib/narrow';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import PathNext from './PathNext';
import { IconBank, IconBuilding, IconGavel, IconHome, IconLayers, IconSteps, IconFile } from './Icons';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { COUNTY_PAGES, nationalOfficialFor, officeLabelsFor, countyOfficeCards, OTHER_SITES, STATE_SALES, WHERE_TO_LOOK, countyKey, type DealSource } from '../lib/findDeals';
import { COUNTY_OFFICES } from '../lib/countyOffices';
import { useMarkStep, stepEyebrow } from '../lib/path';
import { useMyArea } from '../lib/myArea';
import CountySales from './CountySales';
import { upcomingCountySales } from '../lib/countySales';
import PlaceCombobox from './PlaceCombobox';
import { useLastActivity } from '../lib/journey';
import { FixedAds, useAdShows } from './AdBoxes';
import { useDirectory } from './ProDirectory';
import { useSpotCategories } from './AdSpot';

const NATIONAL_GROUPS: [NonNullable<DealSource['group']>, string][] = [
  ['government', 'Federal agencies'],
  ['gse', 'Fannie Mae and Freddie Mac'],
  ['bank', 'Banks'],
];

const DEFAULT_COUNTY: Record<StateCode, string> = { NV: 'Clark', CA: 'Los Angeles', AZ: 'Maricopa', UT: 'Salt Lake', TX: 'Harris' };

function SourceCard({ s }: { s: DealSource }) {
  const ext = s.url.startsWith('https://');
  return (
    <li>
      <a className="deal-source" href={s.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <strong>{s.name}{ext ? '\u00a0↗' : '\u00a0→'}</strong>
        <span>{s.what}</span>
      </a>
    </li>
  );
}

/** Step 5 of the path: where to look for deals in a state and county. */
/** One group of sources: its own panel, with a colored header bar, an icon and a large title, so groups are easy to tell apart. */
function Band({ tone, icon, title, sub, children, id, other }: { tone: 'county' | 'site' | 'rules' | 'national' | 'other'; icon: ReactNode; title: ReactNode; sub?: ReactNode; children: ReactNode; id?: string; other?: number }) {
  return (
    <section id={id} className={`deal-band tone-${tone}${other !== undefined ? ` other-${other}` : ''}`}>
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
  const openSources = (id: string) => { const target = document.getElementById(id); const panel = target?.closest('details'); if (panel) panel.open = true; target?.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  useLastActivity('#/find-deals', 'Find deals');
  // The visitor's area (myArea.ts): their state and county, from the city they chose or picked here.
  const [mine, setMine] = useMyArea();
  const { pros } = useDirectory();
  const adCats = useSpotCategories('finddeals');
  const adShows = useAdShows(adCats);
  const state: StateCode = mine?.state ?? 'NV';
  const area = { state, county: mine?.county ?? DEFAULT_COUNTY[state] };
  const setArea = (a: { state: StateCode; county: string }) =>
    setMine({ state: a.state, county: a.county, city: mine && mine.state === a.state && mine.county === a.county ? mine.city : null });
  const st = stateByCode(area.state)!;
  const local = COUNTY_PAGES[countyKey(area.state, area.county)];
  const offices = COUNTY_OFFICES[countyKey(area.state, area.county)];
  const missingOffices = officeLabelsFor(area.state).filter((o) => !offices?.[o.key]);
  const officeCards = countyOfficeCards(area.state, offices);
  const place = `${countyName(area.county)}, ${st.name}`;

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">{stepEyebrow('deals')}</span>}
        title={<>Find <span className="grad">deals</span></>}
        sub="Where to look for properties in your area, starting with the official sellers."
      >
        <div className="area-picker">
          <label className="field">
            <span>State</span>
            <select value={area.state} onChange={(e) => { const s = stateByCode(e.target.value)!; setArea({ state: s.code, county: DEFAULT_COUNTY[s.code] }); }}>
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>County</span>
            <select value={area.county} onChange={(e) => setArea({ ...area, county: e.target.value })}>
              {st.counties.map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
            </select>
          </label>
          {/* Optional: the city narrows Your Team and the ads to it; the sources below are the county's. */}
          <PlaceCombobox
            key={`${area.state}-${area.county}-${mine?.city ?? ''}`}
            state={area.state}
            label={mine?.city ? <>City: <strong>{mine.city}</strong></> : 'City or town (optional)'}
            hint={mine?.city ? undefined : `Cities and towns in ${countyName(area.county)}.`}
            keep={(p) => p.counties.includes(area.county)}
            onPick={(p) => setMine({ state: area.state, county: area.county, city: p.name })}
          />
          {mine?.city && <button type="button" className="linkish area-clear" onClick={() => setMine({ state: area.state, county: area.county, city: null })}>Clear city</button>}
        </div>
        {!mine && <p className="muted">Showing Clark County, Nevada. Pick your state and county above to see the official sources where you want to buy.</p>}
      </PageHero>

      <NarrowDown config={findDealsConfig()} intro="Answer two quick questions and we’ll point you to the best places to look first. Other sources stay available in the expandable groups below." />
      <p className="page-starter"><strong>Buying a home listed for sale?</strong> Ask a licensed agent to set up a search of homes on the local listing service (MLS) that match your buy box (your written limits: area, property type, price and condition). <strong>Found a property?</strong> Open it in <a href="#/analyze">Analyze</a> to get its checklist and your numbers, then save it.</p>
      <section aria-labelledby="search-routine">
        <h2 id="search-routine">Turn a search into one property worth checking</h2>
        <p>Find one property that fits your limits, record its source and price, then save it in Analyze.</p>
        <details><summary>See the five-step search routine</summary><ol>
          <li>Pick one area, property type and way of buying (listed home or auction) from your buy box.</li>
          <li>Search the sources below or ask your agent for matching MLS listings. Ask the seller or listing agent whether it’s still for sale and whether investors can buy it.</li>
          <li>Record the address or parcel, source link, date checked, asking price or minimum bid, sale type and payment deadline.</li>
          <li>Screen it against your limits. In <a href="#/analyze">Analyze</a>, enter and save a property that fits; put the source and missing facts in its evidence log.</li>
          <li>Before you offer or bid, check the rent, value, repairs, title, who lives there, allowed use, insurance and loan. A quick calculation is only a first screen.</li>
        </ol></details>
      </section>
      <section aria-label="Choose a purchase route"><h2>How do you want to buy?</h2><p>Choose a route to open the relevant official sources. You can switch or browse the other groups.</p><button type="button" className="btn" onClick={() => openSources('deals-national')}>Listed or bank-owned property</button>{' '}<button type="button" className="btn btn-secondary" onClick={() => openSources('deals-county')}>County auction</button></section>
      <h2 className="section-title">Official sources</h2>
      <p className="muted">Government agencies, Fannie Mae and Freddie Mac, and the banks that own the homes: the sellers themselves.</p>

      <details className="plan-section" name="deal-sources"><summary>County auctions and property research</summary>
      <Band id="deals-county" tone="county" icon={<IconFile />} title={`County offices: ${place}`} sub="The county’s own pages for tax sales, records and sheriff’s sales.">
        {officeCards.length > 0 ? (
          <>
            <ul className="deal-sources">{officeCards.map((s) => <SourceCard key={s.url} s={s} />)}</ul>
            {missingOffices.length > 0 && <OwlNote>Not yet listed for {place}: {missingOffices.map((o) => o.name).join(', ')}. A missing entry does not mean the office or a sale does not exist. Contact the county to find the office responsible for those services.</OwlNote>}
          </>
        ) : (
          <>
            <OwlNote>We’re still gathering {place}’s tax-sale office and records. Until then, these are the official sellers to look for there.</OwlNote>
            <ul className="where-to-look">
              {WHERE_TO_LOOK.map((w) => <li key={w.title}><strong>{w.title}.</strong> {w.what}</li>)}
            </ul>
          </>
        )}
      </Band>
      {upcomingCountySales(new Date(), { state: area.state, county: area.county }).length > 0 && (
        <Band tone="county" icon={<IconFile />} title={`Upcoming tax sales: ${place}`} sub="Dates and the county’s own property list, from the county’s site.">
          <CountySales sales={upcomingCountySales(new Date(), { state: area.state, county: area.county })} />
        </Band>
      )}
      {local && (
        <Band tone="site" icon={<IconLayers />} title={`On DeedOwl for ${countyName(area.county)}`} sub="Live sale lists and step-by-step guides on this site.">
          <ul className="deal-sources">{local.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
        </Band>
      )}
      <Band id="deals-rules" tone="rules" icon={<IconSteps />} title={`How sales work in ${st.name}`}>
        <ul className="state-sales-list">{STATE_SALES[area.state].map((t) => {
          // "Tax sales: …" → the topic in bold, so readers can scan.
          const m = t.match(/^([A-Z][^:.]{1,40}):\s(.*)$/s);
          return <li key={t}>{m ? <><strong>{m[1]}:</strong> {m[2]}</> : t}</li>;
        })}</ul>
        <a className="band-link" href="#/learn/forced-sales">Read the lesson on forced sales&nbsp;→</a>
      </Band>
      </details>
      <details className="plan-section" name="deal-sources"><summary>Government and bank-owned listings</summary>
      <Band id="deals-national" tone="national" icon={<IconBank />} title={`Across ${st.name} and nationwide`} sub="Federal agencies, Fannie Mae and Freddie Mac, and banks selling homes they own.">
        {NATIONAL_GROUPS.map(([g, label]) => {
          const xs = nationalOfficialFor(st.name).filter((s) => s.group === g);
          return xs.length ? (
            <div key={g} className="deal-group">
              <h4 className="deal-group-head">{label}</h4>
              <ul className="deal-sources">{xs.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
            </div>
          ) : null;
        })}
      </Band>

      </details>
      {adShows && <FixedAds pros={pros} categories={adCats} placeholder />}
      <details className="plan-section"><summary>Other sites (not the official seller)</summary>
      <h2 className="section-title">Other sites</h2>
      <p className="other-sites-note">
        These listing sites and private auction companies can help you find properties, but listings may be
        out of date or already sold, and auction companies add their own fees. Confirm every property with the seller, and read each site’s terms.
      </p>
      {OTHER_SITES.map((g, i) => (
        <Band key={g.group} tone="other" icon={[<IconHome key="h" />, <IconGavel key="g" />, <IconBuilding key="b" />][i % 3]} title={g.group} other={i % 3}>
          <ul className="deal-sources other">{g.sites.map((s) => <SourceCard key={s.name} s={s} />)}</ul>
        </Band>
      ))}

      </details>
      <PathNext step="deals" />
    </main>
  );
}
