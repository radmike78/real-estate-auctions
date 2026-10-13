import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useState, type ReactNode } from 'react';
import '../styles/r8-plan.css';
import { DEAL_STAGES, loadDeals, openDeal, type DealStage } from '../lib/analyze';
import { setDealStage, wayOf, stageHint, stageLabel, type PlanTask } from '../lib/dealStage';
import { EVIDENCE_AREAS, EVIDENCE_EVENT, loadLog } from '../lib/evidence';
import { PLAN_EVENT } from '../lib/myPlan';
import { OWNED_EVENT } from '../lib/owned';
import { planNow, planStarted, ROADMAP_TASK_HREF } from '../lib/planNext';
import { ROADMAP_PHASES, roadmapFor } from '../lib/roadmap';
import { DEAL_KEY } from '../lib/roadmapDeals';
import { NO_DEAL, pathForDeal, planPath, PROGRESS_EVENT, progressChanged, ROADMAP_PATH_KEY, roadmapProgress, settledFor, focusDealId } from '../lib/roadmapState';

const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode: not kept */
  }
};

/** Re-render when anything the next step depends on changes, here or in another tab. */
function usePlanTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    const events = [PROGRESS_EVENT, PLAN_EVENT, EVIDENCE_EVENT, OWNED_EVENT, 'deedowl:journey', 'deedowl:practice-deal', 'storage'];
    events.forEach((e) => window.addEventListener(e, on));
    return () => events.forEach((e) => window.removeEventListener(e, on));
  }, []);
}

/** The Continue button: opens where the task is done, or moves the deal on when that's the task. */
/** The plan's one Continue: it opens the task's deal or moves its stage when the task says so. `label` replaces the plain wording (the home page names the task). */
export function ContinueButton({ task, dealId, onPlan, label }: { task: PlanTask; dealId?: string; onPlan: boolean; label?: string }) {
  if (task.setStage && dealId)
    return <button type="button" className="btn big" onClick={() => setDealStage(dealId, task.setStage!)}>{label ?? 'Continue: move it on'}&nbsp;→</button>;
  if (task.openDeal && dealId) {
    const d = loadDeals().find((x) => x.id === dealId);
    if (d) return <a className="btn big" href="#/analyze" onClick={(e) => { e.preventDefault(); openDeal(d); }}>{label ?? 'Continue'}&nbsp;→</a>;
  }
  // On My plan, a roadmap task is further down this page: the link scrolls there.
  const href = task.href === ROADMAP_TASK_HREF && !onPlan ? '#/toolkit/roadmap' : task.href;
  return <a className="btn big" href={href}>{label ?? 'Continue'}{task.href === ROADMAP_TASK_HREF && onPlan ? '\u00a0↓' : '\u00a0→'}</a>;
}

/**
 * The top of My plan, and its copy on the home page: your goal, the next task, what it gives you, and one Continue.
 * On My plan, the property you're working on and its stage can be changed here, with the optional "Not sure where to
 * start?" helper beside it and the roadmap or evidence summary alongside on wide screens.
 */
