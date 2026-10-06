import { shuffled } from '../lib/shuffle';
import { useEffect, useRef, useState } from 'react';
import { downloadText } from '../lib/download';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { PracticeRibbon } from './PracticePage';
import { CASE_TITLE, NV_CASE, caseFor, tasksFor, walkedFrom, type CaseDoc, type CaseStage, type CaseTask, type PracticeCase, type Verdict } from '../practice/rentalCase';
import { useMyState } from '../lib/myState';
import { docGuide } from '../lib/docGuides';
import DocGuideView from './DocGuideView';
import { emptyCase, loadCase, saveCase, type CaseProgress } from '../practice/caseProgress';
import TopicAd from './TopicAd';
import AdSpot from './AdSpot';

const key = (st: CaseStage, t: CaseTask) => `${st.key}/${t.id}`;
const $ = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
/** The practice house being shown: the visitor's state's version (set on each render of the page). */
let C: PracticeCase = NV_CASE;
const VERDICT: Record<Verdict, string> = { best: 'Strong choice', ok: 'Reasonable', poor: 'Not this one' };

/**
 * "Buy a rental, start to finish": one fictional purchase, worked from your budget to the first months of renting.
 * Each step gives you documents to read and decisions to make, and ends with something for your deal packet.
 */
export default function RentalCasePage({ stageKey }: { stageKey?: string }) {
  // Each covered state has its own house (its contract, taxes and landlord rules); with no state chosen, Nevada's.
  const [st] = useMyState();
  C = caseFor(st);
  return <CasePage key={C.state} stageKey={stageKey} />;
}

function CasePage({ stageKey }: { stageKey?: string }) {
  const [p, setP] = useState<CaseProgress>(() => loadCase(C.state));
  const idx = C.stages.findIndex((s) => s.key === stageKey);
  const stage = idx >= 0 ? C.stages[idx] : null;
  const packet = stageKey === 'packet';
  useLastActivity(`#/practice/case${stageKey ? `/${stageKey}` : ''}`, `Practice: ${CASE_TITLE}${stage ? ` · ${stage.title}` : ''}`);
  // Moving between steps brings the step list into view and focuses the step's heading; the first load stays at the top.
  const lastStage = useRef(stageKey);
  useEffect(() => {
    // The step strip shows the current step on phones (it scrolls sideways).
    const chip = document.querySelector<HTMLElement>('.practice-stages a.active');
    const row = chip?.parentElement;
    if (chip && row) row.scrollLeft = chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.clientWidth) / 2;
    if (lastStage.current === stageKey) return;
    lastStage.current = stageKey;
    document.getElementById('case-top')?.scrollIntoView({ block: 'start' });
    document.getElementById('stage-head')?.focus({ preventScroll: true });
  }, [stageKey]);

  const update = (fn: (x: CaseProgress) => CaseProgress) =>
    setP((prev) => {
      const next = fn(prev);
      saveCase(next, C.state);
      return next;
    });
  const stageDone = (st: CaseStage) => tasksFor(st, p.answers).every((t) => p.done.includes(key(st, t)));
  const doneStages = C.stages.filter(stageDone).length;

  return (
    <main className="page practice case">
      <PageHero
        compact
        eyebrow={<span className="practice-tag">Practice · fictional property</span>}
        title={CASE_TITLE}
        sub={stage || packet ? C.property : `${C.property}. You’ll read teaching versions of a purchase’s paperwork (fictional extracts, each with a guide to the real form), make the calls, and finish with your own deal packet.`}
      />
      <PracticeRibbon />
      <nav className="practice-stages" aria-label="Steps in this practice purchase" id="case-top">
        <a href="#/practice/case" className={!stage && !packet ? 'active' : ''}>Start</a>
        {C.stages.map((st, i) => (
          <a key={st.key} href={`#/practice/case/${st.key}`} className={`${stage?.key === st.key ? 'active' : ''}${stageDone(st) ? ' done' : ''}`} aria-current={stage?.key === st.key ? 'step' : undefined}>
            <span className="step-num" aria-hidden>{stageDone(st) ? '✓' : i + 1}</span> {st.title}
          </a>
        ))}
        <a href="#/practice/case/packet" className={packet ? 'active' : ''}>Your deal packet</a>
      </nav>

      {packet ? (
        <Packet p={p} />
      ) : stage ? (
        <StageView stage={stage} n={idx + 1} p={p} update={update} done={stageDone(stage)} />
      ) : (
        <Start p={p} doneStages={doneStages} onReset={() => { if (!window.confirm('Start over? This clears your answers and your deal packet.')) return; saveCase(emptyCase(), C.state); setP(emptyCase()); }} />
      )}
      <AdSpot spot="practiceCase" />
    </main>
  );
}

