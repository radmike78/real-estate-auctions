import { roadmapNextStep, stepContext } from '../lib/planNext';
import { AreaLine } from './AreaPicker';
import NumInput from './NumInput';
import { syncRoadmapCredits } from '../lib/journey';
import { useAccount } from '../lib/account';
import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { STATES, countyName } from '../lib/regions';
import { dropStateLead, forStateText, getMyState, useMyState } from '../lib/myState';
import { fmtMoney } from '../lib/status';
import { getMyArea } from '../lib/myArea';
import { countyTaxLine } from '../lib/stateCosts';
import { cleanAssumptions, cleanBuyBox, DEAL_BREAKERS, EMPTY_BUY_BOX, EXAMPLE_BUY_BOX, PROPERTY_TYPE_OPTIONS, ROADMAP_PATHS, ROADMAP_PHASES, ROADMAP_PHASE_HELP, roadmapFor, LIEN_STRATEGY, STEP_STATUS_LABEL, STRATEGY_OPTIONS, TOOLKIT, WORKSHEETS, worksheetText, type BuyBox, type RoadmapPath, type RoadmapStep, type StepStatus } from '../lib/toolkit';
import { downloadText, fileName } from '../lib/download';
import { cleanLog, logText } from '../lib/evidence';
import { makeBackup, readBackup, restoreBackup } from '../lib/progressBackup';
import { loadDeals as loadAnalyzed } from '../lib/analyze';
import { docGuide, DOC_GUIDES } from '../lib/docGuides';
import NarrowDown from './NarrowDown';
import { toolkitConfig } from '../lib/narrow';
import DocGuideView from './DocGuideView';
import { EvidenceArea } from './EvidenceLog';
import { cleanDealSteps, DEAL_KEY, DEAL_STEPS_KEY, type DealSteps } from '../lib/roadmapDeals';
import { cleanStatus, creditStep, dealScoped, focusDealId, NO_DEAL, pathForDeal, planPath, PROGRESS_EVENT, progressChanged, ROADMAP_KEY, ROADMAP_PATH_KEY, roadmapDone, roadmapPath, roadmapProgress, STATUS_KEY } from '../lib/roadmapState';
import { stageLabel, stageOf, stageOfStep, STAGE_STEPS, DEAL_STAGES } from '../lib/dealStage';
import PlanNext from './PlanNext';
import { planNow } from '../lib/planNext';
import { cashForPrice, cleanGoal, investorProfile, cleanTeamList, GOAL_KEY, PLAN_EVENT, PRICE_DEFAULTS, priceForCash, TEAM_LIST_KEY, TEAM_ROLES, type PriceAssumptions, type TeamList, type TeamMember } from '../lib/myPlan';
import { currentProgress } from '../lib/journey';
import { DECIDE_KEY, QUESTIONS, rank, type Answers } from '../lib/decide';
import { loadCase } from '../practice/caseProgress';
import { caseFor, tasksFor } from '../practice/rentalCase';
import { proGuideByKey } from '../lib/proGuide';
import { PRO_SCRIPTS } from '../lib/proScripts';

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
// Where the roadmap's progress is kept, and how it's counted, lives in roadmapState.ts (the home page and My plan's
// next step count the same way). Re-exported for the pages that used to read it from here.
export { roadmapDone, roadmapPath, roadmapProgress };

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
  if (id === 'c-buybox') {
    const b = read(BUYBOX_KEY, EMPTY_BUY_BOX, cleanBuyBox);
    return b.strategy === LIEN_STRATEGY && b.cashMax > 0 && b.priceMax > 0 ? 'Your buy box shows Lien certificates, the cash you’ll tie up and the most for one certificate.' : null;
  }
  if (id === 'practice') {
    const c = caseFor(getMyState());
    const p = loadCase(c.state);
    const finished = c.stages.every((st) => tasksFor(st, p.answers).every((t) => p.done.includes(`${st.key}/${t.id}`)));
    return finished || p.walked ? 'You finished the practice purchase and have its deal packet.' : null;
  }
  if (id === 'team') {
    const t = read(TEAM_LIST_KEY, {}, cleanTeamList);
    const named = Object.values(t).filter((m) => m && m.name.trim());
    return named.length >= 3 ? `Your team list has ${named.length} people${named.every((m) => m!.licenseChecked) ? ', each one checked' : ''}.` : null;
  }
  return null;
}

/** The goal shows in "Your next step" and again in its phase: both copies stay in step. */
function GoalField() {
  const [g, setG] = useState(() => read(GOAL_KEY, '', cleanGoal));
  // A first draft from the answers given in Decide (goal, budget, time), to edit rather than retype.
  const fromDecide = (() => {
    const a = read<{ answers?: Answers } | null>(DECIDE_KEY, null, (v) => (v && typeof v === 'object' ? (v as { answers?: Answers }) : null))?.answers ?? {};
    const text = (k: string) => QUESTIONS.find((q) => q.key === k)?.options.find((o) => o.value === a[k as keyof Answers])?.text;
    const goal = text('goal');
    if (!goal || a.goal === 'learn') return '';
    return [goal, text('cash') && `with ${text('cash')!.replace(/^[A-Z]/, (c) => c.toLowerCase())} to put in`, text('time')?.toLowerCase()].filter(Boolean).join(', ') + '.';
  })();
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
  // A written goal ticks "Write your goal" (a full sentence, so a stray letter doesn't).
  const settle = (v: string) => { if (v.trim().length >= 12) { creditStep('goal'); progressChanged(); } };
  // Leaving the box by pressing a button (the step's own "Done"): tick it after that click, not before it. Ticking on
  // the press would move the card on, and the click would land on the next step's "Done".
  const settleAfterPress = (v: string) => {
    if (!pressing) { settle(v); return; }
    // However long the press lasts: tick after its click, or shortly after it's released without one (dragged away).
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      window.removeEventListener('click', run, true);
      window.removeEventListener('pointerup', released, true);
      window.removeEventListener('pointercancel', released, true);
      setTimeout(() => settle(v), 0);
    };
    const released = () => setTimeout(run, 400);
    window.addEventListener('click', run, true);
    window.addEventListener('pointerup', released, true);
    window.addEventListener('pointercancel', released, true);
  };
  return (
    <label className="field roadmap-goal">
      <span>Your goal, in one sentence</span>
      <textarea rows={2} maxLength={400} value={g} onChange={(e) => change(e.target.value)} onBlur={(e) => {
        // Moving on within this step (Tab to its "Done" or its status buttons): those buttons decide, so the step
        // doesn't move away from under the keyboard. Leaving the step straight from the box ticks it as before.
        const here = e.currentTarget.closest('.roadmap-next, .roadmap-step');
        if (here && e.relatedTarget instanceof Node && here.contains(e.relatedTarget)) return;
        settleAfterPress(e.target.value);
      }} placeholder="e.g. A rental I’ll hold 10 years, where the rent covers the costs. About 6 hours a week." />
      {!g.trim() && fromDecide && <button type="button" className="linkish" onClick={() => { change(fromDecide); settle(fromDecide); }}>Start from my Decide answers: “{fromDecide}”</button>}
    </label>
  );
}

