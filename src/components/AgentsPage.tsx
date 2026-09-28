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

// What to do on official lookups that can't be filled in from a link.
const HOW_TO: Partial<Record<Category, string>> = {
  agent: 'Type the agent’s last name (or license number, like S.0012345) in its search form.',
  home_inspector: 'Type the inspector’s last name or license number in its search form.',
  property_manager: 'Type the manager’s last name or permit number in its search form.',
  contractor: 'Type the business name or license number in its search form.',
  cpa: 'Choose Nevada, then type the CPA’s name.',
  credit_union: 'Type the credit union’s name in its search box.',
};

const LOOKUP_TYPES: Category[] = ['agent', 'loan_officer', 'mortgage_company', 'private_lender', 'contractor', 'insurance', 'title_escrow', 'home_inspector', 'property_manager', 'attorney', 'cpa', 'bank', 'credit_union'];

export default function AgentsPage({ shortSales = false, initialQuery = '' }: { shortSales?: boolean; initialQuery?: string }) {
  const [cat, setCat] = useState<Category>('agent');
  const [query, setQuery] = useState(initialQuery);
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState<{ url: string; q: string; prefilled: boolean } | null>(null);
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
    // Open the official site first, while the click still counts: phones block new tabs opened after waiting on anything.
    window.open(official.url, '_blank', 'noopener,noreferrer');
    setOpened({ url: official.url, q: a.normalized, prefilled: official.prefilled });
    if (!official.prefilled && a.normalized) {
      try {
        await navigator.clipboard.writeText(a.normalized);
        setCopied(true);
        setTimeout(() => setCopied(false), 8000);
      } catch {
        /* clipboard blocked: the value is still shown on screen */
      }
    }
  }

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">License lookup · Nevada</span>}
        title={<>Check a <span className="grad">license</span></>}
        sub="Look up any agent, lender, contractor or other professional on the official record before you work with them."
      >
        <form className="lookup-box" onSubmit={search}>
          <select aria-label="Type of professional" value={cat} onChange={(e) => { setCat(e.target.value as Category); setLive(null); setOpened(null); }}>
            {LOOKUP_TYPES.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
          </select>
          <input
            aria-label="Name or license number"
            placeholder={cat === 'agent' ? 'Agent name or license # (e.g. S.0012345)' : cat === 'attorney' ? 'Attorney name or bar number' : cat === 'bank' ? 'Bank name' : `Name or ${info.licenseLabel}`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpened(null); }}
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
          </div>
        )}
        {!liveKind && opened && (
          <div className="lookup-result" role="status">
            <div className="lookup-line">
              {opened.prefilled
                ? <>We opened {SHORT[cat]}’s official lookup in a new tab with “{opened.q}” searched.</>
                : <>We opened {SHORT[cat]}’s official lookup in a new tab. {HOW_TO[cat] ?? 'Enter the name or license number there.'}{copied && opened.q ? <> We copied “{opened.q}” so you can paste it.</> : null}</>}
            </div>
            <div className="lookup-line small">Nothing opened? <a href={opened.url} target="_blank" rel="noopener noreferrer">Open {SHORT[cat].replace(/^the /, '')} ↗</a></div>
          </div>
        )}
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

      <ProDirectory
        categories={['agent']}
        initialCategory="agent"
        showCategoryFilter={false}
        key={String(shortSales)}
        hideWhenEmpty
        header={
          <>
            <h2 className="section-title">Agents who advertise on DeedOwl</h2>
            <p className="small muted">
              Paid listings. We check each agent’s license with the Real Estate Division before they appear, and again at least every {REVERIFY_DAYS} days.
              {adsOpen && <> <a href="#/advertise/apply/agent">Agents: get listed →</a></>} Looking for lenders, title or contractors?{' '}
              <a href="#/financing">Financing</a> · <a href="#/pros">Title, insurance &amp; repairs</a>
            </p>
          </>
        }
        notice={<Disclaimer kind="professionals" compact />}
      />
    </main>
  );
}
