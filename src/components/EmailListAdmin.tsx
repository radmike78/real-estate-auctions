import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

interface Broadcast {
  id: string;
  subject: string;
  createdAt: string;
  createdBy: string;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  status: 'SENDING' | 'DONE';
}
interface Overview {
  counts: { active: number; listOptIn: number; pending: number; trackedProperties: number; savedSearches: number };
  postalAddressReady: boolean;
  broadcasts: Broadcast[];
}

const n = (x: number) => x.toLocaleString('en-US');
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });

/** Admin: who's on the email list, and writing and sending updates to the general list. */
export default function EmailListAdmin() {
  const [o, setO] = useState<Overview | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testTo, setTestTo] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(() => api<Overview>('/api/admin/email').then(setO, (e: Error) => setMsg({ ok: false, text: e.message })), []);
  useEffect(() => {
    load();
  }, [load]);
  // While an update is sending, refresh its progress.
  useEffect(() => {
    if (!o?.broadcasts.some((b) => b.status === 'SENDING')) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [o, load]);

  async function run(path: string, extra: Record<string, unknown>, done: (r: Record<string, unknown>) => string) {
    setBusy(true);
    setMsg(null);
    setErrors({});
    try {
      const r = await api<Record<string, unknown>>(path, { body: { subject, body, ...extra }, auth: true });
      setMsg({ ok: true, text: done(r) });
      return true;
    } catch (e) {
      const b = e instanceof ApiError ? e.body : {};
      setErrors((b.errors as Record<string, string>) ?? {});
      setMsg({ ok: false, text: (e as Error).message });
      if (typeof b.recipients === 'number') load();
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!o) return <p>{msg?.text ?? 'Loading…'}</p>;
  const c = o.counts;
  const sending = o.broadcasts.find((b) => b.status === 'SENDING');

  return (
    <div className="email-admin">
      <section className="kpis email-kpis" aria-label="Email sign-ups">
        <div className="kpi kpi-lead"><span className="kpi-label">General updates list</span><strong>{n(c.listOptIn)}</strong><span className="kpi-sub">confirmed addresses that asked for updates</span></div>
        <div className="kpi"><span className="kpi-label">Confirmed addresses</span><strong>{n(c.active)}</strong><span className="kpi-sub">any kind of alert</span></div>
        <div className="kpi"><span className="kpi-label">Tracked properties</span><strong>{n(c.trackedProperties)}</strong><span className="kpi-sub">change alerts</span></div>
        <div className="kpi"><span className="kpi-label">Saved searches</span><strong>{n(c.savedSearches)}</strong><span className="kpi-sub">daily digests</span></div>
        <div className="kpi"><span className="kpi-label">Waiting to confirm</span><strong>{n(c.pending)}</strong><span className="kpi-sub">deleted after 48 hours</span></div>
      </section>

      {!o.postalAddressReady && (
        <div className="caution" role="alert">
          <strong>Sending is off until you add your business details.</strong> Set <code>operatorName</code> and <code>mailingAddress</code> in{' '}
          <code>src/lib/siteInfo.ts</code>. Anti-spam law (CAN-SPAM) requires a postal address in every update. A PO box is fine.
        </div>
      )}

      <div className="email-admin-grid">
        <section className="lead-card">
          <h2>Write an update</h2>
          <p className="muted">
            Plain text, sent to everyone on the general updates list. We add the unsubscribe links, your business name and address, and a
            reminder to confirm details with the official source.
          </p>
          <div className="form">
            <label className="field">
              <span>Subject</span>
              <input value={subject} maxLength={120} onChange={(e) => { setSubject(e.target.value); setConfirming(false); }} aria-invalid={!!errors.subject} placeholder="Spring tax auction list is out" />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </label>
            <label className="field">
              <span>Message</span>
              <textarea rows={10} maxLength={20000} value={body} onChange={(e) => { setBody(e.target.value); setConfirming(false); }} aria-invalid={!!errors.body} placeholder="The Clark County Treasurer published the list for the May auction…" />
              {errors.body && <span className="field-error">{errors.body}</span>}
            </label>
            <div className="email-test row">
              <label className="field">
                <span>Send a test to</span>
                <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} aria-invalid={!!errors.to} placeholder="you@your-domain" />
                {errors.to && <span className="field-error">{errors.to}</span>}
              </label>
              <button className="btn btn-secondary" disabled={busy} onClick={() => run('/api/admin/email/test', { to: testTo }, (r) => String(r.message))}>Send test</button>
            </div>
            {msg && <div className={msg.ok ? 'notice' : 'caution'} role="status">{msg.text}</div>}
            {confirming ? (
              <div className="email-confirm">
                <p><strong>Send “{subject}” to {n(c.listOptIn)} {c.listOptIn === 1 ? 'person' : 'people'}?</strong> This can’t be undone.</p>
                <div className="row">
                  <button className="btn" disabled={busy} onClick={async () => {
                    if (await run('/api/admin/email/send', { expectedRecipients: c.listOptIn }, (r) => `Sending to ${n((r.broadcast as Broadcast).recipients)} people.`)) {
                      setSubject('');
                      setBody('');
                      load();
                    }
                    setConfirming(false);
                  }}>Yes, send it</button>
                  <button className="linkish" onClick={() => setConfirming(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn big" disabled={busy || !!sending || !o.postalAddressReady || c.listOptIn === 0 || !subject.trim() || !body.trim()} onClick={() => setConfirming(true)}>
                Send to {n(c.listOptIn)} {c.listOptIn === 1 ? 'person' : 'people'}…
              </button>
            )}
            {sending && <p className="muted">An update is sending now. You can send another when it finishes.</p>}
          </div>
        </section>

        <section className="lead-card">
          <h2>Preview</h2>
          <pre className="email-preview">
            <strong>Subject:</strong> {subject || '(subject)'}{'\n\n'}
            {body || '(your message)'}{'\n\n'}
            Always confirm details with the official source before you bid.{'\n\n'}
            --{'\n'}You're getting this because you signed up for general updates from DeedOwl.{'\n'}
            Change what you get: (their own link){'\n'}Unsubscribe from everything: (their own link){'\n'}
            (your business name and postal address)
          </pre>
          <p className="muted"><a href="/api/admin/email/list.csv">Download the list (CSV)</a>. The download is recorded. Keep it private: people signed up to hear from you, not anyone else.</p>
        </section>
      </div>

      <section>
        <h2>Sent updates</h2>
        {o.broadcasts.length === 0 ? (
          <p className="muted">Nothing sent yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sent</th><th>Subject</th><th className="num">To</th><th className="num">Delivered</th><th className="num">Failed</th><th className="num">Skipped</th><th>Status</th></tr></thead>
              <tbody>
                {o.broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td>{when(b.createdAt)}<div className="small muted">by {b.createdBy}</div></td>
                    <td>{b.subject}</td>
                    <td className="num">{n(b.recipients)}</td>
                    <td className="num">{n(b.sent)}</td>
                    <td className="num">{n(b.failed)}</td>
                    <td className="num" title="Unsubscribed or turned off updates before their turn">{n(b.skipped)}</td>
                    <td>{b.status === 'DONE' ? 'Done' : 'Sending…'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
