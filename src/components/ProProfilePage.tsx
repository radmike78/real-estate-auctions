import { CATEGORIES, REVERIFY_DAYS, safeMailto, safeTel, safeWebsite } from '../lib/pros';
import { fmtDate } from '../lib/status';
import { useEffect } from 'react';
import { track } from '../lib/track';
import LeadForm from './LeadForm';
import Disclaimer from './Disclaimer';
import { fmtPhone, useDirectory } from './ProDirectory';

export default function ProProfilePage({ id }: { id: string }) {
  const { pros, loading } = useDirectory();
  const found = pros.some((x) => x.id === id);
  useEffect(() => {
    if (found) track('profile_view', id);
  }, [found, id]);
  if (loading) return <main className="page"><p>Loading…</p></main>;
  const p = pros.find((x) => x.id === id);
  if (!p) {
    return (
      <main className="page prose">
        <h1>Profile not available</h1>
        <p>This professional isn't currently listed. Their license check or advertising may have lapsed.</p>
        <a href="#/agents">Browse verified professionals</a>
      </main>
    );
  }
  const info = CATEGORIES[p.category];
  const tel = safeTel(p.phone);
  const mail = safeMailto(p.email);
  const web = safeWebsite(p.website);

  return (
    <main className="page profile">
      <section className="profile-hero">
        <div className="avatar big" aria-hidden>{p.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('')}</div>
        <div>
          <div className="pro-kicker">{info.label} · {p.company}</div>
          <h1>{p.name}</h1>
          <p className="lede">{p.headline}</p>
          <div className="contact">
            {tel && <a className="btn" href={tel} onClick={() => track('phone_click', p.id)}>Call {fmtPhone(p.phone!)}</a>}
            {mail && <a className="btn btn-secondary" href={mail} onClick={() => track('email_click', p.id)}>Email</a>}
            {web && <a className="btn btn-secondary" href={web} target="_blank" rel="noreferrer noopener nofollow" onClick={() => track('website_click', p.id)}>Website ↗</a>}
          </div>
        </div>
        <span className="ad-label">Advertisement{p.isSample ? ' · sample profile' : ''}</span>
      </section>

      <div className="profile-grid">
        <div className="main-col">
        <section>
          <h2>About</h2>
          <p>{p.bio}</p>
          <h3>{info.financing ? 'Loan types' : 'Services'}</h3>
          <div className="chips">{p.services.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          {info.financing && (
            <>
              <h3>Credit situations they say they work with</h3>
              <div className="chips">{p.creditProfiles.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              <p className="small muted">Self-reported by the lender. Not an offer or guarantee of credit.</p>
            </>
          )}
          <h3>Serves</h3>
          <p>{p.serviceCities.join(', ')}{p.serviceZips.length ? ` · ZIPs ${p.serviceZips.join(', ')}` : ''}</p>
          <h3>Languages</h3>
          <p>{p.languages.join(', ')}</p>
        </section>
        <Disclaimer kind={info.financing ? 'financing' : p.category === 'agent' ? 'professionals' : 'services'} />
        </div>

        <div className="side-col">
        <LeadForm pro={p} />
        <aside className="verify-card">
          <h2>✓ Verified</h2>
          <dl className="mini">
            <div><dt>{info.licenseLabel}</dt><dd>{p.licenseId}</dd></div>
            <div><dt>Status</dt><dd>{p.licenseStatus}</dd></div>
            {p.licenseExpires && <div><dt>Expires</dt><dd>{fmtDate(p.licenseExpires)}</dd></div>}
            <div><dt>Last checked</dt><dd>{fmtDate(p.licenseVerifiedAt)}</dd></div>
          </dl>
          <p className="small">
            A person checked this on {info.regulator} and confirmed their identity independently. We re-check at least every {REVERIFY_DAYS} days.
          </p>
          <a className="btn btn-secondary" href={info.lookupUrl} target="_blank" rel="noreferrer noopener">Check it yourself on {info.regulator} ↗</a>
        </aside>
        </div>
      </div>
    </main>
  );
}
