import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { lessonByKey } from '../lib/lessons';
import { useAccount } from '../lib/account';
import { useEffect, useRef, useState } from 'react';
import { useMyState } from '../lib/myState';
import { downloadText } from '../lib/download';
import { navigate } from '../lib/nav';
import { useLastActivity } from '../lib/journey';
import { CHAPTERS, SPECIALTIES, SOURCES, LOCAL_NOTE, DEFAULT_LAB, accepts, answerTask, calculateDeal, emptyJourney, journeyHref, loadJourney, money, originalDecision, resumeChapter, saveJourney, taskKey, workbookText, type Answer, type Chapter, type JourneyProgress, type LabInputs, type Task } from '../practice/dealJourney';
import '../styles/deal-journey.css';

/** Architectural drawing, not a photo of a listed property. */
export function CedarDrawing() {
  return <svg viewBox="0 0 420 205" className="cedar-drawing" role="img" aria-label="Illustration of the fictional Cedar House">
    <path d="M20 179H402M54 179V106L183 39L312 106V179M86 178V111H281V178" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M38 108L183 29L328 108M78 108L183 54L289 108" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M159 179V122H209V179M166 129H202V159M92 120H139V158H92ZM230 120H276V158H230ZM115 120V158M92 138H139M253 120V158M230 138H276" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M315 179V132H382V179M313 131L349 105L385 131M324 143H373M324 155H373M324 167H373M53 179H26V157H53" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M34 157V131M23 134L34 119L46 134M176 179L152 200M197 179L215 200" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="198" cy="166" r="2" fill="currentColor" />
  </svg>;
}

