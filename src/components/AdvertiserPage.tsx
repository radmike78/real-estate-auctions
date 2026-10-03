import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { replaceAddress } from '../lib/nav';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/pros';
import type { ProProfile, Billing } from '../lib/proApplication';
import { fmtDate, fmtDateTime } from '../lib/status';
import PageHero from './PageHero';
import DailyColumns from './DailyColumns';
import OwlNote from './OwlNote';

const LOGIN_KEY = 'fsf.pro-login';

interface Me {
  id: string;
  status: string;
  profile: ProProfile;
  billing: Billing | null;
  verifiedAt: string | null;
  reverifyDueInDays: number | null;
  listed: boolean;
  payments: { available: boolean; amountLabel: string | null; status: string | null; active: boolean; cancelAtPeriodEnd: boolean; hasCard: boolean };
  photo: { live: string | null; pendingAt: string | null };
}

// Only ever send the browser to Stripe's own pages.
const STRIPE_PAGES = ['https://checkout.stripe.com/', 'https://billing.stripe.com/'];

function PlanCard({ me }: { me: Me }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice] = useState(() => {
    const m = `${window.location.search}${window.location.hash}`.match(/[?&]payment=(done|cancelled)/);
    if (m) replaceAddress('/advertiser');
    return m?.[1] ?? null;
  });
  const p = me.payments;
  async function open(path: string) {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ url: string }>(path, { body: {}, auth: true });
      if (!STRIPE_PAGES.some((pre) => r.url.startsWith(pre))) throw new Error('Unexpected payment page address.');
      window.location.assign(r.url);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section className="plan-card" aria-labelledby="plan-h">
      <h2 id="plan-h">Your plan</h2>
      {notice === 'done' && (
        <div className="notice" role="status">
          {p.active ? <><strong>Payment received. Thank you!</strong> {me.listed ? 'Your profile is live.' : 'Your profile will be live shortly.'}</> : <><strong>Thank you.</strong> Stripe is confirming your payment. Your profile goes live within a minute or two; refresh this page to check.</>}
        </div>
      )}
      {notice === 'cancelled' && <div className="caution" role="status">Payment was cancelled. Nothing was charged.</div>}
      {p.active ? (
        <>
          <p className="plan-line">
            <strong>{p.amountLabel ?? me.billing?.plan}</strong>
            {me.billing && <> · paid through <strong>{fmtDate(me.billing.paidThrough)}</strong></>}
          </p>
          {p.status === 'past_due' && <div className="caution">Your last payment didn't go through. Update your card to keep your profile live.</div>}
          {p.cancelAtPeriodEnd && <p className="muted">Your plan is set to end after the current paid period.</p>}
          <button className="btn" disabled={busy} onClick={() => open('/api/pro/billing-portal')}>{busy ? 'Opening…' : 'Manage billing'}</button>
          <p className="muted">Change your card, download receipts or cancel on Stripe's secure page.</p>
        </>
      ) : p.available ? (
        <>
          <p className="plan-line"><strong>{p.amountLabel}</strong> · the same flat price for everyone in your category. Cancel any time.</p>
          {me.billing && <p className="muted">Currently paid through {fmtDate(me.billing.paidThrough)}.</p>}
          <button className="btn big plan-cta" disabled={busy} onClick={() => open('/api/pro/checkout')}>{busy ? 'Opening secure payment…' : 'Start advertising'}</button>
          <p className="muted">You'll pay on Stripe's secure page. We never see or store your card details. Your profile goes live as soon as the payment clears.</p>
          {p.hasCard && <button className="linkish" disabled={busy} onClick={() => open('/api/pro/billing-portal')}>Manage billing</button>}
        </>
      ) : (
        <p>{me.billing ? <>Paid through <strong>{fmtDate(me.billing.paidThrough)}</strong>. </> : null}We'll contact you to set up or renew your advertising plan.</p>
      )}
      {err && <div className="caution" role="alert">{err}</div>}
    </section>
  );
}

interface Summary {
  from: string;
  to: string;
  totals: Record<'impression' | 'profile_view' | 'phone_click' | 'email_click' | 'website_click' | 'lead', { total: number; uniques: number }>;
  contactRate: number | null;
  daily: { day: string; views: number; contacts: number; leads: number }[];
}
interface Lead {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interest: string | null;
}

