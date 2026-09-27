import { useEffect, useMemo, useState } from 'react';
import { FALLBACK_PROS } from '../data';
import { DIRECTORY_PUBLIC_KEY_SPKI_B64 } from '../feed/publicKey';
import { loadVerifiedPros, type ProsFeedResult } from '../feed/prosFeed';
import { CATEGORIES, CREDIT_PROFILES, LOAN_PRODUCTS, safeMailto, safeTel, searchPros, servicesFor, type Category, type Pro, type ProQuery } from '../lib/pros';
import { track } from '../lib/track';

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
const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

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
        <div className="avatar" aria-hidden>{initials(p.name)}</div>
        <div>
          <div className="pro-kicker">{info.label}</div>
          <h3>{p.name}</h3>
          <div className="small muted">{p.company}</div>
        </div>
      </a>
      <p className="pro-headline">{p.headline}</p>
      <div className="chips">
        {p.services.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}
        {p.services.length > 4 && <span className="chip">+{p.services.length - 4}</span>}
      </div>
      <div className="verified small">✓ Verified with {info.regulator}</div>
      <div className="contact">
        <a className="btn" href={`#/pros/${p.id}`}>View profile</a>
        {tel && <a className="btn btn-secondary" href={tel} onClick={() => track('phone_click', p.id)}>Call</a>}
        {!tel && mail && <a className="btn btn-secondary" href={mail} onClick={() => track('email_click', p.id)}>Email</a>}
      </div>
    </li>
  );
}

interface Props {
  initialLocation?: string;
  categories: Category[]; // which categories this directory offers
  initialCategory?: Category | 'any';
  showCategoryFilter?: boolean;
}

export default function ProDirectory({ categories, initialCategory = 'any', showCategoryFilter = true, initialLocation = '' }: Props) {
  const { pros, usingSamples, error, loading } = useDirectory();
  const [cat, setCat] = useState<Category | 'any'>(initialCategory);
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

  return (
    <div className="directory">
      {showCategoryFilter && categories.length > 1 && (
        <div className="chip-tabs" role="tablist" aria-label="Type">
          <button role="tab" aria-selected={cat === 'any'} onClick={() => setCat('any')}>All</button>
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => { setCat(c); setQ({ ...q, service: 'any' }); }}>{CATEGORIES[c].plural}</button>
          ))}
        </div>
      )}
      <div className="toolbar">
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
      </div>
      {error && <div className="caution small" role="alert"><strong>The directory couldn't be verified, so no profiles are shown.</strong> {error}</div>}
      {usingSamples && <p className="small muted">Showing fictional sample profiles until real advertisers are approved.</p>}
      {!loading && pros.length > 0 && (
        <p className="small muted">
          {results.length} verified {results.length === 1 ? 'professional' : 'professionals'} · shown in a daily rotating order. Advertisers can't pay
          for a higher position.
        </p>
      )}
      {!loading && !error && pros.length === 0 && (
        <div className="empty">
          <p><strong>No professionals are listed here yet.</strong> Every listing is license-checked before it appears.</p>
          <p>
            Looking for someone now? <a href="#/agents">Look up any professional's license</a> with the official regulator. Licensed and want to be
            listed? <a href="#/advertise">Apply to advertise</a>.
          </p>
        </div>
      )}
      {!loading && results.length === 0 && pros.length > 0 && !error && <div className="empty">No license-checked professionals match yet. Try another city or filter.</div>}
      <ul className="pro-grid">{results.map((p) => <ProCard key={p.id} p={p} />)}</ul>
    </div>
  );
}
