import { useMemo, useState, type FormEvent } from 'react';
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
import ClassSwitch from './ClassSwitch';
import { typesFor, type ClassFilter } from '../lib/propertyClass';

interface Props {
  initialLocation?: string;
  initialSaleTypes?: SaleType[];
  initialStatuses?: AcquisitionStatus[];
  initialClass?: ClassFilter;
}

export default function SearchPage({ initialLocation = '', initialSaleTypes = [], initialStatuses = [], initialClass = 'all' }: Props) {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, location: initialLocation, saleTypes: initialSaleTypes, statuses: initialStatuses, propertyClass: initialClass });
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [view, setView] = useState<'list' | 'map'>('list');
  const { properties, loading } = useProperties();
  const results = useMemo(() => applyFilters(properties, filters), [properties, filters]);
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  const [filtersOpen, setFiltersOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia?.('(max-width: 800px)').matches);
  const activeFilters = filters.saleTypes.length + filters.statuses.length + filters.propertyTypes.length;
  const setClass = (c: ClassFilter) => update({ propertyClass: c, propertyTypes: filters.propertyTypes.filter((t) => typesFor(c).includes(t)) });

  function submit(e: FormEvent) {
    e.preventDefault();
    update({ location: locationInput });
    history.replaceState(null, '', locationInput ? `#/search?q=${encodeURIComponent(locationInput)}` : '#/search');
  }

  if (properties.length === 0) {
    if (loading) return <main className="page"><h1 className="sr-only">Property search</h1><p>Checking the official lists…</p></main>;
    return (
      <main className="page">
        <h1 className="sr-only">Property search</h1>
        <NoListingsYet />
        <Disclaimer kind="sales" compact />
      </main>
    );
  }

  return (
    <div className="search-page">
      <div className="search-top">
        <h1 className="search-title">Properties for sale in Clark County</h1>
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
              <div className="seg" role="tablist" aria-label="View">
                <button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>List</button>
                <button role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}>Map</button>
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