export default function DealJourneyPage({ chapterKey }: { chapterKey?: string }) {
  const account=useAccount();
  const [p, setP] = useState<JourneyProgress>(loadJourney);
  const [storageProblem, setStorageProblem] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const heading = useRef<HTMLSpanElement>(null);
  const chapter = CHAPTERS.find((c) => c.id === chapterKey);
  const workbook = chapterKey === 'workbook';
  const specialties = chapterKey === 'specialties';
  const unknown = !!chapterKey && !chapter && !workbook && !specialties;
  const update = (next: JourneyProgress) => { setP(next); setStorageProblem(!saveJourney(next)); };
  useLastActivity(journeyHref(chapterKey), `Practice: Build your first deal${chapter ? ` · ${chapter.title}` : ''}`);
  useEffect(() => { if (chapterKey) heading.current?.focus({ preventScroll: true }); }, [chapterKey]);
  const started = Object.keys(p.answers).length > 0;
  const current = chapter ? CHAPTERS.indexOf(chapter) : -1;
  return <main className="page deal-journey">
    <PageHero
      compact
      top={<a href="#/practice">← Practice</a>}
      eyebrow="Practice part 1 · Cedar House (the decisions) · Fictional"
      title={<span ref={heading} tabIndex={-1}>{chapter?.title ?? (workbook ? 'Your deal workbook' : specialties ? 'Choose your next challenge' : 'One property. Better decisions.')}</span>}
      sub={chapter?.purpose ?? (workbook ? 'Your reasoning, numbers and questions, all in one place.' : specialties ? 'Keep the habits. Learn what changes for your investment.' : 'Learn the process by trying it. Follow Cedar House from its listing to life as a rental.')}
      aside={!workbook && started ? <a className="deal-workbook-link" href={journeyHref('workbook')}>Your workbook ↗</a> : undefined}
    >
      <div className="deal-progress-row"><span>{p.completed.length} of {CHAPTERS.length} chapters done</span><span>{storageProblem ? 'Not saved — download your workbook' : account.account ? 'Use Save my work to keep account progress' : 'Progress stays in this browser'}</span></div>
      <progress max={CHAPTERS.length} value={p.completed.length} aria-label="Practice chapters completed" />
    </PageHero>
    {account.account && <p className="deal-input-hint">Account saves keep your choices, numbers and self-review completion. Written answers stay in this visit and your workbook download; write them again if you want to review them on another device.</p>}
    {storageProblem && <p className="deal-alert" role="status">This browser could not save your progress. Keep this page open and <button type="button" className="linkish" onClick={() => downloadText('deedowl-practice-workbook.txt', workbookText(p))}>download your workbook</button>. Download your workbook to keep a readable copy. Optional account saving can keep supported choices and deal numbers across devices.</p>}
    <details className="deal-outline"><summary>See all chapters {chapter && <span> · Chapter {current + 1} of {CHAPTERS.length}</span>}</summary><nav aria-label="Practice deal chapters"><a href={journeyHref()}>Start</a>{CHAPTERS.map((c, i) => <a key={c.id} href={journeyHref(c.id)} aria-current={c.id === chapter?.id ? 'step' : undefined}><span>{p.completed.includes(c.id) ? '✓' : i + 1}</span>{c.title}</a>)}<a href={journeyHref('workbook')}>Your workbook</a></nav></details>
    {unknown ? <section className="deal-task-card"><h2>That chapter isn’t in this exercise</h2><a className="btn" href={journeyHref()}>Open the practice deal</a></section> : workbook ? <Workbook p={p} /> : specialties ? <SpecialtyView p={p} update={update} /> : chapter ? <div className="deal-workspace">
      <section className="deal-main"><p className="deal-practice-note" role="note">Practice only: the numbers and papers are made up. Check real deals with local offices and professionals.</p><ChapterView key={chapter.id} chapter={chapter} p={p} update={update} /><div className="deal-reference"><details><summary>Why this works · explanations and sources</summary><p>{chapter.detail}</p><p className="deal-reviewed">{chapter.sources.length ? 'The linked official sources were checked October 9, 2026.' : 'This chapter uses made-up numbers and practice judgments.'}</p><ul>{SOURCES.filter((s) => chapter.sources.includes(s.id)).map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></li>)}</ul></details><details><summary>Check what varies where you invest</summary><p>{LOCAL_NOTE}</p></details></div></section>
      <aside className="deal-side" aria-label="Your fictional property"><PropertyPanel chapter={chapter} p={p} />{current >= 5 && current <= 7 && <DealLab p={p} update={update} />}</aside>
    </div> : <section className="deal-start">
      <div className="deal-intro"><p className="deal-kicker">MEET YOUR PRACTICE PROPERTY</p><h2>Cedar House</h2><p>Three bedrooms. An attractive rent claim. A few costs hiding behind the headline.</p><p>You’ll check the numbers, handle surprises, and decide whether to proceed or pass. Each short chapter adds something useful to your workbook.</p><a className="btn deal-primary" href={journeyHref(started ? resumeChapter(p) : CHAPTERS[0].id)}>{started ? 'Continue your deal' : 'Try the first decision'} →</a><p className="deal-start-note">No signup. No real purchase. Passing can be a good result.</p></div>
      <div className="deal-cover"><span className="deal-cover-label">CEDAR HOUSE / PRACTICE FILE 01</span><CedarDrawing /><div className="deal-cover-facts"><div><span>Asking price</span><strong>$300,000</strong></div><div><span>Advertised rent</span><strong>$2,650 <small>/mo</small></strong></div></div><p>What would you need to know before calling this a deal?</p></div>
      <div className="deal-start-bottom"><div><strong>A complete decision, one piece at a time</strong><p>Your cash → the facts → the loan → the numbers → buying → owning.</p></div><div><strong>Your judgment matters</strong><p>Revise or pass when the evidence says to. You can still practice the rest.</p></div></div>
      <p className="deal-local">{LOCAL_NOTE}</p>
    </section>}
    <footer className="deal-page-footer"><a href={journeyHref('specialties')}>Specialty challenges</a><a href="#/toolkit">My plan and progress backup</a>{started && <button type="button" className="linkish" onClick={() => setResetOpen(true)}>Start this practice over</button>}</footer>
    {resetOpen && <section className="deal-reset" role="region" aria-label="Confirm practice reset"><p>Clear only this practice deal’s answers, lab and workbook? Your real property plans and other practice stay saved.</p><button type="button" className="btn btn-secondary" onClick={() => setResetOpen(false)}>Keep my practice</button> <button type="button" className="btn" onClick={() => { update(emptyJourney()); setResetOpen(false); navigate('/practice/deal'); }}>Clear this practice</button></section>}
  </main>;
}

