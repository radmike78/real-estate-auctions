import { useEffect, useState } from 'react';
import SearchPage from './components/SearchPage';
import HomePage from './components/HomePage';
import SiteHeader from './components/SiteHeader';
import PropertyPage from './components/PropertyPage';
import AboutPage from './components/AboutPage';
import LivePage from './components/LivePage';
import PreForeclosurePage from './components/PreForeclosurePage';
import ShortSalesPage from './components/ShortSalesPage';
import BankOwnedPage from './components/BankOwnedPage';
import BusinessAssetsPage from './components/BusinessAssetsPage';
import FindAProPage from './components/FindAProPage';
import { proGuideByKey } from './lib/proGuide';
import AdminPage from './components/AdminPage';
import AdvertisePage from './components/AdvertisePage';
import AdvertiseApplyPage from './components/AdvertiseApplyPage';
import ApplicationConfirmPage from './components/ApplicationConfirmPage';
import FinancingPage from './components/FinancingPage';
import ProProfilePage from './components/ProProfilePage';
import AdvertiserPage from './components/AdvertiserPage';
import DisclaimerPage from './components/DisclaimerPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import LessonPage from './components/LessonPage';
import ReadingPage from './components/ReadingPage';
import PropertyTypePage from './components/PropertyTypePage';
import { lessonByKey } from './lib/lessons';
import { topicBySlug } from './lib/deep/propertyTopics';
import LearnPage from './components/LearnPage';
import DecidePage from './components/DecidePage';
import FindDealsPage from './components/FindDealsPage';
import AnalyzePage from './components/AnalyzePage';
import PracticePage from './components/PracticePage';
import PracticeScenarioPage from './components/PracticeScenarioPage';
import DrillPage from './components/DrillPage';
import ToolkitPage from './components/ToolkitPage';
import PlaybookPage from './components/PlaybookPage';
import DealsPage from './components/DealsPage';
import HomeownerHelpPage from './components/HomeownerHelpPage';
import GuidesPage from './components/GuidesPage';
import AlertsPage, { type AlertsMode } from './components/AlertsPage';
import RoleNotice from './components/RoleNotice';
import { ROLE_SHORT, SOURCES_AND_ADVICE } from './lib/disclaimers';
import { CATEGORIES, type Category } from './lib/pros';
import { SALE_TYPE_LABEL } from './lib/rules';
import { STATUS } from './lib/status';
import type { AcquisitionStatus, SaleType } from './types';
import { outboundAction, sitePageFor } from './lib/siteStats';
import { parseClass, type ClassFilter } from './lib/propertyClass';
import { trackAction, trackPage } from './lib/track';

