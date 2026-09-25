import { useMemo, useState, type FormEvent } from 'react';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { applyFilters, DEFAULT_FILTERS, type Filters } from '../lib/search';
import type { AcquisitionStatus, SaleType } from '../types';
import FiltersPanel from './FiltersPanel';
import ResultsList from './ResultsList';
import MapView from './MapView';
import Disclaimer from './Disclaimer';

interface Props {
  initialLocation?: string;
  initialSaleTypes?: SaleType[];
  initialStatuses?: AcquisitionStatus[];
}

export default function SearchPage({ initialLocation = '', initialSaleTypes = [], initialStatuses = [] }: Props) {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, location: initialLocation, saleTypes: initialSaleTypes, statuses: initialStatuses });
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [view, setView] = useState<'list' | 'map'>('list');
  const results = useMemo(() => applyFilters(SAMPLE_PROPERTIES, filters), [filters]);
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    update({ location: locationInput });
    history.replaceState(null, '', locationInput ? `#/search?q=${encodeURIComponent(locationInput)}` : '#/search');
  }

  return (
    <div className="search-page">
      <h1 className="sr-only">Property search</h1>
      <div className="search-top">
        <form className="searchbar" role="search" onSubmit={submit}>
          <input aria-label="Search location" placeholder="City, ST · ZIP · address · APN" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
          <button type="submit">Search</button>
        </form>
        <span className="pill">Sample data · Clark County, NV</span>
        <a className="small" href="#/live">Verified live tax sales →</a>
      </div>
      <main className="search-layout">
        <FiltersPanel filters={filters} onChange={update} onReset={() => { setFilters(DEFAULT_FILTERS); setLocationInput(''); }} />
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
                  <option value="equity">Estimated equity</option>
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
          {view === 'map' ? <MapView properties={results} onSearchArea={(bounds) => update({ bounds })} /> : <ResultsList properties={results} />}
          <Disclaimer kind="sales" compact />
        </section>
      </main>
    </div>
  );
}
