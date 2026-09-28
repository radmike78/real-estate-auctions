import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { SHOW_SAMPLE_DATA } from '../data';
import { useProperties } from '../data/live';
import { applyFilters, DEFAULT_FILTERS, type Filters } from '../lib/search';
import type { AcquisitionStatus, SaleType } from '../types';
import FiltersPanel from './FiltersPanel';
import ResultsList from './ResultsList';
import MapView from './MapView';
import Disclaimer from './Disclaimer';
import BuyerChecklistBox from './BuyerChecklistBox';
import { checklistForFilters } from '../lib/buyerChecklists';
import NoListingsYet from './NoListingsYet';
import PageHero from './PageHero';
import ClassSwitch from './ClassSwitch';
import { typesFor, type ClassFilter } from '../lib/propertyClass';

interface Props {
  initialLocation?: string;
  initialSaleTypes?: SaleType[];
  initialStatuses?: AcquisitionStatus[];
  initialClass?: ClassFilter;
}

/** The search as a link: location, sale types, statuses and residential/commercial. */
function searchHash(f: Filters): string {
  const q = new URLSearchParams();
  if (f.location) q.set('q', f.location);
  if (f.saleTypes.length) q.set('type', f.saleTypes.join(','));
  if (f.statuses.length) q.set('status', f.statuses.join(','));
  if (f.propertyClass !== 'all') q.set('class', f.propertyClass);
  const qs = q.toString();
  return qs ? `#/search?${qs}` : '#/search';
}

// The other filters (price, occupancy, sort, ...) don't fit in a short link; they're kept for this browser
// tab and restored when you come back to the same search.
const SAVED = 'fsf.search.filters.v1';
function saveFilters(f: Filters) {
  const hash = searchHash(f);
  if (location.hash !== hash) history.replaceState(history.state, '', hash);
  try {
    sessionStorage.setItem(SAVED, JSON.stringify({ hash, filters: { ...f, bounds: null } }));
  } catch {
    /* storage unavailable: the link still carries the main filters */
  }
}
function restoreFilters(fromLink: Filters): Filters {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SAVED) ?? 'null') as { hash?: string; filters?: Partial<Filters> } | null;
    if (!saved?.filters || saved.hash !== searchHash(fromLink)) return fromLink;
    const f = saved.filters;
    return {
      ...fromLink,
      purchasableOnly: f.purchasableOnly === true,
      bidding: f.bidding === 'online' || f.bidding === 'in_person' ? f.bidding : 'any',
      sort: f.sort === 'equity' || f.sort === 'minBid' || f.sort === 'updated' ? f.sort : 'auction',
      occupancy: typeof f.occupancy === 'string' ? (f.occupancy as Filters['occupancy']) : 'any',
      redemption: f.redemption === 'none' || f.redemption === 'has' ? f.redemption : 'any',
      auctionWithinDays: typeof f.auctionWithinDays === 'number' ? f.auctionWithinDays : null,
      maxMinimumBid: typeof f.maxMinimumBid === 'number' ? f.maxMinimumBid : null,
      minEquity: typeof f.minEquity === 'number' ? f.minEquity : null,
      propertyTypes: Array.isArray(f.propertyTypes) ? (f.propertyTypes.filter((t) => typeof t === 'string') as Filters['propertyTypes']) : [],
    };
  } catch {
    return fromLink;
  }
}

export default function SearchPage({ initialLocation = '', initialSaleTypes = [], initialStatuses = [], initialClass = 'all' }: Props) {
  const [filters, setFilters] = useState<Filters>(() => restoreFilters({ ...DEFAULT_FILTERS, location: initialLocation, saleTypes: initialSaleTypes, statuses: initialStatuses, propertyClass: initialClass }));
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [view, setView] = useState<'list' | 'map'>('list');
  const { properties, loading } = useProperties();
  const results = useMemo(() => applyFilters(properties, filters), [properties, filters]);
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  // Keep the address bar in step with the filters, so Back, reload and shared links show the same search.
  useEffect(() => saveFilters(filters), [filters]);

  const [filtersOpen, setFiltersOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia?.('(max-width: 800px)').matches);
  const activeFilters = filters.saleTypes.length + filters.statuses.length + filters.propertyTypes.length;
  const setClass = (c: ClassFilter) => update({ propertyClass: c, propertyTypes: filters.propertyTypes.filter((t) => typesFor(c).includes(t)) });

  function submit(e: FormEvent) {
    e.preventDefault();
    update({ location: locationInput });
  }

  if (properties.length === 0) {
    if (loading) return <main className="page"><h1 className="sr-only">Property search</h1><p>Checking the official lists…</p></main>;
    return (
      <main className="page">
        <PageHero
          eyebrow={<span className="eyebrow">Clark County · Official sources only</span>}
          title={<>Properties <span className="grad">for sale</span></>}
          sub="Forced-sale properties from official records: tax sales, foreclosures, bank-owned homes and more."
        />
        <NoListingsYet />
        <Disclaimer kind="sales" compact />
      </main>
    );
  }

  return (
    <div className="search-page">
      <div className="search-top">
        <h1 className="search-title">
          {filters.statuses.length > 0 && filters.statuses.every((s) => s === 'NOT_FOR_SALE_LIEN_ONLY') ? 'Liens on record in Clark County (not for sale)' : 'Properties for sale in Clark County'}
        </h1>
        <form className="searchbar" role="search" onSubmit={submit}>
          <input aria-label="Search location" placeholder="City, ZIP or address" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
          <button type="submit">Search</button>
        </form>
        <ClassSwitch value={filters.propertyClass} onChange={setClass} />
        {SHOW_SAMPLE_DATA && <span className="pill">Sample data · Clark County, NV</span>}
        <a className="small" href="#/live">Verified live tax sales →</a>
      </div>
      <main className="search-layout">
        {/* On phones the filters fold away behind one button, so results start right under the search bar. */}
        <details className="filters-wrap" open={filtersOpen} onToggle={(e) => setFiltersOpen((e.target as HTMLDetailsElement).open)}>
          <summary>Filters{activeFilters > 0 && ` (${activeFilters} on)`}</summary>
          <FiltersPanel filters={filters} onChange={update} onReset={() => { setFilters(DEFAULT_FILTERS); setLocationInput(''); }} />
        </details>
        <section className="results">
          <div className="results-head">
            <div>
              <strong>{results.length}</strong> {results.length === 1 ? 'property' : 'properties'}
              {filters.location && <> matching “{filters.location}”</>}
              {filters.bounds && <button className="linkish" onClick={() => update({ bounds: null })}>clear map area</button>}
            </div>
            <div className="results-controls">
              <label>
                Sort{' '}
                <select value={filters.sort} onChange={(e) => update({ sort: e.target.value as Filters['sort'] })}>
                  <option value="auction">Auction date</option>
                  <option value="equity">Estimated spread</option>
                  <option value="minBid">Minimum bid</option>
                  <option value="updated">Recently updated</option>
                </select>
              </label>
              <div className="seg" role="group" aria-label="View">
                <button aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
                <button aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button>
              </div>
            </div>
          </div>
          {(filters.saleTypes.length > 0 || filters.statuses.length > 0) && <BuyerChecklistBox list={checklistForFilters(filters.saleTypes, filters.statuses)} />}
          {view === 'map' ? <MapView properties={results} onSearchArea={(bounds) => update({ bounds })} /> : <ResultsList properties={results} />}
          <Disclaimer kind="sales" compact />
        </section>
      </main>
    </div>
  );
}