export default function PlanNext({ variant, helper }: { variant: 'plan' | 'home'; helper?: ReactNode }) {
  usePlanTick();
  const now = planNow();
  const { task, deal, stage } = now;
  const onPlan = variant === 'plan';
  const deals = onPlan ? loadDeals() : [];
  const focus = deal ? `analyzed:${deal.id}` : '';
  const prog = roadmapProgress();
  const chooseDeal = (v: string) => {
    write(DEAL_KEY, v || NO_DEAL);
    const d = deals.find((x) => `analyzed:${x.id}` === v);
    if (d) write(ROADMAP_PATH_KEY, pathForDeal(d));
    progressChanged();
  };
  const log = deal ? loadLog(`analyzed:${deal.id}`) : null;
  const checked = log ? EVIDENCE_AREAS.filter((a) => log.rows[a.key]?.done).length : 0;
  // Working on a property doesn't finish the groundwork: the goal, cash, buy box and payment plan still open stay in view.
  const settledOwn = settledFor('');
  const foundations = deal ? roadmapFor(planPath()).filter((s) => s.phase <= 2 && !settledOwn(s)) : [];

  // The same label My plan's roadmap uses: "Next roadmap task · Get ready".
  const nextLabel = now.context.startsWith('Roadmap · ') ? `Next roadmap task · ${now.context.slice('Roadmap · '.length)}` : `Next task · ${now.context}`;

  const side = (
    <aside className="plan-now-side" aria-labelledby={`plan-now-where-${variant}`}>
      <h3 id={`plan-now-where-${variant}`}>Where you are</h3>
      {/* My plan shows this count once, at the top of its roadmap. */}
      {(
        <p className="plan-now-count">
          <span><strong>{prog.done} of {prog.total}</strong> roadmap tasks done</span>
          <span className="decide-bar" role="progressbar" aria-label="Investing roadmap" aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.done}><span style={{ width: `${Math.round((prog.done / Math.max(1, prog.total)) * 100)}%` }} /></span>
        </p>
      )}
      {deal && now.tasks && stage ? (
        <>
          <h4>{stageLabel(stage, deal)}: {deal.name}</h4>
          <details><summary>See all tasks in this stage</summary><ol className="plan-now-tasks">
            {now.tasks.map((t) => (
              <li key={t.key} className={t.done ? 'done' : t.key === task.key ? 'now' : undefined}>
                <span className="plan-now-mark" aria-hidden>{t.done ? '✓' : t.key === task.key ? '→' : '○'}</span>
                <span>{t.label}{t.done && t.doneLabel ? <span className="plan-now-done-note"> ({t.doneLabel})</span> : t.done ? <span className="sr-only"> (done)</span> : t.key === task.key ? <span className="sr-only"> (next)</span> : null}</span>
              </li>
            ))}
          </ol></details>
          <p className="plan-now-evidence">Evidence: <strong>{checked} of {EVIDENCE_AREAS.length}</strong> areas checked. <a href={`#/deals/packet/${deal.id}`}>Open its deal packet&nbsp;→</a></p>
        </>
      ) : (
        !onPlan && <details><summary>See the full journey</summary><PhaseSummary /></details>
      )}
      {!onPlan && <p><a href="#/toolkit">Open My plan&nbsp;→</a></p>}
    </aside>
  );

  return (
    <section className={`plan-now plan-now-${variant}${helper ? ' with-helper' : ''}`} aria-labelledby={`plan-now-head-${variant}`}>
      <div className="plan-now-main">
        <h2 id={`plan-now-head-${variant}`}>{onPlan || now.source === 'starter' ? 'Your next step' : 'Your next real-world step'}</h2>
        <p className="plan-now-goal">
          <span className="plan-now-k">Your goal</span>
          {now.goal ? <span>{now.goal}</span> : <span>Not written yet. <a href="#/decide">Choose my goal</a> (a few questions), then write it in a sentence in your roadmap.</span>}
        </p>
        {onPlan && deals.length > 0 && (
          <div className="plan-now-deal">
            <label className="field">
              <span>Property you’re working on</span>
              <select value={focus} onChange={(e) => chooseDeal(e.target.value)}>
                <option value="">None yet (learning)</option>
                {deals.map((d) => <option key={d.id} value={`analyzed:${d.id}`}>{d.name}</option>)}
              </select>
            </label>
            {deal && stage && (
              <label className="field">
                <span>Where it stands</span>
                <select value={stage} onChange={(e) => setDealStage(deal.id, e.target.value as DealStage)}>
                  {DEAL_STAGES.map((s) => <option key={s} value={s}>{stageLabel(s, deal)}</option>)}
                </select>
              </label>
            )}
            {deal && stage && <p className="muted plan-now-hint">{stageHint(stage, deal)}{deal.stage ? '' : ' (We worked this out from what you’ve recorded; change it if it’s wrong.)'}</p>}
          </div>
        )}
        <div className={`plan-now-task${task.urgent ? ' urgent' : ''}`}>
          <p className="plan-now-k">{nextLabel}</p>
          <h3>{task.label}</h3>
          <p className="plan-now-produces"><strong>You’ll have:</strong> {task.produces}.</p>
          <div className="plan-now-actions">
            <ContinueButton task={task} dealId={deal?.id} onPlan={onPlan} label={planStarted(now) ? undefined : 'Start'} />
            {task.advance && deal && <button type="button" className="btn btn-secondary" onClick={() => setDealStage(deal.id, task.advance!.stage)}>{task.advance.label}</button>}
          </div>
          {task.support.length > 0 && (
            <details className="plan-now-support"><summary>Help with this step</summary><p>
              <span>Helps with this:</span>{' '}
              {task.support.map((s, i) => <span key={s.href + s.label}>{i > 0 && ' · '}<a href={s.href}>{s.label}</a></span>)}
            </p></details>
          )}
        </div>
        {onPlan && deal && stage === 'contract' && wayOf(deal) === 'offer' && (
          <section aria-labelledby="contract-workstreams">
            <p id="contract-workstreams"><strong>Arrange the deposit, inspection, loan and title work promptly.</strong> These tasks run together.</p><details><summary>Who does what, and when</summary>
            <p>Do not wait for one to finish before arranging the others. Your signed contract controls deadlines; ask your team to confirm them.</p>
            <div className="table-wrap"><table><caption>Who handles each part of the purchase</caption><thead><tr><th scope="col">Work</th><th scope="col">Responsible people</th><th scope="col">Checkpoint</th></tr></thead><tbody>
              <tr><th scope="row">Earnest money and any option fee</th><td>You and escrow</td><td>Deliver by the contract deadline; confirm receipt</td></tr>
              <tr><th scope="row">Inspection and repair decision</th><td>You, inspector and agent</td><td>Before the inspection or option deadline</td></tr>
              <tr><th scope="row">Underwriting and appraisal</th><td>You and lender</td><td>Loan and appraisal deadlines; rate-lock expiration</td></tr>
              <tr><th scope="row">Title and HOA review</th><td>You, title officer and agent or attorney</td><td>Objection and document-review deadlines</td></tr>
              <tr><th scope="row">Insurance activation</th><td>You and insurer</td><td>Proof for lender; coverage coordinated with closing</td></tr>
              <tr><th scope="row">Walkthrough and closing figures</th><td>You, agent and closing officer</td><td>Resolve discrepancies before signing</td></tr>
            </tbody></table></div>
            <p><a href={`#/deals/packet/${deal.id}/dates`}>Open this property’s deadline calendar</a>. Record the responsible person and any unresolved question in its evidence log.</p></details>
          </section>
        )}
        {deal && foundations.length > 0 && (
          <div className="plan-now-foundations" role="note">
            <details><summary>Getting ready: {foundations.length} items still open</summary>
            <ul>{foundations.map((s) => <li key={s.id}>{s.href ? <a href={s.href}>{s.title}</a> : s.title}</li>)}</ul>
            <p>{stage === 'researching' || stage === 'offer' ? 'Finish these before you offer or bid.' : 'Review these gaps with your team now; keep meeting the deadlines already running.'} Record each milestone in <a href="#/toolkit/roadmap">your roadmap</a>.</p></details>
          </div>
        )}
      </div>
      {side}
      {helper && <div className="plan-now-help">{helper}</div>}
    </section>
  );
}

/** Without a property: the roadmap's phases, each with how many of its steps are done. */
function PhaseSummary() {
  const deals = loadDeals();
  const steps = roadmapFor(planPath(deals));
  const settled = settledFor(focusDealId(deals));
  const phases = ([1, 2, 3, 4, 5, 6, 7] as const).map((n) => ({ n, steps: steps.filter((s) => s.phase === n) })).filter((p) => p.steps.length);
  return (
    <ol className="plan-now-phases">
      {phases.map((p) => {
        const d = p.steps.filter(settled).length;
        return (
          <li key={p.n} className={d === p.steps.length ? 'done' : undefined}>
            <span>{ROADMAP_PHASES[p.n]}</span>
            <span className="muted">{d === p.steps.length ? '✓ Done' : `${d} of ${p.steps.length}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
