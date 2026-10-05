import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FALLBACK_PROS } from '../data';
import { DIRECTORY_PUBLIC_KEY_SPKI_B64 } from '../feed/publicKey';
import { loadVerifiedPros, type ProsFeedResult } from '../feed/prosFeed';
import { CATEGORIES, CREDIT_PROFILES, LOAN_PRODUCTS, safeMailto, safeTel, searchPros, servicesFor, type Category, type Pro, type ProQuery } from '../lib/pros';
import { track } from '../lib/track';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';
import OwlNote from './OwlNote';
import ProAvatar from './ProAvatar';
import { FeaturedAds, inState } from './AdBoxes';
import { useMyState } from '../lib/myState';
import { stateByCode } from '../lib/regions';
import { regulatorFor } from '../lib/regulators';

/** Loads the signed directory; falls back to fictional samples only when no directory exists yet. */
export function useDirectory(): { pros: Pro[]; usingSamples: boolean; error: string | null; loading: boolean } {
  const [feed, setFeed] = useState<ProsFeedResult | null>(null);
  useEffect(() => {
    let alive = true;
    loadVerifiedPros(DIRECTORY_PUBLIC_KEY_SPKI_B64).then((r) => alive && setFeed(r));
    return () => {
      alive = false;
    };
  }, []);
  if (!feed) return { pros: [], usingSamples: false, error: null, loading: true };
  if (feed.ok) return { pros: feed.feed.pros, usingSamples: false, error: null, loading: false };
  const noDirectoryYet = feed.reason === 'NOT_CONFIGURED' || feed.reason === 'MISSING';
  const usingSamples = noDirectoryYet && FALLBACK_PROS.length > 0;
  return { pros: usingSamples ? FALLBACK_PROS : [], usingSamples, error: noDirectoryYet ? null : feed.detail, loading: false };
}

export const fmtPhone = (e164: string) => e164.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3');

export function ProCard({ p }: { p: Pro }) {
  const info = CATEGORIES[p.category];
  const tel = safeTel(p.phone);
  const mail = safeMailto(p.email);
  return (
    <li className="pro-card">
      <div className="pro-card-top">
        <span className="ad-label">Advertisement</span>
        {p.isSample && <span className="badge tone-info">Sample</span>}
      </div>
      <a className="pro-card-main" href={`#/pros/${p.id}`}>
        <ProAvatar name={p.name} photo={p.photo} />
        <div>
          <div className="pro-kicker">{info.label}</div>
          <h3>{p.name}</h3>
          <div className="small muted">{p.company !== p.name ? p.company : ''}</div>
        </div>
      </a>
      <p className="pro-headline">{p.headline}</p>
      <div className="chips">
        {p.services.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}
        {p.services.length > 4 && <span className="chip">+{p.services.length - 4}</span>}
      </div>
      {p.isSample ? <div className="small muted">Sample profile: fictional, not a license check</div> : <div className="verified small">✓ Verified with {regulatorFor(p.category, p.state).name}</div>}
      <div className="contact">
        <a className="btn" href={`#/pros/${p.id}`}>View profile</a>
        {!p.isSample && tel && <a className="btn btn-secondary" href={tel} onClick={() => track('phone_click', p.id)}>Call</a>}
        {!p.isSample && !tel && mail && <a className="btn btn-secondary" href={mail} onClick={() => track('email_click', p.id)}>Email</a>}
      </div>
    </li>
  );
}

interface Props {
  initialLocation?: string;
  categories: Category[]; // which categories this directory offers
  initialCategory?: Category | 'any';
  showCategoryFilter?: boolean;
  notice?: ReactNode; // the advertising notice, shown only when there are listings to go with it
  header?: ReactNode; // a heading for the section, shown with the listings
  hideWhenEmpty?: boolean; // for a directory that's a side section of another page: nothing at all until someone is listed
  featured?: boolean; // show the Featured ad box above the list (off where the page shows it elsewhere)
}

