import { useState, type FormEvent } from 'react';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';
import ProDirectory from './ProDirectory';
import OwlNote from './OwlNote';
import { api } from '../lib/api';
import Disclaimer from './Disclaimer';
import { analyzeQuery, checklistFor, LIVE_KIND, officialSearch, RED_FLAGS, type LicenseSearch } from '../lib/licenseLookup';
import { CATEGORIES, REVERIFY_DAYS, type Category } from '../lib/pros';
import PageHero from './PageHero';
import { fmtDateTime } from '../lib/status';

/** Short names of the official lookups, for buttons and notes. */
const SHORT: Record<Category, string> = {
  agent: 'the Real Estate Division', home_inspector: 'the Real Estate Division', property_manager: 'the Real Estate Division',
  loan_officer: 'NMLS', mortgage_company: 'NMLS', private_lender: 'NMLS', insurance: 'the Division of Insurance', title_escrow: 'the Division of Insurance',
  contractor: 'the Contractors Board', cpa: 'CPAverify', attorney: 'the State Bar', bank: 'the FDIC', credit_union: 'the NCUA',
};

const LOOKUP_TYPES: Category[] = ['agent', 'loan_officer', 'mortgage_company', 'private_lender', 'contractor', 'insurance', 'title_escrow', 'home_inspector', 'property_manager', 'attorney', 'cpa', 'bank', 'credit_union'];

