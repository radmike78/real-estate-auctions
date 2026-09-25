import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { Pro } from '../lib/pros';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'consent' | 'acknowledge' | 'form', string>>;

export default function LeadForm({ pro }: { pro: Pro }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', interest: '', message: '', consent: false, acknowledge: false, company_url: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  if (pro.isSample) {
    return (
      <section className="lead-card">
        <h2>Contact {pro.name}</h2>
        <p className="small muted">This is a sample profile, so messages are turned off.</p>
      </section>
    );
  }
  if (sent) {
    return (
      <section className="lead-card">
        <h2>Message sent</h2>
        <p>{sent}</p>
        <p className="small muted">We also emailed you a copy. Verify their license and read every document before you sign or pay anything.</p>
      </section>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const r = await api<{ message: string }>(`/api/pros/${pro.id}/leads`, { body: { ...f, interest: f.interest || null } });
      setSent(r.message);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : {};
      setErrors({ ...((body.errors as Errors) ?? {}), form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const input = (k: 'name' | 'email' | 'phone', label: string, props: Record<string, unknown> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <section className="lead-card">
      <h2>Contact {pro.name}</h2>
      <form className="form" onSubmit={submit} noValidate>
        <div className="hp" aria-hidden="true">
          <label>Company URL <input tabIndex={-1} autoComplete="off" value={f.company_url} onChange={(e) => set('company_url', e.target.value)} /></label>
        </div>
        {input('name', 'Your name', { autoComplete: 'name' })}
        {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
        {input('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel' })}
        <label className="field">
          <span>Interested in (optional)</span>
          <select value={f.interest} onChange={(e) => set('interest', e.target.value)}>
            <option value="">Choose…</option>
            {pro.services.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Message</span>
          <textarea rows={3} maxLength={1000} value={f.message} onChange={(e) => set('message', e.target.value)} aria-invalid={!!errors.message} placeholder="What are you looking for? Don't include account numbers or your SSN." />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </label>
        <label className="check attest">
          <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
          <span>Send my name, email, phone and message to {pro.name} only, so they can contact me about my request.{errors.consent && <span className="field-error"> {errors.consent}</span>}</span>
        </label>
        <label className="check attest">
          <input type="checkbox" checked={f.acknowledge} onChange={(e) => set('acknowledge', e.target.checked)} />
          <span>
            I understand Forced-Sale Finder only helps me find options. It isn't a party to any agreement I make, and I'm responsible for my own
            due diligence. <a href="#/disclaimer" target="_blank" rel="noreferrer">Read more</a>
            {errors.acknowledge && <span className="field-error"> {errors.acknowledge}</span>}
          </span>
        </label>
        {errors.form && <div className="caution small" role="alert">{errors.form}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
      </form>
    </section>
  );
}
