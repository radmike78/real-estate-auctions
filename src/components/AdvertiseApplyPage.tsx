import { useState, type FormEvent } from 'react';
import { CLARK_COUNTY_CITIES, LANGUAGES, validateApplication, type ApplicationInput } from '../lib/proApplication';
import { CATEGORIES, CREDIT_PROFILES, REVERIFY_DAYS, servicesFor, type Category } from '../lib/pros';
import PageHero from './PageHero';
import { api, ApiError } from '../lib/api';

type Errors = Partial<Record<keyof ApplicationInput | 'form', string>>;

const blank = (category: string): ApplicationInput => ({
  category,
  name: '',
  company: '',
  licenseId: '',
  serviceCities: [],
  serviceZips: '',
  services: [],
  creditProfiles: [],
  languages: ['English'],
  headline: '',
  phone: '',
  email: '',
  website: '',
  bio: '',
  attestLicensed: false,
  attestAccurate: false,
  consentVerification: false,
  attestAdvertising: false,
  company_url: '',
});

function CheckGroup({ legend, options, value, onChange, error }: { legend: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void; error?: string }) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="check-grid">
        {options.map((o) => (
          <label key={o} className="check">
            <input type="checkbox" checked={value.includes(o)} onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} />
            {o}
          </label>
        ))}
      </div>
      {error && <div className="field-error">{error}</div>}
    </fieldset>
  );
}

export default function AdvertiseApplyPage({ initialCategory }: { initialCategory: Category | null }) {
  const [f, setF] = useState<ApplicationInput>(blank(initialCategory ?? ''));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const info = CATEGORIES[f.category as Category];
  const isAgent = f.category === 'agent';

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
      requestAnimationFrame(() => document.querySelector('.field-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const r = await api<{ message: string }>('/api/applications', { body: f });
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
        <PageHero compact title="Check your email" />
        <p>{done}</p>
        <p className="muted">
          After you confirm, we check your license on {info?.regulator ?? 'the regulator lookup'} and confirm your identity. Then we set up your
          advertising plan. Your profile goes live when both steps are complete.
        </p>
        <a href="#/advertise">Back to advertising</a>
      </main>
    );
  }

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">For professionals</span>}
        title={<>Apply to <span className="grad">advertise</span></>}
        sub={`Choose your type of business to start. It takes about five minutes, and we verify every license before you're listed.`}
      />
      <form className="form page-form" onSubmit={submit} noValidate>
        <div className="hp" aria-hidden="true">
          <label>Company URL <input tabIndex={-1} autoComplete="off" value={f.company_url} onChange={(e) => set('company_url', e.target.value)} /></label>
        </div>

        <label className="field">
          <span>What kind of business are you?</span>
          <select value={f.category} onChange={(e) => setF({ ...blank(e.target.value), name: f.name, company: f.company, phone: f.phone, email: f.email, website: f.website })} aria-invalid={!!errors.category}>
            <option value="">Choose…</option>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </label>

        {info && (
          <>
            <div className="notice small" role="note">
              We verify your {info.licenseLabel.replace(/^(Individual|Company) /, (w) => w.toLowerCase())} on{' '}
              <a href={info.lookupUrl} target="_blank" rel="noreferrer noopener">{info.regulator} ↗</a>, and confirm your identity using contact
              details we find independently. We re-check every {REVERIFY_DAYS} days.
            </div>

            <h2>License</h2>
            <div className="form-grid">
              {text('name', isAgent || f.category === 'loan_officer' || f.category === 'insurance' ? 'Your full name (as licensed)' : 'Business name (as licensed)', { autoComplete: 'name' })}
              {text('company', isAgent ? 'Brokerage' : 'Company or employer', { autoComplete: 'organization' })}
              {text('licenseId', info.licenseLabel, { placeholder: info.licenseHint, autoCapitalize: 'characters' })}
            </div>

            <h2>What you offer</h2>
            {text('headline', 'Headline', { maxLength: 90, placeholder: info.financing ? 'e.g. Fix-and-flip loans that close in 10 days' : 'e.g. Short-sale specialist in Henderson' })}
            <CheckGroup legend={info.financing ? 'Loan types you offer' : 'Services'} options={servicesFor(f.category as Category)} value={f.services} onChange={(v) => set('services', v)} error={errors.services} />
            {info.financing && (
              <CheckGroup legend="Credit situations you work with" options={CREDIT_PROFILES} value={f.creditProfiles} onChange={(v) => set('creditProfiles', v)} error={errors.creditProfiles} />
            )}
            <CheckGroup legend="Cities and areas you serve" options={CLARK_COUNTY_CITIES} value={f.serviceCities} onChange={(v) => set('serviceCities', v)} error={errors.serviceCities} />
            {text('serviceZips', 'ZIP codes (optional)', { placeholder: '89123, 89052', inputMode: 'numeric' })}
            <CheckGroup legend="Languages" options={LANGUAGES} value={f.languages} onChange={(v) => set('languages', v)} error={errors.languages} />

            <h2>Contact details shown to buyers</h2>
            <div className="form-grid">
              {text('phone', 'Business phone', { type: 'tel', autoComplete: 'tel' })}
              {text('email', 'Business email', { type: 'email', autoComplete: 'email' }, 'Leads and your sign-in links go here.')}
              {text('website', 'Website (optional)', { type: 'url', placeholder: 'https://' })}
            </div>
            <label className="field">
              <span>About you</span>
              <textarea rows={4} maxLength={800} value={f.bio} onChange={(e) => set('bio', e.target.value)} aria-invalid={!!errors.bio} />
              <small className="muted">{f.bio.length}/800 · plain text</small>
              {errors.bio && <span className="field-error">{errors.bio}</span>}
            </label>

            <h2>Confirmations</h2>
            {(
              [
                ['attestLicensed', `I hold an active ${info.licenseLabel.replace(/ number| ID/i, '')} and I'm authorized to advertise for the company named above.`],
                ['attestAccurate', "The information above is accurate, and I'll tell you if my license, company or contact details change."],
                ['consentVerification', `I consent to verification with ${info.regulator} and to you contacting my company to confirm my identity.`],
                ['attestAdvertising', "I understand this is paid advertising with equal, rotating placement. Forced-Sale Finder isn't a party to any transaction and receives no referral fees. I'll follow all laws that apply to my services and to contacting consumers."],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="check attest">
                <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />
                <span>{label}{errors[k] && <span className="field-error"> {errors[k]}</span>}</span>
              </label>
            ))}

            {errors.form && <div className="caution" role="alert">{errors.form}</div>}
            <button className="btn big" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
          </>
        )}
      </form>
    </main>
  );
}
