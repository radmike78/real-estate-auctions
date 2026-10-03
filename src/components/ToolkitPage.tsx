import { useEffect, useState } from 'react';
import PageHero from './PageHero';
import { STATES } from '../lib/regions';
import { getMyState } from '../lib/myState';
import { fmtMoney } from '../lib/status';
import { cleanBuyBox, DEAL_BREAKERS, EMPTY_BUY_BOX, FIRST_DEAL, PROPERTY_TYPE_OPTIONS, STRATEGY_OPTIONS, TOOLKIT, type BuyBox } from '../lib/toolkit';

const ROADMAP_KEY = 'deedowl.roadmap.v1';
const BUYBOX_KEY = 'deedowl.buybox.v1';

function read<T>(key: string, fallback: T, clean: (v: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? clean(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode: not kept */
  }
}
const cleanIds = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && FIRST_DEAL.some((s) => s.id === x)) : []);

/** Ticked roadmap steps, for the homepage progress line. */
export const roadmapDone = () => read(ROADMAP_KEY, [] as string[], cleanIds);

/** The first-deal roadmap with its ticks. */
export function FirstDealRoadmap() {
  const [done, setDone] = useState<string[]>(roadmapDone);
  useEffect(() => write(ROADMAP_KEY, done), [done]);
  const pct = Math.round((done.length / FIRST_DEAL.length) * 100);
  return (
    <section aria-labelledby="roadmap-head">
      <h2 id="roadmap-head">Your first deal: {pct}% done</h2>
      <p className="decide-progress">
        {done.length} of {FIRST_DEAL.length} steps
        <span className="decide-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>
      </p>
      <ol className="decide-checklist roadmap">
        {FIRST_DEAL.map((s) => (
          <li key={s.id}>
            <label>
              <input type="checkbox" checked={done.includes(s.id)} onChange={() => setDone((d) => (d.includes(s.id) ? d.filter((x) => x !== s.id) : [...d, s.id]))} />
              <span>{s.text}</span>
            </label>
            {s.href && <a href={s.href}>Go →</a>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function BuyBoxBuilder() {
  const [b, setB] = useState<BuyBox>(() => read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox));
  useEffect(() => write(BUYBOX_KEY, b), [b]);
  const set = <K extends keyof BuyBox>(k: K, v: BuyBox[K]) => setB((x) => ({ ...x, [k]: v }));
  const toggle = (k: 'types' | 'dealBreakers', v: string) => set(k, b[k].includes(v) ? b[k].filter((x) => x !== v) : [...b[k], v]);
  const money = (k: 'priceMax' | 'repairsMax' | 'cashMax' | 'minCashFlow', label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input type="number" inputMode="numeric" min={0} step={1000} value={b[k] || ''} onChange={(e) => set(k, Math.max(0, Number(e.target.value) || 0))} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  const state = STATES.find((s) => s.code === b.state);
  return (
    <section id="buy-box" aria-labelledby="buybox-head">
      <h2 id="buybox-head">Your buy box</h2>
      <p>A buy box is the exact kind of property you’re looking for. Writing it down turns “I’ll know a deal when I see it” into a quick yes or no, and keeps you from chasing everything.</p>
      <div className="buybox-grid">
        <label className="field">
          <span>State</span>
          <select value={b.state} onChange={(e) => set('state', e.target.value)}>
            <option value="">Choose</option>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Counties, cities or neighborhoods</span>
          <input type="text" maxLength={200} value={b.area} onChange={(e) => set('area', e.target.value)} />
        </label>
        <label className="field">
          <span>Strategy</span>
          <select value={b.strategy} onChange={(e) => set('strategy', e.target.value)}>
            <option value="">Choose</option>
            {STRATEGY_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Bedrooms or units</span>
          <input type="text" maxLength={40} value={b.beds} onChange={(e) => set('beds', e.target.value)} placeholder="e.g. 3+ beds, or 2–4 units" />
        </label>
        {money('priceMax', 'Highest price ($)')}
        {money('repairsMax', 'Most repairs you’ll take on ($)')}
        {money('cashMax', 'Cash you can put in, all in ($)', 'Down payment, closing costs, repairs and reserves.')}
        {money('minCashFlow', 'Least cash flow per month ($)', 'For rentals, after every cost and the loan.')}
      </div>
      <fieldset className="buybox-checks">
        <legend>Property types</legend>
        {PROPERTY_TYPE_OPTIONS.map((t) => <label key={t}><input type="checkbox" checked={b.types.includes(t)} onChange={() => toggle('types', t)} /> {t}</label>)}
      </fieldset>
      <fieldset className="buybox-checks">
        <legend>Deal breakers: I walk away if…</legend>
        {DEAL_BREAKERS.map((t) => <label key={t}><input type="checkbox" checked={b.dealBreakers.includes(t)} onChange={() => toggle('dealBreakers', t)} /> {t}</label>)}
      </fieldset>
      <label className="field">
        <span>Notes</span>
        <textarea maxLength={1000} rows={3} value={b.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>
      <div className="buybox-summary" aria-live="polite">
        <h3>My buy box</h3>
        <p>
          {b.types.length ? b.types.join(', ') : 'Any property type'}
          {b.beds ? ` (${b.beds})` : ''} in {b.area || 'any area'}
          {state ? `, ${state.name}` : ''}
          {b.strategy ? `, to ${b.strategy.charAt(0).toLowerCase()}${b.strategy.slice(1)}` : ''}.
          {b.priceMax ? ` Price up to ${fmtMoney(b.priceMax)}.` : ''}
          {b.repairsMax ? ` Repairs up to ${fmtMoney(b.repairsMax)}.` : ''}
          {b.cashMax ? ` No more than ${fmtMoney(b.cashMax)} of my cash in it.` : ''}
          {b.minCashFlow ? ` At least ${fmtMoney(b.minCashFlow)} a month of cash flow.` : ''}
        </p>
        {b.dealBreakers.length > 0 && <p><strong>I walk away if:</strong> {b.dealBreakers.join('; ').toLowerCase()}.</p>}
        <div className="decide-nav">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Print</button>
          <button type="button" className="btn btn-secondary" onClick={() => setB({ ...EMPTY_BUY_BOX })}>Clear</button>
        </div>
      </div>
      <p className="muted">Your roadmap and buy box are saved only in this browser.</p>
    </section>
  );
}

/** Everything free in one place: the first-deal roadmap, a buy box, and the calculators and checklists. */
export default function ToolkitPage({ section }: { section?: string }) {
  useEffect(() => {
    if (section === 'buy-box') document.getElementById('buy-box')?.scrollIntoView();
  }, [section]);
  return (
    <main className="page toolkit">
      <PageHero
        eyebrow={<span className="eyebrow">Free, no sign-up</span>}
        title={<>Investor <span className="grad">toolkit</span></>}
        sub="Your roadmap to a first deal, a buy box to keep you focused, and every calculator and checklist on DeedOwl."
      />
      <FirstDealRoadmap />
      <BuyBoxBuilder />
      {TOOLKIT.map((g) => (
        <section key={g.group}>
          <h2>{g.group}</h2>
          <ul className="lesson-links">
            {g.items.map((x) => (
              <li key={x.label}>
                <a href={x.href}>{x.label} →</a>
                <span className="muted">{x.what}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