function PropertyPanel({ chapter, p }: { chapter: Chapter; p: JourneyProgress }) {
  const index = CHAPTERS.indexOf(chapter);
  if (chapter.id === 'new-property') return <div className="deal-property-panel"><span className="deal-kicker">WILLOW DUPLEX · FICTIONAL</span><h2>A fresh decision</h2><dl><div><dt>All-cash price</dt><dd>$230,000</dd></div><div><dt>Projected total rent</dt><dd>$2,500/mo</dd></div><div><dt>Acquisition and repairs</dt><dd>$20,000</dd></div><div><dt>Property reserve</dt><dd>$20,000</dd></div></dl><p className="deal-property-note">New property, new evidence. These are assumptions to test, not a verified investment.</p></div>;
  return <div className="deal-property-panel"><span className="deal-kicker">CEDAR HOUSE · FICTIONAL</span><CedarDrawing /><div className="deal-property-heading"><h2>{chapter.phase === 'owned' ? 'After the purchase' : chapter.phase === 'contract' ? 'Under contract' : 'The candidate'}</h2><span>{chapter.phase === 'research' ? 'Investigate' : chapter.phase === 'analysis' ? 'Run the numbers' : 'What-if purchase'}</span></div><dl><div><dt>{index >= 8 ? 'Agreed price (what-if)' : 'Asking price'}</dt><dd>{index >= 8 ? '$260,000' : '$300,000'}</dd></div><div><dt>{index >= 5 ? 'Supported rent estimate' : 'Advertised rent'}</dt><dd>{index >= 5 ? '$2,500/mo' : '$2,650/mo'}</dd></div>{index >= 5 && <div><dt>At asking price</dt><dd>−$21.93/mo</dd></div>}{index >= 8 && <div><dt>Left each month at $260,000</dt><dd>$177.66/mo</dd></div>}{index >= 9 && <div><dt>Revised repair budget</dt><dd>$22,000</dd></div>}</dl>{originalDecision(p) !== 'Not decided' && <p className="deal-original">Your original decision: <strong>{originalDecision(p)}</strong>. {index >= 8 ? 'Kept while you practice the what-if purchase at $260,000.' : 'You can revisit it as you learn.'}</p>}</div>;
}

