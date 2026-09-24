import { useMemo, useState } from 'react';
import { SAMPLE_AGENTS } from '../data/sampleAgents';
import { NRED_LOOKUP_URL, REVERIFY_DAYS, safeMailto, safeTel, safeWebsite, searchAgents, type AgentQuery, type Specialty } from '../lib/agents';
import { fmtDate } from '../lib/status';

const SPECIALTIES: Specialty[] = ['Short sales', 'Bank-owned (REO)', 'Auction & tax-sale properties', 'Investors', 'First-time buyers', 'Probate & estate sales'];

const fmtPhone = (e164: string) => e164.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3');

export default function AgentsPage({ initialSpecialty = 'any' }: { initialSpecialty?: Specialty | 'any' }) {
  const [q, setQ] = useState<AgentQuery>({ location: '', specialty: initialSpecialty, language: 'any' });
  const languages = useMemo(() => [...new Set(SAMPLE_AGENTS.flatMap((a) => a.languages))].sort(), []);
  const results = searchAgents(SAMPLE_AGENTS, q);

  return (
    <main className="page">
      <h1>Find a real estate agent</h1>
      <p className="muted">
        Licensed Nevada agents who work with short sales, bank-owned homes and auction properties. Short sales and bank-owned homes are
        bought through an agent. A buyer's agent is usually paid through the transaction, but confirm compensation in your written buyer
        agreement.
      </p>

      <div className="notice small" role="note">
        <strong>How we verify agents:</strong> before a profile appears, and at least every {REVERIFY_DAYS} days after, we confirm the license
        is active on the official{' '}
        <a href={NRED_LOOKUP_URL} target="_blank" rel="noreferrer noopener">Nevada Real Estate Division license lookup ↗</a>. Profiles with an
        expired license or an overdue check are hidden automatically. Check the license yourself before you sign anything. Listed agents are
        partners of this site, and being listed is not a recommendation. <strong>The profiles below are fictional samples.</strong>
      </div>

      <div className="toolbar">
        <input aria-label="City or ZIP" placeholder="City or ZIP (e.g. Henderson or 89123)" value={q.location} onChange={(e) => setQ({ ...q, location: e.target.value })} />
        <select aria-label="Specialty" value={q.specialty} onChange={(e) => setQ({ ...q, specialty: e.target.value as AgentQuery['specialty'] })}>
          <option value="any">Any specialty</option>
          {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="Language" value={q.language} onChange={(e) => setQ({ ...q, language: e.target.value })}>
          <option value="any">Any language</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <p className="small muted">{results.length} verified {results.length === 1 ? 'agent' : 'agents'}</p>
      {results.length === 0 && <div className="empty">No verified agents match. Try a nearby city or a different specialty.</div>}
      <ul className="agent-list">
        {results.map((a) => {
          const tel = safeTel(a.phone);
          const mail = safeMailto(a.email);
          const web = safeWebsite(a.website);
          return (
            <li key={a.id} className="agent-card">
              <div className="agent-head">
                <div>
                  <h3>{a.name}</h3>
                  <div className="small muted">{a.licenseType} · {a.brokerage}</div>
                </div>
                {a.isSample && <span className="badge tone-info">Sample profile</span>}
              </div>
              <div className="verified small">
                ✓ License {a.licenseNumber} verified active with the Nevada Real Estate Division on {fmtDate(a.licenseVerifiedAt)} · expires{' '}
                {fmtDate(a.licenseExpires)}
              </div>
              <div className="chips">
                {a.specialties.map((s) => <span key={s} className={`chip${s === 'Short sales' ? ' chip-strong' : ''}`}>{s}</span>)}
              </div>
              <p className="small">{a.bio}</p>
              <dl className="mini small">
                <div><dt>Serves</dt><dd>{a.serviceCities.join(', ')}</dd></div>
                <div><dt>Languages</dt><dd>{a.languages.join(', ')}</dd></div>
                {a.shortSaleExperience && <div><dt>Short-sale experience</dt><dd>{a.shortSaleExperience}</dd></div>}
              </dl>
              <div className="contact">
                {tel && <a className="btn" href={tel}>Call {fmtPhone(a.phone!)}</a>}
                {mail && <a className="btn btn-secondary" href={`${mail}?subject=${encodeURIComponent('Short sale inquiry from Forced-Sale Finder')}`}>Email</a>}
                {web && <a href={web} target="_blank" rel="noreferrer noopener nofollow">Website ↗</a>}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="prose">
        <h2>Questions to ask before you hire an agent for a short sale</h2>
        <ul>
          <li>How many short sales have you closed as the buyer's agent in the last two years, and how long did lender approval take?</li>
          <li>How do you handle a lender counteroffer or a second-mortgage holder that won't cooperate?</li>
          <li>Can I keep making backup offers on other homes while I wait for approval?</li>
          <li>How are you paid, and what does our written buyer agreement say?</li>
        </ul>
        <h2>Are you a Nevada agent?</h2>
        <p>
          To be listed, your license must be active on the Nevada Real Estate Division lookup and you must work under a Nevada broker. We
          re-check every license at least every {REVERIFY_DAYS} days. Contact the site operator to apply.
        </p>
      </section>
    </main>
  );
}