export default function AgentsPage({ shortSales = false, initialQuery = '' }: { shortSales?: boolean; initialQuery?: string }) {
  const [cat, setCat] = useState<Category>('agent');
  const [query, setQuery] = useState(initialQuery);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<{ q: string; data?: LicenseSearch; error?: string; loading?: boolean } | null>(null);
  const adsOpen = advertisingOpen(useSiteFeatures());
  const info = CATEGORIES[cat];
  const a = analyzeQuery(cat, query);
  const liveKind = LIVE_KIND[cat];
  const official = officialSearch(cat, query);

  async function search(e?: FormEvent) {
    e?.preventDefault();
    if (liveKind) {
      const q = query.trim();
      if (q.length < 2) return;
      setLive({ q, loading: true });
      try {
        const data = await api<LicenseSearch>(`/api/licenses?kind=${liveKind}&q=${encodeURIComponent(q)}`);
        setLive({ q, data });
      } catch (err) {
        setLive({ q, error: (err as Error).message });
      }
      return;
    }
    if (!official.prefilled && a.normalized) {
      try {
        await navigator.clipboard.writeText(a.normalized);
        setCopied(true);
        setTimeout(() => setCopied(false), 5000);
      } catch {
        /* clipboard blocked: the value is still shown on screen */
      }
    }
    window.open(official.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">License lookup · Nevada</span>}
        title={<>Check a <span className="grad">license</span></>}
        sub="Look up any agent, lender, contractor or other professional on the official record before you work with them."
      >
        <form className="lookup-box" onSubmit={search}>
          <select aria-label="Type of professional" value={cat} onChange={(e) => { setCat(e.target.value as Category); setLive(null); }}>
            {LOOKUP_TYPES.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
          </select>
          <input
            aria-label="Name or license number"
            placeholder={cat === 'agent' ? 'Agent name or license # (e.g. S.0012345)' : cat === 'attorney' ? 'Attorney name or bar number' : cat === 'bank' ? 'Bank name' : `Name or ${info.licenseLabel}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn big" type="submit">{liveKind ? 'Search' : `Search on ${SHORT[cat].replace(/^the /, '')} ↗`}</button>
        </form>
        <p className="lookup-how small">
          {liveKind
            ? `Results come straight from the ${liveKind === 'attorney' ? 'State Bar of Nevada’s public directory' : 'FDIC’s official BankFind data'} when you search.`
            : official.prefilled
              ? `Opens the official lookup at ${SHORT[cat]} with your search filled in.`
              : `${SHORT[cat].replace(/^the/, 'The')} doesn’t let other sites search it, so this opens its official lookup${a.normalized ? ' and copies what you typed, ready to paste' : ''}.`}
          {cat === 'title_escrow' && <> Independent escrow companies are licensed by the <a href="https://www.mld.nv.gov/industry-info/search-licensees/" target="_blank" rel="noopener noreferrer">Division of Mortgage Lending ↗</a>.</>}
        </p>
        {!liveKind && a.mode === 'license' && (
          <div className="lookup-result" role="status">
            <div className={`lookup-line ${a.formatOk === false ? 'bad' : ''}`}>{a.formatOk === false ? '⚠' : 'ℹ'} {a.detail}</div>
            {copied && <div className="lookup-line small">Copied "{a.normalized}". Paste it into the official search.</div>}
          </div>
        )}
        {!liveKind && a.mode !== 'license' && copied && <div className="lookup-result" role="status"><div className="lookup-line small">Copied "{a.normalized}". Paste it into the official search.</div></div>}
      </PageHero>

      {liveKind && live && (
        <section className="license-results" aria-live="polite" aria-label="Official results">
          {live.loading && <p>Searching the {liveKind === 'attorney' ? 'State Bar' : 'FDIC'}…</p>}
          {live.error && <div className="caution" role="alert">{live.error} <a href={info.lookupUrl} target="_blank" rel="noopener noreferrer">Open the official lookup ↗</a></div>}
          {live.data && live.data.results.length === 0 && (
            <OwlNote>No match for “{live.q}” in the {live.data.source} records. Check the spelling{liveKind === 'attorney' ? ' or search by bar number' : ''}.</OwlNote>
          )}
          {live.data && live.data.results.length > 0 && (
            <>
              <p className="small muted">
                {live.data.results.length}{live.data.more ? '+' : ''} {live.data.results.length === 1 ? 'match' : 'matches'} from {live.data.source}, {fmtDateTime(live.data.checkedAt)}.
                {live.data.more && ' Showing the first 20: add a first name or number to narrow it.'}
              </p>
              <ul className="license-list">
                {live.data.results.map((r) => (
                  <li key={r.id} className="license-card">
                    <div className="license-top">
                      <h3>{r.name}</h3>
                      <span className={`badge ${/inactive|suspend|revok|disbar|deceased/i.test(r.status) ? 'tone-stop' : /active/i.test(r.status) ? 'tone-go' : 'tone-info'}`}>{r.status}</span>
                    </div>
                    <dl className="license-facts">
                      <div><dt>{liveKind === 'attorney' ? 'Bar number' : 'FDIC certificate'}</dt><dd>{r.id}</dd></div>
                      {r.since && <div><dt>Admitted</dt><dd>{r.since}</dd></div>}
                      {r.company && <div><dt>Firm</dt><dd>{r.company}</dd></div>}
                      {r.address && <div><dt>Address</dt><dd>{r.address}</dd></div>}
                      {r.phone && <div><dt>Phone</dt><dd><a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a></dd></div>}
                      {r.website && <div><dt>Website</dt><dd><a href={r.website} target="_blank" rel="noopener noreferrer nofollow">{r.website.replace(/^https:\/\//, '')} ↗</a></dd></div>}
                      {liveKind === 'attorney' && <div><dt>Discipline</dt><dd>{r.discipline && r.discipline.length ? r.discipline.join('; ') : 'None listed'}</dd></div>}
                    </dl>
                    <a className="small" href={r.officialUrl} target="_blank" rel="noopener noreferrer">{liveKind === 'attorney' ? 'Full listing and email on the State Bar’s site ↗' : 'Full record on FDIC BankFind ↗'}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <div className="lookup-grid">
        <section className="lookup-card">
          <h2>What to check on {info.regulator}</h2>
          <ul>{checklistFor(cat).map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
        <section className="lookup-card warn-card">
          <h2>Red flags</h2>
          <ul>{RED_FLAGS.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      </div>

      <h2 className="section-title">License-checked agents</h2>
      <p className="small muted">
        Licenses checked by a person at least every {REVERIFY_DAYS} days.{adsOpen && <> <a href="#/advertise/apply/agent">Agents: get listed →</a></>} · Looking for
        lenders, title or contractors? <a href="#/financing">Financing</a> · <a href="#/pros">Title, insurance &amp; repairs</a>
      </p>
      <Disclaimer kind="professionals" compact />
      <ProDirectory categories={['agent']} initialCategory="agent" showCategoryFilter={false} key={String(shortSales)} />
    </main>
  );
}