function ChapterView({ chapter, p, update }: { chapter: Chapter; p: JourneyProgress; update: (p: JourneyProgress) => void }) {
  const taskComplete = (t: Task) => accepts(t,p.answers[taskKey(chapter,t)]) || (t.kind==='reflection' && p.reflectionDone?.includes(taskKey(chapter,t)) === true);
  const firstOpen = chapter.tasks.findIndex(t => !taskComplete(t));
  const [taskIndex, setTaskIndex] = useState(firstOpen < 0 ? chapter.tasks.length - 1 : firstOpen);
  const [draftEdited, setDraftEdited] = useState(false);
  const task = chapter.tasks[taskIndex];
  const a = p.answers[taskKey(chapter, task)];
  const accepted = taskComplete(task) && !draftEdited;
  const complete = p.completed.includes(chapter.id);
  const next = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const changeTask = (i: number) => { setDraftEdited(false); setTaskIndex(i); };
  useEffect(() => { stepHeading.current?.focus({ preventScroll: true }); }, [taskIndex]);
  const idx = CHAPTERS.indexOf(chapter);
  const earlierUndone = idx > 0 && !CHAPTERS.slice(0, idx).some((c) => p.completed.includes(c.id));
  const lessonMod = LEARN_MODULES.find((m) => m.key === chapter.lesson);
  return <>
    {earlierUndone && <p className="deal-builds-on" role="note">This chapter builds on chapters 1 to {idx}. <a href={journeyHref()}>Start at chapter 1&nbsp;→</a></p>}
    {lessonMod && <p className="deal-lesson-first">Learn this first: <a href={`#/learn/${lessonMod.key}`}>{lessonMod.title}</a>{lessonByKey(lessonMod.key) ? ` (${lessonByKey(lessonMod.key)!.minutes} min)` : ''}</p>}
    <div className="deal-evidence"><p className="deal-kicker">WHAT YOU KNOW</p><ul>{chapter.facts.map((f) => <li key={f}>{f}</li>)}</ul></div>
    {chapter.phase === 'contract' && <p className="deal-parallel"><strong>Keep the other work moving.</strong> Deposit, inspection, loan and title tasks run together; confirm every applicable deadline.</p>}
    <section className="deal-task-card" aria-labelledby="deal-question"><div className="deal-task-top"><span>YOUR DECISION</span><span>{taskIndex + 1} of {chapter.tasks.length} in this chapter</span></div><h2 id="deal-question" ref={stepHeading} tabIndex={-1}>{task.question}</h2>{task.kind==='reflection' && !a && taskComplete(task) && <p className="deal-input-hint">Your self-review completion was saved. Its written answer was not stored in the account. You can continue, or write a new explanation to review it again.</p>}<TaskView key={task.id} task={task} answer={a} onDraftEdited={setDraftEdited} onAnswer={(answer) => update(answerTask(p, chapter, task, answer))} />
      {accepted && <div className="deal-task-next">{taskIndex < chapter.tasks.length - 1 ? <button type="button" className="btn deal-primary" onClick={() => changeTask(taskIndex + 1)}>Next decision →</button> : complete ? <><p className="deal-saved"><span aria-hidden>✓</span> {chapter.output}</p><a className="btn deal-primary" href={journeyHref(next?.id ?? 'workbook')}>{next?.id === 'parallel' ? 'Try the alternate purchase' : next ? 'Continue' : 'See your workbook'} →</a>{next?.id === 'parallel' && <p className="deal-alternate">We’ll simulate a $260,000 agreement. Your original decision stays saved.</p>}</> : <p>Review the other decisions in this chapter before continuing.</p>}</div>}
      {chapter.tasks.length > 1 && <nav className="deal-task-nav" aria-label="Decisions in this chapter">{chapter.tasks.map((t, i) => <button key={t.id} type="button" onClick={() => changeTask(i)} aria-current={i === taskIndex ? 'step' : undefined}>{taskComplete(t) ? '✓ ' : ''}Decision {i + 1}</button>)}</nav>}
    </section>
    <p className="deal-local"><strong>For a real property:</strong> {chapter.local}</p>
  </>;
}