type Route =
  | { page: 'home' }
  | { page: 'search'; q: string; types: SaleType[]; statuses: AcquisitionStatus[]; cls: ClassFilter }
  | { page: 'property'; id: string; section?: string }
  | { page: 'about'; section?: string }
  | { page: 'live' }
  | { page: 'preforeclosures'; q: string; section?: string }
  | { page: 'shortsales'; section?: string }
  | { page: 'bankowned'; section?: string }
  | { page: 'businessassets'; section?: string }
  | { page: 'findpro'; section?: string }
  | { page: 'financing'; q: string }
  | { page: 'pro'; id: string }
  | { page: 'advertise' }
  | { page: 'apply'; category: Category | null }
  | { page: 'applicationConfirm'; token: string }
  | { page: 'admin' }
  | { page: 'advertiser'; token: string | null }
  | { page: 'disclaimer'; section?: string }
  | { page: 'privacy'; section?: string }
  | { page: 'terms'; section?: string }
  | { page: 'analyze' }
  | { page: 'learn' }
  | { page: 'lesson'; key: string }
  | { page: 'reading' }
  | { page: 'propertyType'; slug: string }
  | { page: 'decide' }
  | { page: 'finddeals' }
  | { page: 'deals' }
  | { page: 'homeowner' }
  | { page: 'guides'; q: string }
  | { page: 'alerts'; mode: AlertsMode; token: string; welcome: boolean; add?: string }
  | { page: 'playbook'; key?: string; section?: string }
  | { page: 'practice'; sale?: string }
  | { page: 'practiceRun'; id: string; stage?: string }
  | { page: 'drill'; id: string }
  | { page: 'toolkit'; section?: string }
  | { page: 'notFound' };

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
      cls: parseClass(params.get('class')),
    };
  }
  const m = h.match(/^property\/([^/]+)(?:\/([a-z-]+))?$/);
  if (m) return { page: 'property', id: m[1], section: m[2] };
  // Pages split into sections take an optional /section suffix.
  const sub = h.match(/^(about|pre-foreclosures|short-sales|bank-owned|business-assets|disclaimer|privacy|terms)(?:\/([a-z-]+))?$/);
  if (sub?.[1] === 'about') return { page: 'about', section: sub[2] };
  if (h === 'live') return { page: 'live' };
  if (sub?.[1] === 'pre-foreclosures') return { page: 'preforeclosures', q, section: sub[2] };
  if (sub?.[1] === 'short-sales') return { page: 'shortsales', section: sub[2] };
  if (sub?.[1] === 'bank-owned') return { page: 'bankowned', section: sub[2] };
  if (sub?.[1] === 'business-assets') return { page: 'businessassets', section: sub[2] };
  // Your deal team (the Find a pro tab): #/pros, and #/pros/<kind of professional>. Other #/pros/<id> are advertiser profiles.
  const fp = h.match(/^(?:pros|find-a-pro)(?:\/([a-z_]+))?$/);
  if (fp && (!fp[1] || fp[1] === 'all' || proGuideByKey(fp[1]))) return { page: 'findpro', section: fp[1] };
  // The old license-check page now lands on the agent section of Find a pro.
  if (h === 'agents' || h === 'agents/short-sales') return { page: 'findpro', section: 'agent' };
  if (h === 'financing') return { page: 'financing', q };
  const pro = h.match(/^pros\/([A-Za-z0-9]{1,64})$/);
  if (pro) return { page: 'pro', id: pro[1] };
  if (h === 'advertise') return { page: 'advertise' };
  const apply = h.match(/^(?:advertise\/apply(?:\/([a-z_]+))?|agents\/join)$/);
  if (apply) return { page: 'apply', category: h === 'agents/join' ? 'agent' : apply[1] && apply[1] in CATEGORIES ? (apply[1] as Category) : null };
  const confirm = h.match(/^advertise\/confirm(?:\/([A-Za-z0-9_-]+))?$/);
  if (confirm) return { page: 'applicationConfirm', token: confirm[1] ?? '' };
  if (h === 'admin') return { page: 'admin' };
  if (h === 'calculator' || h === 'analyze') return { page: 'analyze' };
  if (h === 'learn') return { page: 'learn' };
  const lesson = h.match(/^learn\/([a-z-]{1,30})$/);
  if (h === 'learn/reading') return { page: 'reading' };
  const ptype = h.match(/^learn\/types\/([a-z-]{1,30})$/);
  if (ptype && topicBySlug(ptype[1])) return { page: 'propertyType', slug: ptype[1] };
  if (lesson && lessonByKey(lesson[1])) return { page: 'lesson', key: lesson[1] };
  if (h === 'decide') return { page: 'decide' };
  if (h === 'find-deals') return { page: 'finddeals' };
  if (h === 'deals') return { page: 'deals' };
  if (h === 'homeowner-help') return { page: 'homeowner' };
  if (h === 'guides') return { page: 'guides', q };
  const al = h.match(/^alerts(?:\/(confirm|manage|unsubscribe)\/([A-Za-z0-9._-]{1,100}))?$/);
  if (al) return { page: 'alerts', mode: (al[1] as AlertsMode | undefined) ?? 'signup', token: al[2] ?? '', welcome: params.get('welcome') === '1', add: params.get('add')?.slice(0, 210) ?? undefined };
  if (h === 'practice') {
    const sale = params.get('sale') ?? undefined;
    return { page: 'practice', sale: sale && /^[a-z]{2,12}$/.test(sale) ? sale : undefined };
  }
  const tk = h.match(/^toolkit(?:\/(buy-box))?$/);
  if (tk) return { page: 'toolkit', section: tk[1] };
  const drill = h.match(/^practice\/drills\/([a-z0-9-]{2,40})$/);
  if (drill) return { page: 'drill', id: drill[1] };
  if (h === 'practice/drills') return { page: 'practice' };
  const pr = h.match(/^practice\/([a-z]{2,12}-[a-z-]{2,30})(?:\/([a-z]{2,20}))?$/);
  if (pr) return { page: 'practiceRun', id: pr[1], stage: pr[2] };
  const pb = h.match(/^playbooks(?:\/([a-z]+)(?:\/([a-z-]+))?)?$/);
  if (pb) return { page: 'playbook', key: pb[1], section: pb[2] };
  if (sub?.[1] === 'disclaimer') return { page: 'disclaimer', section: sub[2] };
  if (sub?.[1] === 'privacy') return { page: 'privacy', section: sub[2] };
  if (sub?.[1] === 'terms') return { page: 'terms', section: sub[2] };
  const adv = h.match(/^advertiser(?:\/login\/([A-Za-z0-9_-]+))?$/);
  if (adv) return { page: 'advertiser', token: adv[1] ?? null };
  return { page: 'notFound' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [path, setPath] = useState(hashPath);
  // Counts real navigations. Search rewrites its own URL (replaceState) as filters change, so the route
  // alone can look unchanged when someone clicks back to plain #/search; this makes that a fresh page.
  const [nav, setNav] = useState(0);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setPath(hashPath());
      setNav((n) => n + 1);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Anonymous site stats: one page view per navigation (section name only), and which kinds of
  // outside sources people go on to check.
  useEffect(() => {
    const page = sitePageFor(route.page);
    if (page) trackPage(page);
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  // Each page gets its own browser-tab title from its main heading (bookmarks, history, screen readers).
  useEffect(() => {
    const t = window.setTimeout(() => {
      const h1 = document.querySelector('main h1, h1')?.textContent?.trim();
      document.title = route.page === 'home' || !h1 ? 'DeedOwl · Learn real estate investing, step by step' : `${h1.slice(0, 70)} · DeedOwl`;
    }, 60);
    return () => window.clearTimeout(t);
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      const action = a ? outboundAction((a as HTMLAnchorElement).href) : null;
      if (action && sitePageFor(route.page)) trackAction(action);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [route.page]);

  return (
    <div className={`app${route.page === 'home' ? ' app-home' : ''}`}>
      <SiteHeader current={path} nav={nav} />
      <RoleNotice />
      {route.page === 'home' && <HomePage />}
      {route.page === 'notFound' && (
        <main className="page empty-page">
          <img className="owl-empty" src="logo.svg" alt="" width={128} height={128} />
          <h1>We couldn’t find that page</h1>
          <p>Even owls miss one sometimes. The link may be old or mistyped.</p>
          <p className="row"><a className="btn" href="#/">Go to the home page</a> <a className="btn btn-secondary" href="#/search">Find properties</a></p>
        </main>
      )}
      {route.page === 'search' && (
        <SearchPage key={`${nav}|${route.q}|${route.types}|${route.statuses}|${route.cls}`} initialLocation={route.q} initialSaleTypes={route.types} initialStatuses={route.statuses} initialClass={route.cls} />
      )}
      {route.page === 'property' && <PropertyPage key={route.id} id={route.id} section={route.section} />}
      {route.page === 'about' && <AboutPage section={route.section} />}
      {route.page === 'live' && <LivePage />}
      {route.page === 'preforeclosures' && <PreForeclosurePage key={route.q} initialQuery={route.q} section={route.section} />}
      {route.page === 'shortsales' && <ShortSalesPage section={route.section} />}
      {route.page === 'bankowned' && <BankOwnedPage section={route.section} />}
      {route.page === 'businessassets' && <BusinessAssetsPage section={route.section} />}
      {route.page === 'financing' && <FinancingPage key={route.q} initialLocation={route.q} />}
      {route.page === 'pro' && <ProProfilePage id={route.id} />}
      {route.page === 'advertise' && <AdvertisePage />}
      {route.page === 'apply' && <AdvertiseApplyPage key={route.category ?? ''} initialCategory={route.category} />}
      {route.page === 'applicationConfirm' && <ApplicationConfirmPage token={route.token} />}
      {route.page === 'admin' && <AdminPage />}
      {route.page === 'disclaimer' && <DisclaimerPage section={route.section} />}
      {route.page === 'privacy' && <PrivacyPage section={route.section} />}
      {route.page === 'terms' && <TermsPage section={route.section} />}
      {route.page === 'analyze' && <AnalyzePage />}
      {route.page === 'learn' && <LearnPage />}
      {route.page === 'reading' && <ReadingPage />}
      {route.page === 'propertyType' && <PropertyTypePage slug={route.slug} />}
      {route.page === 'lesson' && <LessonPage key={route.key} lessonKey={route.key} />}
      {route.page === 'decide' && <DecidePage />}
      {route.page === 'finddeals' && <FindDealsPage />}
      {route.page === 'deals' && <DealsPage />}
      {route.page === 'homeowner' && <HomeownerHelpPage />}
      {route.page === 'guides' && <GuidesPage key={`${nav}|${route.q}`} initialQuery={route.q} />}
      {route.page === 'alerts' && <AlertsPage key={`${route.mode}${route.token}${route.add ?? ''}`} mode={route.mode} token={route.token} welcome={route.welcome} add={route.add} />}
      {route.page === 'practice' && <PracticePage key={route.sale ?? ''} sale={route.sale} />}
      {route.page === 'toolkit' && <ToolkitPage section={route.section} />}
      {route.page === 'drill' && <DrillPage key={route.id} id={route.id} />}
      {route.page === 'practiceRun' && <PracticeScenarioPage key={route.id} id={route.id} stageKey={route.stage} />}
      {route.page === 'playbook' && <PlaybookPage key={route.key ?? ''} playbook={route.key} section={route.section} />}
      {route.page === 'advertiser' && <AdvertiserPage key={route.token ?? ''} token={route.token} />}
      {route.page === 'findpro' && <FindAProPage key={route.section ?? ''} section={route.section} />}
      <footer className="footer">
        <span>{ROLE_SHORT}</span>
        <span>{SOURCES_AND_ADVICE}</span>
        <nav aria-label="Footer">
          <a href="#/alerts">Email alerts</a>
          <a href="#/homeowner-help">Homeowners: free help</a>
          <a href="#/disclaimer">How we help</a>
          <a href="#/about">How it works</a>
          <a href="#/advertise">Advertise</a>
          <a href="#/advertiser">Advertiser sign-in</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
