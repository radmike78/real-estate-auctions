import { useEffect, useMemo, useState } from 'react';
import { SAMPLE_PROPERTIES } from './data/sampleProperties';
import { applyFilters, DEFAULT_FILTERS, type Filters } from './lib/search';
import FiltersPanel from './components/FiltersPanel';
import ResultsList from './components/ResultsList';
import MapView from './components/MapView';
import PropertyPage from './components/PropertyPage';
import AboutPage from './components/AboutPage';

type Route = { page: 'search' } | { page: 'property'; id: string } | { page: 'about' };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const m = h.match(/^property\/(.+)$/);
  if (m) return { page: 'property', id: m[1] };
  if (h === 'about') return { page: 'about' };
  return { page: 'search' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const results = useMemo(() => applyFilters(SAMPLE_PROPERTIES, filters), [filters]);
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark" aria-hidden>◆</span> Forced-Sale Finder
        </a>
        <form
          className="searchbar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ location: locationInput });
            window.location.hash = '#/';
          }}
        >
          <input
            aria-label="Search location"
            placeholder="City, ST · ZIP · address · APN · county"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <nav>
          <a href="#/about">How it works</a>
        </nav>
      </header>

      <div className="banner" role="note">
        <strong>Prototype with sample data.</strong> Every property, owner and document here is fictional. Real sales can be paid off,
        postponed or cancelled up to the last minute, so always verify with the official source before bidding. Nothing here is legal advice
        or a title determination.
      </div>

      {route.page === 'property' && <PropertyPage id={route.id} />}
      {route.page === 'about' && <AboutPage />}
      {route.page === 'search' && (
        <main className="search-layout">
          <FiltersPanel filters={filters} onChange={update} onReset={() => { setFilters(DEFAULT_FILTERS); setLocationInput(''); }} />
          <section className="results">
            <div className="results-head">
              <div>
                <strong>{results.length}</strong> {results.length === 1 ? 'property' : 'properties'}
                {filters.location && <> matching “{filters.location}”</>}
                {filters.bounds && (
                  <button className="linkish" onClick={() => update({ bounds: null })}>
                    clear map area
                  </button>
                )}
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
            {view === 'map' ? (
              <MapView properties={results} onSearchArea={(bounds) => update({ bounds })} />
            ) : (
              <ResultsList properties={results} />
            )}
          </section>
        </main>
      )}
      <footer className="footer">
        Links go to official auction and agency sites. This site does not accept bids or funds.
      </footer>
    </div>
  );
}