function TaskView({ task, answer, onAnswer, onDraftEdited }: { task: Task; answer: Answer | undefined; onAnswer: (a: Answer) => void; onDraftEdited: (edited: boolean) => void }) {
  const [draft, setDraft] = useState(typeof answer === 'number' || typeof answer === 'string' ? String(answer) : '');
  const [checks, setChecks] = useState<string[]>(Array.isArray(answer) ? answer : []);
  const [error, setError] = useState('');
  const [reviewed, setReviewed] = useState(task.kind === 'reflection' && accepts(task, answer));
  const [edited, setEdited] = useState(false);
  const editDraft = () => { setEdited(true); onDraftEdited(true); };
  const submitAnswer = (a: Answer) => { onAnswer(a); setEdited(false); onDraftEdited(false); };
  const accepted = accepts(task, answer);
  const checkOptions = (task.checks ?? []).flatMap((x, i) => task.distractors?.[i] ? [x, task.distractors[i]] : [x]);
  const choice = task.kind === 'choice' && typeof answer === 'number' ? task.options?.[answer] : null;
  const submitted = answer !== undefined;
  const feedback = edited ? '' : choice?.feedback ?? (accepted ? task.explanation : submitted ? task.kind === 'check' ? 'Some required checks are missing or an unsupported shortcut is selected. Review your choices.' : 'Not quite. Check the amounts and what is included, then try again. Open the explanation if you need a hand.' : '');
  return <>
    {task.kind === 'choice' ? <div className="deal-options">{task.options?.map((o, i) => <button type="button" key={o.text} aria-pressed={answer === i} className={`deal-option${answer === i ? ' selected' : ''}`} onClick={() => onAnswer(i)}><span className="deal-option-mark" aria-hidden>{answer === i ? '●' : '○'}</span>{o.text}</button>)}</div> : task.kind === 'check' ? <form onSubmit={(e) => { e.preventDefault(); if (!accepts(task, checks)) { setError(task.distractors?.length ? 'Select all supported checks and leave out the unsupported shortcuts.' : 'Check each applicable item before saving this practice checklist.'); return; } setError(''); onAnswer(checks); }}><div className="deal-checks">{checkOptions.map((x) => <label key={x}><input type="checkbox" checked={checks.includes(x)} onChange={(e) => { const nextChecks = e.target.checked ? [...checks, x] : checks.filter((v) => v !== x); setChecks(nextChecks); if (answer !== undefined) onAnswer(nextChecks); setError(''); }} />{x}</label>)}</div><button type="submit" className="btn btn-secondary">Save practice checklist</button></form> : <form onSubmit={(e) => { e.preventDefault(); if (task.kind === 'reflection') { if (draft.trim().length < 40 || !reviewed) { setError('Add your reasoning and review it against the checks shown.'); return; } setError(''); submitAnswer(draft.trim()); } else { const input = draft.replace(/[$,]/g, '').trim(); const value = Number(input); if (!input || !Number.isFinite(value)) { setError('Enter a number. Use a minus sign for a shortfall.'); return; } setError(''); submitAnswer(value); } }}>
      {task.kind === 'reflection' ? <><label className="deal-input-label" htmlFor="deal-answer">Your reasoning</label><textarea id="deal-answer" value={draft} maxLength={2000} rows={4} onChange={(e) => { setDraft(e.target.value); editDraft(); setReviewed(false); setError(''); }} placeholder="I would pass, revise or proceed because…" /><label className="deal-review-check"><input type="checkbox" checked={reviewed} onChange={(e) => { setReviewed(e.target.checked); editDraft(); }} />{task.reviewChecks ? 'I reviewed my explanation against the checks below.' : 'I included a financial result, a risk, and a source or professional to consult.'}</label>{task.reviewChecks && <ul className="deal-input-hint">{task.reviewChecks.map((x) => <li key={x}>{x}</li>)}</ul>}</> : <><label className="deal-input-label" htmlFor="deal-answer">Your answer in dollars</label><div className="deal-number-row"><span aria-hidden>$</span><input id="deal-answer" type="text" inputMode="decimal" value={draft} maxLength={30} aria-describedby="deal-answer-hint" onChange={(e) => { setDraft(e.target.value); editDraft(); setError(''); }} placeholder="0.00" /><button type="submit" className="btn deal-primary">Check my number</button></div><p id="deal-answer-hint" className="deal-input-hint">Use a minus sign if the result is below zero.</p></>}
      {task.kind === 'reflection' && <p className="deal-input-hint">This is your self-review. Your explanation stays in this visit (or on this device without an account) and can be downloaded; it does not grade your judgment or approve a purchase.</p>}
      {task.kind === 'reflection' && <button type="submit" className="btn deal-primary">Save my reasoning</button>}
    </form>}
    {edited && submitted && <p className="deal-input-hint" role="status">You edited this answer. {task.kind === 'reflection' ? 'Review and save it' : 'Check your new number'} before continuing. Your last saved answer remains in the workbook.</p>}
    {error && <p role="alert" className="deal-input-error">{error}</p>}
    {feedback && <div className={`deal-feedback${accepted ? ' accepted' : ''}`} role="status"><strong>{accepted ? task.kind === 'reflection' ? 'Reasoning saved' : 'You’ve got it' : 'Take another look'}</strong><p>{feedback}</p></div>}
  </>;
}