// Whether a press (mouse button, finger) is down now: a box that loses focus during one was left by pressing something.
let pressing = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { pressing = true; }, true);
  const up = () => { setTimeout(() => { pressing = false; }, 0); };
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', up, true);
}

/** One roadmap step, opened: what you'll have, what to do, what to say, the documents, when to stop, and when it's done. */
function StepBody({ s, status, setStatus, deal }: { s: RoadmapStep; status: StepStatus | 'done' | 'todo'; setStatus: (v: StepStatus | 'done' | 'todo') => void; deal?: { id: string; name: string; kind?: string } }) {
  const [myState] = useMyState();
  return (
    <div className="roadmap-step-body">
      <p>{dropStateLead(forStateText(myState, s.text), myState)}</p>
      <p className="roadmap-outcome"><strong>You’ll have:</strong> {s.outcome}</p>
      <div className="roadmap-actions">
        <div>
          <h4>What to do</h4>
          <ol>{s.steps.map((x) => [x, dropStateLead(forStateText(myState, x), myState)]).filter(([, t]) => t).map(([x, t]) => <li key={x}>{t}</li>)}</ol>
        </div>
      </div>
      {(s.say || s.docs || s.guides?.length) ? <details className="roadmap-help">
        <summary>More help: questions to ask and documents to check</summary>
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
      {s.guides?.map((k) => docGuide(k)).filter((g) => g !== undefined).map((g) => <DocGuideView key={g.key} g={g} label={`How to read it: ${g.title}`} />)}
      </details> : null}
      {deal && s.evidence && dealScoped(s) && <EvidenceArea key={`${deal.id}|${s.evidence}`} dealId={deal.id} dealName={deal.name} area={s.evidence} askFinding={status === 'done'} kind={deal.kind} />}
      {!deal && s.evidence && dealScoped(s) && <p className="muted">Working on a real property? Save it in <a href="#/analyze">Analyze</a> (it becomes the property you’re working on, shown above) to record what you find here.</p>}
      {s.id === 'goal' && <GoalField />}
      {s.id === 'market' && <AreaLine county what="Your sources, rules and checklists follow it." />}
      {s.stop && forStateText(myState, s.stop) && <p className="roadmap-stop"><strong>When to pause:</strong> {dropStateLead(forStateText(myState, s.stop), myState)}</p>}
      <p className="roadmap-done"><strong>Done when:</strong> {s.doneWhen}</p>
      {status !== 'done' && stepEvidence(s.id) && (
        <p className="roadmap-has" role="status">✓ {stepEvidence(s.id)} <button type="button" className="linkish" onClick={() => setStatus('done')}>Mark it done</button></p>
      )}
      {s.skip && <p className="muted roadmap-skip"><strong>Doesn’t apply if:</strong> {s.skip}</p>}
      <div className="roadmap-status" role="group" aria-label={`Status: ${s.title}`}>
        {(['todo', 'doing', 'waiting', 'done', 'stopped', 'na'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>{STEP_STATUS_LABEL[k]}</button>
        ))}
        {s.href && <a className="btn" href={s.href}>{s.id === 'goal' && currentProgress().decided ? 'Review your Decide results' : s.action ?? 'Open'}&nbsp;→</a>}
        {s.also && <a className="btn btn-secondary" href={s.also.href}>{s.also.label}&nbsp;→</a>}
      </div>
    </div>
  );
}

