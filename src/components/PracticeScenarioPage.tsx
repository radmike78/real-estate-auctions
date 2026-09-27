import { useEffect, useMemo, useState, type ReactElement } from 'react';
import PageHero from './PageHero';
import { PracticeRibbon } from './PracticePage';
import { maxSafeBid, costsAtBid } from '../lib/bidCalc';
import { fmtMoney } from '../lib/status';
import { scenarioById } from '../practice/scenarios';
import { loadProgress, resetProgress, saveProgress, type ScenarioProgress } from '../practice/progress';
import type { Scenario, Stage, Task } from '../practice/types';

const taskKey = (stage: Stage, t: Task) => `${stage.key}/${t.id}`;

/** One practice run: a fictional listing, then stage by stage through the purchase. */
export default function PracticeScenarioPage({ id, stageKey }: { id: string; stageKey?: string }) {
  const scenario = useMemo(() => scenarioById(id), [id]);
  const [progress, setProgress] = useState<ScenarioProgress>(() => loadProgress(id));
  useEffect(() => setProgress(loadProgress(id)), [id]);
  // On phones the step buttons are one swipeable row: bring the current step into view.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.practice-stages a.active');
    const row = el?.parentElement;
    if (el && row) row.scrollLeft = el.offsetLeft - row.offsetLeft - (row.clientWidth - el.clientWidth) / 2;
  }, [id, stageKey]);

  if (!scenario) {
    return (
      <main className="page">
        <p>That practice run doesn’t exist. <a href="#/practice">Choose one</a></p>
      </main>
    );
  }
  const s = scenario;
  const update = (fn: (p: ScenarioProgress) => ScenarioProgress) =>
    setProgress((prev) => {
      const next = fn(prev);
      saveProgress(s.id, next);
      return next;
    });
  const markDone = (key: string) => update((p) => (p.done.includes(key) ? p : { ...p, done: [...p.done, key] }));
  const stageDone = (st: Stage) => st.tasks.every((t) => progress.done.includes(taskKey(st, t)));
  const found = s.stages.findIndex((st) => st.key === stageKey);
  const idx = Math.max(0, found);
  // An unknown step shows the listing (the start) with a note, never a different step by surprise.
  const stage = stageKey && found >= 0 ? s.stages[idx] : null;
  const unknownStage = !!stageKey && found < 0;
  const total = s.stages.reduce((n, st) => n + st.tasks.length, 0);
  const allDone = progress.done.length >= total;

  return (
    <main className="page practice">
      <PageHero
        compact
        eyebrow={<span className="practice-tag">Practice · fictional property</span>}
        title={s.property.label}
        sub={`${s.saleTitle}. ${s.property.address}, ${s.property.city} (fictional)`}
      />
      <PracticeRibbon />
      {unknownStage && <p className="notice" role="status">We couldn’t find that step. Start from the listing below.</p>}

      <nav className="practice-stages" aria-label="Practice steps">
        <a href={`#/practice/${s.id}`} className={!stage ? 'active' : ''}>Listing</a>
        {s.stages.map((st, i) => (
          <a key={st.key} href={`#/practice/${s.id}/${st.key}`} className={`${stage?.key === st.key ? 'active' : ''}${stageDone(st) ? ' done' : ''}`}>
            <span className="step-num" aria-hidden>{stageDone(st) ? '✓' : i + 1}</span> {st.title}
          </a>
        ))}
      </nav>

      {!stage ? (
        <Listing s={s} progress={progress} total={total} onReset={() => { resetProgress(s.id); setProgress(loadProgress(s.id)); }} />
      ) : (
        <section aria-labelledby="stage-head">
          <h2 id="stage-head">{idx + 1}. {stage.title}</h2>
          <p className="muted">{stage.summary}</p>
          {stage.tasks.map((t) => (
            <TaskCard key={t.id} task={t} k={taskKey(stage, t)} progress={progress} update={update} markDone={markDone} />
          ))}
          <div className="row practice-next">
            {idx > 0 && <a className="btn btn-secondary" href={`#/practice/${s.id}/${s.stages[idx - 1].key}`}>← {s.stages[idx - 1].title}</a>}
            {idx < s.stages.length - 1 ? (
              <a className="btn big" href={`#/practice/${s.id}/${s.stages[idx + 1].key}`}>Next: {s.stages[idx + 1].title} →</a>
            ) : (
              <a className="btn big" href={`#/practice/${s.id}`}>Finish: see your results →</a>
            )}
          </div>
          {!stageDone(stage) && <p className="small muted">Work through every card to complete this step. You can come back any time; your progress stays in this browser.</p>}
        </section>
      )}
      {!stage && allDone && <Results s={s} progress={progress} />}
    </main>
  );
}

