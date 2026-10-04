import { useEffect, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { STATES } from '../lib/regions';
import { getMyState } from '../lib/myState';
import { fmtMoney } from '../lib/status';
import { cleanBuyBox, DEAL_BREAKERS, EMPTY_BUY_BOX, EXAMPLE_BUY_BOX, PROPERTY_TYPE_OPTIONS, ROADMAP, ROADMAP_PATHS, ROADMAP_PHASES, roadmapFor, STRATEGY_OPTIONS, TOOLKIT, WORKSHEETS, worksheetText, type BuyBox, type RoadmapPath } from '../lib/toolkit';
import { downloadText, fileName } from '../lib/download';
import { cleanLog, logText } from '../lib/evidence';
import { makeBackup, readBackup, restoreBackup } from '../lib/progressBackup';

const ROADMAP_KEY = 'deedowl.roadmap.v1';
const ROADMAP_PATH_KEY = 'deedowl.roadmap.path.v1';
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
const cleanIds = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && ROADMAP.some((s) => s.id === x)) : []);
const cleanPath = (v: unknown): RoadmapPath => (v === 'auction' ? 'auction' : 'listing');

/** Ticked roadmap steps, for the homepage progress line. */
export const roadmapDone = () => read(ROADMAP_KEY, [] as string[], cleanIds);
/** How the visitor plans to buy: through an agent or at an auction. */
export const roadmapPath = () => read(ROADMAP_PATH_KEY, 'listing' as RoadmapPath, cleanPath);
/** Steps done out of the steps on the visitor's path. */
export function roadmapProgress() {
  const steps = roadmapFor(roadmapPath());
  const done = roadmapDone();
  return { done: steps.filter((s) => done.includes(s.id)).length, total: steps.length };
}

/** The investing roadmap in four phases, with the current phase open. */
export function FirstDealRoadmap() {
  const [done, setDone] = useState<string[]>(roadmapDone);
  const [path, setPath] = useState<RoadmapPath>(roadmapPath);
  useEffect(() => write(ROADMAP_KEY, done), [done]);
  useEffect(() => write(ROADMAP_PATH_KEY, path), [path]);
  const steps = roadmapFor(path);
  const count = steps.filter((s) => done.includes(s.id)).length;
  const next = steps.find((s) => !done.includes(s.id));
  const phases = ([1, 2, 3, 4] as const).map((n) => ({ n, title: ROADMAP_PHASES[n], steps: steps.filter((s) => s.phase === n) }));
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <section id="roadmap" aria-labelledby="roadmap-head">
      <h2 id="roadmap-head">Your investing roadmap</h2>
      <p>The real tasks of buying, in four phases. You don’t need to do it all at once: tick a step when its “Done when” is true. This is separate from Getting started, which only introduces the site.</p>
      <div className="roadmap-path" role="group" aria-label="How you’ll buy">
        <span className="roadmap-path-label">How you’ll buy:</span>
        {(Object.keys(ROADMAP_PATHS) as RoadmapPath[]).map((k) => (
          <button key={k} type="button" aria-pressed={path === k} onClick={() => setPath(k)}>{ROADMAP_PATHS[k].label}</button>
        ))}
        <span className="muted">{ROADMAP_PATHS[path].hint}</span>
      </div>
      <p className="decide-progress">
        {count} of {steps.length} steps done
        <span className="decide-bar" role="progressbar" aria-label="Investing roadmap" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={count}><span style={{ width: `${Math.round((count / steps.length) * 100)}%` }} /></span>
      </p>
      <div className="next-step" role="status">
        <strong>Your next step:</strong>{' '}
        {next ? <>{next.text} {next.href && <a href={next.href}>{next.action ?? 'Open'} →</a>}</> : 'Every step is ticked. Revisit your numbers on each new deal, and try another practice drill.'}
      </div>
      {phases.map((ph) => {
        const phDone = ph.steps.filter((s) => done.includes(s.id)).length;
        return (
          <details key={ph.n} className="roadmap-phase" open={next ? next.phase === ph.n : ph.n === 1}>
            <summary>
              <span className="roadmap-phase-title">{ph.n}. {ph.title}</span>
              <span className="muted">{phDone} of {ph.steps.length} done</span>
            </summary>
            <ol className="decide-checklist roadmap">
              {ph.steps.map((s) => (
                <li key={s.id}>
                  <label>
                    <input type="checkbox" checked={done.includes(s.id)} onChange={() => toggle(s.id)} />
                    <span>{s.text}<small className="roadmap-done-when">Done when: {s.doneWhen}</small></span>
                  </label>
                  {s.href && <a href={s.href}>{s.action ?? 'Open'} →</a>}
                </li>
              ))}
            </ol>
          </details>
        );
      })}
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
      <p className="buybox-help">Not sure of your numbers yet? That’s normal. Leave a field blank, start from an example, or work them out with <a href="#/decide">Decide</a> (your goal and budget) and the <a href="#/calculator">calculators</a>.{' '}
        <button type="button" className="linkish" onClick={() => { if (isBlank(b) || window.confirm('Replace your buy box with the example?')) setB({ ...b, ...EXAMPLE_BUY_BOX }); }}>Show an example</button>
      </p>
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
        {money('priceMax', 'Highest price ($)', 'Not sure? A lender’s pre-approval or your cash limit sets it.')}
        {money('repairsMax', 'Most repairs you’ll take on ($)', 'New investors often start with cosmetic work only.')}
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
          <button type="button" className="btn btn-secondary" onClick={() => downloadText('my-buy-box.txt', buyBoxText(b, state?.name))}>Download</button>
          <button type="button" className="btn btn-secondary" onClick={() => setB({ ...EMPTY_BUY_BOX })}>Clear</button>
        </div>
      </div>
      <p className="muted">Your roadmap and buy box are saved only in this browser.</p>
    </section>
  );
}

