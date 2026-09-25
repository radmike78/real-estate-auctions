import { useEffect, useState } from 'react';
import SearchPage from './components/SearchPage';
import HomePage from './components/HomePage';
import SiteHeader from './components/SiteHeader';
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
import DisclaimerPage from './components/DisclaimerPage';
import RoleNotice from './components/RoleNotice';
import { ROLE_SHORT } from './lib/disclaimers';
import { CATEGORIES, type Category } from './lib/pros';
import { SALE_TYPE_LABEL } from './lib/rules';
import { STATUS } from './lib/status';
import type { AcquisitionStatus, SaleType } from './types';

type Route =
  | { page: 'home' }
  | { page: 'search'; q: string; types: SaleType[]; statuses: AcquisitionStatus[] }
  | { page: 'property'; id: string; section?: string }
  | { page: 'about'; section?: string }
  | { page: 'live' }
  | { page: 'preforeclosures'; q: string; section?: string }
  | { page: 'shortsales'; section?: string }
  | { page: 'agents'; shortSales: boolean; q: string }
  | { page: 'financing'; q: string }
  | { page: 'pros'; q: string }
  | { page: 'pro'; id: string }
  | { page: 'advertise' }
  | { page: 'apply'; category: Category | null }
  | { page: 'applicationConfirm'; token: string }
  | { page: 'admin' }
  | { page: 'advertiser'; token: string | null }
  | { page: 'disclaimer'; section?: string };

function hashPath(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

function parseHash(): Route {
  const full = hashPath();
  const [h, query = ''] = full.split('?');
  let params = new URLSearchParams();
  try {
    params = new URLSearchParams(query);
  } catch {
    /* ignore malformed query */
  }
  const q = params.get('q')?.slice(0, 100) ?? '';
  // Only known sale types / statuses are accepted from the URL.
  const list = (k: string) => (params.get(k) ?? '').split(',').filter(Boolean);
  if (h === '') return { page: 'home' };
  if (h === 'search') {
    return {
      page: 'search',
      q,
      types: list('type').filter((t): t is SaleType => t in SALE_TYPE_LABEL),
      statuses: list('status').filter((t): t is AcquisitionStatus => t in STATUS),
    };
  }
  const m = h.match(/^property\/([^/]+)(?:\/([a-z-]+))?$/);
  if (m) return { page: 'property', id: m[1], section: m[2] };
  // Pages split into sections take an optional /section suffix.
  const sub = h.match(/^(about|pre-foreclosures|short-sales|disclaimer)(?:\/([a-z-]+))?$/);
  if (sub?.[1] === 'about') return { page: 'about', section: sub[2] };
  if (h === 'live') return { page: 'live' };
  if (sub?.[1] === 'pre-foreclosures') return { page: 'preforeclosures', q, section: sub[2] };
  if (sub?.[1] === 'short-sales') return { page: 'shortsales', section: sub[2] };
  if (h === 'agents' || h === 'agents/short-sales') return { page: 'agents', shortSales: h.endsWith('short-sales'), q };
  if (h === 'financing') return { page: 'financing', q };
  if (h === 'pros') return { page: 'pros', q };
  const pro = h.match(/^pros\/([A-Za-z0-9]{1,64})$/);
  if (pro) return { page: 'pro', id: pro[1] };
  if (h === 'advertise') return { page: 'advertise' };
  const apply = h.match(/^(?:advertise\/apply(?:\/([a-z_]+))?|agents\/join)$/);
  if (apply) return { page: 'apply', category: h === 'agents/join' ? 'agent' : apply[1] && apply[1] in CATEGORIES ? (apply[1] as Category) : null };
  const confirm = h.match(/^advertise\/confirm(?:\/([A-Za-z0-9_-]+))?$/);
  if (confirm) return { page: 'applicationConfirm', token: confirm[1] ?? '' };
  if (h === 'admin') return { page: 'admin' };
  if (sub?.[1] === 'disclaimer') return { page: 'disclaimer', section: sub[2] };
  const adv = h.match(/^advertiser(?:\/login\/([A-Za-z0-9_-]+))?$/);
  if (adv) return { page: 'advertiser', token: adv[1] ?? null };
  return { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [path, setPath] = useState(hashPath);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setPath(hashPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className={`app${route.page === 'home' ? ' app-home' : ''}`}>
      <SiteHeader current={path} />
      {route.page === 'home' && <HomePage />}
      {route.page === 'search' && (
        <SearchPage key={`${route.q}|${route.types}|${route.statuses}`} initialLocation={route.q} initialSaleTypes={route.types} initialStatuses={route.statuses} />
      )}
      {route.page === 'property' && <PropertyPage id={route.id} section={route.section} />}
      {route.page === 'about' && <AboutPage section={route.section} />}
      {route.page === 'live' && <LivePage />}
      {route.page === 'preforeclosures' && <PreForeclosurePage key={route.q} initialQuery={route.q} section={route.section} />}
      {route.page === 'shortsales' && <ShortSalesPage section={route.section} />}
      {route.page === 'financing' && <FinancingPage key={route.q} initialLocation={route.q} />}
      {route.page === 'pros' && <ProsPage key={route.q} initialLocation={route.q} />}
      {route.page === 'pro' && <ProProfilePage id={route.id} />}
      {route.page === 'advertise' && <AdvertisePage />}
      {route.page === 'apply' && <AdvertiseApplyPage key={route.category ?? ''} initialCategory={route.category} />}
      {route.page === 'applicationConfirm' && <ApplicationConfirmPage token={route.token} />}
      {route.page === 'admin' && <AdminPage />}
      {route.page === 'disclaimer' && <DisclaimerPage section={route.section} />}
      {route.page === 'advertiser' && <AdvertiserPage key={route.token ?? ''} token={route.token} />}
      {route.page === 'agents' && <AgentsPage key={`${route.shortSales}${route.q}`} shortSales={route.shortSales} initialQuery={route.q} />}
      <footer className="footer">
        <span>{ROLE_SHORT}</span>
        <nav aria-label="Footer">
          <a href="#/disclaimer">Our role</a>
          <a href="#/about">How it works</a>
          <a href="#/advertise">Advertise</a>
          <a href="#/advertiser">Advertiser sign-in</a>
        </nav>
      </footer>
      <RoleNotice />
    </div>
  );
}
