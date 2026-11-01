import FeatureStatus from './FeatureStatus';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { replaceAddress } from '../lib/nav';
import { api, ApiError } from '../lib/api';
import { CATEGORIES } from '../lib/pros';
import { AD_LINE_RULES, validateAdLine, type ProProfile, type Billing } from '../lib/proApplication';
import { TIER_INFO, topicsFor, type AdTier } from '../lib/adPlans';
import { PlanCards, useAdPlans } from './PlanCards';
import { fmtDate, fmtDateTime } from '../lib/status';
import PageHero from './PageHero';
import DailyColumns from './DailyColumns';
import OwlNote from './OwlNote';
import EmptyState from './EmptyState';
import { useSiteFeatures } from '../lib/siteFeatures';
import { adAreaLabel, MAX_AD_AREAS, validateAdAreas, type AdArea } from '../lib/adAreas';
import { countyName, stateByCode } from '../lib/regions';
import PlaceCombobox from './PlaceCombobox';

const LOGIN_KEY = 'fsf.pro-login';

interface Payments {
  available: boolean;
  amountLabel: string | null;
  tier: AdTier;
  topic: string | null;
  founding: boolean;
  adsHidden: boolean;
  status: string | null;
  active: boolean;
  cancelAtPeriodEnd: boolean;
  hasCard: boolean;
  paidAreaCount: number;
  full: Record<AdTier, boolean>;
  topicsFull: string[];
  foundingDiscount: Record<AdTier, boolean>;
}

interface Me {
  id: string;
  status: string;
  profile: ProProfile;
  billing: Billing | null;
  verifiedAt: string | null;
  reverifyDueInDays: number | null;
  listed: boolean;
  payments: Payments;
  photo: { live: string | null; pendingAt: string | null };
}

// Only ever send the browser to Stripe's own pages.
const STRIPE_PAGES = ['https://checkout.stripe.com/', 'https://billing.stripe.com/'];
// Stripe couldn't collect the latest payment (or a free period from a discount code ended with no card on file).
const NEEDS_CARD = new Set(['past_due', 'unpaid', 'incomplete']);

/** Premium Plus: which Learn or Practice topic the ad appears beside. Full topics can't be picked. */
function TopicPicker({ me, value, onChange }: { me: Me; value: string; onChange: (v: string) => void }) {
  const topics = topicsFor(me.profile.category);
  return (
    <label className="field">
      <span>Topic for your Mentor Connect ad (optional)</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">No topic ad</option>
        {topics.map((t) => {
          const taken = me.payments.topicsFull.includes(t.key) && me.payments.topic !== t.key;
          return <option key={t.key} value={t.key} disabled={taken}>{t.label}{taken ? ' (taken right now)' : ''}</option>;
        })}
      </select>
      <small className="muted">Your ad appears, labeled as an ad, after the explanation on these lessons and practice pages, never inside a question.</small>
    </label>
  );
}

