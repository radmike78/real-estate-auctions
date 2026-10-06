import { useEffect, useState, type FormEvent } from 'react';
import { navigate, replaceAddress } from '../lib/nav';
import { api, ApiError, unreachable } from '../lib/api';
import PageHero from './PageHero';
import EmptyState from './EmptyState';
import OwlNote from './OwlNote';
import { useSiteFeatures } from '../lib/siteFeatures';
import { forgetManageToken, rememberManageToken, storedManageToken } from '../lib/alertsLink';

export type AlertsMode = 'signup' | 'confirm' | 'manage' | 'unsubscribe';

interface Subscription {
  id: string;
  kind: string;
  label: string;
  createdAt: string;
}
interface ManageView {
  email: string;
  listOptIn: boolean;
  confirmedAt: string | null;
  subscriptions: Subscription[];
  preview?: { kind: 'property' | 'search'; target: string; label: string; tracked: boolean } | null;
}

const KIND_LABEL: Record<string, string> = { property: 'Tracked property', search: 'Saved search' };

/** Email alerts: sign up (double opt-in), confirm, manage from the emailed link, and unsubscribe. No accounts. */
export default function AlertsPage({ mode, token: fromLink, welcome, add }: { mode: AlertsMode; token: string; welcome?: boolean; add?: string }) {
  const features = useSiteFeatures();
  // The emailed link's token works like a password, so it's taken out of the address bar (and so out of history,
  // referrers and server logs) and kept for this tab only, so refreshing the page still works.
  const tabKey = `deedowl.alerts.${mode}.tab`;
  const [token] = useState(() => {
    if (fromLink) return fromLink;
    try {
      return sessionStorage.getItem(tabKey) ?? '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    if (!fromLink || mode === 'signup') return;
    try {
      sessionStorage.setItem(tabKey, fromLink);
    } catch {
      /* storage unavailable: the page still works until it's reloaded */
    }
    replaceAddress(`/alerts/${mode}${add ? `?add=${encodeURIComponent(add)}` : ''}`);
  }, [fromLink, mode, add, tabKey]);
  return (
    <main className="page alerts-page">
      <PageHero
        compact={mode !== 'signup'}
        eyebrow={features?.email ? <span className="eyebrow">Free · No account needed</span> : undefined}
        title={mode === 'signup' ? <>Email <span className="grad">alerts</span></> : 'Email alerts'}
        sub={mode === 'signup' && features?.email ? 'Updates from DeedOwl in your inbox. Confirm once, then change or stop them any time from the link in every email.' : undefined}
      />
      {mode === 'signup' && features && (features.email ? <SignUp /> : <AlertsSoon />)}
      {mode === 'confirm' && <Confirm token={token} />}
      {mode === 'manage' && <Manage token={token} welcome={!!welcome} add={add} />}
      {mode === 'unsubscribe' && <Unsubscribe token={token} />}
    </main>
  );
}

/** Shown until the server has an email service set up. */
function AlertsSoon() {
  return (
    <EmptyState soon title="Email alerts are coming soon">
      <p>
        Soon you’ll be able to get a free email when a new tax-sale list comes out, when a parcel you’re watching changes, and before the
        auction. No account needed.
      </p>
      <p>
        Until then, check <a href="#/live">Live tax sales</a> for verified parcels, or <a href="#/deals">save properties to My deals</a> to keep
        track of them in this browser.
      </p>
    </EmptyState>
  );
}

function SignUp() {
  const [f, setF] = useState({ email: '', list: false, company_url: '' });
  const [errors, setErrors] = useState<Partial<Record<'email' | 'list' | 'form', string>>>({});
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setDone((await api<{ message: string }>('/api/alerts/signup', { body: f })).message);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : {};
      setErrors({ ...((body.errors as typeof errors) ?? {}), form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="alerts-grid">
      <section className="lead-card">
        {done ? (
          <>
            <h2>Check your inbox</h2>
            <p>{done}</p>
            <p className="muted">Nothing is sent until you click the link. Don’t see it? Check your spam folder.</p>
          </>
        ) : (
          <>
            <h2>Sign up</h2>
            <form className="form" onSubmit={submit} noValidate>
              <div className="hp" aria-hidden="true">
                <label>Company URL <input tabIndex={-1} autoComplete="off" value={f.company_url} onChange={(e) => setF({ ...f, company_url: e.target.value })} /></label>
              </div>
              <label className="field">
                <span>Your email</span>
                <input type="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-invalid={!!errors.email} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label className="check attest">
                <input type="checkbox" checked={f.list} onChange={(e) => setF({ ...f, list: e.target.checked })} />
                <span>
                  <strong>General updates:</strong> new Clark County, Nevada auction lists, new guides and site news. A few emails a month at most. We don’t send sale alerts for other counties yet: watch your county’s page in Find Deals.
                  {errors.list && <span className="field-error"> {errors.list}</span>}
                </span>
              </label>
              {errors.form && !errors.email && !errors.list && <div className="caution" role="alert">{errors.form}</div>}
              <button className="btn big" disabled={busy}>{busy ? 'Sending…' : f.list ? 'Sign up' : 'Email me my manage link'}</button>
              {!f.list && <p className="small muted">To sign up, tick General updates above.</p>}
              <p className="muted">Already signed up? Enter your email and we’ll send you your link to manage your alerts.</p>
            </form>
          </>
        )}
      </section>
      <section className="alerts-how" aria-labelledby="alerts-how-h">
        <h2 id="alerts-how-h">How it works</h2>
        <ol>
          <li><strong>Confirm your email.</strong> We send one link. Nothing else arrives until you click it.</li>
          <li><strong>Manage from any email.</strong> Every message has a link to change what you get. No password to remember.</li>
          <li><strong>Stop any time.</strong> One click unsubscribes you and deletes your address.</li>
        </ol>
        <p className="muted">
          Alerts are free. We never sell or share your email address, and advertisers never see it. <a href="#/privacy">Privacy policy</a>
        </p>
      </section>
    </div>
  );
}

function Confirm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    api<{ manageToken: string }>('/api/alerts/confirm', { body: { token } })
      .then((r) => alive && navigate(`/alerts/manage/${r.manageToken}?welcome=1`, { replace: true }))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [token]);
  return (
    <section className="lead-card alerts-narrow">
      {error ? (
        <>
          <OwlNote><strong>{unreachable(error) ? 'We couldn’t confirm your email just now' : 'That link didn’t work'}</strong></OwlNote>
          <p>{error}</p>
          {unreachable(error) ? <button className="btn" onClick={() => window.location.reload()}>Try again</button> : <a className="btn" href="#/alerts">Sign up again</a>}
        </>
      ) : (
        <p>Confirming your email…</p>
      )}
    </section>
  );
}