function Listing({ s, progress, total, onReset }: { s: Scenario; progress: ScenarioProgress; total: number; onReset: () => void }) {
  const p = s.property;
  const started = progress.done.length > 0;
  return (
    <section aria-labelledby="listing-head">
      <div className="practice-listing">
        <span className="practice-stamp" aria-hidden>PRACTICE</span>
        <h2 id="listing-head">Practice listing</h2>
        <p className="lead"><strong>{p.label}</strong> · {p.address}, {p.city}, NV {p.zip}</p>
        <dl className="practice-facts">
          <div><dt>Parcel number</dt><dd>{p.apn} <span className="small muted">(book 999 isn’t used by the Assessor)</span></dd></div>
          {p.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
          <div><dt>Practice value once repaired</dt><dd>{fmtMoney(p.value)}</dd></div>
          {p.repairs > 0 && <div><dt>Practice repair estimate</dt><dd>{fmtMoney(p.repairs)} <span className="small muted">(from the outside)</span></dd></div>}
          <div><dt>Occupancy</dt><dd>{p.occupancy === 'Tenants' ? 'Tenants' : p.occupancy === 'Vacant' ? 'Vacant' : 'Unknown'}</dd></div>
        </dl>
        <h3>The sale</h3>
        <p>{s.saleTitle}. <strong>What you’d get:</strong> {s.youGet}</p>
        <dl className="practice-facts">
          {s.sale_facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
        <p className="small muted">Rules and deadlines come from our <a href={`#/playbooks/${s.playbookKey}`}>{s.saleTitle} playbook</a>. Real sales can change them: always read the official notice.</p>
      </div>
      <div className="row practice-next">
        <a className="btn big" href={`#/practice/${s.id}/${s.stages[0].key}`}>{started ? 'Continue practicing →' : 'Start practicing →'}</a>
        {started && <span className="muted">{progress.done.length} of {total} done</span>}
        {started && <button className="linkish" onClick={onReset}>Start over</button>}
        <a href="#/practice">Choose another</a>
      </div>
    </section>
  );
}

function Results({ s, progress }: { s: Scenario; progress: ScenarioProgress }) {
  const decisions = s.stages.flatMap((st) => st.tasks.filter((t) => t.kind === 'decision').map((t) => `${st.key}/${t.id}`));
  const right = decisions.filter((k) => progress.firstTry[k]).length;
  return (
    <section className="lead-card practice-results" aria-labelledby="results-head">
      <h2 id="results-head">You finished this practice run</h2>
      <p className="lead">{right} of {decisions.length} decisions right on the first try.</p>
      <p>When you’re ready for a real one:</p>
      <ul>
        <li><a href={`#/playbooks/${s.playbookKey}`}>Read the full playbook for this sale</a></li>
        <li><a href="#/calculator">Run your own numbers in the maximum bid calculator</a></li>
        <li><a href="#/pros">Find licensed title, insurance and repair professionals</a> and <a href="#/agents">agents</a></li>
        <li><a href="#/practice">Practice another kind of sale or property</a></li>
      </ul>
      <p className="small muted">Practice results stay in this browser. Our guides are general education; for your own deal, work with qualified professionals.</p>
    </section>
  );
}

function TaskCard({ task, k, progress, update, markDone }: { task: Task; k: string; progress: ScenarioProgress; update: (fn: (p: ScenarioProgress) => ScenarioProgress) => void; markDone: (k: string) => void }) {
  const done = progress.done.includes(k);
  const head = (label: string, title: string) => (
    <div className="task-head">
      <span className={`task-kind kind-${task.kind}`}>{label}</span>
      <h3>{title}</h3>
      {done && <span className="task-done" aria-label="Done">✓</span>}
    </div>
  );

  switch (task.kind) {
    case 'read':
      return (
        <article className={`task-card${done ? ' is-done' : ''}`}>
          {head('Learn', task.title)}
          {task.body.map((b, i) => <p key={i}>{b}</p>)}
          {!done && <button className="btn btn-secondary" onClick={() => markDone(k)}>Got it</button>}
        </article>
      );
    case 'event':
      return (
        <article className={`task-card event${done ? ' is-done' : ''}`}>
          {head('What happens', task.title)}
          {task.body.map((b, i) => <p key={i}>{b}</p>)}
          {!done && <button className="btn btn-secondary" onClick={() => markDone(k)}>Continue</button>}
        </article>
      );
    case 'checklist':
      return <ChecklistTask task={task} k={k} done={done} head={head} markDone={markDone} />;
    case 'decision': {
      const chosen = progress.answers[k];
      const choice = chosen !== undefined ? task.choices[chosen] : null;
      return (
        <article className={`task-card${done ? ' is-done' : ''}`}>
          {head('Decide', task.title)}
          <p><strong>{task.question}</strong></p>
          <div className="choices" role="group" aria-label={task.question}>
            {task.choices.map((c, i) => (
              <button
                key={i}
                className={`choice${chosen === i ? (c.correct ? ' right' : ' wrong') : ''}`}
                aria-pressed={chosen === i}
                disabled={done}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    answers: { ...p.answers, [k]: i },
                    firstTry: k in p.firstTry ? p.firstTry : { ...p.firstTry, [k]: c.correct },
                    done: c.correct && !p.done.includes(k) ? [...p.done, k] : p.done,
                  }))
                }
              >
                {c.label}
              </button>
            ))}
          </div>
          {choice && <p className={choice.correct ? 'feedback right' : 'feedback wrong'} role="status">{choice.correct ? '✓ ' : '✗ '}{choice.feedback}{!choice.correct && ' Try again.'}</p>}
        </article>
      );
    }
    case 'contact':
      return <ContactTask task={task} k={k} done={done} head={head} progress={progress} update={update} />;
    case 'document':
      return (
        <article className={`task-card${done ? ' is-done' : ''}`}>
          {head('Document', task.title)}
          <div className="practice-doc">
            <span className="practice-stamp" aria-hidden>PRACTICE</span>
            <p className="small muted">From: {task.from}</p>
            <p><em>{task.purpose}</em></p>
            <table>
              <tbody>
                {task.lines.map((l) => (
                  <tr key={l.label}><th scope="row">{l.label}</th><td>{l.value}</td></tr>
                ))}
              </tbody>
            </table>
            {task.note && <p className="small muted">{task.note}</p>}
          </div>
          {!done && <button className="btn btn-secondary" onClick={() => markDone(k)}>{task.from === 'You' || task.from.startsWith('You ') ? 'Prepared' : 'Reviewed'}</button>}
        </article>
      );
    case 'numbers':
      return <NumbersTask task={task} k={k} done={done} head={head} markDone={markDone} />;
    case 'afford': {
      const cash = task.loanAmount === 0;
      const rows: [string, string][] = [
        ['Value as it stands, from comparable sales (practice)', fmtMoney(task.asIsValue)],
        ...(cash
          ? ([['How you pay', 'Cash (proof of funds)']] as [string, string][])
          : ([
              ['Your pre-approved loan (practice)', fmtMoney(task.loanAmount)],
              ['Your down payment', `${task.downPct}% of the price`],
              ['Most the loan supports', fmtMoney(Math.floor(task.loanAmount / (1 - task.downPct / 100) / 1000) * 1000)],
            ] as [string, string][])),
        ...(task.repairs ? ([['Cash to keep for repairs', fmtMoney(task.repairs)]] as [string, string][]) : []),
      ];
      return (
        <article className={`task-card${done ? ' is-done' : ''}`}>
          {head('Numbers', task.title)}
          <p>{task.intro}</p>
          <table className="practice-numbers">
            <tbody>
              {rows.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{v}</td></tr>)}
            </tbody>
            <tfoot>
              <tr><th scope="row">Your maximum offer</th><td className="num"><strong>{fmtMoney(task.maxOffer)}</strong></td></tr>
              <tr><th scope="row">List price</th><td className="num">{fmtMoney(task.list)}</td></tr>
            </tfoot>
          </table>
          <p>{task.lesson}</p>
          <p className="small muted">Practice numbers, not market data.{!cash && ' A real pre-approval comes from a licensed loan officer.'}</p>
          {!done && <button className="btn btn-secondary" onClick={() => markDone(k)}>I understand my budget</button>}
        </article>
      );
    }
  }
}