function PlanCard({ me, onChange }: { me: Me; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice] = useState(() => {
    const m = `${window.location.search}${window.location.hash}`.match(/[?&]payment=(done|cancelled)/);
    if (m) replaceAddress('/advertiser');
    return m?.[1] ?? null;
  });
  const p = me.payments;
  const plans = useAdPlans();
  const labels = plans && plans !== 'loading' ? plans.categories[me.profile.category] : null;
  const [tier, setTier] = useState<AdTier>(p.full[p.tier] ? 'standard' : p.tier);
  const [topic, setTopic] = useState(p.topic ?? '');
  const [topicMsg, setTopicMsg] = useState<string | null>(null);
  async function open(path: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ url: string }>(path, { body, auth: true });
      if (!STRIPE_PAGES.some((pre) => r.url.startsWith(pre))) throw new Error('Unexpected payment page address.');
      window.location.assign(r.url);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }
  async function saveTopic() {
    setTopicMsg(null);
    try {
      await api('/api/pro/ad-topic', { body: { topic }, auth: true });
      setTopicMsg('Saved. Your ad appears beside this topic within a few minutes.');
      onChange();
    } catch (e) {
      setTopicMsg((e as Error).message);
    }
  }
  const price = (t: AdTier) => {
    const l = labels?.[t];
    if (!l?.available) return 'Not available for your category yet';
    return p.founding && l.foundingLabel ? <>{l.foundingLabel} <span className="small muted">founding price, then {l.amountLabel}</span></> : l.amountLabel;
  };
  const canBuy = (t: AdTier) => !!labels?.[t]?.available && !p.full[t];
  const areaCount = me.profile.adAreas.length;
  const ready = areaCount > 0 && canBuy(tier) && (tier !== 'premium_plus' || !topic || !p.topicsFull.includes(topic));
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
            <strong>{TIER_INFO[p.tier].label}</strong>{p.amountLabel && <> · {p.amountLabel} per area</>} · {p.paidAreaCount} {p.paidAreaCount === 1 ? 'area' : 'areas'}
            {me.billing && <> · paid through <strong>{fmtDate(me.billing.paidThrough)}</strong></>}
          </p>
          {p.adsHidden && (
            <div className="caution">
              <strong>Your ads are paused by DeedOwl.</strong> Your profile page and directory listing are still live, but your ad boxes aren’t showing.
            </div>
          )}
          {NEEDS_CARD.has(p.status ?? '') && (
            <div className="caution">
              <strong>Add a card to keep advertising.</strong> Stripe couldn’t collect your latest payment, or a discount’s free period has ended.
              Add or update your card on the billing page; your profile stays up only through the period already paid.
            </div>
          )}
          {p.cancelAtPeriodEnd && <p className="muted">Your plan is set to end after the current paid period.</p>}
          {p.tier === 'premium_plus' && (
            <div className="form">
              {!p.topic && <div className="notice">Choose the topic for your Mentor Connect ad. It appears once you save a topic.</div>}
              <TopicPicker me={me} value={topic} onChange={setTopic} />
              <button className="btn btn-secondary" disabled={topic === (p.topic ?? '')} onClick={saveTopic}>Save topic</button>
              {topicMsg && <p className="small" role="status">{topicMsg}</p>}
            </div>
          )}
          <button className="btn" disabled={busy} onClick={() => open('/api/pro/billing-portal')}>{busy ? 'Opening…' : NEEDS_CARD.has(p.status ?? '') ? 'Add a card' : 'Manage billing'}</button>
          <p className="muted">Change your card or plan, download receipts or cancel on Stripe's secure page.</p>
        </>
      ) : p.available ? (
        <>
          <p className="plan-line">Choose a plan. Monthly, cancel any time. Every plan keeps the same fair rotating place in the directory list. Prices are per ad area each month.</p>
          {areaCount === 0 && <div className="notice">Choose where your ads show (above) first.</div>}
          {me.billing && <p className="muted">Currently paid through {fmtDate(me.billing.paidThrough)}.</p>}
          <PlanCards
            selected={tier}
            price={price}
            extra={(t) => (
              <>
                <label><input type="radio" name="plan" checked={tier === t} disabled={!canBuy(t)} onChange={() => setTier(t)} /> Choose {TIER_INFO[t].label}</label>
                {p.full[t] && <span className="small warn">Full right now in one of your areas. Try other areas, or try again later.</span>}
              </>
            )}
          />
          {tier === 'premium_plus' && <TopicPicker me={me} value={topic} onChange={setTopic} />}
          <button className="btn big plan-cta" disabled={busy || !ready} onClick={() => open('/api/pro/checkout', { tier, ...(tier === 'premium_plus' ? { topic } : {}) })}>{busy ? 'Opening secure payment…' : areaCount > 1 ? `Start advertising in ${areaCount} areas` : 'Start advertising'}</button>
          {!p.foundingDiscount[tier] && <p className="small">Have a discount code? Enter it on the payment page.</p>}
          {p.foundingDiscount[tier] && <p className="small">Your founding-advertiser discount is applied on the payment page.</p>}
          <p className="muted">You'll pay on Stripe's secure page. We never see or store your card details. After payment is confirmed, your profile can appear once approval, current license verification and placement requirements are met.</p>
          {p.hasCard && <button className="linkish" disabled={busy} onClick={() => open('/api/pro/billing-portal')}>Manage billing</button>}
        </>
      ) : (
        <p>{me.billing ? <>{TIER_INFO[p.tier].label} plan, paid through <strong>{fmtDate(me.billing.paidThrough)}</strong>. </> : null}We'll contact you to set up or renew your advertising plan.</p>
      )}
      {err && <div className="caution" role="alert">{err}</div>}
    </section>
  );
}

/**
 * Where their ads show: cities or towns, or whole counties, in their state. Each area is one unit of the plan's monthly
 * price; with a card plan, saving a different number of areas changes the charge (Stripe prorates it).
 */