export default function ProDirectory({ categories, initialCategory = 'any', showCategoryFilter = true, initialLocation = '', notice, header, hideWhenEmpty = false, featured = true }: Props) {
  const { pros: all, usingSamples, error, loading } = useDirectory();
  // Advertisers in the visitor's state (every state until they pick one).
  const [st] = useMyState();
  const pros = inState(all, st);
  const stName = st ? stateByCode(st)?.name : null;
  const none = !loading && !error && pros.length === 0;
  const [cat, setCat] = useState<Category | 'any'>(initialCategory);
  const adsOpen = advertisingOpen(useSiteFeatures());
  const [q, setQ] = useState<Omit<ProQuery, 'categories'>>({ location: initialLocation, service: 'any', creditProfile: 'any', language: 'any' });
  const active = cat === 'any' ? categories : [cat];
  const financing = active.some((c) => CATEGORIES[c].financing);
  const serviceOptions = useMemo(() => [...new Set(active.flatMap((c) => servicesFor(c)))], [active.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const languages = useMemo(() => [...new Set(pros.flatMap((p) => p.languages))].sort(), [pros]);
  const results = searchPros(pros, { ...q, categories: active });
  // Count an "appeared in results" impression once per profile per page view.
  const seen = useMemo(() => new Set<string>(), []);
  const resultKey = results.map((p) => p.id).join();
  useEffect(() => {
    const fresh = results.map((p) => p.id).filter((id) => !seen.has(id));
    fresh.forEach((id) => seen.add(id));
    if (fresh.length) track('impression', fresh);
  }, [resultKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (none && hideWhenEmpty) return null;
  return (
    <div className="directory">
      {header}
      {none && (
        <div className="empty">
          <OwlNote><strong>No professionals advertise here{stName ? ` in ${stName}` : ''} yet.</strong> Every listing is license-checked before it appears.</OwlNote>
          <p>
            Looking for someone now? <a href="#/pros">Find a pro</a> explains who you need and how to find them.{' '}
            {adsOpen ? <>Licensed and want to be listed? <a href="#/advertise">Apply to advertise</a>.</> : 'Advertising for licensed professionals opens soon.'}
          </p>
        </div>
      )}
      {!none && notice}
      {/* Paid Featured ads sit apart from the list below, which keeps the same rotation for every advertiser. */}
      {featured && !loading && !error && <FeaturedAds pros={pros} categories={active} />}
      {!none && showCategoryFilter && categories.length > 1 && (
        <div className="chip-tabs" role="group" aria-label="Type">
          <button aria-pressed={cat === 'any'} onClick={() => setCat('any')}>All</button>
          {categories.map((c) => (
            <button key={c} aria-pressed={cat === c} onClick={() => { setCat(c); setQ({ ...q, service: 'any' }); }}>{CATEGORIES[c].plural}</button>
          ))}
        </div>
      )}
      {!none && <div className="toolbar">
        <input aria-label="City or ZIP" placeholder="City or ZIP" value={q.location} onChange={(e) => setQ({ ...q, location: e.target.value })} />
        <select aria-label={financing ? 'Loan type' : 'Service'} value={q.service} onChange={(e) => setQ({ ...q, service: e.target.value })}>
          <option value="any">{financing ? 'Any loan type' : 'Any service'}</option>
          {(financing ? LOAN_PRODUCTS.filter((l) => serviceOptions.includes(l)) : serviceOptions).map((s) => <option key={s}>{s}</option>)}
        </select>
        {financing && (
          <select aria-label="Credit situation" value={q.creditProfile} onChange={(e) => setQ({ ...q, creditProfile: e.target.value })}>
            <option value="any">Any credit situation</option>
            {CREDIT_PROFILES.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <select aria-label="Language" value={q.language} onChange={(e) => setQ({ ...q, language: e.target.value })}>
          <option value="any">Any language</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>}
      {error && <div className="caution small" role="alert"><strong>The directory couldn't be verified, so no profiles are shown.</strong> {error}</div>}
      {usingSamples && <p className="small muted">Showing fictional sample profiles until real advertisers are approved.</p>}
      {!loading && pros.length > 0 && !usingSamples && (
        <p className="small muted">
          {results.length} verified {results.length === 1 ? 'professional' : 'professionals'} · every listed professional appears here in the
          same daily rotating order, whatever plan they pay for.
        </p>
      )}
      {!loading && results.length === 0 && pros.length > 0 && !error && <div className="empty"><OwlNote>No advertisers match yet. Try another city or filter.</OwlNote></div>}
      <ul className="pro-grid">{results.map((p) => <ProCard key={p.id} p={p} />)}</ul>
    </div>
  );
}
