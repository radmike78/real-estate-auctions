import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { approvalBlockers, type Billing, type LicenseVerification, type ProProfile } from '../lib/proApplication';
import { CATEGORIES, REVERIFY_DAYS } from '../lib/pros';
import { api, ApiError } from '../lib/api';
import PageHero from './PageHero';
import { fmtDate, fmtDateTime } from '../lib/status';

type Status = 'EMAIL_UNCONFIRMED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
interface App {
  id: string;
  status: Status;
  profile: ProProfile;
  verification: (LicenseVerification & { verifiedAt: string; verifiedBy: string }) | null;
  billing: Billing | null;
  payments?: { available: boolean; amountLabel: string | null; status: string | null; active: boolean; cancelAtPeriodEnd: boolean; hasCard: boolean };
  listed: boolean;
  decisionReason: string | null;
  createdAt: string;
  emailConfirmedAt: string | null;
  duplicates: { id: string; status: string; field: 'license' | 'email' }[];
  reverifyDueInDays: number | null;
}
interface Audit {
  at: string;
  actor: string;
  action: string;
  detail: string | null;
}

const TABS: { key: string; label: string; match: (a: App) => boolean }[] = [
  { key: 'review', label: 'Needs review', match: (a) => a.status === 'PENDING_REVIEW' },
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
    identityMethod: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const info = CATEGORIES[app.profile.category];
  const blockers = approvalBlockers(app.profile.category, v);
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

  const box = (k: 'nameMatches' | 'typeMatches' | 'companyMatches' | 'identityConfirmed', label: string) => (
    <label className="check attest"><input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} /><span>{label}</span></label>
  );

  return (
    <section className="verify-panel">
      <h3>{relisting ? 'Re-verify license' : 'Verify and approve'}</h3>
      {prev && <p className="small muted">Last verified {fmtDate(prev.verifiedAt)} by {prev.verifiedBy}: {prev.licenseStatus}{prev.licenseExpires ? `, expires ${fmtDate(prev.licenseExpires)}` : ''}.</p>}
      <ol className="small verify-steps">
        <li>
          Open <a href={info.lookupUrl} target="_blank" rel="noreferrer noopener">{info.regulator} ↗</a> and search for {info.licenseLabel}{' '}
          <strong>{app.profile.licenseId}</strong>. Record exactly what it shows.
        </li>
        <li>
          Confirm identity by contacting the <strong>company</strong> using a phone number or email from {info.regulator} or the company's own
          website. <strong>Never use the contact details on this application</strong>, because an impostor would control those.
        </li>
      </ol>
      <div className="form-grid">
        <label className="field">
          <span>Status on {info.regulator}</span>
          <select value={v.licenseStatus} onChange={(e) => set('licenseStatus', e.target.value as LicenseVerification['licenseStatus'])}>
            {['Active', 'Inactive', 'Expired', 'Revoked', 'Not found'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        {info.licenseExpires && (
          <label className="field">
            <span>Expiration shown</span>
            <input type="date" value={v.licenseExpires ?? ''} onChange={(e) => set('licenseExpires', e.target.value)} />
          </label>
        )}
      </div>
      {box('nameMatches', `Name on ${info.regulator} matches "${app.profile.name}"`)}
      {box('typeMatches', app.profile.licenseType ? `License type is ${app.profile.licenseType}` : `License type or classification fits "${info.label}"`)}
      {box('companyMatches', `${info.regulator} shows them with "${app.profile.company}"`)}
      {box('identityConfirmed', 'I confirmed the applicant is this licensee, using contact details that did not come from this application')}
      <label className="field">
        <span>How identity was confirmed</span>
        <textarea rows={2} value={v.identityMethod} onChange={(e) => set('identityMethod', e.target.value)} placeholder="e.g. Called the brokerage number listed on NRED; spoke with the office manager, who confirmed…" />
      </label>
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
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="verify-panel">
      <h3>Advertising plan</h3>
      {app.payments?.hasCard ? (
        <p className="small">
          <strong>Card payments:</strong> {app.payments.status ?? 'started, not completed'}
          {app.payments.cancelAtPeriodEnd && ' · ends after the current period'}. The paid-through date updates automatically when Stripe confirms each payment.
        </p>
      ) : app.payments?.available ? (
        <p className="small">The advertiser can pay online ({app.payments.amountLabel}) from their dashboard once approved.</p>
      ) : null}
      <p className="small muted">For payments received another way (check, invoice), record them here. The profile is live only while it's verified and paid through today or later.</p>
      <div className="form-grid">
        <label className="field"><span>Plan</span><input value={plan} onChange={(e) => setPlan(e.target.value)} /></label>
        <label className="field"><span>Paid through</span><input type="date" value={paidThrough} onChange={(e) => setPaidThrough(e.target.value)} /></label>
      </div>
      {err && <div className="caution small">{err}</div>}
      <button className="btn" onClick={async () => {
        try {
          await api(`/api/admin/applications/${app.id}/billing`, { body: { billing: { plan, paidThrough } }, auth: true });
          onSaved();
        } catch (e) {
          setErr((e as Error).message);
        }
      }}>Save plan</button>
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
        <div><dt>Serves</dt><dd>{p.serviceCities.join(', ')}{p.serviceZips.length ? ` · ${p.serviceZips.join(', ')}` : ''}</dd></div>
        <div><dt>Headline</dt><dd>{p.headline}</dd></div>
        <div><dt>{CATEGORIES[p.category].financing ? 'Loan types' : 'Services'}</dt><dd>{p.services.join(', ')}</dd></div>
        {p.creditProfiles.length > 0 && <div><dt>Credit situations</dt><dd>{p.creditProfiles.join(', ')}</dd></div>}
        <div><dt>Languages</dt><dd>{p.languages.join(', ')}</dd></div>
        <div><dt>Plan</dt><dd>{a.billing ? `${a.billing.plan}, paid through ${fmtDate(a.billing.paidThrough)}` : 'None'}</dd></div>
        <div><dt>Applied</dt><dd>{fmtDateTime(a.createdAt)}</dd></div>
        {a.reverifyDueInDays !== null && <div><dt>Re-verification</dt><dd>{a.reverifyDueInDays >= 0 ? `due in ${a.reverifyDueInDays} days` : `overdue by ${-a.reverifyDueInDays} days (hidden from directory)`}</dd></div>}
      </dl>
      <p className="small">{p.bio}</p>

      {a.status === 'EMAIL_UNCONFIRMED' && <p className="notice small">Waiting for the applicant to confirm their email. Approval is disabled until then.</p>}
      {['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(a.status) && <VerifyForm key={a.status + (a.verification?.verifiedAt ?? '')} app={a} onSaved={refresh} />}
      {['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(a.status) && <BillingForm app={a} onSaved={refresh} />}
      {a.status === 'APPROVED' && <MetricsPanel id={a.id} />}
      <div className="row">
        {['PENDING_REVIEW', 'EMAIL_UNCONFIRMED'].includes(a.status) && <ReasonAction label="Reject" path={`/api/admin/applications/${a.id}/reject`} onDone={refresh} danger />}
        {a.status === 'APPROVED' && <ReasonAction label="Suspend listing" path={`/api/admin/applications/${a.id}/suspend`} onDone={refresh} danger />}
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
      <div className="track-head">
        <div>
          <h1>Advertiser applications</h1>
          <p className="small muted">
            Signed in as {me.username}. Listings need an active license, identity confirmed through the company, re-checks every {REVERIFY_DAYS} days, and a paid plan.
          </p>
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
      {!me.signingConfigured && <div className="caution small">No signing key is configured, so approvals are saved but the public directory isn't published. Run <code>npm run keys:generate</code>.</div>}
      {msg && <div className="notice small" role="status">{msg}</div>}

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
                {a.reverifyDueInDays !== null && a.reverifyDueInDays <= 14 && <span className="small warn">Re-verify {a.reverifyDueInDays < 0 ? 'overdue' : `in ${a.reverifyDueInDays}d`}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div>{selected ? <Detail key={selected} id={selected} onChange={loadApps} /> : <p className="muted">Select an application.</p>}</div>
      </div>
    </main>
  );
}