/** The investing roadmap in six phases and three routes, with the next step open. */
export function FirstDealRoadmap() {
  const [done, setDone] = useState<string[]>(roadmapDone);
  const [status, setStatusMap] = useState<Record<string, StepStatus>>(() => read(STATUS_KEY, {}, cleanStatus));
  const [path, setPath] = useState<RoadmapPath>(() => planPath());
  const [mine] = useMyState();
  const [deals, setDeals] = useState(loadAnalyzed);
  // The property in focus: the one chosen here or at the top of My plan, else the one you worked on last.
  const [dealId, setDealId] = useState(() => focusDealId());
  const [perDeal, setPerDeal] = useState<DealSteps>(() => read(DEAL_STEPS_KEY, {}, cleanDealSteps));
  // Saved when you change something (not on every visit), then every "next step" on the site is told.
  const save = (key: string, v: unknown) => {
    write(key, v);
    progressChanged();
  };
  // Redraw when your goal, cash, buy box or team changes elsewhere on the page, and follow the property and its
  // stage when they're changed at the top of My plan.
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    const reload = () => {
      setDone(roadmapDone());
      setStatusMap(read(STATUS_KEY, {}, cleanStatus));
      setPath(planPath());
      setDeals(loadAnalyzed());
      setDealId(focusDealId());
      setPerDeal(read(DEAL_STEPS_KEY, {}, cleanDealSteps));
    };
    window.addEventListener(PLAN_CHANGED, on);
    window.addEventListener(PLAN_EVENT, on);
    window.addEventListener(PROGRESS_EVENT, reload);
    return () => {
      window.removeEventListener(PLAN_CHANGED, on);
      window.removeEventListener(PLAN_EVENT, on);
      window.removeEventListener(PROGRESS_EVENT, reload);
    };
  }, []);
  const active = deals.find((d) => `analyzed:${d.id}` === dealId);
  const deal = active ? { id: `analyzed:${active.id}`, name: active.name, kind: active.kind } : undefined;
  const stage = active ? stageOf(active) : undefined;
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
  // With a property chosen, the next step follows its stage: a candidate you're researching gets the "find and check"
  // steps, and the offer, deposit and inspection steps only come once it's at that stage.
  const stageNext = stage ? steps.find((s) => STAGE_STEPS[stage].includes(s.id) && !settled(s) && statusOf(s) !== 'stopped') : undefined;
  // After walking away, the step you stopped at stays the next step (start it again with the next property),
  // rather than the later steps of a deal you left.
  const next = walked ?? stageNext ?? steps.find((s) => !settled(s) && statusOf(s) !== 'stopped' && (!stage || !dealScoped(s) || DEAL_STAGES.indexOf(stageOfStep(s.id) ?? 'researching') <= DEAL_STAGES.indexOf(stage)));
  // A step that belongs to a later stage of the property in focus.
  const later = (s: RoadmapStep) => {
    const st = stageOfStep(s.id);
    return !!stage && stage !== 'passed' && !!st && dealScoped(s) && DEAL_STAGES.indexOf(st) > DEAL_STAGES.indexOf(stage) ? st : undefined;
  };
  // The phase holding the next step starts open; after that, phases stay as the reader leaves them.
  const [openPhase, setOpenPhase] = useState(() => next?.phase ?? 1);
  useEffect(() => { setOpenPhase(next?.phase ?? 1); }, [deal?.id, stage]);
  const phases = ([1, 2, 3, 4, 5, 6, 7] as const).map((n) => ({ n, title: ROADMAP_PHASES[n], steps: steps.filter((s) => s.phase === n) })).filter((ph) => ph.steps.length);
  const nextDone = (d: string[], id: string, v: StepStatus | 'done' | 'todo') => (v === 'done' ? (d.includes(id) ? d : [...d, id]) : d.filter((x) => x !== id));
  const nextStatus = (m: Record<string, StepStatus>, id: string, v: StepStatus | 'done' | 'todo') => {
    const n = { ...m };
    if (v === 'done' || v === 'todo') delete n[id];
    else n[id] = v;
    return n;
  };
  // `learner`: your own progress, even with a property in focus (the practice-time task shown above the roadmap).
  const setStatus = (s: RoadmapStep, v: StepStatus | 'done' | 'todo', learner = false) => {
    if (scoped(s) && !learner) {
      const k = deal!.id;
      const cur = perDeal[k] ?? { done: [], status: {} };
      const all = { ...perDeal, [k]: { done: nextDone(cur.done, s.id, v), status: nextStatus(cur.status, s.id, v) } };
      setPerDeal(all);
      save(DEAL_STEPS_KEY, all);
      return;
    }
    const d = nextDone(done, s.id, v);
    const m = nextStatus(status, s.id, v);
    setDone(d);
    setStatusMap(m);
    write(ROADMAP_KEY, d);
    save(STATUS_KEY, m);
  };
  const choosePath = (k: RoadmapPath) => {
    setPath(k);
    save(ROADMAP_PATH_KEY, k);
  };
  const learnerNext = deal && planNow().source === 'roadmap' ? roadmapNextStep() : null;
  return (
    <section id="roadmap" aria-labelledby="roadmap-head">
      <h2 id="roadmap-head">Your investing roadmap</h2>
      <p>Start with your next step above. Open a phase below to see its checklist, then open a task for instructions. Mark it done when you have the result described—not just when you have read the page.</p>
      <p className="muted">The steps depend on how you buy. Confirm the current sale rules, contract terms and local requirements with the official seller and appropriate professionals.</p>
      <div className="roadmap-path" role="group" aria-label="How you’ll buy">
        <span className="roadmap-path-label">How you’ll buy:</span>
        {/* Lien certificates are sold only in Arizona (tax liens) and Nevada (SID liens): other states don't see the route. */}
        {(Object.keys(ROADMAP_PATHS) as RoadmapPath[]).filter((k) => k !== 'certificate' || path === k || liensSoldIn(mine)).map((k) => (
          <button key={k} type="button" aria-pressed={path === k} onClick={() => choosePath(k)}>{ROADMAP_PATHS[k].label}</button>
        ))}
        <span className="muted">{dropStateLead(forStateText(getMyState(), ROADMAP_PATHS[path].hint), getMyState())}</span>
      </div>
      {/* After a switch to a state that doesn't sell lien certificates, the route says so and offers the auction route. */}
      {path === 'certificate' && mine && !liensSoldIn(mine) && !(active && active.kind === 'lien' && liensSoldIn(active.state)) && (
        <p className="notice" role="status">Lien certificates are sold in Arizona and Nevada, not {STATES.find((x) => x.code === mine)?.name ?? mine}.{' '}
          <button type="button" className="linkish" onClick={() => { choosePath('auction'); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.roadmap-path button[aria-pressed="true"]')?.focus()); }}>Switch to buying at an auction</button>
        </p>
      )}
      <div className="roadmap-deal">
        <label className="field">
          <span>Which property are you working on?</span>
          <select
            value={deal ? deal.id : ''}
            onChange={(e) => {
              setDealId(e.target.value);
              write(DEAL_KEY, e.target.value || NO_DEAL);
              // The route follows the property's kind of sale, so its steps fit it.
              const d = deals.find((x) => `analyzed:${x.id}` === e.target.value);
              if (d) {
                setPath(pathForDeal(d));
                write(ROADMAP_PATH_KEY, pathForDeal(d));
              }
              progressChanged();
            }}
          >
            <option value="">None yet (learning)</option>
            {deals.map((d) => <option key={d.id} value={`analyzed:${d.id}`}>{d.name}{d.practice ? " (practice)" : ""}</option>)}
          </select>
        </label>
        <p className="muted">
          {deal
            ? `Phases 4 to 7 (find, buy, own, then sell, refinance or trade) are tracked for ${deal.name} only, and what you record goes into its evidence log. Phases 1 to 3 are yours, whatever the property.`
            : deals.length
              ? 'Choose a property to track phases 4 to 7 (find, buy, own and sell) for it. Each property keeps its own progress and evidence.'
              : 'To track phases 4 to 7 (find, buy, own and sell) for a real property, save it in Analyze first. Each property keeps its own progress and evidence.'}
        </p>
      </div>
      {active && stage && (
        <p className="roadmap-stage-note">
          <strong>{active.name}: {stageLabel(stage, active)}.</strong>{' '}
          {stage === 'passed'
            ? 'You walked away from it, so none of its tasks are next. Choose another property, or find the next one.'
            : 'The next task at the top of My plan follows that stage; tasks for later stages are marked and wait until you get there. Change the stage at the top of My plan.'}
        </p>
      )}
      <p className="decide-progress">
        {count} of {steps.length} roadmap tasks done{naCount > 0 && ` (${naCount} marked “doesn’t apply”)`}
        <span className="decide-bar" role="progressbar" aria-label="Investing roadmap" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={count}><span style={{ width: `${Math.round((count / steps.length) * 100)}%` }} /></span>
      </p>
      {walked && (
        <p className="roadmap-walked" role="status">
          You stopped at “{walked.title}”. Walking away from a deal that doesn’t fit is a good result. When you find the next one, set that task back to “Working on it”.
        </p>
      )}
      {!deal && planNow().source === 'roadmap' && next ? (
        <div>
          <div className="roadmap-next" id="roadmap-next">
            <p className="roadmap-next-label">Next task · {stepContext(next)}{scoped(next) ? ` · ${deal!.name}` : ''}</p>
            <h3>{next.title}</h3>
            <StepBody s={next} status={stateOf(next)} setStatus={(v) => setStatus(next, v)} deal={deal} />
          </div>
        </div>
      ) : deal && learnerNext ? (
        // Practice analyses saved, but the plan is still on your own task (paper practice, finding a sale): show it here.
        <div className="roadmap-next" id="roadmap-next">
          <p className="roadmap-next-label">Next task · {stepContext(learnerNext)}</p>
          <h3>{learnerNext.title}</h3>
          <StepBody s={learnerNext} status={done.includes(learnerNext.id) ? 'done' : status[learnerNext.id] ?? 'todo'} setStatus={(v) => setStatus(learnerNext, v, true)} />
        </div>
      ) : (
        <p className="next-step" role="status">Use the task details below to record each milestone{stage === 'contract' ? '; contract tasks may run at the same time' : ''}.</p>
      )}
      <h3 className="roadmap-all-head">All tasks</h3>
      {phases.map((ph) => {
        const phDone = ph.steps.filter(settled).length;
        return (
          <details key={ph.n} className="roadmap-phase" name="roadmap-phases" open={openPhase === ph.n}>
            <summary>
              <span className="roadmap-phase-title">Phase {ph.n}: {ph.title}</span>
              <span className="muted">{phDone === ph.steps.length ? '✓ All done' : `${phDone} of ${ph.steps.length} done`}</span>
            </summary>
            <p className="roadmap-phase-help">{ROADMAP_PHASE_HELP[ph.n]}</p>
            <div className="roadmap-steps">
              {ph.steps.map((s) => {
                const st = stateOf(s);
                const wait = st === 'todo' ? later(s) : undefined;
                return (
                  <details key={s.id} name="roadmap-tasks" className={`roadmap-step ${st}`}>
                    <summary>
                      <span className="roadmap-step-title">{s.title}{wait && active && <span className="roadmap-later"> · Later stage: {stageLabel(wait, active)}</span>}</span>
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
  useEffect(() => {
    write(CASH_KEY, c);
    planChanged();
  }, [c]);
  const fund = c.spending * c.months;
  const investable = Math.max(0, c.savings - fund - c.promised - c.debt);
  const field = (k: keyof Cash, label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <NumInput blank value={c[k] || undefined} placeholder="0" onValue={(v) => setC((x) => ({ ...x, [k]: v ?? 0 }))} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  return (
    <section id="cash" aria-labelledby="cash-head">
      <h2 id="cash-head">Your investable cash</h2>
      <p>Start with money you could use, then subtract what you want to protect for emergencies, other goals and debt payments. This is a planning worksheet, not a loan approval. Numbers stay in this browser.</p>
      <div className="deal-fields cash-fields">
        {field('savings', 'Savings and investments you could sell')}
        {field('spending', 'Household spending each month')}
        {field('months', 'Emergency fund (months of spending)', 'A planning choice: many people keep 3 to 6 months or more.')}
        {field('promised', 'Set aside for other goals this year')}
        {field('debt', 'Money set aside to repay high-interest debt', 'Enter the amount you plan to protect for debt payments. Consider interest costs and your other needs.')}
      </div>
      <dl className="cash-result">
        <div><dt>Emergency fund</dt><dd>{fmtMoney(fund)}</dd></div>
        <div className="cash-main"><dt>What you can invest</dt><dd>{fmtMoney(investable)}</dd></div>
      </dl>
      {c.savings > 0 && investable === 0 && <p className="roadmap-stop"><strong>Not yet.</strong> Your choices leave no cash for a deal in this worksheet. Review your savings, emergency fund and debt plan. You can keep learning and practicing while you prepare.</p>}
      {investable > 0 && <PriceFromCash cash={investable} />}
    </section>
  );
}

/** What price your investable cash can support with a loan: down payment, closing costs and the lender's reserves. */
/** Open the buy box (and any closed section around it), bring it into view and put focus on its first field. */
function showBuyBox() {
  const el = document.getElementById('buy-box');
  if (!el) return;
  for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true;
  setTimeout(() => {
    el.scrollIntoView({ block: 'start' });
    el.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
  }, 0);
}

const ESTIMATES_KEY = 'deedowl.cash.estimates.v1';

function PriceFromCash({ cash }: { cash: number }) {
  // Starts from the estimates you last changed here, else those saved with the buy box, else ours. A change is kept
  // at once (a live-in buyer's 3.5% down shouldn't go back to 25% on the next visit).
  const [a, setA0] = useState<PriceAssumptions>(() => read(ESTIMATES_KEY, null, cleanAssumptions) ?? read(BUYBOX_KEY, EMPTY_BUY_BOX, cleanBuyBox).priceAssumptions ?? PRICE_DEFAULTS);
  const setA = (f: (x: PriceAssumptions) => PriceAssumptions) => setA0((x) => { const n = f(x); write(ESTIMATES_KEY, n); return n; });
  const price = priceForCash(cash, a);
  const c = cashForPrice(Number.isFinite(price) ? price : 0, a);
  const num = (k: keyof PriceAssumptions, label: string, unit: string) => (
    <label className="field">
      <span>{label} ({unit})</span>
      <NumInput percent max={100} value={a[k]} onValue={(n) => setA((x) => ({ ...x, [k]: n ?? 0 }))} />
    </label>
  );
  const useIt = () => {
    const b = read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox);
    // The assumptions go with the price, so the buy box checks it the same way instead of with our defaults.
    write(BUYBOX_KEY, { ...b, priceMax: price, cashMax: Math.round(cash), priceAssumptions: a });
    window.dispatchEvent(new CustomEvent(PLAN_EVENT));
    showBuyBox();
  };
  // Paying cash (Decide: cash only), or buying at an auction or a lien sale (no loan at the sale): the cash is the limit
  // for the price and everything else, so no loan-sized price. The route is the one the roadmap shows (planPath), and
  // follows a change to it at once.
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener(PROGRESS_EVENT, on);
    return () => window.removeEventListener(PROGRESS_EVENT, on);
  }, []);
  const route = planPath();
  const atSale = route === 'auction' || route === 'certificate';
  const payingCash = atSale || investorProfile().loan === 'cash';
  const [savedNote, setSavedNote] = useState('');
  const useCash = () => {
    const b = read(BUYBOX_KEY, { ...EMPTY_BUY_BOX, state: getMyState() ?? '' }, cleanBuyBox);
    // Only the cash limit changes. A price limit already there stays (it may be yours): say when it's more than the cash.
    write(BUYBOX_KEY, { ...b, cashMax: Math.round(cash) });
    window.dispatchEvent(new CustomEvent(PLAN_EVENT));
    setSavedNote(`Saved: ${fmtMoney(Math.round(cash))} as the cash limit in your buy box.${b.priceMax > cash ? ` Its ${b.strategy === LIEN_STRATEGY ? '“Most for one certificate”' : 'price limit'} is still ${fmtMoney(b.priceMax)}, more than this cash: lower it if it no longer fits.` : ''}`);
  };
  if (payingCash) return (
    <div className="price-from-cash">
      <h3>What your investable cash covers</h3>
      <p>
        {route === 'certificate'
          ? <>Buying lien certificates, your {fmtMoney(cash)} is the most you’d tie up: the certificate prices and fees, paid by the county’s deadline, plus any later taxes you pay to protect them. A certificate can take years to pay off, or not pay at all.</>
          : <>Paying cash, your {fmtMoney(cash)} is your limit for the price plus closing costs, repairs and reserves{atSale ? '. An auction wants the full amount by its payment deadline, with no loan at the sale' : ''}. Leave room for repairs and holding costs, so the price itself is less than {fmtMoney(cash)}.</>}
      </p>
      <p className="muted" role="note">A planning limit, not advice. What you tie up in one deal depends on your situation, finances and risk tolerance.</p>
      <button type="button" className="btn btn-secondary" onClick={useCash}>Use {fmtMoney(Math.round(cash))} as the cash limit in my buy box</button>
      {savedNote && <p className="muted small" role="status">{savedNote}</p>}
    </div>
  );
  return (
    <div className="price-from-cash">
      <h3>What price your investable cash supports</h3>
      {Number.isFinite(price) ? (
        <p>
          With {a.downPct}% down, closing costs of about {a.closingPct}% and {a.reserveMonths} months of payments kept in reserve, your {fmtMoney(cash)} supports a price up to about <strong>{fmtMoney(price)}</strong>:
          {' '}{fmtMoney(Math.round(c.down))} down, {fmtMoney(Math.round(c.closing))} closing costs and {fmtMoney(Math.round(c.reserves))} in reserve (about {fmtMoney(Math.round(c.monthly))} a month in loan, tax and insurance). Repairs come out of the same cash, so leave room for them.{investorProfile().ownerOccupant && a.downPct >= 20 ? ` ${a.downPct}% down is common for an investment; a home you’ll live in can need less, so replace it below with your lender’s figure.` : ''}
        </p>
      ) : (
        <p>With no down payment, closing costs or reserves, these assumptions don’t limit the price. Enter what your lender expects below to see a price.</p>
      )}
      <details>
        <summary>Change the planning estimates</summary>
        <div className="deal-fields">
          {num('downPct', 'Down payment', '% of price')}
          {num('closingPct', 'Closing costs', '% of price')}
          {num('reserveMonths', 'Reserves', 'months of payments')}
          {num('ratePct', 'Loan rate', '% a year')}
          {num('taxInsPct', 'Property tax and insurance', '% of price a year')}
        </div>
        {(() => {
          // The area's own property tax rate, so the estimate can match it (Texas rates are often 2% or more alone).
          const area = getMyArea();
          const line = area?.county ? countyTaxLine(area.state, area.county) : null;
          return line ? <p className="muted small">Property tax alone, {line.short.replace(/\.$/, '')}; add insurance to it for this estimate.{area && (area.state === 'NV' || area.state === 'AZ') ? ' That rate is on the county’s value, which is often below the price.' : ''}</p> : null;
        })()}
        <p className="muted small">These are starting estimates, not loan requirements or an affordability decision. Down payment, interest rate and money kept in reserve depend on the loan and your situation. Confirm financing with your lender, and costs with the relevant providers.</p>
      </details>
      <p className="muted" role="note">Cash-budget estimate—not loan approval or proof you can afford the monthly costs. Check ongoing expenses, repairs and your lender’s requirements before using it as a price limit.</p>
      {Number.isFinite(price) && <button type="button" className="btn btn-secondary" onClick={useIt}>Use {fmtMoney(price)} in my buy box</button>}
    </div>
  );
}

/** The buy-box strategy as the end of the summary sentence ("…, to fix and flip"). */
function strategyPhrase(st: string): string {
  if (st === 'Bank-owned and government homes') return ', to buy bank-owned and government homes';
  if (st === 'Tax and foreclosure auctions') return ', to buy at tax and foreclosure auctions';
  if (st === 'Still deciding') return ', strategy still to be decided';
  return `, to ${st.charAt(0).toLowerCase()}${st.slice(1)}`;
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

/** Whether lien certificates are sold in a state: Arizona tax liens and Nevada SID liens (and every state shows them with none chosen). */
const liensSoldIn = (st: string | null | undefined) => !st || st === 'AZ' || st === 'NV';

function BuyBoxBuilder() {
  const [mine] = useMyState();
  const [switched, setSwitched] = useState('');
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
  // The cash check uses the assumptions saved with a price from the cash worksheet, else our usual ones.
  const pa = b.priceAssumptions ?? PRICE_DEFAULTS;
  const toggle = (k: 'types' | 'dealBreakers', v: string) => set(k, b[k].includes(v) ? b[k].filter((x) => x !== v) : [...b[k], v]);
  const money = (k: 'priceMax' | 'repairsMax' | 'cashMax' | 'minCashFlow', label: string, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <NumInput blank value={b[k]} onValue={(n) => set(k, n ?? 0)} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
  const state = STATES.find((s) => s.code === b.state);
  const lien = b.strategy === LIEN_STRATEGY;
  // Lien certificates only where they're sold (Arizona and Nevada), unless already chosen.
  const strategies = STRATEGY_OPTIONS.filter((s) => s !== LIEN_STRATEGY || lien || liensSoldIn(b.state || mine));
  return (
    <section id="buy-box" aria-labelledby="buybox-head">
      <h2 id="buybox-head">Your buy box: what you’re looking for</h2>
      <p>Write down your target area, property type, budget and limits. Investors call this a “buy box.” Use it to decide which properties deserve a closer look; it does not prove a property is a good deal.</p>
      {/* After a state switch, the buy box still names the old state: say so, and offer to move it. */}
      {mine && b.state && b.state !== mine && (
        <p className="notice" role="status">Your buy box is for {STATES.find((x) => x.code === b.state)?.name ?? b.state}, but you’ve chosen {STATES.find((x) => x.code === mine)?.name ?? mine}.{' '}
          <button type="button" className="linkish" onClick={() => { setSwitched(b.area ? `Switched to ${STATES.find((x) => x.code === mine)?.name ?? mine}. Your area (${b.area}) was cleared: add one there.` : `Switched to ${STATES.find((x) => x.code === mine)?.name ?? mine}.`); setB({ ...b, state: mine, area: '' }); }}>Switch it to {STATES.find((x) => x.code === mine)?.name ?? mine}</button>
        </p>
      )}
      {switched && <p className="notice" role="status">{switched}</p>}
      <p className="buybox-help">Not sure of your numbers yet? That’s normal. Leave a field blank, start from an example, or work them out with <a href="#/decide">Decide</a> (your goal and budget) and <a href="#/analyze">Analyze a deal</a> (what a property costs).{' '}
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
        {(() => {
          // Your area (from the county step or the header), offered when this is still empty, for the same state.
          const my = getMyArea();
          const cn = my?.county ? countyName(my.county) : '';
          const words = my?.county && (!b.state || b.state === my.state) ? (my.city && my.city !== cn ? `${my.city}, ${cn}` : cn) : '';
          return !b.area.trim() && words ? <button type="button" className="linkish small" onClick={() => { set('area', words); if (!b.state) set('state', my!.state); }}>Use my area ({words})</button> : null;
        })()}
        <label className="field">
          <span>Strategy</span>
          <select value={b.strategy} onChange={(e) => set('strategy', e.target.value)}>
            <option value="">Choose</option>
            {strategies.map((s) => <option key={s}>{s}</option>)}
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
            {money('priceMax', 'Highest price ($)', 'Use your own budget and financing information. Pre-approval does not guarantee a loan or show what you can comfortably afford.')}
            {money('repairsMax', 'Most repairs you’ll take on ($)', 'New investors often start with cosmetic work only.')}
            {money('cashMax', 'Cash you can put in, all in ($)', 'Down payment, closing costs, repairs and reserves.')}
            {money('minCashFlow', 'Minimum monthly cash left from a rental ($)', 'Your cash-flow target after operating costs, loan payments and planned reserves, before income tax.')}
          </>
        )}
      </div>
      {lien && <p className="muted">A lien certificate isn’t the property: there’s no rent and nothing to repair. Your buy box is the parcels you’ll bid on, what you’ll pay, and how long your money can wait. Property types and deal breakers below describe the land behind each lien.</p>}
      {!b.strategy && suggested && <p className="roadmap-has">Decide suggested: <strong>{suggested}</strong>. <button type="button" className="linkish" onClick={() => set('strategy', suggested)}>Use it</button></p>}
      {!lien && b.priceMax > 0 && b.cashMax > 0 && cashForPrice(b.priceMax, pa).total > b.cashMax && (
        <p className="caution" role="status">
          <strong>Your price limit needs more cash than you have.</strong> At {fmtMoney(b.priceMax)}, {pa.downPct}% down, about {pa.closingPct}% closing costs and {pa.reserveMonths} months of reserves take about {fmtMoney(Math.round(cashForPrice(b.priceMax, pa).total))}, more than your {fmtMoney(b.cashMax)}. Lower the price, or check a lower down payment with your lender.
        </p>
      )}
      {(() => {
        // The cash limit here was set before My plan's investable cash went down: offer the current figure.
        const now = Math.round(investorProfile().investable);
        return b.cashMax > 0 && now > 0 && b.cashMax > now ? (
          <p className="note" role="status">Your cash limit here, {fmtMoney(b.cashMax)}, is more than the {fmtMoney(now)} of investable cash My plan shows now. <button type="button" className="linkish" onClick={() => set('cashMax', now)}>Use {fmtMoney(now)}</button></p>
        ) : null;
      })()}
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
          {b.beds && !lien ? ` (${b.beds})` : ''}
          {b.area ? ` in ${b.area}${state ? `, ${state.name}` : ''}` : state ? `, anywhere in ${state.name}` : ' in any area'}
          {b.strategy && !lien ? strategyPhrase(b.strategy) : ''}.
          {b.priceMax ? (lien ? ` Up to ${fmtMoney(b.priceMax)} for one certificate.` : ` Price up to ${fmtMoney(b.priceMax)}.`) : ''}
          {b.repairsMax && !lien ? ` Repairs up to ${fmtMoney(b.repairsMax)}.` : ''}
          {b.cashMax ? ` No more than ${fmtMoney(b.cashMax)} of my cash in it.` : ''}
          {b.minCashFlow && !lien ? ` At least ${fmtMoney(b.minCashFlow)} a month of cash flow.` : ''}
        </p>
        {b.dealBreakers.length > 0 && <p><strong>I walk away if:</strong> {b.dealBreakers.map((d) => (/^[A-Z][a-z]/.test(d) ? d.charAt(0).toLowerCase() + d.slice(1) : d)).join('; ')}.</p>}
        <div className="decide-nav">
          <button type="button" className="btn btn-secondary" onClick={() => printWith('print-buybox')}>Print</button>
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

/** Required credentials depend on the service and location; qualifications do not replace a required license. */
function licenseCheckLabel(k: keyof TeamList, state: string | null): string {
  if (k === 'inspector') return state === 'CA'
    ? 'I checked their insurance, training and a sample report (California doesn’t license home inspectors)'
    : 'I checked any required inspector license or registration, insurance, training and a sample report';
  if (k === 'lender') return 'I looked them up on NMLS Consumer Access (a state license, or a bank loan officer’s federal registration)';
  if (k === 'attorney') return 'I checked their license with the state bar';
  if (k === 'contractor') return state === 'TX'
    ? 'I checked required trade licenses, local registration and insurance (Texas has no statewide general contractor license)'
    : 'I checked required contractor or trade licenses, local registration and insurance for this work';
  if (k === 'private_lender') return 'I checked which licenses or registrations apply to this lender and loan, and verified any claimed exemption with the regulator';
  if (k === 'title') return 'I checked the required title or escrow license or registration with the appropriate regulator';
  if (k === 'cpa') return 'I checked their claimed tax credentials (CPA, enrolled agent or attorney), any required registration, and experience with my tax situation';
  if (k === 'eviction') return 'I checked the state bar license for legal advice or representation, and any required credentials for other eviction services';
  if (k === 'environmental') return 'I checked qualifications and insurance for the assessment, plus any licenses or certifications required for the specific work';
  return 'I checked the licenses or registrations required for their services, their qualifications and insurance';
}

/** The people you'll call, with what to say to each: kept, printed and downloaded with your plan. */
function TeamListSection() {
  const [myState] = useMyState();
  const [t, setT] = useState<TeamList>(() => read(TEAM_LIST_KEY, {}, cleanTeamList));
  useEffect(() => {
    write(TEAM_LIST_KEY, t);
    planChanged();
  }, [t]);
  const set = (k: keyof TeamList, patch: Partial<TeamMember>) => setT((x) => ({ ...x, [k]: { name: '', contact: '', licenseChecked: false, fees: '', ...x[k], ...patch } }));
  return (
    <section id="team" aria-labelledby="team-head">
      <h2 id="team-head">Your team</h2>
      <p>You may not need every role listed. Add the people your purchase needs and what they charge. Check any licenses or registrations required for their work and location. Where no license is required, check qualifications, experience and insurance. Experience does not replace a required license.</p>
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
              <label className="check"><input type="checkbox" checked={!!m?.licenseChecked} onChange={(e) => set(k, { licenseChecked: e.target.checked })} /> {licenseCheckLabel(k, myState)}</label>
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
  const now = planNow();
  const lines = ['MY INVESTING PLAN', 'DeedOwl educational worksheet.', '', 'GOAL', read(GOAL_KEY, '', cleanGoal) || '(not written yet)', '', `NEXT STEP (${now.context})`, `${now.task.label}. You’ll have ${now.task.produces}.`, '', 'CASH'];
  const pa = b.priceAssumptions ?? PRICE_DEFAULTS;
  const supports = priceForCash(cash, pa);
  lines.push(cash > 0 ? `Investable cash: ${fmtMoney(cash)}. With ${pa.downPct}% down, ${pa.closingPct}% closing costs and ${pa.reserveMonths} months of reserves, it supports ${Number.isFinite(supports) ? `a price up to about ${fmtMoney(supports)}` : 'any price (these assumptions set no limit)'}.` : '(not worked out yet)');
  lines.push('', buyBoxText(b, STATES.find((x) => x.code === b.state)?.name), '', `ROADMAP: ${ROADMAP_PATHS[path].label}`);
  for (const s of steps) lines.push(`[${done.includes(s.id) ? 'x' : status[s.id] === 'na' ? '-' : ' '}] ${ROADMAP_PHASES[s.phase]}: ${s.title}${status[s.id] && !done.includes(s.id) ? ` (${STEP_STATUS_LABEL[status[s.id]]})` : ''}`);
  lines.push('', 'TEAM');
  for (const k of TEAM_ROLES) {
    const m = team[k];
    const g = proGuideByKey(k);
    lines.push(`${g?.title ?? k}: ${m?.name || '(not chosen yet)'}${m?.contact ? `, ${m.contact}` : ''}${m?.licenseChecked ? ', credentials checked' : ''}${m?.fees ? `. Fees: ${m.fees}` : ''}`);
    if (PRO_SCRIPTS[k]) lines.push(`  What to say: ${PRO_SCRIPTS[k].say}`);
  }
  return lines.join('\n');
}

function Worksheets() {
  const [myState] = useMyState();
  return (
    <section id="worksheets" aria-labelledby="worksheets-head">
      <h2 id="worksheets-head">Worksheets to download</h2>
      <p>Plain-text files you can print, fill in on paper, or keep with your deal notes.</p>
      <ul className="lesson-links ref-grid">
        {WORKSHEETS.map((w) => (
          <li key={w.key}>
            <button type="button" className="linkish" onClick={() => downloadText(fileName(w.title, 'txt'), worksheetText(w))}>{w.title}&nbsp;↓</button>
            <span className="muted">{dropStateLead(forStateText(myState, w.intro), myState)}</span>
          </li>
        ))}
        <li>
          <button type="button" className="linkish" onClick={() => downloadText('evidence-log.txt', logText('(property)', cleanLog({})))}>Evidence log&nbsp;↓</button>
          <span className="muted">For each thing you verify: the source, the date, what you found, what’s still open, and who handles it by when. Saved deals have one built in, under My deals.</span>
        </li>
      </ul>
    </section>
  );
}

/** Prints with a body class on, so a print rule can show one part of the page (the buy box's own Print button). */
function printWith(cls: string) {
  document.body.classList.add(cls);
  const done = () => {
    document.body.classList.remove(cls);
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}

function ProgressBackup() {
  const account = useAccount();
  const [msg, setMsg] = useState('');
  // Guests get their download back into a browser here; nothing is uploaded. Signed in, the account holds the work.
  const onFile = async (input: HTMLInputElement) => {
    const f = input.files?.[0];
    input.value = ''; // so choosing the same file again still works
    if (!f) return;
    if (f.size > 4_000_000) return setMsg('That file is too large to be a DeedOwl progress file.');
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
    if (!window.confirm(`Replace your progress in this browser with this file${when} (${count} item${count === 1 ? '' : 's'})? Items in the file replace what’s here now.`)) return setMsg('Nothing was changed.');
    const n = restoreBackup(r.data);
    setMsg(`Restored ${n} item${n === 1 ? '' : 's'}. Reloading…`);
    setTimeout(() => window.location.reload(), 800);
  };
  return (
    <section id="backup" aria-labelledby="backup-head">
      <h2 id="backup-head">Download your progress</h2>
      <p>{account.account ? 'This downloads the work in your account workspace, including notes and written answers from this visit that are not saved to your account.' : 'Without an account, your work stays in this browser. Download a copy to read or keep for your records.'} Keep the file private: it may contain notes you entered.{account.account ? '' : ' To bring it back, load it here on the same or another device; nothing is sent anywhere.'}</p>
      <div className="decide-nav">
        <button type="button" className="btn" onClick={() => downloadText(`deedowl-progress-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup()), 'application/json')}>Download my progress</button>
        {!account.account && (
          <label className="btn btn-secondary file-btn">
            Load a progress file
            <input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target)} />
          </label>
        )}
        <a className="btn btn-secondary" href="#/account">Optional account saving</a>
      </div>
      <p role="status" aria-live="polite">{msg}</p>
    </section>
  );
}

/** Everything free in one place: the first-deal roadmap, a buy box, and the calculators and checklists. */
export default function ToolkitPage({ section }: { section?: string }) {
  useEffect(() => syncRoadmapCredits(), []);
  useLastActivity('#/toolkit', 'My plan');
  useEffect(() => {
    if (!section) return;
    const target = document.getElementById(section);
    for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    target?.scrollIntoView();
  }, [section]);
  return (
    <main className="page toolkit">
      <PageHero
        title={<>My <span className="grad">plan</span></>}
        sub="Build your investing plan one step at a time. Start with the next task, then open the checklist or tools when you need more help."
      />
      {/* One panel: your goal, the next task, what it gives you and one Continue; for a saved property, its stage
          (which picks the task); the roadmap or evidence summary alongside; and the optional helper. */}
      <PlanNext variant="plan" helper={<NarrowDown config={toolkitConfig((() => { const t = planNow().task; return { label: t.label, href: t.href }; })())} intro="Tell us where you are in the process and we’ll suggest where to start." />} />
      <details className="plan-section" open={section === 'roadmap'}><summary>See my full roadmap</summary><FirstDealRoadmap /></details>
      <details className="plan-section"><summary>Your investable cash</summary><CashWorksheet /></details>
      <details className="plan-section"><summary>Your buy box</summary><BuyBoxBuilder /></details>
      <details className="plan-section"><summary>Your team and contacts</summary><TeamListSection /></details>
      <section className="plan-download" aria-labelledby="plan-dl-head">
        <h2 id="plan-dl-head">Print or share your plan</h2>
        <p>Download a summary of your goal, budget, property preferences, checklist progress and contacts. You can keep it or share it with your agent or lender. Optional account saving keeps supported property work and learning progress across devices. This summary is for reading and sharing; it can’t be loaded back. To move your work to another browser, use Download my progress below.</p>
        <div className="decide-nav">
          <button type="button" className="btn" onClick={() => downloadText('my-investing-plan.txt', planText())}>Download my plan</button>
          <button type="button" className="btn btn-secondary" onClick={() => { document.querySelectorAll<HTMLDetailsElement>('.toolkit details.plan-section').forEach((d) => { d.open = true; }); window.print(); }}>Print this page</button>
        </div>
      </section>
      <details className="plan-section"><summary id="reference-head">Worksheets, paperwork and tools</summary>
      <Worksheets />
      <section id="paperwork" aria-labelledby="paperwork-head">
        <h2 id="paperwork-head">Read the paperwork</h2>
        <p>Open a document guide when you need it. Each guide explains who provides the document, what to check, and which parts you or a professional prepare.</p>
        {DOC_GUIDES.map((g) => <DocGuideView key={g.key} g={g} label={g.title} />)}
      </section>
      {TOOLKIT.map((g) => (
        <section key={g.group} id={`tools-${g.group.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
          <h2>{g.group}</h2>
          <ul className="lesson-links ref-grid">
            {g.items.map((x) => (
              <li key={x.label}>
                <a href={x.href}>{x.label}&nbsp;→</a>
                <span className="muted">{x.what}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      </details>
      <ProgressBackup />
    </main>
  );
}