// Sign-in links are single use: share one request per token even if React runs the effect twice.
const sessions = new Map<string, Promise<unknown>>();

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Upload a headshot or logo. It goes live only after an admin approves it. */
function PhotoCard({ me, onChange }: { me: Me; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const photo = me.photo ?? { live: null, pendingAt: null };

  async function upload(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    if (!PHOTO_TYPES.includes(file.type)) return setMsg({ ok: false, text: 'Use a JPG, PNG or WebP photo.' });
    if (file.size > 5 * 1024 * 1024) return setMsg({ ok: false, text: 'That photo is over 5 MB. Choose a smaller one.' });
    setBusy(true);
    try {
      const res = await fetch('/api/pro/photo', { method: 'POST', headers: { 'content-type': file.type, 'x-fsf-request': '1' }, body: file, credentials: 'same-origin' });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setMsg(res.ok ? { ok: true, text: body.message ?? 'Photo received.' } : { ok: false, text: body.error ?? `Upload failed (${res.status}).` });
      if (res.ok) onChange();
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }
  async function remove(which: 'pending' | 'live') {
    setBusy(true);
    await api('/api/pro/photo/remove', { body: { which }, auth: true }).catch(() => {});
    setBusy(false);
    setMsg(null);
    onChange();
  }

  return (
    <section className="plan-card photo-card" aria-labelledby="photo-h">
      <h2 id="photo-h">Profile photo</h2>
      <div className="photo-row">
        <div className="photo-slot">
          {photo.live ? <img className="avatar photo big" src={`/api/pro/photo/live?v=${photo.live.slice(0, 12)}`} alt="Your live profile photo" width={84} height={84} /> : <div className="avatar big" aria-hidden>{me.profile.name.slice(0, 1).toUpperCase()}</div>}
          <span className="small muted">{photo.live ? 'Live on your profile' : 'No photo yet: your initials show'}</span>
          {photo.live && <button className="linkish" disabled={busy} onClick={() => remove('live')}>Remove</button>}
        </div>
        {photo.pendingAt && (
          <div className="photo-slot">
            <img className="avatar photo big" src={`/api/pro/photo/pending?v=${encodeURIComponent(photo.pendingAt)}`} alt="Your photo waiting for approval" width={84} height={84} />
            <span className="small muted">Waiting for approval (sent {fmtDate(photo.pendingAt)})</span>
            <button className="linkish" disabled={busy} onClick={() => remove('pending')}>Withdraw</button>
          </div>
        )}
      </div>
      <p className="small">
        Use a clear headshot of you, or your company's logo. It must be your own or one you have the rights to, with no text, prices or claims.
        We check every photo before it appears.
      </p>
      <label className="btn btn-secondary photo-upload">
        {busy ? 'Uploading…' : photo.live || photo.pendingAt ? 'Upload a new photo' : 'Upload a photo'}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      <span className="small muted"> JPG, PNG or WebP, up to 5 MB. We crop it to a square.</span>
      {msg && <p className={msg.ok ? 'notice' : 'caution'} role="status">{msg.text}</p>}
    </section>
  );
}

export function ranges(): Record<string, { label: string; from: string; to: string }> {
  const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const today = day(0);
  const [y, m] = today.split('-').map(Number);
  const lastMonthStart = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
  return {
    d30: { label: 'Last 30 days', from: day(29), to: today },
    d90: { label: 'Last 90 days', from: day(89), to: today },
    lastMonth: { label: 'Last month', from: lastMonthStart, to: lastMonthEnd },
  };
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg('Enter the email address on your advertiser application.');
      return;
    }
    const r = await api<{ message: string }>('/api/pro/login', { body: { email } }).catch((err: Error) => ({ message: err.message }));
    setMsg(r.message);
  }
  return (
    <main className="page">
      <PageHero compact title="Advertiser sign-in" />
      <div className="signin-card">
        <div className="signin-info">
          <h2>Your advertising dashboard</h2>
          <ul>
            <li>Profile views and phone, email and website clicks</li>
            <li>Leads from buyers, with a CSV download</li>
            <li>Your verification and plan status</li>
          </ul>
        </div>
        <div className="signin-form">
          <p className="muted">Enter the business email on your profile. We'll email you a one-time sign-in link, so there's no password to remember.</p>
          <form className="form" onSubmit={submit}>
            <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="btn">Email me a sign-in link</button>
          </form>
          {msg && <div className="notice small" role="status">{msg}</div>}
          <p className="small muted">Not listed yet? <a href="#/advertise">Advertise with us →</a></p>
        </div>
      </div>
    </main>
  );
}