function Manage({ token, welcome, add }: { token: string; welcome: boolean; add?: string }) {
  const [view, setView] = useState<ManageView | null>(null);
  const [offer, setOffer] = useState<ManageView['preview']>(null);
  const [remembered, setRemembered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    api<ManageView>('/api/alerts/manage', { body: { token, preview: add }, auth: true }).then(
      (v) => {
        setView(v);
        if (v.preview && !v.preview.tracked) setOffer(v.preview);
        // Remember the link in this browser so tracking another property is one click.
        rememberManageToken(token);
        setRemembered(storedManageToken() === token);
      },
      (e: Error) => setError(e.message),
    );
  }, [token, add]);

  async function update(change: Record<string, unknown>) {
    setSaving(true);
    try {
      const r = await api<ManageView & { deleted?: boolean }>('/api/alerts/update', { body: { token, ...change }, auth: true });
      if (r.deleted) {
        forgetManageToken();
        setDeleted(true);
      } else setView(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (deleted) return <Done title="You’re unsubscribed" text="We deleted your email address and everything you signed up for. You won’t get any more email from us." />;
  if (error && !view) return unreachable(error) ? <Done title="We couldn’t load your alerts just now" text={error} /> : <Done title="That link didn’t work" text={error} again />;
  if (!view) return <section className="lead-card alerts-narrow"><p>Loading your alerts…</p></section>;

  return (
    <div className="alerts-narrow">
      {welcome && (
        <div className="notice" role="status">
          <strong>You’re confirmed.</strong> We emailed you this page’s link too. Keep it to change your alerts later.
        </div>
      )}
      {offer && (
        <div className="notice track-offer" role="status">
          {offer.kind === 'search' ? (
            <p><strong>Save the search “{offer.label}”?</strong> We’ll email you once a day when new parcels match.</p>
          ) : (
            <p><strong>Track {offer.label}?</strong> We’ll email you when it changes on the Treasurer’s list, and before the auction.</p>
          )}
          <div className="row">
            <button className="btn" disabled={saving} onClick={() => update({ add: offer.target }).then(() => setOffer(null))}>Add it</button>
            <button className="linkish" onClick={() => setOffer(null)}>No thanks</button>
          </div>
        </div>
      )}
      <section className="lead-card">
        <h2>Alerts for {view.email}</h2>
        <label className="check attest">
          <input type="checkbox" checked={view.listOptIn} disabled={saving} onChange={(e) => {
            const on = e.target.checked;
            setView({ ...view, listOptIn: on }); // show the change at once; the server's answer replaces it
            void update({ list: on });
          }} />
          <span><strong>General updates:</strong> new Clark County, Nevada auction lists, new guides and site news. No sale alerts for other counties yet.</span>
        </label>
        <h3>Tracked properties and saved searches</h3>
        {view.subscriptions.length === 0 ? (
          <OwlNote>None yet. On <a href="#/live">Live tax sales</a>, choose ✉ Email me changes on any parcel, or ✉ Email me new matches to save a search.</OwlNote>
        ) : (
          <ul className="alerts-subs">
            {view.subscriptions.map((s) => (
              <li key={s.id}>
                <span><span className="badge">{KIND_LABEL[s.kind] ?? s.kind}</span> {s.label}</span>
                <button className="linkish" disabled={saving} onClick={() => update({ remove: s.id })} aria-label={`Stop alerts for ${s.label}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        {error && <div className="caution" role="alert">{error}</div>}
        {remembered && (
          <p className="muted">
            This browser remembers your alerts link, so you can add alerts in one click.{' '}
            <button className="linkish" onClick={() => { forgetManageToken(); setRemembered(false); }}>Forget it on this browser</button>
          </p>
        )}
      </section>
      <section className="lead-card alerts-stop">
        <h3>Stop all email</h3>
        {confirmDelete ? (
          <div className="row">
            <button className="btn btn-danger" disabled={saving} onClick={() => update({ deleteAll: true })}>Yes, unsubscribe and delete my address</button>
            <button className="linkish" onClick={() => setConfirmDelete(false)}>Keep my alerts</button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setConfirmDelete(true)}>Unsubscribe from everything</button>
        )}
      </section>
    </div>
  );
}

function Unsubscribe({ token }: { token: string }) {
  const [state, setState] = useState<'ask' | 'busy' | 'done'>('ask');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  // A button, not an automatic request: link scanners in some mail systems open every link.
  async function go() {
    setState('busy');
    try {
      setMessage((await api<{ message: string }>(`/api/alerts/unsubscribe?t=${encodeURIComponent(token)}`, { body: {} })).message);
      forgetManageToken();
      setState('done');
    } catch (e) {
      setError((e as Error).message);
      setState('ask');
    }
  }
  if (state === 'done') return <Done title="You’re unsubscribed" text={message} />;
  return (
    <section className="lead-card alerts-narrow">
      <h2>Unsubscribe from everything?</h2>
      <p>We’ll delete your email address and every alert you signed up for.</p>
      {error && <div className="caution" role="alert">{error}</div>}
      <button className="btn big" disabled={state === 'busy'} onClick={go}>{state === 'busy' ? 'Unsubscribing…' : 'Unsubscribe'}</button>
    </section>
  );
}

function Done({ title, text, again }: { title: string; text: string; again?: boolean }) {
  return (
    <section className="lead-card alerts-narrow" role="status">
      <OwlNote><strong>{title}</strong></OwlNote>
      <p>{text}</p>
      {again ? <a className="btn" href="#/alerts">Sign up again</a> : <a href="#/">Back to the home page</a>}
    </section>
  );
}