function DealLab({ p, update }: { p: JourneyProgress; update: (p: JourneyProgress) => void }) {
  const v = p.lab; const result = calculateDeal(v);
  const set = (key: keyof LabInputs, value: number) => update({ ...p, lab: { ...v, [key]: value } });
  return <section className="deal-lab" aria-labelledby="deal-lab-title"><p className="deal-kicker">WHAT-IF LAB</p><h2 id="deal-lab-title">Change one thing.</h2><p>Explore the effect. This lab is separate from the chapter’s fixed exercise answers.</p><div className="deal-lab-presets"><button type="button" onClick={() => update({ ...p, lab: { ...DEFAULT_LAB } })}>Asking price</button><button type="button" onClick={() => update({ ...p, lab: { ...DEFAULT_LAB, price: 260000 } })}>Lower price</button><button type="button" onClick={() => update({ ...p, lab: { ...v, rent: 2400, vacancy: 10 } })}>Income setback</button></div>
    <label>Price <strong>{money(v.price)}</strong><input aria-label="Lab purchase price" type="range" min={200000} max={350000} step={1000} value={v.price} onChange={(e) => set('price', Number(e.target.value))} /></label>
    <label>Monthly rent <strong>{money(v.rent)}</strong><input aria-label="Lab monthly rent" type="range" min={1800} max={3000} step={25} value={v.rent} onChange={(e) => set('rent', Number(e.target.value))} /></label>
    <label>Empty months and unpaid rent <strong>{v.vacancy}%</strong><input aria-label="Lab vacancy percentage" type="range" min={0} max={20} step={1} value={v.vacancy} onChange={(e) => set('vacancy', Number(e.target.value))} /></label>
    <label>Interest rate <strong>{v.rate}%</strong><input aria-label="Lab interest rate" type="range" min={0} max={15} step={.25} value={v.rate} onChange={(e) => set('rate', Number(e.target.value))} /></label>
    <div className="deal-lab-result" role="status" aria-live="polite" aria-atomic="true"><span>Left each month after all costs</span><strong>{money(result.cash)}<small>/month</small></strong><span>{result.cash >= 150 ? 'Meets this investor’s $150 base-case target.' : 'Below this investor’s $150 target.'} Other risks still need review.</span><span>Cash this plan uses: <b>{money(result.initialCash)}</b> of the $110,000 budget.{result.initialCash > 110000 ? ` ${money(result.initialCash - 110000)} over budget: rework the cash plan even if the monthly amount meets the target.` : ' Within the budget.'} Not counting costs while you repair and find a tenant.</span></div>
    <details><summary>See the calculation</summary><dl><div><dt>Rent after empty months</dt><dd>{money(result.income)}</dd></div><div><dt>Running costs</dt><dd>{money(result.operating)}</dd></div><div><dt>Left before the loan payment (NOI)</dt><dd>{money(result.noi)}</dd></div><div><dt>Loan payment (principal and interest)</dt><dd>{money(result.debt)}</dd></div><div><dt>Savings for big replacements</dt><dd>$125.00</dd></div></dl><p>Loan: 75% of the price, paid off over 30 years. Management: 8% of the full rent. Other running costs: $575 a month. No HOA or mortgage insurance here. Taxes and insurance are part of running costs. Cash this plan uses: 25% down, $8,000 closing costs, $12,000 repairs and the $15,000 property reserve. This lab uses the first repair budget, not the later $22,000 one. Costs while you repair and find a tenant aren’t included; budget them separately before a real purchase. Made-up numbers, not lender rules.</p></details>
  </section>;
}

function Workbook({ p }: { p: JourneyProgress }) {
  return <section className="deal-workbook"><div className="deal-workbook-summary"><div><p className="deal-kicker">YOUR PRACTICE FILE</p><h2>{p.completed.length === CHAPTERS.length ? 'You built a decision.' : 'Your work so far.'}</h2><p>Original asking-price decision: <strong>{originalDecision(p)}</strong>. The later purchase is an alternate simulation.</p><p>Completion means practice, not a real-property approval or readiness certification.</p></div><div className="deal-workbook-actions"><button type="button" className="btn" onClick={() => downloadText('deedowl-practice-workbook.txt', workbookText(p))}>Download workbook</button>{p.completed.length === CHAPTERS.length ? <><a className="btn" href="#/practice/case">Next, part 2: do the paperwork for a purchase →</a> <a className="btn btn-secondary" href={journeyHref('specialties')}>Try a specialty →</a></> : <a className="btn btn-secondary" href={journeyHref(resumeChapter(p))}>Continue practicing →</a>}</div></div>
    <div className="deal-workbook-list">{CHAPTERS.map((c, i) => <details key={c.id}><summary><span className="deal-workbook-num">{p.completed.includes(c.id) ? '✓' : i + 1}</span><span>{c.title}<small>{p.completed.includes(c.id) ? c.output : 'Not complete yet'}</small></span></summary>{c.tasks.map((t) => { const a = p.answers[taskKey(c, t)]; const text = t.kind === 'choice' && typeof a === 'number' ? t.options?.[a]?.text : Array.isArray(a) ? a.join('; ') : a; return <div key={t.id} className="deal-workbook-answer"><strong>{t.question}</strong><p>{text ?? 'Not answered'}{a !== undefined && !accepts(t, a) ? ' — needs review' : ''}</p></div>; })}<p><strong>Local check:</strong> {c.local}</p><a href={journeyHref(c.id)}>Revisit this chapter →</a></details>)}</div><p className="deal-local">{LOCAL_NOTE}</p><p>For a real candidate, use <a href="#/toolkit">My plan</a> and verify fresh evidence. Practice answers do not complete your real transaction tasks.</p></section>;
}