function AreasCard({ me, onChange }: { me: Me; onChange: () => void }) {
  const p = me.payments;
  const st = stateByCode(me.profile.state);
  const [areas, setAreas] = useState<AdArea[]>(me.profile.adAreas);
  const [county, setCounty] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const saved = me.profile.adAreas;
  const changed = JSON.stringify(areas) !== JSON.stringify(saved);
  const check = validateAdAreas(areas, me.profile.state);
  const has = (a: AdArea) => areas.some((x) => x.county === a.county && x.city === a.city);
  const wholeCounty = (c: string) => areas.some((x) => x.county === c && x.city === null);
  const add = (a: AdArea) => {
    setMsg(null);
    if (has(a) || areas.length >= MAX_AD_AREAS) return;
    // A whole county replaces the single cities already chosen in it.
    setAreas(a.city === null ? [...areas.filter((x) => x.county !== a.county), a] : [...areas, a]);
  };
  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ message: string }>('/api/pro/areas', { body: { areas }, auth: true });
      setMsg({ ok: true, text: r.message });
      onChange();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  if (!st) return null;
  const billed = !!me.billing;
  return (
    <section className="plan-card areas-card" aria-labelledby="areas-h">
      <h2 id="areas-h">Where your ads show</h2>
      <p>
        Choose the cities and towns, or whole counties, in {st.name} where buyers see your listing and ads. Each area is billed at your
        plan’s monthly price{p.amountLabel ? ` (${p.amountLabel} each)` : ''}. A whole county covers every city and community in it.
      </p>
      {areas.length === 0 ? (
        <OwlNote><strong>No ad areas yet.</strong> Add at least one city or county to start advertising.</OwlNote>
      ) : (
        <ul className="chips area-chips" aria-label="Your ad areas">
          {areas.map((a, i) => {
            const waiting = billed && !changed && i >= p.paidAreaCount;
            return (
              <li key={`${a.county}|${a.city ?? '*'}`}>
                <button type="button" className="chip on" onClick={() => { setMsg(null); setAreas(areas.filter((x) => x !== a)); }} aria-label={`Remove ${adAreaLabel(a)}`}>
                  {adAreaLabel(a)}{waiting ? ' · not paid yet' : ''} ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="areas-add">
        <PlaceCombobox
          state={me.profile.state}
          label="Add a city or town"
          disabled={areas.length >= MAX_AD_AREAS}
          keep={(pl) => !areas.some((x) => x.city === pl.name) && !pl.counties.every(wholeCounty)}
          onPick={(pl) => add({ county: pl.counties.find((c) => !wholeCounty(c)) ?? pl.counties[0], city: pl.name })}
        />
        <div className="field">
          <label htmlFor="area-county">Or a whole county</label>
          <div className="row">
            <select id="area-county" value={county} onChange={(e) => setCounty(e.target.value)}>
              <option value="">Choose a county…</option>
              {st.counties.filter((c) => !wholeCounty(c)).map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
            </select>
            <button type="button" className="btn btn-secondary" disabled={!county || areas.length >= MAX_AD_AREAS} onClick={() => { add({ county, city: null }); setCounty(''); }}>Add county</button>
          </div>
        </div>
      </div>
      <p className="small muted">
        {areas.length} of up to {MAX_AD_AREAS} areas.
        {p.active && changed && areas.length !== saved.length && ' Saving changes your monthly charge: Stripe charges or credits the difference for the rest of this billing period right away.'}
      </p>
      {!check.ok && areas.length > 0 && <p className="field-error">{check.error}</p>}
      <button className="btn" disabled={busy || !changed || !check.ok} onClick={save}>{busy ? 'Saving…' : 'Save ad areas'}</button>
      {msg && <div className={msg.ok ? 'notice' : 'caution'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
    </section>
  );
}

/** The optional one-line ad shown in Featured and topic ad boxes. Changes are reviewed before they appear. */
function AdLineCard({ me, onChange }: { me: Me; onChange: () => void }) {
  const [line, setLine] = useState(me.profile.adLinePending || me.profile.adLine);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const local = validateAdLine(line, me.profile.category);
  async function save(value: string) {
    setMsg(null);
    try {
      const r = await api<{ message: string }>('/api/pro/ad-line', { body: { adLine: value }, auth: true });
      setMsg({ ok: true, text: r.message });
      onChange();
    } catch (e) {
      const body = e instanceof ApiError ? (e.body.errors as { adLine?: string } | undefined) : undefined;
      setMsg({ ok: false, text: body?.adLine ?? (e as Error).message });
    }
  }
  return (
    <section className="plan-card" aria-labelledby="adline-h">
      <h2 id="adline-h">Your ad line</h2>
      <p className="small">
        {me.profile.adLine ? <>Live: “{me.profile.adLine}”</> : 'No ad line yet: your ad boxes show your headline.'}
        {me.profile.adLinePending && <> · Waiting for review: “{me.profile.adLinePending}”</>}
      </p>
      <label className="field wide">
        <span>Ad line (optional)</span>
        <textarea rows={2} maxLength={180} value={line} onChange={(e) => setLine(e.target.value)} aria-invalid={!!local} />
        <small className="muted">{line.trim().length}/180 · plain text</small>
        {local && <span className="field-error">{local}</span>}
      </label>
      <ul className="small">{AD_LINE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      <div className="row">
        <button className="btn btn-secondary" disabled={!!local || !line.trim() || line.trim() === me.profile.adLine} onClick={() => save(line)}>Send for review</button>
        {(me.profile.adLine || me.profile.adLinePending) && <button className="linkish" onClick={() => { setLine(''); void save(''); }}>Remove my ad line</button>}
      </div>
      {msg && <p className={msg.ok ? 'notice' : 'caution'} role="status">{msg.text}</p>}
    </section>
  );
}

interface Summary {
  from: string;
  to: string;
  totals: Record<'impression' | 'profile_view' | 'phone_click' | 'email_click' | 'website_click' | 'lead' | 'ad_impression' | 'ad_click', { total: number; uniques: number }>;
  contactRate: number | null;
  daily: { day: string; views: number; contacts: number; leads: number }[];
  /** Ad views and clicks by placement; absent from older servers. */
  bySpot?: { spot: string; label: string; shown: number; clicks: number }[];
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
  const features = useSiteFeatures();
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
  // Sign-in links go by email: until email is set up, the form can't work.
  if (!features || features.unavailable) return <main className="page"><PageHero title="Advertiser sign-in" /><FeatureStatus features={features} what="Advertiser sign-in isn’t" /></main>;
  if (!features.email)
    return (
      <main className="page">
        <PageHero compact title="Advertiser sign-in" />
        <EmptyState soon title="Advertiser sign-in is coming soon">
          <p>Advertisers will sign in here with a one-time link sent by email, to see their numbers and leads.</p>
          <p>Until then, see <a href="#/advertise">how advertising will work</a>.</p>
        </EmptyState>
      </main>
    );
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
          <p className="small muted">Not listed yet? <a href="#/advertise">Advertise with us&nbsp;→</a></p>
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
      replaceAddress('/advertiser'); // drop the token from the address bar and history
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

      <AreasCard key={JSON.stringify(me.profile.adAreas)} me={me} onChange={loadMe} />
      <PlanCard me={me} onChange={loadMe} />
      <AdLineCard me={me} onChange={loadMe} />
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
            <div className="kpi"><span className="kpi-label">Contact clicks</span><strong>{contacts.toLocaleString()}</strong><span className="kpi-sub">{t.phone_click.uniques} phone {t.phone_click.uniques === 1 ? 'tap' : 'taps'} · {t.email_click.uniques} email · {t.website_click.uniques} website</span></div>
            {(me.payments.tier !== 'standard' || t.ad_impression.total > 0) && (
              <div className="kpi"><span className="kpi-label">Shown in ad boxes</span><strong>{t.ad_impression.total.toLocaleString()}</strong><span className="kpi-sub">{t.ad_click.uniques} clicked your ad’s button</span></div>
            )}
            <div className="kpi"><span className="kpi-label">Visitors who reached out</span><strong>{summary.contactRate === null ? '—' : `${Math.round(summary.contactRate * 100)}%`}</strong><span className="kpi-sub">contact clicks ÷ profile views</span></div>
          </section>

          {!!summary.bySpot?.length && (
            <section aria-labelledby="by-spot-head">
              <h2 id="by-spot-head">Where your ad was seen</h2>
              <p className="small muted">“Shown” counts each time your ad card was at least half on a visitor’s screen, once per visit to that page.</p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th scope="col">Placement</th><th scope="col" className="num">Shown</th><th scope="col" className="num">Clicked</th></tr></thead>
                  <tbody>{summary.bySpot.map((x) => <tr key={x.spot}><td>{x.label}</td><td className="num">{x.shown.toLocaleString()}</td><td className="num">{x.clicks.toLocaleString()}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="small muted">Counts only: we record the placement’s name, never the page address or who saw it. “Clicked” counts each visitor once a day in each place, so a visitor who clicks in two places counts in both rows. Views from before October 31, 2026 aren’t broken down by placement.</p>
            </section>
          )}
          <div className="viz-root">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="page-section-title">Daily activity</h2>
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
          <h2 className="page-section-title">Leads ({leads.length})</h2>
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
      <p className="small muted">Days run midnight to midnight Pacific time (Las Vegas), for every advertiser. Counts exclude known bots and repeat clicks by the same visitor on the same day. We don't track visitors across days or collect anything that identifies them.</p>
    </main>
  );
}