function Start({ p, doneStages, onReset }: { p: CaseProgress; doneStages: number; onReset: () => void }) {
  const next = C.stages.find((st) => !tasksFor(st, p.answers).every((t) => p.done.includes(key(st, t))));
  const started = p.done.length > 0;
  return (
    <section aria-labelledby="case-start">
      <h2 id="case-start">What you’ll do</h2>
      <p>You’ll buy a fictional rental house through an agent, the way most first rentals are bought. Things will go wrong on purpose: a claim in the listing that isn’t true, a bad sewer line, a low appraisal, a lien on the title, a fake wiring email and a mistake on the closing statement. You decide what to do each time, and see why.</p>
      <p>There’s often more than one reasonable answer. Walking away at the right moment counts as a good result.</p>
      <div className="case-gets">
        <h3>You’ll finish with your own deal packet</h3>
        <ul>
          <li><strong>A budget:</strong> what you can invest, what the deal needs, and what’s left</li>
          <li><strong>A deadline calendar</strong> from the contract</li>
          <li><strong>An evidence log:</strong> what you checked, what you found, what’s still open</li>
          <li><strong>Questions</strong> you wrote for the lender, the plumber and the title officer</li>
          <li><strong>Your decisions</strong> and the reasons for each</li>
        </ul>
      </div>
      <p className="muted">About 45 minutes. {C.stages.length} steps. Your progress stays in this browser; you can stop and come back.</p>
      <div className="row practice-next">
        <a className="btn big" href={`#/practice/case/${(next ?? C.stages[0]).key}`}>{started ? `Continue: ${(next ?? C.stages[0]).title} →` : 'Start: your goal and your cash →'}</a>
        {started && <span className="muted">{doneStages} of {C.stages.length} steps done</span>}
        {started && <a href="#/practice/case/packet">See your deal packet</a>}
        {started && <button type="button" className="linkish" onClick={onReset}>Start over</button>}
      </div>
    </section>
  );
}

function StageView({ stage, n, p, update, done }: { stage: CaseStage; n: number; p: CaseProgress; update: (fn: (x: CaseProgress) => CaseProgress) => void; done: boolean }) {
  const i = C.stages.indexOf(stage);
  const prev = C.stages[i - 1];
  const nextSt = C.stages[i + 1];
  const walkedHere = p.walked === stage.key;
  const tasks = tasksFor(stage, p.answers);
  const firstOpen = tasks.findIndex((t) => !p.done.includes(key(stage, t)));
  // After walking away here, the rest of the step's questions stay hidden: they describe a deal you left.
  const shown = walkedHere ? Math.max(0, firstOpen < 0 ? tasks.length : firstOpen) : firstOpen < 0 ? tasks.length : firstOpen + 1;
  return (
    <section aria-labelledby="stage-head">
      <h2 id="stage-head" tabIndex={-1}>{n}. {stage.title}</h2>
      <p className="case-outcome"><strong>When you finish this step, you’ll have:</strong> {stage.outcome}</p>
      <div className={stage.docs.length ? 'case-grid' : undefined}>
        {stage.docs.some((d) => !d.after || p.done.includes(`${stage.key}/${d.after}`)) && (
          <div className="case-docs">
            {stage.docs.filter((d) => !d.after || p.done.includes(`${stage.key}/${d.after}`)).map((d) => <Doc key={d.title} d={d} />)}
          </div>
        )}
        <div className="case-work">
          {stage.brief.map((b) => <p key={b}>{b}</p>)}
          {/* One question at a time: the next appears once this one is answered, so later questions never give
              away what happens next (the seller's reply comes after you've made your request). */}
          {tasks.slice(0, shown).map((t, ti) => (
            <Task key={t.id} n={ti + 1} t={t} k={key(stage, t)} p={p} update={update} stageKey={stage.key} />
          ))}
          {shown < tasks.length && <p className="muted">{tasks.length - shown} more {tasks.length - shown === 1 ? 'question appears' : 'questions appear'} as you answer.</p>}
        </div>
      </div>
      {walkedHere && (
        <div className="case-walked" role="status">
          <h3>You walked away. That’s a good result.</h3>
          <p>{walkNote(stage.key)} Many good investors walk away from far more deals than they buy. Your deal packet shows what you found and why you left.</p>
          <div className="row">
            <a className="btn" href="#/practice/case/packet">See your deal packet →</a>
            <button type="button" className="btn btn-secondary" onClick={() => update((x) => ({ ...x, walked: undefined }))}>Keep going to see the rest</button>
          </div>
        </div>
      )}
      {done && (
        <div className="case-added">
          <h3>Added to your deal packet</h3>
          <ul>
            {choiceLogs(stage, p).map((x) => <li key={x}><strong>Your decision:</strong> {x}</li>)}
            {stage.log.map((l) => <li key={l.area}><strong>{l.area}:</strong> {l.finding}{l.open && <> <span className="muted">Still open: {l.open}.</span></>}</li>)}
          </ul>
          {stage.dates && <ul>{stage.dates.map((d) => <li key={d.when}><strong>{d.when}:</strong> {d.what}</li>)}</ul>}
        </div>
      )}
      {/* At the end of a finished step, after its questions and feedback. */}
      {done && <TopicAd caseStage={stage.key} />}
      {stage.learnMore && <p className="muted case-more">Go deeper: {stage.learnMore.map((l, j) => <span key={l.href}>{j > 0 && ' · '}<a href={l.href}>{l.label}</a></span>)}</p>}
      <div className="row practice-next">
        {prev && <a className="btn btn-secondary" href={`#/practice/case/${prev.key}`}>← {prev.title}</a>}
        {nextSt ? <a className="btn big" href={`#/practice/case/${nextSt.key}`}>Next: {nextSt.title} →</a> : <a className="btn big" href="#/practice/case/packet">See your deal packet →</a>}
      </div>
      {!done && <p className="muted">Answer each question to finish this step. You can move on and come back.</p>}
    </section>
  );
}