function SpecialtyView({ p, update }: { p: JourneyProgress; update: (p: JourneyProgress) => void }) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [state] = useMyState();
  const specialties = SPECIALTIES.filter((x) => x.id !== 'lien' || state === 'AZ');
  const s = specialties.find((x) => x.id === p.specialty);
  return <section className="deal-specialties"><p>These short challenges show what changes. They are starting points, not complete specialty courses or local transaction instructions.</p><div className="deal-specialty-grid">{specialties.map((x) => <button type="button" key={x.id} aria-pressed={x.id === s?.id} onClick={() => { update({ ...p, specialty: x.id }); setSelectedAnswer(null); }}><span>{x.title}</span><span aria-hidden>{p.specialtyDone.includes(x.id) ? '✓' : '↗'}</span></button>)}</div>{s && <section className="deal-task-card" aria-labelledby="specialty-question"><p className="deal-kicker">{s.title} · FICTIONAL CHALLENGE</p><p>{s.facts}</p><h2 id="specialty-question">{s.question}</h2><div className="deal-options">{[s.wrong, s.answer].map((a, i) => <button type="button" key={a} className="deal-option" aria-pressed={selectedAnswer === i} onClick={() => { setSelectedAnswer(i); if (i === 1) update({ ...p, specialtyDone: [...new Set([...p.specialtyDone, s.id])] }); }}>{a}</button>)}</div>{selectedAnswer !== null && <div className="deal-feedback" role="status"><strong>{selectedAnswer === 1 ? 'You spotted the difference.' : 'Take another look.'}</strong><p>{s.explanation}</p>{selectedAnswer === 1 && <a href={s.href}>Explore the related lesson or sale guide →</a>}</div>}{s.id === 'lien' && <p><a href={SOURCES.find((x) => x.id === 'lien')!.url} target="_blank" rel="noopener noreferrer">Official Arizona certificate statute ↗</a> — an example, not a national rule.</p>}<p className="deal-local">{LOCAL_NOTE}</p></section>}</section>;
}

/** One clear entry point, used on Learn and Practice. No new top-level navigation item. */
export function DealJourneyEntry({ compact = false }: { compact?: boolean }) {
  const [p] = useState(loadJourney);
  const started = Object.keys(p.answers).length > 0;
  return <section className={`deal-entry${compact ? ' compact' : ''}`} aria-label="Build your first deal"><div><p className="deal-kicker">PRACTICE PART 1 · CEDAR HOUSE (THE DECISIONS) · FICTIONAL</p><h2>Build your first deal.</h2><p>One property, one decision at a time. Check the numbers, handle surprises, and save your reasoning as you learn.</p><a className="btn deal-primary" href={journeyHref(started ? resumeChapter(p) : undefined)}>{p.completed.length === CHAPTERS.length ? 'Review your deal' : started ? 'Continue your deal' : 'Meet your practice property'} →</a><span className="deal-entry-note">{started ? `${p.completed.length} of ${CHAPTERS.length} skills practiced` : 'About 30 minutes in all: 15 short chapters, one decision at a time. No signup.'}</span></div>{!compact && <div className="deal-entry-art"><CedarDrawing /><span>CEDAR HOUSE / PRACTICE FILE 01</span></div>}</section>;
}