export default function AdvertiserPage({ token }: { token: string | null }) {
  const [me, setMe] = useState<Me | null | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState('d30');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showTable, setShowTable] = useState(false);
  const range = ranges()[rangeKey];

  const loadMe = useCallback(() => api<Me>('/api/pro/me').then(setMe).catch(() => setMe(null)), []);

  // A sign-in link is only used after a click, so nobody can sign you into their account just by
  // getting you to open their link.
  // The token is dropped from the address bar, but kept for this tab only, so refreshing before the click still works.
  const [pending, setPending] = useState<string | null>(() => {
    if (token) return token;
    try {
      return sessionStorage.getItem(LOGIN_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (token) {
      try {
        sessionStorage.setItem(LOGIN_KEY, token);
      } catch {
        /* storage unavailable */
      }
      history.replaceState(null, '', '#/advertiser'); // drop the token from the address bar and history
    } else if (!pending) loadMe();
  }, [token, loadMe]); // eslint-disable-line react-hooks/exhaustive-deps
  function redeemLink(t: string) {
    try {
      sessionStorage.removeItem(LOGIN_KEY);
    } catch {
      /* storage unavailable */
    }
    if (!sessions.has(t)) sessions.set(t, api('/api/pro/session', { body: { token: t }, auth: true }));
    setMe('loading');
    setPending(null);
    sessions.get(t)!.then(loadMe).catch((e: Error) => {
      setError(e.message);
      setMe(null);
    });
  }

  useEffect(() => {
    if (!me || me === 'loading') return;
    const qs = `?from=${range.from}&to=${range.to}`;
    api<Summary>(`/api/pro/metrics${qs}`).then(setSummary).catch(() => setSummary(null));
    api<{ leads: Lead[] }>(`/api/pro/leads${qs}`).then((r) => setLeads(r.leads)).catch(() => setLeads([]));
  }, [me, range.from, range.to]);

  if (pending) {
    return (
      <main className="page">
        <PageHero compact title="Advertiser sign-in" />
        <div className="narrow-box">
          <p>You opened a one-time sign-in link for an advertiser dashboard.</p>
          <p className="muted small">Only continue if you asked for this link yourself, from the sign-in page.</p>
          <div className="form">
            <button className="btn" onClick={() => redeemLink(pending)}>Sign in to my dashboard</button>
          </div>
          <p className="small muted"><a href="#/advertiser" onClick={() => { setPending(null); loadMe(); }}>Cancel</a></p>
        </div>
      </main>
    );
  }
  if (me === 'loading') return <main className="page"><p>Loading…</p></main>;
  if (!me) return <>{error && <div className="page"><div className="caution" role="alert">{error}</div></div>}<SignIn /></>;

  const t = summary?.totals;
  const contacts = t ? t.phone_click.uniques + t.email_click.uniques + t.website_click.uniques : 0;
  const info = CATEGORIES[me.profile.category];

  return (
    <main className="page wide">
      <div className="track-head">
        <div>
          <div className="pro-kicker">{info.label}</div>
          <h1>{me.profile.name}</h1>
          <p className="small">
            {me.listed ? <span className="verified">● Live in the directory</span> : <span className="neg">○ Not live</span>}
            {me.billing && <> · plan paid through {fmtDate(me.billing.paidThrough)}</>}
            {me.reverifyDueInDays !== null && <> · license re-check {me.reverifyDueInDays >= 0 ? `due in ${me.reverifyDueInDays} days` : 'overdue'}</>}
          </p>
        </div>
        <div className="row">
          <a className="btn btn-secondary" href={`#/pros/${me.id}`}>View my profile</a>
          <button onClick={async () => { await api('/api/pro/logout', { body: {}, auth: true }).catch(() => {}); setMe(null); }}>Sign out</button>
        </div>
      </div>

      <PlanCard me={me} />
      <PhotoCard me={me} onChange={loadMe} />

      <div className="toolbar" role="group" aria-label="Date range">
        <div className="seg">
          {Object.entries(ranges()).map(([k, r]) => (
            <button key={k} aria-pressed={rangeKey === k} onClick={() => setRangeKey(k)}>{r.label}</button>
          ))}
        </div>
        <span className="small muted">{fmtDate(range.from)} – {fmtDate(range.to)}</span>
      </div>

      {t && summary && (
        <>
          <section className="kpis" aria-label="Results">
            <div className="kpi kpi-lead">
              <span className="kpi-label">Leads sent to you</span>
              <strong>{t.lead.total.toLocaleString()}</strong>
              <span className="kpi-sub">buyers who filled in your contact form</span>
            </div>
            <div className="kpi"><span className="kpi-label">Appeared in results</span><strong>{t.impression.total.toLocaleString()}</strong></div>
            <div className="kpi"><span className="kpi-label">Profile views</span><strong>{t.profile_view.uniques.toLocaleString()}</strong><span className="kpi-sub">unique visitors</span></div>
            <div className="kpi"><span className="kpi-label">Contact clicks</span><strong>{contacts.toLocaleString()}</strong><span className="kpi-sub">{t.phone_click.uniques} call · {t.email_click.uniques} email · {t.website_click.uniques} website</span></div>
            <div className="kpi"><span className="kpi-label">Visitors who reached out</span><strong>{summary.contactRate === null ? '—' : `${Math.round(summary.contactRate * 100)}%`}</strong><span className="kpi-sub">contact clicks ÷ profile views</span></div>
          </section>

          <div className="viz-root">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Daily activity</h2>
              <button className="linkish" onClick={() => setShowTable(!showTable)}>{showTable ? 'Show charts' : 'Show as table'}</button>
            </div>
            {showTable ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Day</th><th className="num">Profile views</th><th className="num">Contact clicks</th><th className="num">Leads</th></tr></thead>
                  <tbody>{summary.daily.map((d) => <tr key={d.day}><td>{fmtDate(d.day)}</td><td className="num">{d.views}</td><td className="num">{d.contacts}</td><td className="num">{d.leads}</td></tr>)}</tbody>
                </table>
              </div>
            ) : (
              <div className="small-multiples">
                <DailyColumns title="Profile views" data={summary.daily.map((d) => ({ day: d.day, value: d.views }))} />
                <DailyColumns title="Contact clicks" data={summary.daily.map((d) => ({ day: d.day, value: d.contacts }))} />
                <DailyColumns title="Leads" data={summary.daily.map((d) => ({ day: d.day, value: d.leads }))} />
              </div>
            )}
          </div>
        </>
      )}

      <section>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Leads ({leads.length})</h2>
          <a className="btn btn-secondary" href={`/api/pro/leads.csv?from=${range.from}&to=${range.to}`}>Download CSV</a>
        </div>
        {leads.length === 0 && <OwlNote>No leads in this period yet.</OwlNote>}
        <ul className="lead-list">
          {leads.map((l) => (
            <li key={l.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{l.name}</strong>
                <span className="small muted">{fmtDateTime(l.createdAt)}</span>
              </div>
              <div className="small">
                <a href={`mailto:${l.email}`}>{l.email}</a>
                {l.phone && <> · <a href={`tel:${l.phone}`}>{l.phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}</a></>}
                {l.interest && <> · {l.interest}</>}
              </div>
              <p className="small">{l.message}</p>
            </li>
          ))}
        </ul>
        <p className="small muted">
          Buyers agreed to share these details with you only. Respond personally and follow the laws on contacting consumers (for example, don't
          add them to marketing lists or robocalls without consent). Leads are kept for 13 months.
        </p>
      </section>
      <p className="small muted">Counts exclude known bots and repeat clicks by the same visitor on the same day. We don't track visitors across days or collect anything that identifies them.</p>
    </main>
  );
}
