import { useState, type FormEvent, type ReactNode } from 'react';
import { AD_LINE_RULES, CLARK_COUNTY_CITIES, CONTENT_RULES, LANGUAGES, validateApplication, type ApplicationInput } from '../lib/proApplication';
import { CATEGORIES, CREDIT_PROFILES, REVERIFY_DAYS, servicesFor, type Category } from '../lib/pros';
import PageHero from './PageHero';
import { api, ApiError } from '../lib/api';
import EmptyState from './EmptyState';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';

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
  adLine: '',
  attestLicensed: false,
  attestAccurate: false,
  consentVerification: false,
  attestAdvertising: false,
  attestOriginal: false,
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

/** One numbered section of the application. Defined at module level so inputs keep focus while typing. */
const Card = ({ n, id, title, sub, children }: { n: number; id: string; title: string; sub?: string; children: ReactNode }) => (
  <section className="apply-card" id={id} aria-labelledby={`${id}-h`}>
    <header className="apply-card-head">
      <span className="apply-num" aria-hidden>{n}</span>
      <div>
        <h2 id={`${id}-h`}>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
    </header>
    {children}
  </section>
);

export default function AdvertiseApplyPage({ initialCategory }: { initialCategory: Category | null }) {
  const [f, setF] = useState<ApplicationInput>(blank(initialCategory ?? ''));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const info = CATEGORIES[f.category as Category];
  const isAgent = f.category === 'agent';
  const features = useSiteFeatures();

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

  if (!features) return <main className="page" />;
  if (!advertisingOpen(features)) {
    return (
      <main className="page">
        <PageHero compact title={<>Advertise on <span className="grad">DeedOwl</span></>} />
        <EmptyState soon title="Advertising is coming soon">
          <p>Applications for licensed professionals open soon. Every advertiser’s license is checked on the official regulator lookup before they’re listed.</p>
          <p><a href="#/advertise">What advertising includes</a> · <a href="#/pros">Find a pro</a></p>
        </EmptyState>
      </main>
    );
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

  const pick = (c: string) => setF({ ...blank(c), name: f.name, company: f.company, phone: f.phone, email: f.email, website: f.website });
  const has = (k: keyof ApplicationInput) => !!errors[k];
  // Each section: whether it's filled in, and whether it has an error, for the progress menu.
  const sections: { id: string; label: string; done: boolean; bad: boolean }[] = [
    { id: 'apply-type', label: 'Type of business', done: !!info, bad: has('category') },
    { id: 'apply-license', label: 'License', done: !!(f.name && f.company && f.licenseId), bad: has('name') || has('company') || has('licenseId') },
    { id: 'apply-offer', label: 'What you offer', done: !!f.headline && f.services.length > 0 && (!info?.financing || f.creditProfiles.length > 0), bad: has('headline') || has('services') || has('creditProfiles') },
    { id: 'apply-areas', label: 'Areas & languages', done: f.serviceCities.length > 0 && f.languages.length > 0, bad: has('serviceCities') || has('serviceZips') || has('languages') },
    { id: 'apply-contact', label: 'Contact details', done: !!(f.phone && f.email) && f.bio.length >= 30, bad: has('phone') || has('email') || has('website') || has('bio') || has('adLine') },
    { id: 'apply-confirm', label: 'Confirm & submit', done: f.attestLicensed && f.attestAccurate && f.consentVerification && f.attestOriginal && f.attestAdvertising, bad: has('attestLicensed') || has('attestAccurate') || has('consentVerification') || has('attestOriginal') || has('attestAdvertising') },
  ];
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">For professionals</span>}
        title={<>Apply to <span className="grad">advertise</span></>}
        sub="Six short sections, about five minutes. We verify every license before you're listed."
      />
      <div className="apply-layout">
        <aside className="apply-nav" aria-label="Application sections">
          <ol>
            {sections.map((x, i) => (
              <li key={x.id}>
                <button type="button" className={`${x.done ? 'done' : ''}${x.bad ? ' bad' : ''}`} onClick={() => go(x.id)} disabled={i > 0 && !info}>
                  <span className="apply-nav-num" aria-hidden>{x.bad ? '!' : x.done ? '✓' : i + 1}</span>
                  {x.label}
                </button>
              </li>
            ))}
          </ol>
          <div className="apply-next">
            <h3>After you apply</h3>
            <p>We confirm your email, verify your license and identity, then you choose a plan and go live. Your profile is always labeled as an advertisement.</p>
          </div>
        </aside>

        <form className="form apply-form" onSubmit={submit} noValidate>
          <div className="hp" aria-hidden="true">
            <label>Company URL <input tabIndex={-1} autoComplete="off" value={f.company_url} onChange={(e) => set('company_url', e.target.value)} /></label>
          </div>

          <Card n={1} id="apply-type" title="What kind of business are you?" sub="Pick one. The rest of the form adjusts to your license type.">
            <div className="type-grid" role="radiogroup" aria-label="Type of business" aria-invalid={has('category')}>
              {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                <label key={c} className={`type-option${f.category === c ? ' on' : ''}`}>
                  <input type="radio" name="category" value={c} checked={f.category === c} onChange={() => pick(c)} />
                  <strong>{CATEGORIES[c].label}</strong>
                  <span>Verified on {CATEGORIES[c].regulator}</span>
                </label>
              ))}
            </div>
            {errors.category && <span className="field-error">{errors.category}</span>}
            {info && (
              <div className="notice" role="note">
                We verify your {info.licenseLabel.replace(/^(Individual|Company) /, (w) => w.toLowerCase())} on{' '}
                <a href={info.lookupUrl} target="_blank" rel="noreferrer noopener">{info.regulator} ↗</a>, and confirm your identity using contact
                details we find independently. We re-check every {REVERIFY_DAYS} days.
              </div>
            )}
            {info?.advertisingNote && (
              <div className="caution" role="note"><strong>Advertising rule:</strong> {info.advertisingNote}</div>
            )}
          </Card>

          {info && (
            <>
              <Card n={2} id="apply-license" title="License" sub="Exactly as it appears on your license.">
                <div className="form-grid">
                  {text('name', isAgent || f.category === 'loan_officer' || f.category === 'insurance' || info.individual ? 'Your full name (as licensed)' : 'Business name (as licensed)', { autoComplete: 'name' })}
                  {text('company', isAgent ? 'Brokerage' : 'Company or employer', { autoComplete: 'organization' })}
                  {text('licenseId', info.licenseLabel, { placeholder: info.licenseHint, autoCapitalize: 'characters' })}
                </div>
              </Card>

              <Card n={3} id="apply-offer" title="What you offer" sub="Buyers filter by these, so pick what you actually do.">
                {text('headline', 'Headline', { maxLength: 90, placeholder: info.financing ? 'e.g. Fix-and-flip loans that close in 10 days' : 'e.g. Short-sale specialist in Henderson' })}
                <CheckGroup legend={info.financing ? 'Loan types you offer' : 'Services'} options={servicesFor(f.category as Category)} value={f.services} onChange={(v) => set('services', v)} error={errors.services} />
                {info.financing && (
                  <CheckGroup legend="Credit situations you work with" options={CREDIT_PROFILES} value={f.creditProfiles} onChange={(v) => set('creditProfiles', v)} error={errors.creditProfiles} />
                )}
              </Card>

              <Card n={4} id="apply-areas" title="Areas & languages" sub="Where you work, and the languages you can help buyers in.">
                <CheckGroup legend="Cities and areas you serve" options={CLARK_COUNTY_CITIES} value={f.serviceCities} onChange={(v) => set('serviceCities', v)} error={errors.serviceCities} />
                {text('serviceZips', 'ZIP codes (optional)', { placeholder: '89123, 89052', inputMode: 'numeric' })}
                <CheckGroup legend="Languages" options={LANGUAGES} value={f.languages} onChange={(v) => set('languages', v)} error={errors.languages} />
              </Card>

              <Card n={5} id="apply-contact" title="Contact details shown to buyers" sub="Buyers see these on your profile. Leads and sign-in links go to your email.">
                <div className="form-grid">
                  {text('phone', 'Business phone', { type: 'tel', autoComplete: 'tel' })}
                  {text('email', 'Business email', { type: 'email', autoComplete: 'email' })}
                  {text('website', 'Website (optional)', { type: 'url', placeholder: 'https://' })}
                </div>
                <label className="field">
                  <span>About you</span>
                  <textarea rows={5} maxLength={800} value={f.bio} onChange={(e) => set('bio', e.target.value)} aria-invalid={!!errors.bio} placeholder="How you help buyers and investors (at least 30 characters)" />
                  <small className="muted">{f.bio.length}/800 · plain text</small>
                  {errors.bio && <span className="field-error">{errors.bio}</span>}
                </label>
                <label className="field">
                  <span>Ad line (optional)</span>
                  <textarea rows={2} maxLength={180} value={f.adLine ?? ''} onChange={(e) => set('adLine', e.target.value)} aria-invalid={!!errors.adLine} placeholder="e.g. Ask us how we help first-time buyers compare bank-owned homes." />
                  <small className="muted">{(f.adLine ?? '').trim().length}/180 · plain text</small>
                  {errors.adLine && <span className="field-error">{errors.adLine}</span>}
                </label>
                <div className="content-rules" role="note">
                  <h3>Ad line rules</h3>
                  <ul>{AD_LINE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
                <div className="content-rules" role="note">
                  <h3>Write it yourself. Your profile must not include:</h3>
                  <ul>{CONTENT_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              </Card>

              <Card n={6} id="apply-confirm" title="Confirm & submit" sub="Tick each box to confirm.">
                {(
                  [
                    ['attestLicensed', `I hold an active ${info.licenseLabel.replace(/ number| ID/i, '')} and I'm authorized to advertise for the company named above.`],
                    ['attestAccurate', "The information above is accurate, and I'll tell you if my license, company or contact details change."],
                    ['consentVerification', `I consent to verification with ${info.regulator} and to you contacting my company to confirm my identity.`],
                    ['attestOriginal', "Everything I submit, now or later, is my own original work or material I have written permission to use. I haven't copied text, images or logos from anyone else without permission, and my profile follows the content rules above. I'm responsible for my content and will cover DeedOwl's costs if someone makes a claim because of it. DeedOwl may edit or remove any content."],
                    ['attestAdvertising', "I understand this is paid advertising. Every listed professional appears in the directory list in the same fair rotating order, whatever plan they choose; paid plans add separate boxes labeled as ads. DeedOwl isn't a party to any transaction and receives no referral fees. I'll follow all laws that apply to my services and to contacting consumers. I agree to the Terms of Use, including the Advertiser terms, and the Privacy Policy."],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="check attest">
                    <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />
                    <span>{label}{errors[k] && <span className="field-error"> {errors[k]}</span>}</span>
                  </label>
                ))}
                <p className="muted">
                  Read the <a href="#/terms/advertisers" target="_blank" rel="noreferrer">Terms of Use (Advertiser terms)</a> and the{' '}
                  <a href="#/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </p>
                {errors.form && <div className="caution" role="alert">{errors.form}</div>}
                <button className="btn big apply-submit" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
              </Card>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
