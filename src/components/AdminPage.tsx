import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { adAreaLabel } from '../lib/adAreas';
import { approvalBlockers, billingTier, paidAreas, type Billing, type LicenseVerification, type ProProfile } from '../lib/proApplication';
import { AD_TIERS, CAPS, TIER_INFO, topicsFor, type AdTier } from '../lib/adPlans';
import { adTopicByKey } from '../lib/adTopics';
import { CATEGORIES, REVERIFY_DAYS } from '../lib/pros';
import { allowsAlternativeQualifications, regulatorFor } from '../lib/regulators';
import { countyName, stateByCode } from '../lib/regions';
import { api, ApiError } from '../lib/api';
import PageHero from './PageHero';
import SiteStats from './SiteStats';
import EmailListAdmin from './EmailListAdmin';
import AdSpotsAdmin from './AdSpotsAdmin';
import { fmtDate, fmtDateTime } from '../lib/status';

type Status = 'EMAIL_UNCONFIRMED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
interface App {
  id: string;
  status: Status;
  profile: ProProfile;
  verification: (LicenseVerification & { verifiedAt: string; verifiedBy: string }) | null;
  billing: Billing | null;
  payments?: { available: boolean; amountLabel: string | null; tier: AdTier; topic: string | null; status: string | null; active: boolean; cancelAtPeriodEnd: boolean; hasCard: boolean };
  founding: boolean;
  adsHidden: boolean;
  listed: boolean;
  decisionReason: string | null;
  createdAt: string;
  emailConfirmedAt: string | null;
  duplicates: { id: string; status: string; field: 'license' | 'email' }[];
  reverifyDueInDays: number | null;
  photo?: { live: string | null; pendingAt: string | null; pending?: string | null };
}
interface Audit {
  at: string;
  actor: string;
  action: string;
  detail: string | null;
}

const TABS: { key: string; label: string; match: (a: App) => boolean }[] = [
  { key: 'review', label: 'Needs review', match: (a) => a.status === 'PENDING_REVIEW' },
  { key: 'photos', label: 'Photos to review', match: (a) => !!a.photo?.pendingAt },
  { key: 'adlines', label: 'Ad lines to review', match: (a) => !!a.profile.adLinePending },
  { key: 'due', label: 'Re-verification due', match: (a) => a.status === 'APPROVED' && (a.reverifyDueInDays ?? 0) <= 14 },
  { key: 'approved', label: 'Approved', match: (a) => a.status === 'APPROVED' },
  { key: 'unpaid', label: 'Needs a plan', match: (a) => a.status === 'APPROVED' && !a.listed },
  { key: 'email', label: 'Awaiting email', match: (a) => a.status === 'EMAIL_UNCONFIRMED' },
  { key: 'closed', label: 'Rejected / suspended', match: (a) => a.status === 'REJECTED' || a.status === 'SUSPENDED' },
];

const STATUS_TONE: Record<Status, string> = { EMAIL_UNCONFIRMED: 'info', PENDING_REVIEW: 'wait', APPROVED: 'go', REJECTED: 'stop', SUSPENDED: 'stop' };

function Login({ onDone }: { onDone: (u: string) => void }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ username: string }>('/api/admin/login', { body: { username: u, password: p }, auth: true });
      setP('');
      onDone(r.username);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page">
      <PageHero compact title="Admin sign-in" />
      <div className="signin-card">
        <div className="signin-info">
          <h2>Staff only</h2>
          <ul>
            <li>Review and verify advertiser applications</li>
            <li>Record billing and publish the signed directory</li>
            <li>See site stats and print an advertiser summary</li>
            <li>Every sign-in and change is logged</li>
          </ul>
        </div>
        <div className="signin-form">
          <form className="form" onSubmit={submit}>
            <label className="field"><span>Username</span><input autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} /></label>
            <label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} /></label>
            {err && <div className="caution" role="alert">{err}</div>}
            <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </div>
      </div>
    </main>
  );
}

