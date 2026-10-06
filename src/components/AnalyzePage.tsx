import { useEffect, useRef, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import { replaceAddress } from '../lib/nav';
import PageHero from './PageHero';
import { Calculators } from './CalculatorPage';
import { CalcRegion } from './calcRegion';
import { useMarkStep } from '../lib/path';
import { useMyState, setMyState } from '../lib/myState';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { CURRENT_KEY, PLANS, calcTabFor, checklistFor, carryDraftNumbers, clearDraftNumbers, cleanDeal, forgetDeal, kindLabel, kindsFor, loadDeals, plansFor, saveDeals, withPlan, type Deal, type Plan, type Prefill, type SaleKind } from '../lib/analyze';
import CheckFold from './CheckFold';
import { linkLabel } from '../lib/linkLabel';
import { investorProfile } from '../lib/myPlan';
import { fmtMoney } from '../lib/status';
import { getMyArea } from '../lib/myArea';
import { analyzeAdCategories } from '../lib/contextAds';
import { RotatingAd } from './AdBoxes';
import { useDirectory } from './ProDirectory';

const DEFAULT_COUNTY: Record<StateCode, string> = { NV: 'Clark', CA: 'Los Angeles', AZ: 'Maricopa', UT: 'Salt Lake', TX: 'Harris' };
/** A new deal's county: the visitor's chosen county in that state (myArea.ts), else the state's largest. */
const startCounty = (st: StateCode) => { const a = getMyArea(); return a?.state === st && a.county ? a.county : DEFAULT_COUNTY[st]; };
const CURRENT = CURRENT_KEY;

/** The plan a new deal starts on: from the strategy in your buy box (rentals open Keep and rent). */
function planFromBuyBox(): Plan {
  try {
    const s = (JSON.parse(localStorage.getItem('deedowl.buybox.v1') ?? 'null') as { strategy?: unknown } | null)?.strategy;
    if (typeof s === 'string' && /rental|rent the others|BRRRR/.test(s)) return 'rent';
  } catch {
    /* storage unavailable */
  }
  return 'flip';
}

function blank(st: StateCode): Deal {
  return { id: '', name: '', state: st, county: startCounty(st), kind: 'listing', plan: planFromBuyBox(), notes: '', done: [], updatedAt: new Date().toISOString() };
}

function loadCurrent(st: StateCode): Deal {
  try {
    const v = cleanDeal(JSON.parse(localStorage.getItem(CURRENT) ?? 'null'));
    if (v && (!st || v.state === st)) return v;
  } catch {
    /* start fresh */
  }
  return blank(st);
}

/** A property sent from a listing page: a new, unsaved deal with its address, state, county and kind of sale. */
function fromListing(f: Prefill): Deal {
  // A kind of sale this state doesn't have falls back to an auction (court sale), never to a regular listing.
  const kinds = kindsFor(f.state);
  const kind = kinds.some((k) => k.key === f.kind) ? f.kind : (kinds.find((k) => k.key === 'court') ?? kinds[0]).key;
  return { ...blank(f.state), name: f.name, county: f.county, kind, plan: plansFor(kind)[0] };
}

/** A link that names a calculator ("#/analyze?plan=commercial") opens that one. A saved deal is left as it was. */
function forLink(d: Deal, plan?: Plan): Deal {
  if (!plan) return d;
  return withPlan(d.id ? blank(d.state) : d, plan);
}

/**
 * Step 6 of the path: describe a real deal, get the checklist for that sale in that state, and run the numbers.
 * `plan` comes from a link that promises a particular calculator.
 */
export default function AnalyzePage({ plan, prefill }: { plan?: Plan; prefill?: Prefill } = {}) {
  useMarkStep('analyze');
  useLastActivity('#/analyze', 'Analyze a deal');
  const [mine] = useMyState();
  // A property opened from a listing never wipes unsaved work: a started, unsaved deal is saved to My deals first.
  const keepUnsaved = () => {
    const cur = loadCurrent(mine ?? 'NV');
    if (cur.id || (!cur.name.trim() && !cur.notes.trim() && cur.done.length === 0)) return;
    const all = loadDeals();
    if (all.some((x) => x.updatedAt === cur.updatedAt && x.name.trim() === (cur.name.trim() || `${countyName(cur.county)} deal`))) return;
    const d = { ...cur, id: `d${Date.now().toString(36)}`, name: cur.name.trim() || `${countyName(cur.county)} deal` };
    saveDeals([d, ...all]);
  };
  const [deal, setDeal] = useState<Deal>(() => {
    if (!prefill) return forLink(loadCurrent(mine ?? 'NV'), plan);
    keepUnsaved();
    return fromListing(prefill);
  });
  // A property opened from a DeedOwl listing arrives filled in; the address then goes back to plain /analyze.
  useEffect(() => {
    if (!prefill) return;
    setSaved(loadDeals());
    setDeal(fromListing(prefill));
    setMyState(prefill.state);
    replaceAddress('/analyze');
  }, [prefill]);
  const numbersRef = useRef<HTMLHeadingElement>(null);
  // A link to a named calculator goes straight to it, set up for that plan.
  useEffect(() => {
    if (!plan) return;
    setDeal((d) => (d.plan === plan && (plan !== 'lien' || d.kind === 'lien') ? d : forLink(d, plan)));
    numbersRef.current?.scrollIntoView({ block: 'start' });
    // Done with the link's request: a reload then reopens the deal as it is now, not a fresh one.
    replaceAddress('/analyze');
  }, [plan]);
  const [saved, setSaved] = useState<Deal[]>(loadDeals);

  // Keep the working deal between visits, and in the saved list once it has been saved.
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT, JSON.stringify(deal));
    } catch {
      /* private mode */
    }
    if (deal.id) {
      setSaved((list) => {
        const next = list.map((d) => (d.id === deal.id ? deal : d));
        saveDeals(next);
        return next;
      });
    }
  }, [deal]);
  // Choosing a state elsewhere on the site moves a new, unsaved deal to it.
  useEffect(() => {
    if (mine && !deal.id && mine !== deal.state) setDeal(blank(mine));
  }, [mine]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Deal>) => setDeal((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
  const st = stateByCode(deal.state)!;
  const kinds = kindsFor(deal.state);
  const plans = PLANS.filter((p) => plansFor(deal.kind).includes(p.key));
  const groups = checklistFor(deal);
  const all = groups.flatMap((g) => g.items);
  const doneCount = all.filter((i) => deal.done.includes(i.id)).length;
  const toggle = (id: string) => set({ done: deal.done.includes(id) ? deal.done.filter((x) => x !== id) : [...deal.done, id] });

  const saveNew = () => {
    const d = { ...deal, id: `d${Date.now().toString(36)}`, name: deal.name.trim() || `${countyName(deal.county)} deal` };
    carryDraftNumbers(d.id, d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short');
    const next = [d, ...saved];
    saveDeals(next);
    setSaved(next);
    setDeal(d);
  };
  const remove = (id: string) => {
    const next = saved.filter((d) => d.id !== id);
    saveDeals(next);
    forgetDeal(id);
    setSaved(next);
    if (deal.id === id) setDeal(blank(deal.state));
  };

  // The "at the moment you need one" ad beside What's next (contextAds.ts).
  const { pros } = useDirectory();
  const adCats = analyzeAdCategories(deal.kind, deal.plan);

  return (
    <main className="page analyze">
      <PageHero
        eyebrow={<span className="eyebrow">Step 6 of 6</span>}
        title={<>Analyze <span className="grad">a deal</span></>}
        sub="Found one you like? Tell us about it, get the checklist for that kind of sale in your state, and know your number before you offer or bid."
      />

      <section className="deal-setup" aria-labelledby="setup-head">
        <h2 id="setup-head">1. Tell us about the property you found</h2>
        <p className="muted">Found a property on an official list, a listing site or from your agent? Enter it here. You’ll get the checklist for that kind of sale in that county, and the calculator for your plan. Save it to come back to it in My deals.</p>
        <div className="deal-fields">
          <label className="field wide">
            <span>Address or nickname</span>
            <input value={deal.name} maxLength={80} placeholder="e.g. 123 Main St" onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="field">
            <span>State</span>
            <select value={deal.state} onChange={(e) => { const s = e.target.value as StateCode; const k = kindsFor(s).some((x) => x.key === deal.kind) ? deal.kind : 'listing'; set({ state: s, county: startCounty(s), kind: k, plan: plansFor(k).includes(deal.plan) ? deal.plan : plansFor(k)[0] }); setMyState(s); }}>
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>County</span>
            <select value={deal.county} onChange={(e) => set({ county: e.target.value })}>
              {st.counties.map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Kind of sale</span>
            <select value={deal.kind} onChange={(e) => { const k = e.target.value as SaleKind; set({ kind: k, plan: plansFor(k).includes(deal.plan) ? deal.plan : plansFor(k)[0] }); }}>
              {kinds.map((k) => <option key={k.key} value={k.key}>{kindLabel(k, deal.state)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Your plan</span>
            <select value={deal.plan} onChange={(e) => set({ plan: e.target.value as Plan })}>
              {plans.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>
        </div>
        <div className="deal-actions">
          {deal.id ? (
            <>
              <span className="muted">Saved as “{deal.name}”. Changes save as you go.</span>
              <button type="button" className="btn btn-secondary" onClick={() => { clearDraftNumbers(); setDeal(blank(deal.state)); }}>Start a new deal</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={saveNew}>Save this deal</button>
          )}
        </div>
        {saved.length > 0 && (
          <div className="saved-deals">
            <strong>Your deals</strong>
            <ul>
              {saved.map((d) => (
                <li key={d.id} className={d.id === deal.id ? 'on' : ''}>
                  <button type="button" className="linkish" onClick={() => setDeal(d)}>{d.name}</button>
                  <span className="muted"> · {countyName(d.county)}, {d.state}</span>
                  <button type="button" className="linkish danger" aria-label={`Delete ${d.name}`} onClick={() => remove(d.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="deal-checklist" aria-labelledby="check-head">
        <h2 id="check-head">2. Your checklist <span className="muted">({doneCount} of {all.length} done)</span></h2>
        <p className="muted">For a {kindLabel(kinds.find((k) => k.key === deal.kind) ?? kinds[0], deal.state).replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())} in {countyName(deal.county)}, {st.name}.</p>
        {groups.map((g) => (
          <CheckFold key={g.title} title={g.title} done={g.items.filter((c) => deal.done.includes(c.id)).length} total={g.items.length}>
            <ul className="decide-checklist">
              {g.items.map((c) => (
                <li key={c.id}>
                  <label>
                    <input type="checkbox" checked={deal.done.includes(c.id)} onChange={() => toggle(c.id)} />
                    <span>{c.text}</span>
                  </label>
                  {c.href && (c.href.startsWith('https://') ? <a href={c.href} target="_blank" rel="noopener noreferrer">Open ↗</a> : <a href={c.href}>{linkLabel(c.href)} →</a>)}
                </li>
              ))}
            </ul>
          </CheckFold>
        ))}
        <label className="field deal-notes">
          <span>Notes</span>
          <textarea rows={3} maxLength={2000} value={deal.notes} placeholder="Questions for the title company, repair quotes, dates…" onChange={(e) => set({ notes: e.target.value })} />
        </label>
      </section>

      <h2 className="section-title" id="numbers" ref={numbersRef}>3. Run the numbers</h2>
      <ProfileNote />
      <CalcRegion.Provider value={{ state: deal.state, county: deal.county }}>
        <Calculators key={`${deal.id}-${deal.state}-${deal.county}-${deal.kind}`} dealId={deal.id || undefined} onAnalyze initial={calcTabFor(deal.plan)} onTab={(k) => { const p = PLANS.find((x) => calcTabFor(x.key) === k)?.key; if (p && p !== deal.plan && plans.some((x) => x.key === p)) set({ plan: p }); }} state={deal.state} saleKind={deal.kind} offer={deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short'} lien={deal.kind === 'lien'} />
      </CalcRegion.Provider>

      {/* One clear next step once the numbers are in: keep the deal, then follow the buying steps for this kind of sale. */}
      <div className={adCats.length ? 'next-with-ad' : undefined}>
      <section className="analyze-next" aria-labelledby="analyze-next-head">
        <h2 id="analyze-next-head">4. What’s next</h2>
        <p>Numbers work, and every checklist item above has an answer? Save the deal so you can come back to it, then follow the “Buy it” steps for this kind of sale in My plan.</p>
        <p><strong>When to walk away:</strong> when the numbers say you’d lose money: the monthly cash flow is negative after reserves, you wouldn’t make a profit when you sell, or the long-term return misses your goal. Write down why in the notes, and move on to the next one. <a href="#/learn/walk-away">When to walk away</a></p>
        <div className="row">
          {!deal.id ? <button type="button" className="btn" onClick={saveNew}>Save this deal</button> : <a className="btn" href="#/deals">Open My deals</a>}
          <a href="#/toolkit">Your buying steps in My plan →</a>
        </div>
      </section>
      {/* One labeled ad from the kind of professional this plan needs (listings and bank-owned homes only). */}
      {adCats.length > 0 && <RotatingAd pros={pros} categories={adCats} placeholder />}
      </div>
    </main>
  );
}

/** What a new deal's starting numbers take from your plan, said once, so nothing changes silently. */
function ProfileNote() {
  const p = investorProfile();
  const parts: string[] = [];
  if (p.investable > 0) parts.push(`${fmtMoney(p.investable)} of investable cash (your limit for a listed home)`);
  if (p.loan === 'cash') parts.push('paying cash');
  else if (p.loan === 'yes') parts.push('a loan (a common 75% of the price for a listed rental, until your lender quotes)');
  if (p.manager === true) parts.push('a property manager (8% of rent)');
  else if (p.manager === false) parts.push('managing it yourself');
  if (!parts.length) return null;
  return <p className="muted analyze-profile">From your plan: {parts.join('; ')}. These fill in a new deal’s starting numbers. Change any of them below; they aren’t loan terms anyone approved. <a href="#/toolkit">Edit your plan</a></p>;
}