function Doc({ d }: { d: CaseDoc }) {
  return (
    <article className="practice-doc case-doc">
      <span className="practice-stamp" aria-hidden>PRACTICE</span>
      <p className="case-doc-kind">{d.kind}</p>
      <h3>{d.title}</h3>
      <p className="muted case-doc-from">From: {d.from}</p>
      {d.rows && <dl className="practice-facts">{d.rows.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>}
      {d.table && (
        <div className="table-wrap">
          <table className="lesson-table">
            <thead><tr>{d.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{d.table.rows.map((r) => <tr key={r.join('|')}>{r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row">{c}</th> : <td key={ci} data-label={d.table!.head[ci]}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      )}
      {d.notes?.map((x) => <p key={x} className="case-doc-note">{x}</p>)}
      {d.guide && docGuide(d.guide) && <DocGuideView g={docGuide(d.guide)!} />}
    </article>
  );
}

type Update = (fn: (x: CaseProgress) => CaseProgress) => void;

/** Before the offer is signed there's no contract, so nothing is at stake; after, a contract deadline protects the deposit. */
function walkNote(stageKey: string): string {
  const i = C.stages.findIndex((s) => s.key === stageKey);
  const offer = C.stages.findIndex((s) => s.key === 'offer');
  return i <= offer ? 'No contract was signed, so nothing was at risk.' : 'You left inside a contract deadline, so you keep your earnest money.';
}

/** Evidence lines from the choices you made in a step (an opening offer, a counteroffer you accepted). */
function choiceLogs(st: CaseStage, p: CaseProgress): string[] {
  return tasksFor(st, p.answers).flatMap((t) => {
    const a = p.answers[key(st, t)];
    if (t.kind !== 'choice' || typeof a !== 'number' || !t.choices[a]?.log || !p.done.includes(key(st, t))) return [];
    return [t.choices[a].log!];
  });
}

function Task({ n, t, k, p, update, stageKey }: { n: number; t: CaseTask; k: string; p: CaseProgress; update: Update; stageKey: string }) {
  const finished = p.done.includes(k);
  // Finished on a later try, or after "Show me how": marked apart from a first-try answer, so a miss doesn't look like a win.
  const retried = finished && (p.first[k] === 'wrong' || p.first[k] === 'poor');
  const finish = (x: CaseProgress) => (x.done.includes(k) ? x : { ...x, done: [...x.done, k] });
  return (
    <div className={`case-task${finished ? (retried ? ' finished retried' : ' finished') : ''}`}>
      <p className="case-task-q">
        <span className="case-task-n" aria-hidden>{finished ? (retried ? '↺' : '✓') : n}</span> {t.prompt}
        {retried && <span className="sr-only"> (finished after a miss)</span>}
      </p>
      {t.kind === 'choice' && <Choice t={t} k={k} p={p} update={update} finish={finish} stageKey={stageKey} />}
      {t.kind === 'multi' && <Multi t={t} k={k} p={p} update={update} finish={finish} />}
      {t.kind === 'number' && <NumberTask t={t} k={k} p={p} update={update} finish={finish} />}
      {t.kind === 'write' && <Write t={t} k={k} p={p} update={update} finish={finish} />}
    </div>
  );
}

type Finish = (x: CaseProgress) => CaseProgress;

function Choice({ t, k, p, update, finish, stageKey }: { t: Extract<CaseTask, { kind: 'choice' }>; k: string; p: CaseProgress; update: Update; finish: Finish; stageKey: string }) {
  const a = p.answers[k];
  const picked = typeof a === 'number' && Number.isInteger(a) && t.choices[a] ? a : null;
  const c = picked != null ? t.choices[picked] : null;
  const pick = (i: number) =>
    update((x) => {
      const ch = t.choices[i];
      let next: CaseProgress = { ...x, answers: { ...x.answers, [k]: i }, first: x.first[k] ? x.first : { ...x.first, [k]: ch.verdict } };
      if (ch.verdict !== 'poor') next = finish(next);
      // The walk-away follows your answers: choosing it marks the step, changing it clears it, and an answer that
      // brings a walk-away answer back into view brings the walk-away back. "Keep going" (walked cleared while a walk
      // answer is still showing) holds until one of those happens.
      const before = walkedFrom(x.answers, C.stages);
      const after = walkedFrom(next.answers, C.stages);
      if (ch.walk && ch.verdict !== 'poor') next = { ...next, walked: stageKey };
      else if (!after) next = { ...next, walked: undefined };
      else if (after !== before) next = { ...next, walked: after };
      return next;
    });
  return (
    <>
      <div className="case-choices" role="group" aria-label={t.prompt}>
        {shuffled(t.choices.length, t.prompt).map((i) => [t.choices[i], i] as const).map(([ch, i]) => (
          <button key={ch.label} type="button" aria-pressed={picked === i} className={picked === i ? `picked ${ch.verdict}` : undefined} onClick={() => pick(i)}>
            {ch.label}
          </button>
        ))}
      </div>
      {c && (
        <div className={`case-feedback ${c.verdict}`} role="status">
          <strong>{VERDICT[c.verdict]}.</strong> {c.why}
          {c.verdict === 'poor' && <> <em>Try another answer.</em></>}
          {c.verdict !== 'poor' && t.ifDifferent && <p className="case-if"><strong>What would change the answer:</strong> {t.ifDifferent}</p>}
        </div>
      )}
    </>
  );
}

function Multi({ t, k, p, update, finish }: { t: Extract<CaseTask, { kind: 'multi' }>; k: string; p: CaseProgress; update: Update; finish: Finish }) {
  const checked = p.done.includes(k);
  const saved = Array.isArray(p.answers[k]) ? (p.answers[k] as number[]) : [];
  const [sel, setSel] = useState<number[]>(saved);
  const toggle = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const right = t.options.every((o, i) => o.right === sel.includes(i));
  const check = () => update((x) => finish({ ...x, answers: { ...x.answers, [k]: sel }, first: x.first[k] ? x.first : { ...x.first, [k]: right ? 'right' : 'wrong' } }));
  const shown = checked ? saved : sel;
  return (
    <>
      <ul className="case-multi">
        {shuffled(t.options.length, t.prompt).map((i) => [t.options[i], i] as const).map(([o, i]) => (
          <li key={o.label} className={checked ? (o.right ? 'should' : 'shouldnt') : undefined}>
            <label>
              <input type="checkbox" checked={shown.includes(i)} disabled={checked} onChange={() => toggle(i)} />
              <span>{o.label}</span>
            </label>
            {checked && <span className="case-why">{o.right ? (shown.includes(i) ? '✓ Yes. ' : 'You missed this one. ') : shown.includes(i) ? 'Not needed. ' : '✓ Right to leave out. '}{o.why}</span>}
          </li>
        ))}
      </ul>
      {!checked ? (
        <button type="button" className="btn" onClick={check}>Check my answers</button>
      ) : (
        !t.options.every((o, i) => o.right === saved.includes(i)) && <button type="button" className="linkish" onClick={() => { setSel([]); update((x) => ({ ...x, done: x.done.filter((d) => d !== k) })); }}>Try again</button>
      )}
    </>
  );
}

function NumberTask({ t, k, p, update, finish }: { t: Extract<CaseTask, { kind: 'number' }>; k: string; p: CaseProgress; update: Update; finish: Finish }) {
  const saved = typeof p.answers[k] === 'number' ? String(p.answers[k]) : '';
  const [val, setVal] = useState(saved);
  const [tries, setTries] = useState(0);
  const [show, setShow] = useState(p.done.includes(k));
  const num = Number(val.replace(/[$,\s]/g, ''));
  const ok = val.trim() !== '' && Number.isFinite(num) && Math.abs(num - t.answer) <= t.tolerance;
  const [checked, setChecked] = useState(p.done.includes(k));
  const check = () => {
    if (!val.trim()) return;
    setChecked(true);
    setTries((n) => n + 1);
    if (ok) {
      setShow(true);
      update((x) => finish({ ...x, answers: { ...x.answers, [k]: num }, first: x.first[k] ? x.first : { ...x.first, [k]: 'right' } }));
    } else update((x) => (x.first[k] ? x : { ...x, first: { ...x.first, [k]: 'wrong' } }));
  };
  return (
    <>
      <div className="case-number">
        <label>
          <span className="sr-only">Your answer</span>
          <span aria-hidden>$</span>
          <input inputMode="decimal" value={val} onChange={(e) => { setVal(e.target.value); setChecked(false); }} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="Your answer" />
        </label>
        <button type="button" className="btn" onClick={check} disabled={!val.trim()}>Check</button>
        {!show && p.first[k] !== undefined && <button type="button" className="linkish" onClick={() => { setShow(true); update((x) => finish({ ...x, first: x.first[k] ? x.first : { ...x.first, [k]: 'wrong' } })); }}>Show me how</button>}
      </div>
      {checked && val.trim() !== '' && (
        <p className={`case-feedback ${ok ? 'best' : 'poor'}`} role="status">
          {ok ? <><strong>Right.</strong> {$(t.answer)}.</> : <><strong>Not quite.</strong> {tries >= 2 || !t.hint ? 'Open “Show me how” for the working.' : t.hint}</>}
        </p>
      )}
      {show && (
        <div className="case-worked">
          <strong>How it’s worked out</strong>
          <ul>{t.worked.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
    </>
  );
}

function Write({ t, k, p, update, finish }: { t: Extract<CaseTask, { kind: 'write' }>; k: string; p: CaseProgress; update: Update; finish: Finish }) {
  const saved = typeof p.answers[k] === 'string' ? (p.answers[k] as string) : '';
  const [val, setVal] = useState(saved);
  const done = p.done.includes(k);
  return (
    <>
      <label className="field">
        <span className="sr-only">Your question for: {t.to}</span>
        <textarea rows={3} maxLength={600} value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Your question for: ${t.to}`} />
      </label>
      <button type="button" className="btn" disabled={!val.trim()} onClick={() => update((x) => finish({ ...x, answers: { ...x.answers, [k]: val.trim() } }))}>{done ? 'Update' : 'Save to my packet'}</button>
      {done && <p className="case-feedback ok" role="status"><strong>Saved.</strong> Compare yours: {t.model}</p>}
    </>
  );
}

/** Everything the learner produced, in one place, to print or download. */
export function packetText(p: CaseProgress): string {
  const lines: string[] = [`${CASE_TITLE.toUpperCase()} — DEAL PACKET (practice, fictional)`, C.property, ''];
  for (const sec of packetSections(p)) {
    lines.push(sec.title.toUpperCase());
    for (const row of sec.rows) lines.push(`- ${row}`);
    lines.push('');
  }
  lines.push('Practice only. Before a real deal, talk with a real estate attorney, a licensed lender and a tax advisor.');
  return lines.join('\n');
}

export function packetSections(p: CaseProgress): { title: string; rows: string[] }[] {
  const finished = (st: CaseStage) => tasksFor(st, p.answers).every((t) => p.done.includes(key(st, t)));
  // A step you walked away in counts as reached, so the packet shows what you found there; its price and value
  // rows are left out because they describe a deal that didn't happen.
  const walkIdx = C.stages.findIndex((st) => st.key === p.walked);
  const reached = C.stages.filter((st, i) => (walkIdx < 0 || i <= walkIdx) && (finished(st) || i === walkIdx));
  const logOf = (st: CaseStage) => (st.key === p.walked ? st.log.filter((l) => l.area !== 'Price' && l.area !== 'Value' && l.area !== 'Contract') : st.log);
  const bought = !p.walked && (finished(C.stages[C.stages.length - 1]) || reached.some((s) => s.key === 'closing'));
  const budget = [
    `Most you can invest: ${$(C.N.investable)} (after a ${$(C.N.cushion)} emergency fund and ${$(C.N.otherGoals)} for other goals)`,
    bought ? `Cash the deal took in this case: ${$(C.N.cashFinal)}, including ${$(C.N.urgent)} of repairs and ${C.N.reserveMonths} months of reserves` : `Cash needed at the first offer: ${$(C.N.cashOffer)}, before repairs`,
    bought ? `Left beyond the reserves: ${$(C.N.investable - C.N.cashFinal)}` : `Left at the first offer: ${$(C.N.investable - C.N.cashOffer)}`,
  ];
  if (bought) budget.push(`Monthly cash flow after set-asides, self-managed: about ${$(C.N.cashFlow)}`);
  const decisions: string[] = [];
  const questions: string[] = [];
  for (const st of C.stages)
    for (const t of tasksFor(st, p.answers)) {
      const a = p.answers[key(st, t)];
      if (t.kind === 'choice' && typeof a === 'number' && t.choices[a]) decisions.push(`${st.title}: ${t.choices[a].label} (${VERDICT[t.choices[a].verdict].toLowerCase()})`);
      if (t.kind === 'write' && typeof a === 'string' && a) questions.push(t.to === 'You' ? `For yourself: ${a}` : `To the ${t.to.toLowerCase()}: ${a}`);
    }
  // First tries count only for questions you can see now (a counteroffer you no longer face doesn't count).
  const visible = new Set(C.stages.flatMap((st) => tasksFor(st, p.answers).map((t) => key(st, t))));
  const firsts = Object.entries(p.first).filter(([k]) => visible.has(k)).map(([, v]) => v);
  const strong = firsts.filter((v) => v === 'best' || v === 'ok' || v === 'right').length;
  const walkedAt = C.stages.find((s) => s.key === p.walked);
  return [
    { title: 'Result', rows: [walkedAt ? `You walked away at “${walkedAt.title}”. ${walkNote(walkedAt.key)} A good result when the deal stops fitting.` : bought ? 'You bought it. In this case the seller agreed to the appraised value, and you kept your reserves.' : `${reached.length} of ${C.stages.length} steps done so far.`, `${strong} of ${firsts.length} questions right or reasonable on the first try.`] },
    { title: 'Your budget', rows: budget },
    { title: 'Deadline calendar', rows: reached.some((s) => s.dates) && !(walkedAt && walkedAt.key === 'offer') ? [...reached.flatMap((s) => s.dates ?? []).map((d) => `${d.when}: ${d.what}`), 'Practice contract terms. A real contract sets its own periods and how days are counted: build your calendar from it.'] : ['Not yet: the dates come from your contract, once your offer is accepted.'] },
    { title: 'Evidence log', rows: reached.flatMap((s) => [...choiceLogs(s, p).map((x) => `Your decision: ${x}`), ...logOf(s).map((l) => `${l.area}: ${l.finding}${l.open ? ` Still open: ${l.open}.` : ''}`)]) },
    { title: 'Your questions for the professionals', rows: questions.length ? questions : ['None saved yet.'] },
    { title: 'Your decisions', rows: decisions.length ? decisions : ['None yet.'] },
  ];
}

function Packet({ p }: { p: CaseProgress }) {
  const secs = packetSections(p);
  const download = () => downloadText('deedowl-practice-deal-packet.txt', packetText(p));
  return (
    <section aria-labelledby="packet-head" className="case-packet">
      <h2 id="packet-head">Your deal packet</h2>
      <p>Everything you produced in this practice purchase. For a real deal, you’d build the same packet: it’s what you bring to your lender, title officer and attorney.</p>
      <div className="row">
        <button type="button" className="btn" onClick={download}>Download as text</button>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Print</button>
      </div>
      <div className="case-packet-grid">
        {secs.map((s) => (
          <div key={s.title} className={`case-packet-sec${s.rows.length > 6 ? ' wide' : ''}`}>
            <h3>{s.title}</h3>
            <ul>{s.rows.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="muted">This practice doesn’t make anyone “ready to invest.” It shows the steps, the paperwork and the decisions. Next, use the same steps on your own plan.</p>
      <div className="row practice-next">
        <a className="btn big" href="#/toolkit">Use it in My plan →</a>
        <a href="#/practice">More practice</a>
      </div>
    </section>
  );
}

/** A fixed, scrambled order for a question's answers, so the best one isn't always first (same order on every visit). */
