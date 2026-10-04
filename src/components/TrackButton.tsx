import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import { forgetManageToken, storedManageToken } from '../lib/alertsLink';
import { useSiteFeatures } from '../lib/siteFeatures';
import { useModal } from '../lib/useModal';

/** "Email me changes" for a verified listing. With a remembered alerts link it's one click; otherwise email + confirm. */
export default function TrackButton({ target, label }: { target: string; label: string }) {
  const intro = target.startsWith('irs:') ? IRS_INTRO : PROPERTY_INTRO;
  const [open, setOpen] = useState(false);
  const features = useSiteFeatures();
  if (!features?.email) return null; // email alerts aren't set up on this server yet
  return (
    <>
      <button className="linkish track-btn" onClick={() => setOpen(true)} aria-label={`Email me changes to ${label}`}>✉ Email me changes</button>
      {open && <AlertDialog title="Email me changes" intro={intro} target={target} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}

const PROPERTY_INTRO = 'We’ll email you if it leaves the Treasurer’s list or comes back, if the auction date or minimum bid changes, and before the auction.';
const IRS_INTRO = 'We’ll email you if the IRS cancels or relists the sale, if the sale date or minimum bid changes, and before the sale.';

/** Adds one alert (a tracked property or a saved search): one click with a remembered link, otherwise by email with confirmation. */
export function AlertDialog({ title, intro, target, label, extra, onClose }: { title: string; intro: string; target: string; label: string; extra?: ReactNode; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [list, setList] = useState(false);
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(storedManageToken);
  const first = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  useModal(box, onClose);
  useEffect(() => first.current?.focus(), [token, done]);

  async function quickAdd() {
    setBusy(true);
    setError(null);
    try {
      await api('/api/alerts/update', { body: { token, add: target }, auth: true });
      setDone(target.startsWith('search:') ? 'Search saved. We’ll email you once a day when new parcels match.' : 'You’re tracking it. We’ll email you when it changes.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404 && /link/i.test(e.message)) {
        forgetManageToken(); // the remembered link no longer works: fall back to email
        setToken(null);
      } else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone((await api<{ message: string }>('/api/alerts/track', { body: { email, target, list, company_url: hp } })).message);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : {};
      setError(((body.errors as Record<string, string> | undefined)?.email) ?? (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="role-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="role-dialog track-dialog" role="dialog" aria-modal="true" aria-labelledby="track-title">
        <h2 id="track-title">{title}</h2>
        {!done && extra}
        <p className="track-label">{label}</p>
        {done ? (
          <>
            <p role="status">{done}</p>
            <div className="row">
              <button ref={(el) => void (first.current = el)} className="btn" onClick={onClose}>Done</button>
              {token && <a href={`#/alerts/manage/${token}`}>Manage my alerts</a>}
            </div>
          </>
        ) : token ? (
          <>
            <p>{intro}</p>
            {error && <div className="caution" role="alert">{error}</div>}
            <div className="row">
              <button ref={(el) => void (first.current = el)} className="btn big" disabled={busy} onClick={quickAdd}>{busy ? 'Adding…' : 'Add it'}</button>
              <button className="linkish" onClick={() => { forgetManageToken(); setToken(null); }}>Use a different email</button>
            </div>
          </>
        ) : (
          <form className="form" onSubmit={submit} noValidate>
            <p>{intro} Free, no account.</p>
            <div className="hp" aria-hidden="true">
              <label>Company URL <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label>
            </div>
            <label className="field">
              <span>Your email</span>
              <input ref={(el) => void (first.current = el)} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
            </label>
            <label className="check attest">
              <input type="checkbox" checked={list} onChange={(e) => setList(e.target.checked)} />
              <span>Also send me general updates (new auction lists, guides and site news).</span>
            </label>
            {error && <div className="caution" role="alert">{error}</div>}
            <div className="row">
              <button className="btn big" disabled={busy}>{busy ? 'Sending…' : title}</button>
              <button type="button" className="linkish" onClick={onClose}>Cancel</button>
            </div>
            <p className="muted">We’ll send a link to confirm first. <a href="#/privacy">Privacy</a></p>
          </form>
        )}
      </div>
    </div>
  );
}