const isBlank = (b: BuyBox) => !b.area && !b.types.length && !b.strategy && !b.priceMax && !b.repairsMax && !b.cashMax && !b.minCashFlow && !b.beds && !b.dealBreakers.length && !b.notes;

function buyBoxText(b: BuyBox, stateName?: string): string {
  const money = (n: number) => (n ? fmtMoney(n) : '');
  return [
    'My buy box',
    'DeedOwl educational worksheet.',
    '',
    `State: ${stateName ?? ''}`,
    `Area: ${b.area}`,
    `Property types: ${b.types.join(', ')}`,
    `Bedrooms or units: ${b.beds}`,
    `Strategy: ${b.strategy}`,
    `Highest price: ${money(b.priceMax)}`,
    `Most repairs I’ll take on: ${money(b.repairsMax)}`,
    `Cash I can put in, all in: ${money(b.cashMax)}`,
    `Least cash flow per month: ${money(b.minCashFlow)}`,
    `I walk away if: ${b.dealBreakers.join('; ')}`,
    `Notes: ${b.notes}`,
  ].join('\n');
}

function Worksheets() {
  return (
    <section id="worksheets" aria-labelledby="worksheets-head">
      <h2 id="worksheets-head">Worksheets to download</h2>
      <p>Plain-text files you can print, fill in on paper, or keep with your deal notes.</p>
      <ul className="lesson-links">
        {WORKSHEETS.map((w) => (
          <li key={w.key}>
            <button type="button" className="linkish" onClick={() => downloadText(fileName(w.title, 'txt'), worksheetText(w))}>{w.title} ↓</button>
            <span className="muted">{w.intro}</span>
          </li>
        ))}
        <li>
          <button type="button" className="linkish" onClick={() => downloadText('evidence-log.txt', logText('(property)', cleanLog({})))}>Evidence log ↓</button>
          <span className="muted">For each thing you verify: the source, the date, what you found, what’s still open, and who handles it by when. Saved deals have one built in, under My deals.</span>
        </li>
      </ul>
    </section>
  );
}

function ProgressBackup() {
  const [msg, setMsg] = useState('');
  const onFile = async (input: HTMLInputElement) => {
    const f = input.files?.[0];
    input.value = ''; // so choosing the same file again still works
    if (!f) return;
    let text: string;
    try {
      text = await f.text();
    } catch {
      return setMsg('That file couldn’t be read.');
    }
    const r = readBackup(text);
    if (!r.ok) return setMsg(r.error);
    const count = Object.keys(r.data).length;
    const when = r.saved ? ` saved ${new Date(r.saved).toLocaleString()}` : '';
    if (!window.confirm(`Replace your progress in this browser with this backup${when} (${count} item${count === 1 ? '' : 's'})? Items in the backup replace what’s here now.`)) return setMsg('Nothing was changed.');
    const n = restoreBackup(r.data);
    setMsg(`Restored ${n} item${n === 1 ? '' : 's'}. Reloading…`);
    setTimeout(() => window.location.reload(), 800);
  };
  return (
    <section id="backup" aria-labelledby="backup-head">
      <h2 id="backup-head">Keep your progress</h2>
      <p>DeedOwl has no accounts, so your roadmap, drills, practice runs, buy box, saved deals and evidence logs are kept only in this browser. Download a backup to keep them safe or move them to another device. Sign-in links and email-alert links are never included.</p>
      <div className="decide-nav">
        <button type="button" className="btn" onClick={() => downloadText(`deedowl-progress-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup()), 'application/json')}>Download my progress</button>
        <label className="btn btn-secondary file-btn">
          Restore from a backup
          <input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target)} />
        </label>
      </div>
      <p role="status" aria-live="polite">{msg}</p>
    </section>
  );
}

const JUMPS: [string, string][] = [['roadmap', 'Roadmap'], ['buy-box', 'Buy box'], ['worksheets', 'Worksheets'], ['tools-calculators', 'Calculators'], ['tools-checklists', 'Checklists'], ['backup', 'Keep your progress']];
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Everything free in one place: the first-deal roadmap, a buy box, and the calculators and checklists. */
export default function ToolkitPage({ section }: { section?: string }) {
  useLastActivity('#/toolkit', 'My plan');
  useEffect(() => {
    if (section === 'buy-box') document.getElementById('buy-box')?.scrollIntoView();
  }, [section]);
  return (
    <main className="page toolkit">
      <PageHero
        eyebrow={<span className="eyebrow">Free, no sign-up</span>}
        title={<>My <span className="grad">plan</span></>}
        sub="Your investor toolkit: a step-by-step roadmap, a buy box to keep you focused, and every calculator and checklist on DeedOwl."
      />
      <section className="toolkit-start" aria-labelledby="start-head">
        <h2 id="start-head">Start your investing plan</h2>
        <p>First, choose what you want from investing. You can change your answer later.</p>
        <div className="decide-nav">
          <a className="btn" href="#/decide">Choose my goal</a>
          <button type="button" className="btn btn-secondary" onClick={() => jump('roadmap')}>See the full roadmap</button>
        </div>
      </section>
      <nav className="toolkit-jump" aria-label="On this page">
        {JUMPS.map(([id, label]) => <button key={id} type="button" className="linkish" onClick={() => jump(id)}>{label}</button>)}
      </nav>
      <FirstDealRoadmap />
      <BuyBoxBuilder />
      <Worksheets />
      {TOOLKIT.map((g) => (
        <section key={g.group} id={`tools-${g.group.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
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
      <ProgressBackup />
    </main>
  );
}
