import { useState, type FormEvent } from 'react';
import { CLARK_COUNTY_CITIES, LANGUAGES, SPECIALTIES, validateApplication, type ApplicationInput } from '../lib/agentApplication';
import { NRED_LOOKUP_URL, REVERIFY_DAYS } from '../lib/agents';
import { api, ApiError } from '../lib/api';

type Errors = Partial<Record<keyof ApplicationInput | 'form', string>>;

const EMPTY: ApplicationInput = {
  name: '',
  brokerage: '',
  licenseNumber: '',
  licenseType: 'Salesperson',
  serviceCities: [],
  serviceZips: '',
  specialties: [],
  languages: ['English'],
  shortSaleExperience: '',
  phone: '',
  email: '',
  website: '',
  bio: '',
  attestLicensed: false,
  attestAccurate: false,
  consentVerification: false,
  company_url: '',
};

function CheckGroup({ legend, options, value, onChange, error, id }: { legend: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void; error?: string; id: string }) {
  return (
    <fieldset className="field" aria-describedby={error ? `${id}-err` : undefined}>
      <legend>{legend}</legend>
      <div className="check-grid">
        {options.map((o) => (
          <label key={o} className="check">
            <input type="checkbox" checked={value.includes(o)} onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} />
            {o}
          </label>
        ))}
      </div>
      {error && <div id={`${id}-err`} className="field-error">{error}</div>}
    </fieldset>
  );
}

export default function AgentSignupPage() {
  const [f, setF] = useState<ApplicationInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const text = (k: keyof ApplicationInput, label: string, props: Record<string, unknown> = {}, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} {...props} />
      {hint && <small className="muted">{hint}</small>}
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateApplication(f);
    if (!v.ok) {
      setErrors(v.errors);
      document.querySelector('[aria-invalid="true"], .field-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const r = await api<{ message: string }>('/api/agent-applications', { body: f });
      setDone(r.message);
      window.scrollTo(0, 0);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : {};
      setErrors({ ...((body.errors as Errors) ?? {}), form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="page prose">
        <h1>Check your email</h1>
        <p>{done}</p>
        <p className="muted">
          After you confirm, we check your license on the Nevada Real Estate Division lookup and call your brokerage to confirm your identity.
          Your profile goes live only after both checks pass. It usually takes a few business days.
        </p>
        <a href="#/agents">Back to the agent directory</a>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Apply to be listed as an agent</h1>
      <p className="muted">
        For Nevada-licensed agents serving Clark County who help buyers with short sales, bank-owned homes and auction properties.
      </p>
      <div className="notice small" role="note">
        <strong>How approval works:</strong> (1) you confirm your email; (2) we look up your license on the{' '}
        <a href={NRED_LOOKUP_URL} target="_blank" rel="noreferrer noopener">Nevada Real Estate Division lookup ↗</a>; (3) we confirm your
        identity through your brokerage, using contact details from NRED or the brokerage, not from this form. We re-check every license at
        least every {REVERIFY_DAYS} days. A profile with an expired license or an overdue check is hidden automatically.
      </div>

      <form className="form" onSubmit={submit} noValidate>
        {/* Honeypot: invisible to people and screen readers; bots that fill it are ignored. */}
        <div className="hp" aria-hidden="true">
          <label>
            Company URL <input tabIndex={-1} autoComplete="off" value={f.company_url} onChange={(e) => set('company_url', e.target.value)} />
          </label>
        </div>

        <h2>License</h2>
        <div className="form-grid">
          {text('name', 'Full name (as on your license)', { autoComplete: 'name' })}
          {text('brokerage', 'Brokerage', { autoComplete: 'organization' })}
          {text('licenseNumber', 'Nevada license number', { placeholder: 'S.0012345', autoCapitalize: 'characters' })}
          <label className="field">
            <span>License type</span>
            <select value={f.licenseType} onChange={(e) => set('licenseType', e.target.value)} aria-invalid={!!errors.licenseType}>
              <option>Salesperson</option>
              <option>Broker-Salesperson</option>
              <option>Broker</option>
            </select>
            {errors.licenseType && <span className="field-error">{errors.licenseType}</span>}
          </label>
        </div>

        <h2>Where and how you work</h2>
        <CheckGroup id="cities" legend="Cities and areas you serve" options={CLARK_COUNTY_CITIES} value={f.serviceCities} onChange={(v) => set('serviceCities', v)} error={errors.serviceCities} />
        {text('serviceZips', 'ZIP codes you serve (optional)', { placeholder: '89123, 89052, 89014', inputMode: 'numeric' }, 'Separate with commas.')}
        <CheckGroup id="specialties" legend="Specialties" options={SPECIALTIES} value={f.specialties} onChange={(v) => set('specialties', v)} error={errors.specialties} />
        <CheckGroup id="languages" legend="Languages" options={LANGUAGES} value={f.languages} onChange={(v) => set('languages', v)} error={errors.languages} />
        {text('shortSaleExperience', 'Short-sale experience (optional)', { placeholder: 'e.g. 25 short sales closed as buyer\'s agent' }, 'Shown as "Says they have…". Be accurate.')}

        <h2>Contact details shown to buyers</h2>
        <div className="form-grid">
          {text('phone', 'Business phone', { type: 'tel', autoComplete: 'tel' })}
          {text('email', 'Business email', { type: 'email', autoComplete: 'email' }, 'We send a confirmation link here.')}
          {text('website', 'Website (optional)', { type: 'url', placeholder: 'https://' })}
        </div>
        <label className="field">
          <span>About you</span>
          <textarea rows={4} maxLength={600} value={f.bio} onChange={(e) => set('bio', e.target.value)} aria-invalid={!!errors.bio} />
          <small className="muted">{f.bio.length}/600. Plain text only.</small>
          {errors.bio && <span className="field-error">{errors.bio}</span>}
        </label>

        <h2>Confirmations</h2>
        {(
          [
            ['attestLicensed', 'I hold an active Nevada real estate license and work under the brokerage named above.'],
            ['attestAccurate', 'The information above is accurate, and I will tell you if my license or brokerage changes.'],
            ['consentVerification', 'I consent to you verifying my license with the Nevada Real Estate Division and contacting my brokerage to confirm my identity.'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="check attest">
            <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} aria-invalid={!!errors[k]} />
            <span>{label}{errors[k] && <span className="field-error"> {errors[k]}</span>}</span>
          </label>
        ))}

        {errors.form && <div className="caution" role="alert">{errors.form}</div>}
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
      </form>
    </main>
  );
}
