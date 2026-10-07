import { useState, type FormEvent, type ReactNode } from 'react';
import { AD_LINE_RULES, CONTENT_RULES, LANGUAGES, MAX_SERVICE_CITIES, validateApplication, type ApplicationInput } from '../lib/proApplication';
import { CATEGORIES, CREDIT_PROFILES, REVERIFY_DAYS, servicesFor, type Category } from '../lib/pros';
import { getMyState } from '../lib/myState';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { regulatorFor } from '../lib/regulators';
import PageHero from './PageHero';
import PlaceCombobox from './PlaceCombobox';
import { api, ApiError } from '../lib/api';
import EmptyState from './EmptyState';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';

type Errors = Partial<Record<keyof ApplicationInput | 'form', string>>;

const blank = (category: string, state: string = getMyState() ?? ''): ApplicationInput => ({
  state,
  category,
  name: '',
  company: '',
  licenseId: '',
  serviceCounties: [],
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

function CheckGroup({ legend, options, value, onChange, error, className = '' }: { legend: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void; error?: string; className?: string }) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className={`check-grid ${className}`.trim()}>
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

/** Optional cities or towns, picked from the Census list for the state (src/data/places). */
function CityPicker({ state, counties, value, onChange, error }: { state: StateCode; counties: string[]; value: string[]; onChange: (v: string[]) => void; error?: string }) {
  return (
    <div className="field city-picker">
      {value.length > 0 && (
        <ul className="chips" aria-label="Cities you chose">
          {value.map((c) => (
            <li key={c}><button type="button" className="chip on" onClick={() => onChange(value.filter((x) => x !== c))} aria-label={`Remove ${c}`}>{c} ✕</button></li>
          ))}
        </ul>
      )}
      <PlaceCombobox
        state={state}
        label={<>Cities or towns you serve <span className="muted">(optional, up to {MAX_SERVICE_CITIES})</span></>}
        hint="Leave this empty if you serve whole counties."
        disabled={value.length >= MAX_SERVICE_CITIES}
        // Places in the counties they chose (all of the state's until they choose any), not already picked.
        keep={(p) => !value.includes(p.name) && (!counties.length || p.counties.some((c) => counties.includes(c)))}
        onPick={(p) => value.length < MAX_SERVICE_CITIES && onChange([...value, p.name])}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
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
  const st = stateByCode(f.state);
  const state = (st?.code ?? 'NV') as StateCode;
  const reg = info ? regulatorFor(f.category as Category, state) : null;
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
          <p><a href="#/advertise">What advertising includes</a> · <a href="#/pros">Your team</a></p>
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
          After you confirm, we check your license on {reg?.name ?? 'the regulator lookup'} and confirm your identity. Then we set up your
          advertising plan. Your profile goes live when both steps are complete.
        </p>
        <a href="#/advertise">Back to advertising</a>
      </main>
    );
  }

  const pick = (c: string) => setF({ ...blank(c, f.state), name: f.name, company: f.company, phone: f.phone, email: f.email, website: f.website, serviceCounties: f.serviceCounties, serviceCities: f.serviceCities });
  // A new state clears the counties and cities picked in the old one.
  const pickState = (code: string) => { if (code !== f.state) setF((x) => ({ ...x, state: code, serviceCounties: [], serviceCities: [] })); };
  const has = (k: keyof ApplicationInput) => !!errors[k];
  // Each section: whether it's filled in, and whether it has an error, for the progress menu.
  const sections: { id: string; label: string; done: boolean; bad: boolean }[] = [
    { id: 'apply-type', label: 'State & business', done: !!info && !!st, bad: has('category') || has('state') },
    { id: 'apply-license', label: 'License', done: !!(f.name && f.company && f.licenseId), bad: has('name') || has('company') || has('licenseId') },
    { id: 'apply-offer', label: 'What you offer', done: !!f.headline && f.services.length > 0 && (!info?.financing || f.creditProfiles.length > 0), bad: has('headline') || has('services') || has('creditProfiles') },
    { id: 'apply-areas', label: 'Areas & languages', done: f.serviceCounties.length > 0 && f.languages.length > 0, bad: has('serviceCounties') || has('serviceCities') || has('serviceZips') || has('languages') },
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
                <button type="button" className={`${x.done ? 'done' : ''}${x.bad ? ' bad' : ''}`} onClick={() => go(x.id)} disabled={i > 0 && !(info && st)}>
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

          <Card n={1} id="apply-type" title="Where you work and what you do" sub="Pick your state, then your kind of business. The rest of the form adjusts.">
            <fieldset className="field area-states" aria-invalid={has('state')}>
              <legend>State you’re licensed in and advertise to</legend>
              {STATES.map((s) => (
                <button key={s.code} type="button" aria-pressed={f.state === s.code} className={f.state === s.code ? 'on' : ''} onClick={() => pickState(s.code)}>
                  {s.name}
                </button>
              ))}
            </fieldset>
            {errors.state && <span className="field-error">{errors.state}</span>}
            <div className="type-grid" role="radiogroup" aria-label="Type of business" aria-invalid={has('category')}>
              {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                <label key={c} className={`type-option${f.category === c ? ' on' : ''}`}>
                  <input type="radio" name="category" value={c} checked={f.category === c} onChange={() => pick(c)} />
                  <strong>{CATEGORIES[c].label}</strong>
                  {st && <span>{regulatorFor(c, state).url ? 'Verified on' : 'Verified with'} {regulatorFor(c, state).name}</span>}
                </label>
              ))}
            </div>
            {errors.category && <span className="field-error">{errors.category}</span>}
            {info && reg && st && (
              <div className="notice" role="note">
                {reg.url ? <>We check your license or registration on <a href={reg.url} target="_blank" rel="noreferrer noopener">{reg.name} ↗</a></> : <>We check {reg.name}</>}, and confirm your identity using
                contact details we find independently. We re-check every {REVERIFY_DAYS} days.
              </div>
            )}
            {state === 'NV' && info?.advertisingNote && (
              <div className="caution" role="note"><strong>Advertising rule:</strong> {info.advertisingNote}</div>
            )}
          </Card>

          {info && st && (
            <>
              <Card n={2} id="apply-license" title="License" sub="Exactly as it appears on your license.">
                <div className="form-grid">
                  {text('name', isAgent || f.category === 'loan_officer' || f.category === 'insurance' || info.individual ? 'Your full name (as licensed)' : 'Business name (as licensed)', { autoComplete: 'name' })}
                  {text('company', isAgent ? 'Brokerage' : 'Company or employer', { autoComplete: 'organization' })}
                  {text('licenseId', 'License, registration or ID number', { placeholder: state === 'NV' ? info.licenseHint : 'As the regulator shows it', autoCapitalize: 'characters', maxLength: 30 })}
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
                <CheckGroup legend={`Counties you serve in ${st.name}`} options={st.counties.map(countyName)} value={f.serviceCounties.map(countyName)}
                  onChange={(v) => set('serviceCounties', st.counties.filter((c) => v.includes(countyName(c))))} error={errors.serviceCounties} className="county-grid" />
                <CityPicker state={state} counties={f.serviceCounties} value={f.serviceCities} onChange={(v) => set('serviceCities', v)} error={errors.serviceCities} />
                {text('serviceZips', 'ZIP codes (optional)', { placeholder: 'e.g. 85004, 85251', inputMode: 'numeric' })}
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
                    ['attestLicensed', `I hold an active license or registration for this work in ${st.name}, and I'm authorized to advertise for the company named above.`],
                    ['attestAccurate', "The information above is accurate, and I'll tell you if my license, company or contact details change."],
                    ['consentVerification', `I consent to verification with ${reg?.name ?? 'the regulator'} and to you contacting my company to confirm my identity.`],
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
