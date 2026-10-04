import { useEffect, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { STATES } from '../lib/regions';
import { getMyState } from '../lib/myState';
import { fmtMoney } from '../lib/status';
import { cleanBuyBox, DEAL_BREAKERS, EMPTY_BUY_BOX, EXAMPLE_BUY_BOX, PROPERTY_TYPE_OPTIONS, ROADMAP, ROADMAP_PATHS, ROADMAP_PHASES, roadmapFor, STEP_STATUS_LABEL, STRATEGY_OPTIONS, TOOLKIT, WORKSHEETS, worksheetText, type BuyBox, type RoadmapPath, type RoadmapStep, type StepStatus } from '../lib/toolkit';
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
const cleanPath = (v: unknown): RoadmapPath => (v === 'auction' || v === 'certificate' ? v : 'listing');
const STATUS_KEY = 'deedowl.roadmap.status.v1';
const STATUSES: StepStatus[] = ['doing', 'waiting', 'stopped'];
const cleanStatus = (v: unknown): Record<string, StepStatus> => {
  const out: Record<string, StepStatus> = {};
  if (v && typeof v === 'object' && !Array.isArray(v))
    for (const [k, x] of Object.entries(v)) if (ROADMAP.some((s) => s.id === k) && STATUSES.includes(x as StepStatus)) out[k] = x as StepStatus;
  return out;
};

/** Ticked roadmap steps, for the homepage progress line. */
export const roadmapDone = () => read(ROADMAP_KEY, [] as string[], cleanIds);
/** How the visitor plans to buy: through an agent, at an auction, or lien certificates. */
export const roadmapPath = () => read(ROADMAP_PATH_KEY, 'listing' as RoadmapPath, cleanPath);
/** Steps done out of the steps on the visitor's path. */
export function roadmapProgress() {
  const steps = roadmapFor(roadmapPath());
  const done = roadmapDone();
  return { done: steps.filter((s) => done.includes(s.id)).length, total: steps.length };
}

/** One roadmap step, opened: what you'll have, what to do, what to say, the documents, when to stop, and when it's done. */
function StepBody({ s, status, setStatus }: { s: RoadmapStep; status: StepStatus | 'done' | 'todo'; setStatus: (v: StepStatus | 'done' | 'todo') => void }) {
  return (
    <div className="roadmap-step-body">
      <p>{s.text}</p>
      <p className="roadmap-outcome"><strong>You’ll have:</strong> {s.outcome}</p>
      <div className="roadmap-cols">
        <div>
          <h4>Do this</h4>
          <ol>{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
        {(s.say || s.docs) && (
          <div>
            {s.say && (
              <>
                <h4>What to say: {s.say.to}</h4>
                <blockquote className="roadmap-script">{s.say.script}</blockquote>
              </>
            )}
            {s.docs && (
              <>
                <h4>Documents</h4>
                <ul>{s.docs.map((d) => <li key={d}>{d}</li>)}</ul>
              </>
            )}
          </div>
        )}
      </div>
      {s.stop && <p className="roadmap-stop"><strong>Stop if:</strong> {s.stop}</p>}
      <p className="roadmap-done"><strong>Done when:</strong> {s.doneWhen}</p>
      <div className="roadmap-status" role="group" aria-label={`Status: ${s.title}`}>
        {(['todo', 'doing', 'waiting', 'done', 'stopped'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>{STEP_STATUS_LABEL[k]}</button>
        ))}
        {s.href && <a className="btn" href={s.href}>{s.action ?? 'Open'} →</a>}
      </div>
    </div>
  );
}

/** The investing roadmap in six phases and three routes, with the next step open. */
export function FirstDealRoadmap() {
  const [done, setDone] = useState<string[]>(roadmapDone);
  const [status, setStatusMap] = useState<Record<string, StepStatus>>(() => read(STATUS_KEY, {}, cleanStatus));
  const [path, setPath] = useState<RoadmapPath>(roadmapPath);
  useEffect(() => write(ROADMAP_KEY, done), [done]);
  useEffect(() => write(STATUS_KEY, status), [status]);
  useEffect(() => write(ROADMAP_PATH_KEY, path), [path]);
  const steps = roadmapFor(path);
  const count = steps.filter((s) => done.includes(s.id)).length;
  const stateOf = (id: string): StepStatus | 'done' | 'todo' => (done.includes(id) ? 'done' : status[id] ?? 'todo');
  const walked = steps.find((s) => status[s.id] === 'stopped' && !done.includes(s.id));
  const next = steps.find((s) => !done.includes(s.id) && status[s.id] !== 'stopped');
  const phases = ([1, 2, 3, 4, 5, 6] as const).map((n) => ({ n, title: ROADMAP_PHASES[n], steps: steps.filter((s) => s.phase === n) })).filter((ph) => ph.steps.length);
  const setStatus = (id: string, v: StepStatus | 'done' | 'todo') => {
    setDone((d) => (v === 'done' ? (d.includes(id) ? d : [...d, id]) : d.filter((x) => x !== id)));
    setStatusMap((m) => {
      const n = { ...m };
      if (v === 'done' || v === 'todo') delete n[id];
      else n[id] = v;
      return n;
    });
  };
  return (
    <section id="roadmap" aria-labelledby="roadmap-head">
      <h2 id="roadmap-head">Your investing roadmap</h2>
      <p>Every real task of buying, from your first goal to owning it. Each step tells you what you’ll have when it’s done, exactly what to do, what to say and to whom, the documents involved, and when to stop. Mark a step done only when its “Done when” is true.</p>
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
      {walked && (
        <p className="roadmap-walked" role="status">
          You stopped at “{walked.title}”. Walking away from a deal that doesn’t fit is a good result. When you find the next one, set that step back to “Working on it”.
        </p>
      )}
      {next ? (
        <div className="roadmap-next">
          <p className="roadmap-next-label">Your next step · {ROADMAP_PHASES[next.phase]}</p>
          <h3>{next.title}</h3>
          <StepBody s={next} status={stateOf(next.id)} setStatus={(v) => setStatus(next.id, v)} />
        </div>
      ) : (
        <p className="next-step" role="status">Every step on this route is done. Review your plan before your next deal, and keep practicing.</p>
      )}
      <h3 className="roadmap-all-head">All steps</h3>
      {phases.map((ph) => {
        const phDone = ph.steps.filter((s) => done.includes(s.id)).length;
        return (
          <details key={ph.n} className="roadmap-phase" open={next ? next.phase === ph.n : false}>
            <summary>
              <span className="roadmap-phase-title">{ph.n}. {ph.title}</span>
              <span className="muted">{phDone === ph.steps.length ? '✓ All done' : `${phDone} of ${ph.steps.length} done`}</span>
            </summary>
            <div className="roadmap-steps">
              {ph.steps.map((s) => {
                const st = stateOf(s.id);
                return (
                  <details key={s.id} className={`roadmap-step ${st}`}>
                    <summary>
                      <span className="roadmap-step-title">{s.title}</span>
                      <span className={`roadmap-chip ${st}`}>{STEP_STATUS_LABEL[st]}</span>
                    </summary>
                    <StepBody s={s} status={st} setStatus={(v) => setStatus(s.id, v)} />
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}

/** Investable cash: savings minus the emergency fund and money promised elsewhere. Kept in this browser. */
const CASH_KEY = 'deedowl.cash.v1';
interface Cash { savings: number; spending: number; months: number; promised: number; debt: number }
const cleanCash = (v: unknown): Cash => {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const n = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e9 ? x : d);
  return { savings: n(o.savings, 0), spending: n(o.spending, 0), months: n(o.months, 6), promised: n(o.promised, 0), debt: n(o.debt, 0) };
};
export function CashWorksheet() {
  const [c, setC] = useState<Cash>(() => read(CASH_KEY, cleanCash(null), cleanCash));
  useEffect(() => write(CASH_KEY, c), [c]);
  const fund = c.spending * c.months;
  const investable = Math.max(0, c.savings - fund - c.promised - c.debt);
  const field = (k: keyof Cash, label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input inputMode="decimal" value={c[k] || ''} placeholder="0" onChange={(e) => { const v = Number(e.target.value.replace(/[$,\s]/g, '')); setC((x) => ({ ...x, [k]: Number.isFinite(v) && v >= 0 ? v : 0 })); }} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  return (
    <section id="cash" aria-labelledby="cash-head">
      <h2 id="cash-head">Your investable cash</h2>
      <p>The most you could put into a deal without touching your safety net. Numbers stay in this browser.</p>
      <div className="deal-fields">
        {field('savings', 'Savings and investments you could sell')}
        {field('spending', 'Household spending each month')}
        {field('months', 'Months of spending to keep as an emergency fund', 'A planning choice: many people keep 3 to 6 months or more.')}
        {field('promised', 'Money promised to other goals in the next year')}
        {field('debt', 'High-interest debt to pay off first', 'Credit cards and similar debt usually cost more than a deal earns.')}
      </div>
      <p className="cash-result">
        Emergency fund: <strong>{fmtMoney(fund)}</strong> · Your investable cash: <strong>{fmtMoney(investable)}</strong>
      </p>
      {c.savings > 0 && investable === 0 && <p className="roadmap-stop"><strong>Not yet.</strong> Build your emergency fund and pay off high-interest debt first. Keep learning and practicing in the meantime.</p>}
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

const JUMPS: [string, string][] = [['roadmap', 'Roadmap'], ['cash', 'Investable cash'], ['buy-box', 'Buy box'], ['worksheets', 'Worksheets'], ['tools-calculators', 'Calculators'], ['tools-checklists', 'Checklists'], ['backup', 'Keep your progress']];
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Everything free in one place: the first-deal roadmap, a buy box, and the calculators and checklists. */
export default function ToolkitPage({ section }: { section?: string }) {
  useLastActivity('#/toolkit', 'My plan');
  useEffect(() => {
    if (section === 'buy-box' || section === 'cash') document.getElementById(section)?.scrollIntoView();
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
      <CashWorksheet />
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
