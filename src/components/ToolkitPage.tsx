import { useEffect, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { STATES } from '../lib/regions';
import { getMyState } from '../lib/myState';
import { fmtMoney } from '../lib/status';
import { cleanBuyBox, DEAL_BREAKERS, EMPTY_BUY_BOX, EXAMPLE_BUY_BOX, PROPERTY_TYPE_OPTIONS, ROADMAP, ROADMAP_PATHS, ROADMAP_PHASES, roadmapFor, LIEN_STRATEGY, STEP_STATUS_LABEL, STRATEGY_OPTIONS, TOOLKIT, WORKSHEETS, worksheetText, type BuyBox, type RoadmapPath, type RoadmapStep, type StepStatus } from '../lib/toolkit';
import { downloadText, fileName } from '../lib/download';
import { cleanLog, logText } from '../lib/evidence';
import { makeBackup, readBackup, restoreBackup } from '../lib/progressBackup';
import { loadDeals as loadAnalyzed } from '../lib/analyze';
import { docGuide, DOC_GUIDES } from '../lib/docGuides';
import DocGuideView from './DocGuideView';
import { EvidenceArea } from './EvidenceLog';
import { DEAL_ID, DEAL_KEY, DEAL_STEPS_KEY, type DealSteps } from '../lib/roadmapDeals';
import { cashForPrice, cleanGoal, cleanTeamList, GOAL_KEY, PLAN_EVENT, PRICE_DEFAULTS, priceForCash, TEAM_LIST_KEY, TEAM_ROLES, type PriceAssumptions, type TeamList, type TeamMember } from '../lib/myPlan';
import { currentProgress } from '../lib/journey';
import { DECIDE_KEY, rank, type Answers } from '../lib/decide';
import { loadCase } from '../practice/caseProgress';
import { RENTAL_CASE, tasksFor } from '../practice/rentalCase';
import { proGuideByKey } from '../lib/proGuide';
import { PRO_SCRIPTS } from '../lib/proScripts';

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
const STATUSES: StepStatus[] = ['doing', 'waiting', 'stopped', 'na'];
const cleanStatus = (v: unknown): Record<string, StepStatus> => {
  const out: Record<string, StepStatus> = {};
  if (v && typeof v === 'object' && !Array.isArray(v))
    for (const [k, x] of Object.entries(v)) if (ROADMAP.some((s) => s.id === k) && STATUSES.includes(x as StepStatus)) out[k] = x as StepStatus;
  return out;
};

// Steps 4 to 6 (find, buy, own) belong to one property. With a deal chosen, their progress is kept for that deal,
// so two properties can be at different stages; steps 1 to 3 are the learner's own, whatever the deal.
const cleanDealSteps = (v: unknown): DealSteps => {
  const out: DealSteps = {};
  if (v && typeof v === 'object' && !Array.isArray(v))
    for (const [k, x] of Object.entries(v).slice(0, 200)) {
      if (!DEAL_ID.test(k) || !x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      out[k] = { done: cleanIds(o.done), status: cleanStatus(o.status) };
    }
  return out;
};
const dealScoped = (s: RoadmapStep) => s.phase >= 4;

/** Ticked roadmap steps, for the homepage progress line. */
export const roadmapDone = () => read(ROADMAP_KEY, [] as string[], cleanIds);
/** How the visitor plans to buy: through an agent, at an auction, or lien certificates. */
export const roadmapPath = () => read(ROADMAP_PATH_KEY, 'listing' as RoadmapPath, cleanPath);
/** Steps done out of the steps on the visitor's path. */
export function roadmapProgress() {
  const steps = roadmapFor(roadmapPath());
  const done = roadmapDone();
  const status = read(STATUS_KEY, {}, cleanStatus);
  // The same count My plan shows: "doesn't apply" counts as settled, and steps 4 to 6 count for the chosen property.
  const chosen = read(DEAL_KEY, '', (v) => (typeof v === 'string' && DEAL_ID.test(v) ? v : ''));
  const active = chosen && loadAnalyzed().some((d) => `analyzed:${d.id}` === chosen) ? chosen : '';
  const per = active ? read(DEAL_STEPS_KEY, {}, cleanDealSteps)[active] ?? { done: [], status: {} } : null;
  const settled = (s: RoadmapStep) => (per && dealScoped(s) ? per.done.includes(s.id) || per.status[s.id] === 'na' : done.includes(s.id) || status[s.id] === 'na');
  return { done: steps.filter(settled).length, total: steps.length };
}

/** Fired when the cash, buy box or team changes, so the roadmap can offer to mark their steps done. */
const PLAN_CHANGED = 'deedowl:plan-changed';
const planChanged = () => window.dispatchEvent(new CustomEvent(PLAN_CHANGED));

/** The investable cash from the worksheet, or 0. */
const investableCash = () => {
  const c = read(CASH_KEY, cleanCash(null), cleanCash);
  return Math.max(0, c.savings - c.spending * c.months - c.promised - c.debt);
};

/** What you've already made that a step asks for, so you can mark it done (a step is never ticked for you). */
function stepEvidence(id: string): string | null {
  if (id === 'goal') return read(GOAL_KEY, '', cleanGoal).trim() ? 'Your goal is written below.' : null;
  if (id === 'money') return investableCash() > 0 ? `Your cash worksheet shows ${fmtMoney(investableCash())} of investable cash.` : null;
  if (id === 'buybox') {
    const b = read(BUYBOX_KEY, EMPTY_BUY_BOX, cleanBuyBox);
    return b.area && b.types.length && b.priceMax && b.dealBreakers.length ? 'Your buy box has an area, property types, a price limit and deal breakers.' : null;
  }
  if (id === 'practice') {
    const p = loadCase();
    const finished = RENTAL_CASE.every((st) => tasksFor(st, p.answers).every((t) => p.done.includes(`${st.key}/${t.id}`)));
    return finished || p.walked ? 'You finished the practice purchase and have its deal packet.' : null;
  }
  if (id === 'team') {
    const t = read(TEAM_LIST_KEY, {}, cleanTeamList);
    const named = Object.values(t).filter((m) => m && m.name.trim());
    return named.length >= 3 ? `Your team list has ${named.length} people${named.every((m) => m!.licenseChecked) ? ', each with a checked license' : ''}.` : null;
  }
  return null;
}

/** The goal shows in "Your next step" and again in its phase: both copies stay in step. */
function GoalField() {
  const [g, setG] = useState(() => read(GOAL_KEY, '', cleanGoal));
  useEffect(() => {
    const on = () => setG(read(GOAL_KEY, '', cleanGoal));
    window.addEventListener(PLAN_EVENT, on);
    return () => window.removeEventListener(PLAN_EVENT, on);
  }, []);
  const change = (v: string) => {
    setG(v);
    write(GOAL_KEY, v);
    window.dispatchEvent(new CustomEvent(PLAN_EVENT));
  };
  return (
    <label className="field roadmap-goal">
      <span>Your goal, in one sentence</span>
      <textarea rows={2} maxLength={400} value={g} onChange={(e) => change(e.target.value)} placeholder="e.g. A rental I’ll hold 10 years, where the rent covers the costs. About 6 hours a week." />
    </label>
  );
}

/** One roadmap step, opened: what you'll have, what to do, what to say, the documents, when to stop, and when it's done. */
function StepBody({ s, status, setStatus, deal }: { s: RoadmapStep; status: StepStatus | 'done' | 'todo'; setStatus: (v: StepStatus | 'done' | 'todo') => void; deal?: { id: string; name: string } }) {
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
      {s.guides?.map((k) => docGuide(k)).filter((g) => g !== undefined).map((g) => <DocGuideView key={g.key} g={g} label={`How to read it: ${g.title}`} />)}
      {deal && s.evidence && dealScoped(s) && <EvidenceArea key={`${deal.id}|${s.evidence}`} dealId={deal.id} dealName={deal.name} area={s.evidence} askFinding={status === 'done'} />}
      {!deal && s.evidence && dealScoped(s) && <p className="muted">Working on a real property? Save it in <a href="#/analyze">Analyze</a>, then choose it above to record what you find here.</p>}
      {s.id === 'goal' && <GoalField />}
      {s.stop && <p className="roadmap-stop"><strong>Stop if:</strong> {s.stop}</p>}
      <p className="roadmap-done"><strong>Done when:</strong> {s.doneWhen}</p>
      {status !== 'done' && stepEvidence(s.id) && (
        <p className="roadmap-has" role="status">✓ {stepEvidence(s.id)} <button type="button" className="linkish" onClick={() => setStatus('done')}>Mark it done</button></p>
      )}
      {s.skip && <p className="muted roadmap-skip"><strong>Doesn’t apply if:</strong> {s.skip}</p>}
      <div className="roadmap-status" role="group" aria-label={`Status: ${s.title}`}>
        {(['todo', 'doing', 'waiting', 'done', 'stopped', ...(s.skip || status === 'na' ? (['na'] as const) : [])] as const).map((k) => (
          <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>{STEP_STATUS_LABEL[k]}</button>
        ))}
        {s.href && <a className="btn" href={s.href}>{s.id === 'goal' && currentProgress().decided ? 'Review your Decide results' : s.action ?? 'Open'} →</a>}
      </div>
    </div>
  );
}

/** The investing roadmap in six phases and three routes, with the next step open. */
export function FirstDealRoadmap() {
  const [done, setDone] = useState<string[]>(roadmapDone);
  const [status, setStatusMap] = useState<Record<string, StepStatus>>(() => read(STATUS_KEY, {}, cleanStatus));
  const [path, setPath] = useState<RoadmapPath>(roadmapPath);
  const [deals] = useState(loadAnalyzed);
  const [dealId, setDealId] = useState(() => read(DEAL_KEY, '', (v) => (typeof v === 'string' && DEAL_ID.test(v) ? v : '')));
  const [perDeal, setPerDeal] = useState<DealSteps>(() => read(DEAL_STEPS_KEY, {}, cleanDealSteps));
  useEffect(() => write(ROADMAP_KEY, done), [done]);
  useEffect(() => write(STATUS_KEY, status), [status]);
  useEffect(() => write(ROADMAP_PATH_KEY, path), [path]);
  useEffect(() => write(DEAL_KEY, dealId), [dealId]);
  useEffect(() => write(DEAL_STEPS_KEY, perDeal), [perDeal]);
  // Redraw when your goal, cash, buy box or team changes elsewhere on the page.
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener(PLAN_CHANGED, on);
    window.addEventListener(PLAN_EVENT, on);
    return () => {
      window.removeEventListener(PLAN_CHANGED, on);
      window.removeEventListener(PLAN_EVENT, on);
    };
  }, []);
  const active = deals.find((d) => `analyzed:${d.id}` === dealId);
  const deal = active ? { id: `analyzed:${active.id}`, name: active.name } : undefined;
  const scoped = (s: RoadmapStep) => !!deal && dealScoped(s);
  const doneOf = (s: RoadmapStep) => (scoped(s) ? (perDeal[deal!.id]?.done ?? []).includes(s.id) : done.includes(s.id));
  const statusOf = (s: RoadmapStep): StepStatus | undefined => (scoped(s) ? perDeal[deal!.id]?.status[s.id] : status[s.id]);
  const steps = roadmapFor(path);
  // A step that doesn't apply (with its stated reason) counts as settled, so it never blocks the next one.
  const settled = (s: RoadmapStep) => doneOf(s) || statusOf(s) === 'na';
  const count = steps.filter(settled).length;
  const naCount = steps.filter((s) => !doneOf(s) && statusOf(s) === 'na').length;
  const stateOf = (s: RoadmapStep): StepStatus | 'done' | 'todo' => (doneOf(s) ? 'done' : statusOf(s) ?? 'todo');
  const walked = steps.find((s) => statusOf(s) === 'stopped' && !doneOf(s));
  // After walking away, the step you stopped at stays the next step (start it again with the next property),
  // rather than the later steps of a deal you left.
  const next = walked ?? steps.find((s) => !settled(s) && statusOf(s) !== 'stopped');
  // The phase holding the next step starts open; after that, phases stay as the reader leaves them.
  const [openPhase] = useState(() => next?.phase ?? 1);
  const phases = ([1, 2, 3, 4, 5, 6] as const).map((n) => ({ n, title: ROADMAP_PHASES[n], steps: steps.filter((s) => s.phase === n) })).filter((ph) => ph.steps.length);
  const nextDone = (d: string[], id: string, v: StepStatus | 'done' | 'todo') => (v === 'done' ? (d.includes(id) ? d : [...d, id]) : d.filter((x) => x !== id));
  const nextStatus = (m: Record<string, StepStatus>, id: string, v: StepStatus | 'done' | 'todo') => {
    const n = { ...m };
    if (v === 'done' || v === 'todo') delete n[id];
    else n[id] = v;
    return n;
  };
  const setStatus = (s: RoadmapStep, v: StepStatus | 'done' | 'todo') => {
    if (scoped(s)) {
      const k = deal!.id;
      setPerDeal((all) => {
        const cur = all[k] ?? { done: [], status: {} };
        return { ...all, [k]: { done: nextDone(cur.done, s.id, v), status: nextStatus(cur.status, s.id, v) } };
      });
      return;
    }
    setDone((d) => nextDone(d, s.id, v));
    setStatusMap((m) => nextStatus(m, s.id, v));
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
      <div className="roadmap-deal">
        <label className="field">
          <span>Which property are you working on?</span>
          <select
            value={deal ? deal.id : ''}
            onChange={(e) => {
              setDealId(e.target.value);
              // The route follows the property's kind of sale, so its steps fit it.
              const d = deals.find((x) => `analyzed:${x.id}` === e.target.value);
              if (d) setPath(d.kind === 'lien' ? 'certificate' : d.kind === 'listing' || d.kind === 'reo' ? 'listing' : 'auction');
            }}
          >
            <option value="">None yet: I’m learning and getting ready</option>
            {deals.map((d) => <option key={d.id} value={`analyzed:${d.id}`}>{d.name}</option>)}
          </select>
        </label>
        <p className="muted">
          {deal
            ? `Steps 4 to 6 (find, buy, own) are tracked for ${deal.name} only, and what you record goes into its evidence log. Steps 1 to 3 are yours, whatever the property.`
            : deals.length
              ? 'Choose a property to track steps 4 to 6 for it. Each property keeps its own progress and evidence.'
              : 'To track steps 4 to 6 for a real property, save it in Analyze first. Each property keeps its own progress and evidence.'}
        </p>
      </div>
      <p className="decide-progress">
        {count} of {steps.length} steps done{naCount > 0 && ` (${naCount} marked “doesn’t apply”)`}
        <span className="decide-bar" role="progressbar" aria-label="Investing roadmap" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={count}><span style={{ width: `${Math.round((count / steps.length) * 100)}%` }} /></span>
      </p>
      {walked && (
        <p className="roadmap-walked" role="status">
          You stopped at “{walked.title}”. Walking away from a deal that doesn’t fit is a good result. When you find the next one, set that step back to “Working on it”.
        </p>
      )}
      {next ? (
        <div className="roadmap-next">
          <p className="roadmap-next-label">Your next step · {ROADMAP_PHASES[next.phase]}{scoped(next) ? ` · ${deal!.name}` : ''}</p>
          <h3>{next.title}</h3>
          <StepBody s={next} status={stateOf(next)} setStatus={(v) => setStatus(next, v)} deal={deal} />
        </div>
      ) : (
        <p className="next-step" role="status">Every step on this route is done. Review your plan before your next deal, and keep practicing.</p>
      )}
      <h3 className="roadmap-all-head">All steps</h3>
      {phases.map((ph) => {
        const phDone = ph.steps.filter(settled).length;
        return (
          <details key={ph.n} className="roadmap-phase" open={openPhase === ph.n}>
            <summary>
              <span className="roadmap-phase-title">{ph.n}. {ph.title}</span>
              <span className="muted">{phDone === ph.steps.length ? '✓ All done' : `${phDone} of ${ph.steps.length} done`}</span>
            </summary>
            <div className="roadmap-steps">
              {ph.steps.map((s) => {
                const st = stateOf(s);
                return (
                  <details key={s.id} className={`roadmap-step ${st}`}>
                    <summary>
                      <span className="roadmap-step-title">{s.title}</span>
                      <span className={`roadmap-chip ${st}`}>{STEP_STATUS_LABEL[st]}</span>
                    </summary>
                    <StepBody s={s} status={st} setStatus={(v) => setStatus(s, v)} deal={deal} />
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
  // What's typed is kept as text (so "4." or "5,200.5" can be finished); the number behind it drives the result.
  const [draft, setDraft] = useState<Partial<Record<keyof Cash, string>>>({});
  useEffect(() => {
    write(CASH_KEY, c);
    planChanged();
  }, [c]);
  const fund = c.spending * c.months;
  const investable = Math.max(0, c.savings - fund - c.promised - c.debt);
  const field = (k: keyof Cash, label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input inputMode="decimal" value={draft[k] ?? (c[k] ? String(c[k]) : '')} placeholder="0" onChange={(e) => { const t = e.target.value; setDraft((d) => ({ ...d, [k]: t })); const v = Number(t.replace(/[$,\s]/g, '')); setC((x) => ({ ...x, [k]: Number.isFinite(v) && v >= 0 ? v : 0 })); }} />
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
      {investable > 0 && <PriceFromCash cash={investable} />}
    </section>
  );
}

/** What price your investable cash can support with a loan: down payment, closing costs and the lender's reserves. */
function PriceFromCash({ cash }: { cash: number }) {
  const [a, setA] = useState<PriceAssumptions>(PRICE_DEFAULTS);
  const price = priceForCash(cash, a);
  const c = cashForPrice(price, a);
  const num = (k: keyof PriceAssumptions, label: string, unit: string) => (
    <label className="field">
      <span>{label} ({unit})</span>
      <input type="number" inputMode="decimal" min={0} max={100} step="any" value={a[k]} onChange={(e) => { const n = Number(e.target.value); setA((x) => ({ ...x, [k]: Number.isFinite(n) && n >= 0 ? Math.min(n, 100) : 0 })); }} />
    </label>
  );
  const useIt = () => {
    const b = read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox);
    write(BUYBOX_KEY, { ...b, priceMax: price, cashMax: Math.round(cash) });
    window.dispatchEvent(new CustomEvent(PLAN_EVENT));
    document.getElementById('buy-box')?.scrollIntoView();
  };
  return (
    <div className="price-from-cash">
      <h3>What price your cash can support</h3>
      <p>
        With {a.downPct}% down, closing costs of about {a.closingPct}% and {a.reserveMonths} months of payments kept in reserve, your {fmtMoney(cash)} supports a price up to about <strong>{fmtMoney(price)}</strong>:
        {' '}{fmtMoney(Math.round(c.down))} down, {fmtMoney(Math.round(c.closing))} closing costs and {fmtMoney(Math.round(c.reserves))} in reserve (about {fmtMoney(Math.round(c.monthly))} a month in loan, tax and insurance). Repairs come out of the same cash, so leave room for them.
      </p>
      <details>
        <summary>Change the assumptions</summary>
        <div className="deal-fields">
          {num('downPct', 'Down payment', '% of price')}
          {num('closingPct', 'Closing costs', '% of price')}
          {num('reserveMonths', 'Reserves', 'months of payments')}
          {num('ratePct', 'Loan rate', '% a year')}
          {num('taxInsPct', 'Property tax and insurance', '% of price a year')}
        </div>
        <p className="muted small">25% down and 6 months of reserves are common for a rental you won’t live in; a home you’ll live in can need far less down. Your lender’s quote sets the real numbers.</p>
      </details>
      <button type="button" className="btn btn-secondary" onClick={useIt}>Use {fmtMoney(price)} in my buy box</button>
    </div>
  );
}

/** The top strategy from Decide, as a buy-box strategy, if Decide has been answered. */
const DECIDE_STRATEGY: Record<string, string> = {
  rental: 'Buy and hold a rental', househack: 'Live in one unit, rent the others', brrrr: 'Buy, fix, rent and refinance (BRRRR)', flip: 'Fix and flip', reo: 'Bank-owned and government homes', auction: 'Tax and foreclosure auctions',
};
function decideStrategy(): string | null {
  const d = read<{ answers?: Answers } | null>(DECIDE_KEY, null, (v) => (v && typeof v === 'object' ? (v as { answers?: Answers }) : null));
  if (!d?.answers || !currentProgress().decided) return null;
  const top = rank(d.answers)[0]?.strategy.key;
  return top ? DECIDE_STRATEGY[top] ?? null : null;
}

function BuyBoxBuilder() {
  const [b, setB] = useState<BuyBox>(() => read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox));
  useEffect(() => {
    write(BUYBOX_KEY, b);
    planChanged();
  }, [b]);
  // The cash helper can fill in the price and cash: pick that up.
  useEffect(() => {
    const on = () => setB(read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox));
    window.addEventListener(PLAN_EVENT, on);
    return () => window.removeEventListener(PLAN_EVENT, on);
  }, []);
  const suggested = decideStrategy();
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
  const lien = b.strategy === LIEN_STRATEGY;
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
        {lien ? (
          <>
            {money('priceMax', 'Most for one certificate ($)', 'The lien amount plus any premium you’d bid.')}
            {money('cashMax', 'Cash you’ll tie up, all in ($)', 'Every certificate, plus later taxes or assessments you may pay to protect them. Money you won’t need for years.')}
          </>
        ) : (
          <>
            <label className="field">
              <span>Bedrooms or units</span>
              <input type="text" maxLength={40} value={b.beds} onChange={(e) => set('beds', e.target.value)} placeholder="e.g. 3+ beds, or 2–4 units" />
            </label>
            {money('priceMax', 'Highest price ($)', 'Not sure? A lender’s pre-approval or your cash limit sets it.')}
            {money('repairsMax', 'Most repairs you’ll take on ($)', 'New investors often start with cosmetic work only.')}
            {money('cashMax', 'Cash you can put in, all in ($)', 'Down payment, closing costs, repairs and reserves.')}
            {money('minCashFlow', 'Least cash flow per month ($)', 'For rentals, after every cost and the loan.')}
          </>
        )}
      </div>
      {lien && <p className="muted">A lien certificate isn’t the property: there’s no rent and nothing to repair. Your buy box is the parcels you’ll bid on, what you’ll pay, and how long your money can wait. Property types and deal breakers below describe the land behind each lien.</p>}
      {!b.strategy && suggested && <p className="roadmap-has">Decide suggested: <strong>{suggested}</strong>. <button type="button" className="linkish" onClick={() => set('strategy', suggested)}>Use it</button></p>}
      {!lien && b.priceMax > 0 && b.cashMax > 0 && cashForPrice(b.priceMax, PRICE_DEFAULTS).total > b.cashMax && (
        <p className="caution" role="status">
          <strong>Your price limit needs more cash than you have.</strong> At {fmtMoney(b.priceMax)}, 25% down, about 3% closing costs and 6 months of reserves take about {fmtMoney(Math.round(cashForPrice(b.priceMax, PRICE_DEFAULTS).total))}, more than your {fmtMoney(b.cashMax)}. Lower the price, or check a lower down payment with your lender.
        </p>
      )}
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
          {lien ? `Lien certificates on ${b.types.length ? b.types.join(', ').toLowerCase() : 'any kind of parcel'}` : b.types.length ? b.types.join(', ') : 'Any property type'}
          {b.beds && !lien ? ` (${b.beds})` : ''} in {b.area || 'any area'}
          {state ? `, ${state.name}` : ''}
          {b.strategy && !lien ? `, to ${b.strategy.charAt(0).toLowerCase()}${b.strategy.slice(1)}` : ''}.
          {b.priceMax ? (lien ? ` Up to ${fmtMoney(b.priceMax)} for one certificate.` : ` Price up to ${fmtMoney(b.priceMax)}.`) : ''}
          {b.repairsMax && !lien ? ` Repairs up to ${fmtMoney(b.repairsMax)}.` : ''}
          {b.cashMax ? ` No more than ${fmtMoney(b.cashMax)} of my cash in it.` : ''}
          {b.minCashFlow && !lien ? ` At least ${fmtMoney(b.minCashFlow)} a month of cash flow.` : ''}
        </p>
        {b.dealBreakers.length > 0 && <p><strong>I walk away if:</strong> {b.dealBreakers.map((d) => (/^[A-Z][a-z]/.test(d) ? d.charAt(0).toLowerCase() + d.slice(1) : d)).join('; ')}.</p>}
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
    ...(b.strategy === LIEN_STRATEGY
      ? [`Strategy: ${b.strategy}`, `Most for one certificate: ${money(b.priceMax)}`, `Cash I’ll tie up, all in: ${money(b.cashMax)}`]
      : [
          `Bedrooms or units: ${b.beds}`,
          `Strategy: ${b.strategy}`,
          `Highest price: ${money(b.priceMax)}`,
          `Most repairs I’ll take on: ${money(b.repairsMax)}`,
          `Cash I can put in, all in: ${money(b.cashMax)}`,
          `Least cash flow per month: ${money(b.minCashFlow)}`,
        ]),
    `I walk away if: ${b.dealBreakers.join('; ')}`,
    `Notes: ${b.notes}`,
  ].join('\n');
}

/** The people you'll call, with what to say to each: kept, printed and downloaded with your plan. */
function TeamListSection() {
  const [t, setT] = useState<TeamList>(() => read(TEAM_LIST_KEY, {}, cleanTeamList));
  useEffect(() => {
    write(TEAM_LIST_KEY, t);
    planChanged();
  }, [t]);
  const set = (k: keyof TeamList, patch: Partial<TeamMember>) => setT((x) => ({ ...x, [k]: { name: '', contact: '', licenseChecked: false, fees: '', ...x[k], ...patch } }));
  return (
    <section id="team" aria-labelledby="team-head">
      <h2 id="team-head">Your team</h2>
      <p>The people a first purchase usually needs, in the order you’ll call them. Write down who you chose, check their license, and note what they charge. Each role links to what they do and how to find one.</p>
      <ol className="team-list">
        {TEAM_ROLES.map((k) => {
          const g = proGuideByKey(k);
          const m = t[k];
          if (!g) return null;
          return (
            <li key={k} className="team-member">
              <h3><a href={`#/pros/${k}`}>{g.title}</a></h3>
              <div className="deal-fields">
                <label className="field"><span>Name and company</span><input type="text" maxLength={120} value={m?.name ?? ''} onChange={(e) => set(k, { name: e.target.value })} /></label>
                <label className="field"><span>Phone or email</span><input type="text" maxLength={160} value={m?.contact ?? ''} onChange={(e) => set(k, { contact: e.target.value })} /></label>
                <label className="field"><span>Fees</span><input type="text" maxLength={200} value={m?.fees ?? ''} onChange={(e) => set(k, { fees: e.target.value })} placeholder="What they charge, and when" /></label>
              </div>
              <label className="check"><input type="checkbox" checked={!!m?.licenseChecked} onChange={(e) => set(k, { licenseChecked: e.target.checked })} /> I checked their license with the state</label>
              {PRO_SCRIPTS[k] && (
                <details>
                  <summary>What to say</summary>
                  <blockquote className="roadmap-script">{PRO_SCRIPTS[k].say}</blockquote>
                </details>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Everything in My plan as one text file: goal, cash, buy box, roadmap and team. */
function planText(): string {
  const path = roadmapPath();
  const steps = roadmapFor(path);
  const done = roadmapDone();
  const status = read(STATUS_KEY, {}, cleanStatus);
  const b = read(BUYBOX_KEY, EMPTY_BUY_BOX, cleanBuyBox);
  const team = read(TEAM_LIST_KEY, {}, cleanTeamList);
  const cash = investableCash();
  const lines = ['MY INVESTING PLAN', 'DeedOwl educational worksheet.', '', 'GOAL', read(GOAL_KEY, '', cleanGoal) || '(not written yet)', '', 'CASH'];
  lines.push(cash > 0 ? `Investable cash: ${fmtMoney(cash)}. With 25% down, 3% closing costs and 6 months of reserves, it supports a price up to about ${fmtMoney(priceForCash(cash))}.` : '(not worked out yet)');
  lines.push('', buyBoxText(b, STATES.find((x) => x.code === b.state)?.name), '', `ROADMAP: ${ROADMAP_PATHS[path].label}`);
  for (const s of steps) lines.push(`[${done.includes(s.id) ? 'x' : status[s.id] === 'na' ? '-' : ' '}] ${ROADMAP_PHASES[s.phase]}: ${s.title}${status[s.id] && !done.includes(s.id) ? ` (${STEP_STATUS_LABEL[status[s.id]]})` : ''}`);
  lines.push('', 'TEAM');
  for (const k of TEAM_ROLES) {
    const m = team[k];
    const g = proGuideByKey(k);
    lines.push(`${g?.title ?? k}: ${m?.name || '(not chosen yet)'}${m?.contact ? `, ${m.contact}` : ''}${m?.licenseChecked ? ', license checked' : ''}${m?.fees ? `. Fees: ${m.fees}` : ''}`);
    if (PRO_SCRIPTS[k]) lines.push(`  What to say: ${PRO_SCRIPTS[k].say}`);
  }
  return lines.join('\n');
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

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Everything free in one place: the first-deal roadmap, a buy box, and the calculators and checklists. */
export default function ToolkitPage({ section }: { section?: string }) {
  useLastActivity('#/toolkit', 'My plan');
  useEffect(() => {
    if (section === 'buy-box' || section === 'cash' || section === 'team') document.getElementById(section)?.scrollIntoView();
  }, [section]);
  return (
    <main className="page toolkit">
      <PageHero
        title={<>My <span className="grad">plan</span></>}
        sub="Your investor toolkit: a step-by-step roadmap, a buy box to keep you focused, and every calculator and checklist on DeedOwl."
      />
      {!currentProgress().decided && <section className="toolkit-start" aria-labelledby="start-head">
        <h2 id="start-head">Start your investing plan</h2>
        <p>First, choose what you want from investing. You can change your answer later.</p>
        <div className="decide-nav">
          <a className="btn" href="#/decide">Choose my goal</a>
          <button type="button" className="btn btn-secondary" onClick={() => jump('roadmap')}>See the full roadmap</button>
        </div>
      </section>}
      <FirstDealRoadmap />
      <CashWorksheet />
      <BuyBoxBuilder />
      <TeamListSection />
      <section className="plan-download" aria-labelledby="plan-dl-head">
        <h2 id="plan-dl-head">Take your plan with you</h2>
        <p>Your goal, your cash and what price it supports, your buy box, where you are on the roadmap, and your team with what to say to each, in one file.</p>
        <div className="decide-nav">
          <button type="button" className="btn" onClick={() => downloadText('my-investing-plan.txt', planText())}>Download my plan</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Print this page</button>
        </div>
      </section>
      <Worksheets />
      <section id="paperwork" aria-labelledby="paperwork-head">
        <h2 id="paperwork-head">Read the paperwork</h2>
        <p>The documents a purchase turns on, annotated: who gives each one to you and when, the parts to find, what you fill in and what a professional prepares, and how to check a corrected version. Open one when your roadmap step reaches it.</p>
        {DOC_GUIDES.map((g) => <DocGuideView key={g.key} g={g} label={g.title} />)}
      </section>
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