function ChecklistTask({ task, k, done, head, markDone }: { task: Extract<Task, { kind: 'checklist' }>; k: string; done: boolean; head: (l: string, t: string) => ReactElement; markDone: (k: string) => void }) {
  const [ticked, setTicked] = useState<boolean[]>(() => task.items.map(() => done));
  const all = ticked.every(Boolean);
  useEffect(() => {
    if (all && !done) markDone(k);
  }, [all, done, k, markDone]);
  return (
    <article className={`task-card${done ? ' is-done' : ''}`}>
      {head('Prepare', task.title)}
      {task.intro && <p>{task.intro}</p>}
      <ul className="practice-checks">
        {task.items.map((it, i) => (
          <li key={i}>
            <label>
              <input type="checkbox" checked={ticked[i] || done} disabled={done} onChange={(e) => setTicked((t) => t.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span><strong>{it.text}</strong>{it.detail && <span className="muted"> {it.detail}</span>}</span>
            </label>
          </li>
        ))}
      </ul>
      {!done && <p className="small muted">Tick each one as you’d prepare it.</p>}
    </article>
  );
}

function ContactTask({ task, k, done, head, progress, update }: { task: Extract<Task, { kind: 'contact' }>; k: string; done: boolean; head: (l: string, t: string) => ReactElement; progress: ScenarioProgress; update: (fn: (p: ScenarioProgress) => ScenarioProgress) => void }) {
  const sent = progress.sent[k] ?? [];
  const [typing, setTyping] = useState<number | null>(null);
  const send = (i: number) => {
    setTyping(i);
    window.setTimeout(() => {
      setTyping(null);
      update((p) => ({ ...p, sent: { ...p.sent, [k]: [...(p.sent[k] ?? []).filter((x) => x !== i), i] }, done: p.done.includes(k) ? p.done : [...p.done, k] }));
    }, 700);
  };
  return (
    <article className={`task-card${done ? ' is-done' : ''}`}>
      {head('Reach out', task.role)}
      <p className="small muted">{task.person} · {task.why}</p>
      <div className="chat" aria-live="polite">
        {sent.map((i) => (
          <div key={i}>
            <p className="bubble me"><span className="sr-only">You: </span>{task.messages[i].send}</p>
            <p className="bubble them"><span className="sr-only">{task.role}: </span>{task.messages[i].reply}</p>
          </div>
        ))}
        {typing !== null && (
          <>
            <p className="bubble me">{task.messages[typing].send}</p>
            <p className="bubble them typing" aria-label="Replying">…</p>
          </>
        )}
      </div>
      <div className="row">
        {task.messages.map((m, i) => (
          <button key={i} className="btn btn-secondary" disabled={typing !== null || sent.includes(i)} onClick={() => send(i)}>{m.label}</button>
        ))}
      </div>
      <p className="small muted">Simulated conversation with a fictional professional. Nothing is sent. For a real deal, you’d send a message like yours to a licensed professional you choose.</p>
    </article>
  );
}

function NumbersTask({ task, k, done, head, markDone }: { task: Extract<Task, { kind: 'numbers' }>; k: string; done: boolean; head: (l: string, t: string) => ReactElement; markDone: (k: string) => void }) {
  const i = task.inputs;
  const r = maxSafeBid(i);
  const c = costsAtBid(i, r.maxBid);
  const rows: [string, string][] = [
    ['Value once repaired (practice)', fmtMoney(i.exitValue)],
    ['Repairs, with a ' + i.contingencyPct + '% cushion', fmtMoney(c.repairs)],
    ['Liens that may stay with the property', fmtMoney(c.survivingLiens)],
    ['Title, legal and reports', fmtMoney(c.titleLegal)],
    ['Taking possession', fmtMoney(c.possession)],
    [`Holding costs, ${i.holdingMonths} months`, fmtMoney(c.holding)],
    ...(i.financedPct > 0 ? ([[`Loan costs (${i.financedPct}% financed, ${i.interestRatePct}% interest, ${i.pointsPct} point)`, fmtMoney(c.financing)]] as [string, string][]) : []),
    ['Real property transfer tax, if it applies', fmtMoney(c.transferTax)],
    [`Selling costs, ${i.sellingCostPct}% of the value`, fmtMoney(c.selling)],
    [`Your target profit, ${i.targetProfitPct}% of the value`, fmtMoney((i.exitValue * i.targetProfitPct) / 100)],
  ];
  return (
    <article className={`task-card${done ? ' is-done' : ''}`}>
      {head('Numbers', task.title)}
      <p>{task.intro}</p>
      <table className="practice-numbers">
        <tbody>
          {rows.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{v}</td></tr>)}
        </tbody>
        <tfoot>
          <tr><th scope="row">Your maximum</th><td className="num"><strong>{r.noBidWorks ? 'No price works' : fmtMoney(r.maxBid)}</strong></td></tr>
          <tr><th scope="row">{task.compareTo.label}</th><td className="num">{fmtMoney(task.compareTo.amount)}</td></tr>
        </tfoot>
      </table>
      <p>{task.lesson}</p>
      <p className="small muted">Practice numbers, not market data. <a href="#/calculator">Try your own in the maximum bid calculator</a>.</p>
      {!done && <button className="btn btn-secondary" onClick={() => markDone(k)}>I understand my maximum</button>}
    </article>
  );
}