function VerifyForm({ app, onSaved }: { app: App; onSaved: () => void }) {
  const prev = app.verification;
  const [v, setV] = useState<LicenseVerification>({
    licenseStatus: 'Active',
    licenseExpires: '',
    nameMatches: false,
    typeMatches: false,
    companyMatches: false,
    identityConfirmed: false,
    contentReviewed: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const info = CATEGORIES[app.profile.category];
  const reg = regulatorFor(app.profile.category, app.profile.state);
  const alternative = allowsAlternativeQualifications(app.profile.category, app.profile.state);
  const blockers = approvalBlockers(app.profile.category, v, undefined, app.profile.state);
  const set = <K extends keyof LicenseVerification>(k: K, val: LicenseVerification[K]) => setV((x) => ({ ...x, [k]: val }));
  const relisting = app.status === 'APPROVED' || app.status === 'SUSPENDED';

  async function approve() {
    setErr(null);
    try {
      await api(`/api/admin/applications/${app.id}/approve`, { body: { verification: v }, auth: true });
      onSaved();
    } catch (e) {
      const b = e instanceof ApiError ? (e.body.blockers as string[] | undefined) : undefined;
      setErr(b ? b.join(' ') : (e as Error).message);
    }
  }

  const box = (k: 'nameMatches' | 'typeMatches' | 'companyMatches' | 'identityConfirmed' | 'contentReviewed', label: string) => (
    <label className="check attest"><input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} /><span>{label}</span></label>
  );

  return (
    <section className="verify-panel">
      <h3>{relisting ? 'Re-verify professional' : 'Verify and approve'}</h3>
      {prev && <p className="small muted">Last verified {fmtDate(prev.verifiedAt)} by {prev.verifiedBy}: {prev.licenseStatus}{prev.licenseExpires ? `, expires ${fmtDate(prev.licenseExpires)}` : ''}.</p>}
      <ol className="small verify-steps">
        <li>
          {reg.url ? <>Open <a href={reg.url} target="_blank" rel="noreferrer noopener">{reg.name}&nbsp;↗</a></> : <>Check {reg.name}</>} ({stateByCode(app.profile.state)?.name}) and
          search by {app.profile.licenseId ? <><strong>{app.profile.licenseId}</strong> or </> : null}the name. Record what it shows.{reg.note && <> {reg.note}</>}
        </li>
        {alternative && <li>Determine which licenses the advertised services require and check each one on its official lookup. Where no license applies, check qualifications and any required insurance. Do not approve until these checks are complete.</li>}
        <li>
          Confirm identity by contacting the <strong>company</strong> using a phone number or email from {reg.name} or the company's own
          website. <strong>Never use the contact details on this application</strong>, because an impostor would control those.
        </li>
      </ol>
      <div className="form-grid">
        <label className="field">
          <span>{alternative ? 'Required credentials and qualifications' : `Status on ${reg.name}`}</span>
          <select value={v.licenseStatus} onChange={(e) => set('licenseStatus', e.target.value as LicenseVerification['licenseStatus'])}>
            {['Active', 'Inactive', 'Expired', 'Revoked', 'Not found'].map((s) => <option key={s} value={s}>{alternative && s === 'Active' ? 'Verified' : s}</option>)}
          </select>
        </label>
        {info.licenseExpires && (
          <label className="field">
            <span>Expiration shown (optional)</span>
            <input type="date" value={v.licenseExpires ?? ''} onChange={(e) => set('licenseExpires', e.target.value)} />
          </label>
        )}
      </div>
      {box('nameMatches', `Name on ${reg.name} matches "${app.profile.name}"`)}
      {box('typeMatches', alternative ? 'I checked every license required for the advertised services, and alternative qualifications and required insurance where no license applies' : app.profile.licenseType ? `License type is ${app.profile.licenseType}` : `License type or classification fits "${info.label}"`)}
      {box('companyMatches', alternative ? `I confirmed they are authorized to advertise for "${app.profile.company}"` : `${reg.name} shows them with "${app.profile.company}"`)}
      {box('identityConfirmed', 'I confirmed the applicant’s identity, using contact details that did not come from this application')}
      {box('contentReviewed', 'I checked the headline, bio and ad line against the content rules, and searched a sentence online to make sure it isn\u2019t copied')}
      {blockers.length > 0 && (
        <ul className="blockers small">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
      )}
      {err && <div className="caution small" role="alert">{err}</div>}
      <button className="btn" disabled={blockers.length > 0} onClick={approve}>
        {app.status === 'APPROVED' ? 'Save re-verification' : app.status === 'SUSPENDED' ? 'Re-verify and relist' : 'Approve and list'}
      </button>
    </section>
  );
}

function BillingForm({ app, onSaved }: { app: App; onSaved: () => void }) {
  const [plan, setPlan] = useState(app.billing?.plan ?? 'Monthly listing');
  const [paidThrough, setPaidThrough] = useState(app.billing?.paidThrough ?? '');
  const [areas, setAreas] = useState(String(app.billing?.areas ?? app.profile.adAreas.length ?? ''));
  const [tier, setTier] = useState<AdTier>(billingTier(app.billing));
  const [topic, setTopic] = useState(app.profile.adTopic ?? '');
  const [err, setErr] = useState<string | null>(null);
  const topics = topicsFor(app.profile.category);
  return (
    <section className="verify-panel">
      <h3>Advertising plan</h3>
      {app.payments?.hasCard ? (
        <p className="small">
          <strong>Card payments:</strong> {app.payments.status ?? 'started, not completed'}
          {app.payments.cancelAtPeriodEnd && ' · ends after the current period'}. The paid-through date and plan update automatically when Stripe confirms each payment.
        </p>
      ) : app.payments?.available ? (
        <p className="small">The advertiser can choose a plan and pay online from their dashboard once approved.</p>
      ) : null}
      <p className="small muted">
        For payments received another way (check, invoice), record them here. Free or discounted advertising works through Stripe promotion
        codes instead (see README). The profile is live only while it's verified and paid through today or later, and counts toward the caps.
      </p>
      <div className="form-grid">
        <label className="field"><span>Plan name</span><input value={plan} onChange={(e) => setPlan(e.target.value)} /></label>
        <label className="field">
          <span>Plan</span>
          <select value={tier} onChange={(e) => setTier(e.target.value as AdTier)}>{AD_TIERS.map((t) => <option key={t} value={t}>{TIER_INFO[t].label}</option>)}</select>
        </label>
        {tier === 'premium_plus' && (
          <label className="field">
            <span>Topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">None yet</option>
              {topics.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        )}
        <label className="field"><span>Paid through</span><input type="date" value={paidThrough} onChange={(e) => setPaidThrough(e.target.value)} /></label>
        <label className="field">
          <span>Ad areas paid for</span>
          <input type="number" min={1} max={25} value={areas} onChange={(e) => setAreas(e.target.value)} />
          <small className="muted">They have {app.profile.adAreas.length} chosen; the first this many show.</small>
        </label>
      </div>
      {err && <div className="caution small">{err}</div>}
      <button className="btn" onClick={async () => {
        try {
          await api(`/api/admin/applications/${app.id}/billing`, { body: { billing: { plan, paidThrough, tier, ...(areas ? { areas: Number(areas) } : {}), ...(tier === 'premium_plus' && topic ? { topic } : {}) } }, auth: true });
          onSaved();
        } catch (e) {
          setErr((e as Error).message);
        }
      }}>Save plan</button>
    </section>
  );
}

/** Founding advertisers get the plan's founding coupon at checkout (set in STRIPE_PLANS). */
function FoundingToggle({ app, onSaved }: { app: App; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="verify-panel">
      <h3>Founding advertiser</h3>
      <label className="check attest">
        <input type="checkbox" checked={app.founding} onChange={async (e) => {
          setErr(null);
          try {
            await api(`/api/admin/applications/${app.id}/founding`, { body: { founding: e.target.checked }, auth: true });
            onSaved();
          } catch (x) {
            setErr((x as Error).message);
          }
        }} />
        <span>Founding advertiser: checkout applies the founding coupon of the plan they choose (logged in the audit trail). Up to {CAPS.founding} per category.</span>
      </label>
      {err && <div className="caution small">{err}</div>}
    </section>
  );
}

/** Removing only the ads: the profile page and directory listing stay live. (Suspending removes everything.) */
function AdsToggle({ app, onSaved }: { app: App; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  async function set(hidden: boolean) {
    setErr(null);
    try {
      await api(`/api/admin/applications/${app.id}/ads`, { body: { hidden }, auth: true });
      onSaved();
    } catch (x) {
      setErr((x as Error).message);
    }
  }
  return (
    <section className="verify-panel">
      <h3>Ads</h3>
      {app.adsHidden ? (
        <p className="small"><strong>Ads are off.</strong> Their profile page and directory listing stay live, but none of their ad boxes show (Featured ad, the rotating ad, or a topic ad).</p>
      ) : (
        <p className="small">Turn off only this advertiser's ad boxes (Featured ad, the rotating ad, and any topic ad). Their profile page and directory listing stay live, and their plan keeps its spot. To take everything down, use <strong>Suspend listing</strong> below.</p>
      )}
      <button className={app.adsHidden ? 'btn' : 'btn btn-danger'} onClick={() => set(!app.adsHidden)}>{app.adsHidden ? 'Turn ads back on' : 'Remove ads only'}</button>
      {err && <div className="caution small">{err}</div>}
    </section>
  );
}

/** An ad line sent from the dashboard: approve it (it replaces the live one) or reject it. */
function AdLineReview({ app, onDone }: { app: App; onDone: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const pending = app.profile.adLinePending;
  if (!pending) return null;
  const decide = async (d: 'approve' | 'reject') => {
    setErr(null);
    try {
      await api(`/api/admin/applications/${app.id}/ad-line/${d}`, { body: { adLine: pending }, auth: true });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <section className="verify-panel">
      <h3>Ad line waiting for review</h3>
      <p>“{pending}”</p>
      <p className="small muted">Check it against the content rules: the advertiser’s own words, no claims to be the best or trusted, no contact details, and for lenders no rates, payments or dollar amounts.</p>
      {err && <div className="caution small" role="alert">{err}</div>}
      <div className="row">
        <button className="btn" onClick={() => decide('approve')}>Approve ad line</button>
        <button className="btn btn-secondary" onClick={() => decide('reject')}>Reject</button>
      </div>
    </section>
  );
}

interface Summary {
  totals: Record<string, { total: number; uniques: number }>;
  contactRate: number | null;
}

function MetricsPanel({ id }: { id: string }) {
  const [m, setM] = useState<Summary | null>(null);
  useEffect(() => {
    api<Summary>(`/api/admin/applications/${id}/metrics`).then(setM).catch(() => setM(null));
  }, [id]);
  if (!m) return null;
  const t = m.totals;
  return (
    <section className="verify-panel">
      <h3>Last 30 days</h3>
      <div className="stat-row">
        <div><strong>{t.impression.total}</strong><span>in results</span></div>
        <div><strong>{t.profile_view.uniques}</strong><span>profile views</span></div>
        <div><strong>{t.phone_click.uniques + t.email_click.uniques + t.website_click.uniques}</strong><span>contact clicks</span></div>
        <div><strong>{t.lead.total}</strong><span>leads</span></div>
      </div>
    </section>
  );
}

function ReasonAction({ label, path, onDone, danger }: { label: string; path: string; onDone: () => void; danger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <button className={danger ? 'btn-danger' : ''} onClick={() => setOpen(true)}>{label}…</button>;
  return (
    <div className="reason-box">
      <label className="field"><span>Reason (kept in the audit log)</span><input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      {err && <div className="caution small">{err}</div>}
      <div className="row">
        <button className="btn-danger" onClick={async () => {
          try {
            await api(path, { body: { reason }, auth: true });
            onDone();
          } catch (e) {
            setErr((e as Error).message);
          }
        }}>{label}</button>
        <button onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

/** A profile photo waiting for review: approve it (it replaces the live one) or reject it. */
function PhotoReview({ app, onDone }: { app: App; onDone: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  if (!app.photo?.pendingAt) return null;
  const decide = async (d: 'approve' | 'reject') => {
    setErr(null);
    try {
      await api(`/api/admin/applications/${app.id}/photo/${d}`, { body: { sha256: app.photo?.pending }, auth: true });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <section className="verify-panel">
      <h3>Photo waiting for review</h3>
      <div className="photo-row">
        <img className="avatar photo big" src={`/api/admin/applications/${app.id}/photo?sha=${app.photo.pending ?? ''}`} alt={`Photo uploaded by ${app.profile.name}`} width={84} height={84} />
        <ul className="small plain-list">
          <li>A clear headshot of this person, or their company's logo.</li>
          <li>No text, prices, claims, other people or other companies' logos.</li>
          <li>Uploaded {fmtDateTime(app.photo.pendingAt)}.{app.photo.live ? ' Approving replaces their current photo.' : ''}</li>
        </ul>
      </div>
      {err && <div className="caution small" role="alert">{err}</div>}
      <div className="row">
        <button className="btn" onClick={() => decide('approve')}>Approve photo</button>
        <button className="btn btn-secondary" onClick={() => decide('reject')}>Reject</button>
      </div>
    </section>
  );
}

function Detail({ id, onChange }: { id: string; onChange: () => void }) {
  const [data, setData] = useState<{ application: App; audit: Audit[] } | null>(null);
  const load = useCallback(() => {
    api<{ application: App; audit: Audit[] }>(`/api/admin/applications/${id}`).then(setData).catch(() => setData(null));
  }, [id]);
  useEffect(load, [load]);
  if (!data) return <p>Loading…</p>;
  const a = data.application;
  const p = a.profile;
  const refresh = () => {
    load();
    onChange();
  };
  return (
    <div className="detail">
      <div className="track-head">
        <div>
          <span className={`badge tone-${STATUS_TONE[a.status]}`}>{a.status.replace('_', ' ').toLowerCase()}</span>
          <h2>{p.name}</h2>
          <div className="small muted">{CATEGORIES[p.category].label}{p.licenseType ? ` (${p.licenseType})` : ''} · {p.licenseId} · {p.company}</div>
          <div className="small">{a.listed ? <span className="verified">● Live in the directory</span> : <span className="muted">○ Not live (needs verification and a paid plan)</span>}</div>
        </div>
      </div>
      {a.duplicates.length > 0 && (
        <div className="caution small" role="alert">
          <strong>Possible impersonation or duplicate:</strong>{' '}
          {a.duplicates.map((d) => `${d.field === 'license' ? 'same license number' : 'same email'} as ${d.id} (${d.status.toLowerCase()})`).join('; ')}.
          Confirm identity carefully before approving.
        </div>
      )}
      {a.decisionReason && <p className="small"><strong>Reason:</strong> {a.decisionReason}</p>}
      <dl className="facts small">
        <div><dt>Phone</dt><dd>{p.phone}</dd></div>
        <div><dt>Email</dt><dd>{p.email} {a.emailConfirmedAt ? '(confirmed)' : '(not confirmed)'}</dd></div>
        <div><dt>Website</dt><dd>{p.website ?? '—'}</dd></div>
        <div><dt>Ad areas</dt><dd>{p.adAreas.length ? p.adAreas.map((x, i) => `${adAreaLabel(x)}${a.billing && i >= paidAreas(p, a.billing).length ? ' (not paid)' : ''}`).join('; ') : 'None chosen yet'}</dd></div>
        <div><dt>Serves</dt><dd>{stateByCode(p.state)?.name}: {p.serviceCounties.map(countyName).join(', ')}{p.serviceCities.length ? ` · ${p.serviceCities.join(', ')}` : ''}{p.serviceZips.length ? ` · ${p.serviceZips.join(', ')}` : ''}</dd></div>
        <div><dt>Headline</dt><dd>{p.headline}</dd></div>
        <div><dt>{CATEGORIES[p.category].financing ? 'Loan types' : 'Services'}</dt><dd>{p.services.join(', ')}</dd></div>
        {p.creditProfiles.length > 0 && <div><dt>Credit situations</dt><dd>{p.creditProfiles.join(', ')}</dd></div>}
        <div><dt>Languages</dt><dd>{p.languages.join(', ')}</dd></div>
        <div><dt>Plan</dt><dd>{a.billing ? `${TIER_INFO[billingTier(a.billing)].label} · ${a.billing.plan}, paid through ${fmtDate(a.billing.paidThrough)}` : 'None'}{a.founding ? ' · founding advertiser' : ''}</dd></div>
        {billingTier(a.billing) === 'premium_plus' && <div><dt>Topic ad</dt><dd>{adTopicByKey(a.profile.adTopic)?.label ?? 'None chosen yet'}</dd></div>}
        <div><dt>Ad line</dt><dd>{a.profile.adLine || '—'}</dd></div>
        <div><dt>Applied</dt><dd>{fmtDateTime(a.createdAt)}</dd></div>
        {a.reverifyDueInDays !== null && <div><dt>Re-verification</dt><dd>{a.reverifyDueInDays >= 0 ? `due in ${a.reverifyDueInDays} days` : `overdue by ${-a.reverifyDueInDays} days (hidden from directory)`}</dd></div>}
      </dl>
      <p className="small">{p.bio}</p>

      <PhotoReview app={a} onDone={refresh} />
      <AdLineReview app={a} onDone={refresh} />
      {a.status === 'EMAIL_UNCONFIRMED' && <p className="notice small">Waiting for the applicant to confirm their email. Approval is disabled until then.</p>}
      {['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(a.status) && <VerifyForm key={a.status + (a.verification?.verifiedAt ?? '')} app={a} onSaved={refresh} />}
      {['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(a.status) && <BillingForm key={JSON.stringify(a.billing)} app={a} onSaved={refresh} />}
      {['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(a.status) && <FoundingToggle app={a} onSaved={refresh} />}
      {a.status === 'APPROVED' && <AdsToggle app={a} onSaved={refresh} />}
      {a.status === 'APPROVED' && <MetricsPanel id={a.id} />}
      <div className="row">
        {['PENDING_REVIEW', 'EMAIL_UNCONFIRMED'].includes(a.status) && <ReasonAction label="Reject" path={`/api/admin/applications/${a.id}/reject`} onDone={refresh} danger />}
        {a.status === 'APPROVED' && <ReasonAction label="Suspend listing (removes everything)" path={`/api/admin/applications/${a.id}/suspend`} onDone={refresh} danger />}
      </div>

      <h3>Audit trail</h3>
      <ol className="timeline small">
        {data.audit.map((e, i) => (
          <li key={i}><div className="muted">{fmtDateTime(e.at)} · {e.actor}</div><div><strong>{e.action}</strong>{e.detail ? `: ${e.detail}` : ''}</div></li>
        ))}
      </ol>
    </div>
  );
}

export default function AdminPage() {
  const [me, setMe] = useState<{ username: string; signingConfigured: boolean } | null | 'loading'>('loading');
  const [apps, setApps] = useState<App[]>([]);
  const [tab, setTab] = useState('review');
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [view, setView] = useState<'apps' | 'stats' | 'email' | 'spots'>('apps');

  const loadApps = useCallback(() => {
    api<{ applications: App[] }>('/api/admin/applications').then((r) => setApps(r.applications)).catch((e: ApiError) => e.status === 401 && setMe(null));
  }, []);
  useEffect(() => {
    api<{ username: string; signingConfigured: boolean }>('/api/admin/me').then(setMe).catch(() => setMe(null));
  }, []);
  useEffect(() => {
    if (me && me !== 'loading') loadApps();
  }, [me, loadApps]);

  const shown = useMemo(() => apps.filter(TABS.find((t) => t.key === tab)!.match), [apps, tab]);

  if (me === 'loading') return <main className="page"><p>Loading…</p></main>;
  if (!me) return <Login onDone={() => api<{ username: string; signingConfigured: boolean }>('/api/admin/me').then(setMe)} />;

  return (
    <main className="page wide">
      <div className="track-head admin-head">
        <div>
          <h1>{view === 'apps' ? 'Advertiser applications' : view === 'stats' ? 'Site stats' : view === 'spots' ? 'Ad spots' : 'Email list'}</h1>
          <p className="small muted">
            Signed in as {me.username}.{' '}
            {view === 'apps'
              ? `Listings need an active license, identity confirmed through the company, re-checks every ${REVERIFY_DAYS} days, and a paid plan.`
              : view === 'stats'
                ? 'Anonymous, bot-filtered counts from our own server. Use the advertiser summary when pitching to prospects.'
                : view === 'spots'
                  ? 'Where Mentor Connect ads show across the site.'
                  : 'Everyone here confirmed their address. Updates go to the general list only; property and search alerts are sent automatically.'}
          </p>
          <div className="seg" role="tablist" aria-label="Admin section">
            <button role="tab" aria-selected={view === 'apps'} onClick={() => setView('apps')}>Applications</button>
            <button role="tab" aria-selected={view === 'stats'} onClick={() => setView('stats')}>Site stats</button>
            <button role="tab" aria-selected={view === 'email'} onClick={() => setView('email')}>Email list</button>
            <button role="tab" aria-selected={view === 'spots'} onClick={() => setView('spots')}>Ad spots</button>
          </div>
        </div>
        <div className="row">
          <button onClick={async () => {
            const r = await api<{ published: number }>('/api/admin/publish', { body: {}, auth: true });
            setMsg(`Published ${r.published} listings to the directory.`);
          }}>Publish directory</button>
          <button onClick={async () => {
            await api('/api/admin/logout', { body: {}, auth: true });
            setMe(null);
          }}>Sign out</button>
        </div>
      </div>
      {view === 'stats' && <SiteStats />}
      {view === 'email' && <EmailListAdmin />}
      {view === 'spots' && <AdSpotsAdmin />}
      {view === 'apps' && !me.signingConfigured && <div className="caution small">No signing key is configured, so approvals are saved but the public directory isn't published. Run <code>npm run keys:generate</code>.</div>}
      {view === 'apps' && msg && <div className="notice small" role="status">{msg}</div>}

      {view === 'apps' && <>
      <div className="seg tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); setSelected(null); }}>
            {t.label} ({apps.filter(t.match).length})
          </button>
        ))}
      </div>

      <div className="admin-layout">
        <ul className="app-list">
          {shown.length === 0 && <li className="muted small">Nothing here.</li>}
          {shown.map((a) => (
            <li key={a.id}>
              <button className={`app-item${selected === a.id ? ' selected' : ''}`} onClick={() => setSelected(a.id)}>
                <strong>{a.profile.name}</strong>
                <span className="small muted">{CATEGORIES[a.profile.category].label} · {a.profile.licenseId} · {fmtDate(a.createdAt)}</span>
                {a.duplicates.length > 0 && <span className="small neg">⚠ duplicate license/email</span>}
                {a.photo?.pendingAt && <span className="badge tone-wait">photo to review</span>}
                {a.profile.adLinePending && <span className="badge tone-wait">ad line to review</span>}
                {a.listed && <span className="small muted">{TIER_INFO[billingTier(a.billing)].label}{a.founding ? ' · founding' : ''}</span>}
                {a.reverifyDueInDays !== null && a.reverifyDueInDays <= 14 && <span className="small warn">Re-verify {a.reverifyDueInDays < 0 ? 'overdue' : `in ${a.reverifyDueInDays}d`}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div>{selected ? <Detail key={selected} id={selected} onChange={loadApps} /> : <p className="muted">Select an application.</p>}</div>
      </div>
      </>}
    </main>
  );
}
