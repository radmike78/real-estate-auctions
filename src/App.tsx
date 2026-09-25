import { useEffect, useMemo, useState } from 'react';
import { SAMPLE_PROPERTIES } from './data/sampleProperties';
import { applyFilters, DEFAULT_FILTERS, type Filters } from './lib/search';
import FiltersPanel from './components/FiltersPanel';
import ResultsList from './components/ResultsList';
import MapView from './components/MapView';
import PropertyPage from './components/PropertyPage';
import AboutPage from './components/AboutPage';
import LivePage from './components/LivePage';
import PreForeclosurePage from './components/PreForeclosurePage';
import ShortSalesPage from './components/ShortSalesPage';
import AgentsPage from './components/AgentsPage';
import AdminPage from './components/AdminPage';
import AdvertisePage from './components/AdvertisePage';
import AdvertiseApplyPage from './components/AdvertiseApplyPage';
import ApplicationConfirmPage from './components/ApplicationConfirmPage';
import FinancingPage from './components/FinancingPage';
import ProsPage from './components/ProsPage';
import ProProfilePage from './components/ProProfilePage';
import AdvertiserPage from './components/AdvertiserPage';
import { CATEGORIES, type Category } from './lib/pros';

type Route =
  | { page: 'search' }
  | { page: 'property'; id: string }
  | { page: 'about' }
  | { page: 'live' }
  | { page: 'preforeclosures' }
  | { page: 'shortsales' }
  | { page: 'agents'; shortSales: boolean }
  | { page: 'financing' }
  | { page: 'pros' }
  | { page: 'pro'; id: string }
  | { page: 'advertise' }
  | { page: 'apply'; category: Category | null }
  | { page: 'applicationConfirm'; token: string }
  | { page: 'admin' }
  | { page: 'advertiser'; token: string | null };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const m = h.match(/^property\/(.+)$/);
  if (m) return { page: 'property', id: m[1] };
  if (h === 'about') return { page: 'about' };
  if (h === 'live') return { page: 'live' };
  if (h === 'pre-foreclosures') return { page: 'preforeclosures' };
  if (h === 'short-sales') return { page: 'shortsales' };
  if (h === 'agents' || h === 'agents/short-sales') return { page: 'agents', shortSales: h.endsWith('short-sales') };
  if (h === 'financing') return { page: 'financing' };
  if (h === 'pros') return { page: 'pros' };
  const pro = h.match(/^pros\/([A-Za-z0-9]{1,64})$/);
  if (pro) return { page: 'pro', id: pro[1] };
  if (h === 'advertise') return { page: 'advertise' };
  const apply = h.match(/^(?:advertise\/apply(?:\/([a-z_]+))?|agents\/join)$/);
  if (apply) return { page: 'apply', category: h === 'agents/join' ? 'agent' : apply[1] && apply[1] in CATEGORIES ? (apply[1] as Category) : null };
  const confirm = h.match(/^advertise\/confirm(?:\/([A-Za-z0-9_-]+))?$/);
  if (confirm) return { page: 'applicationConfirm', token: confirm[1] ?? '' };
  if (h === 'admin') return { page: 'admin' };
  const adv = h.match(/^advertiser(?:\/login\/([A-Za-z0-9_-]+))?$/);
  if (adv) return { page: 'advertiser', token: adv[1] ?? null };
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
          <a href="#/live">Live tax sales</a>
          <a href="#/pre-foreclosures">Pre-foreclosures</a>
          <a href="#/short-sales">Short sales</a>
          <a href="#/agents">Find an agent</a>
          <a href="#/financing">Financing</a>
          <a href="#/pros">Title, insurance & repairs</a>
          <a href="#/advertise">Advertise</a>
          <a href="#/about">How it works</a>
        </nav>
      </header>

      <div className="banner" role="note">
        <strong>Search results use sample data.</strong> Every property, owner and document in search is fictional; verified
        official listings are under <a href="#/live">Live tax sales</a>. Real sales can be paid off,
        postponed or cancelled up to the last minute, so always verify with the official source before bidding. Nothing here is legal advice
        or a title determination.
      </div>

      {route.page === 'property' && <PropertyPage id={route.id} />}
      {route.page === 'about' && <AboutPage />}
      {route.page === 'live' && <LivePage />}
      {route.page === 'preforeclosures' && <PreForeclosurePage />}
      {route.page === 'shortsales' && <ShortSalesPage />}
      {route.page === 'financing' && <FinancingPage />}
      {route.page === 'pros' && <ProsPage />}
      {route.page === 'pro' && <ProProfilePage id={route.id} />}
      {route.page === 'advertise' && <AdvertisePage />}
      {route.page === 'apply' && <AdvertiseApplyPage key={route.category ?? ''} initialCategory={route.category} />}
      {route.page === 'applicationConfirm' && <ApplicationConfirmPage token={route.token} />}
      {route.page === 'admin' && <AdminPage />}
      {route.page === 'advertiser' && <AdvertiserPage key={route.token ?? ''} token={route.token} />}
      {route.page === 'agents' && <AgentsPage shortSales={route.shortSales} />}
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
