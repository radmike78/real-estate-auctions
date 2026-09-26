import { useState } from 'react';
import ProDirectory, { useDirectory } from './ProDirectory';
import Disclaimer from './Disclaimer';
import { analyzeQuery, checklistFor, findInDirectory, RED_FLAGS } from '../lib/licenseLookup';
import { CATEGORIES, REVERIFY_DAYS, type Category } from '../lib/pros';
import PageHero from './PageHero';
import { fmtDate } from '../lib/status';

const LOOKUP_TYPES: Category[] = ['agent', 'loan_officer', 'mortgage_company', 'private_lender', 'contractor', 'insurance', 'title_escrow', 'bank', 'credit_union'];

export default function AgentsPage({ shortSales = false, initialQuery = '' }: { shortSales?: boolean; initialQuery?: string }) {
  const [cat, setCat] = useState<Category>('agent');
  const [query, setQuery] = useState(initialQuery);
  const [copied, setCopied] = useState(false);
  const { pros } = useDirectory();
  const info = CATEGORIES[cat];
  const a = analyzeQuery(cat, query);
  const matches = findInDirectory(pros, [cat], a);

  async function openOfficial() {
    if (a.normalized) {
      try {
        await navigator.clipboard.writeText(a.normalized);
        setCopied(true);
        setTimeout(() => setCopied(false), 4000);
      } catch {
        /* clipboard blocked: the value is still shown on screen */
      }
    }
    window.open(info.lookupUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">License lookup · Nevada</span>}
        title={<>Find &amp; <span className="grad">verify</span> an agent</>}
        sub="Check any agent's or professional's license before you work with them. Then browse license-checked agents below."
      >

        <div className="lookup-box">
          <select aria-label="Type of professional" value={cat} onChange={(e) => setCat(e.target.value as Category)}>
            {LOOKUP_TYPES.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
          </select>
          <input
            aria-label="Name or license number"
            placeholder={cat === 'agent' ? 'Agent name or license # (e.g. S.0012345)' : `Name or ${info.licenseLabel}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn big" onClick={openOfficial}>Check on {info.regulator} ↗</button>
        </div>

        {a.mode !== 'empty' && (
          <div className="lookup-result" role="status">
            <div className={`lookup-line ${a.formatOk === false ? 'bad' : ''}`}>{a.formatOk === false ? '⚠' : 'ℹ'} {a.detail}</div>
            {matches.length > 0 ? (
              <div className="lookup-line good">
                ✓ In our verified directory:{' '}
                {matches.slice(0, 5).map((p, i) => (
                  <span key={p.id}>{i > 0 && ', '}<a href={`#/pros/${p.id}`}>{p.name}</a> ({p.company}, checked {fmtDate(p.licenseVerifiedAt)})</span>
                ))}
              </div>
            ) : (
              <div className="lookup-line">Not in our verified directory. That's normal: most licensees don't advertise here. Check the official lookup.</div>
            )}
            {copied && <div className="lookup-line small">Copied "{a.normalized}". Paste it into the official search.</div>}
          </div>
        )}
      </PageHero>

      <div className="lookup-grid">
        <section className="lookup-card">
          <h2>What to check on {info.regulator}</h2>
          <ul>{checklistFor(cat).map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="small muted">The official lookup is the only authority. We can't query it for you, because it doesn't allow automated checks.</p>
        </section>
        <section className="lookup-card warn-card">
          <h2>Red flags</h2>
          <ul>{RED_FLAGS.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      </div>

      <h2 className="section-title">License-checked agents</h2>
      <p className="small muted">
        Licenses checked by a person at least every {REVERIFY_DAYS} days. <a href="#/advertise/apply/agent">Agents: get listed →</a> · Looking for
        lenders, title or contractors? <a href="#/financing">Financing</a> · <a href="#/pros">Title, insurance &amp; repairs</a>
      </p>
      <Disclaimer kind="professionals" compact />
      <ProDirectory categories={['agent']} initialCategory="agent" showCategoryFilter={false} key={String(shortSales)} />
    </main>
  );
}
