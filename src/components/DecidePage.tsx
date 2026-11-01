import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useRef, useState } from 'react';
import { getMode, practicePart2Done, readLessons, useLastActivity } from '../lib/journey';
import { planNow } from '../lib/planNext';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import { useMarkStep, stepEyebrow } from '../lib/path';
import { linkLabel } from '../lib/linkLabel';
import { creditStep } from '../lib/roadmapState';
import { DECIDE_KEY, joinReasons, notYetWhy, QUESTIONS, rank, stateNote, type Answers } from '../lib/decide';
import { strategyHref } from '../lib/strategies';
import { stateByCode, type StateCode } from '../lib/regions';
import { getMyState, setMyState } from '../lib/myState';
import CheckFold from './CheckFold';
import AdSpot from './AdSpot';

/** Auctions aren't automatically cheaper: said wherever the strategy appears. */
const AUCTION_REALITY = 'Are auctions cheaper? Sometimes, but not by default. Most auctions want full payment in certified funds the same day or within a day, with no loan, and you buy as-is, often without seeing inside. Bidding usually rises toward what buyers think the property is worth after its liens, repairs and risks, and many sales are postponed or cancelled. The opening bid isn’t the price.';

interface Saved {
  answers: Answers;
  done: string[];
}

function load(): Saved {
  const mine = getMyState();
  try {
    const v = JSON.parse(localStorage.getItem(DECIDE_KEY) ?? 'null');
    if (v && typeof v === 'object') {
      // Keep only answers that match a question's options, so old or restored data can't break the page.
      const answers: Answers = {};
      for (const q of QUESTIONS) {
        const a = v.answers?.[q.key];
        if (typeof a === 'string' && q.options.some((o) => o.value === a)) answers[q.key] = a;
      }
      return { answers: { ...answers, ...(mine ? { state: mine } : {}) }, done: Array.isArray(v.done) ? v.done.filter((x: unknown): x is string => typeof x === 'string') : [] };
    }
  } catch {
    /* ignore */
  }
  return { answers: mine ? { state: mine } : {}, done: [] };
}

/** Checklist items the site can see you've done: a lesson read ("Read …" linking to it) or a practice purchase
 *  finished ("Practice …" linking to Practice). */
function seenDone(c: { id?: string; text: string; href?: string }): boolean {
  // Items the site tracks by name: the practice purchase (the lessons item also asks for your strategy's lessons).
  if (c.id === 'pr-practice') return practicePart2Done();
  const lesson = c.href?.match(/^#\/learn\/([a-z-]+)$/);
  // Only an item about one lesson: "Read the lessons on X and Y" stays yours to tick.
  if (lesson && /^(Read|Learn)\b/.test(c.text) && !/\blessons\b/.test(c.text)) return readLessons().includes(lesson[1]);
  if (c.href === '#/practice' && /^Practice\b/.test(c.text)) return practicePart2Done();
  return false;
}

function save(s: Saved) {
  try {
    localStorage.setItem(DECIDE_KEY, JSON.stringify(s));
    // Finishing Decide is the roadmap's "Choose one strategy" step.
    if (QUESTIONS.every((q) => typeof s.answers[q.key] === 'string')) creditStep('strategy');
  } catch {
    /* private mode: not kept */
  } finally {
    // The header's Continue and Home move on to the next step right away.
    window.dispatchEvent(new CustomEvent('deedowl:journey'));
  }
}

/** Step 1 of the path: a few questions, then the strategies that fit and a checklist for each. */
export default function DecidePage() {
  useMarkStep('decide');
  useLastActivity('#/decide', 'Decide: which strategy fits you');
  const [saved, setSaved] = useState<Saved>(load);
  const complete = QUESTIONS.every((q) => saved.answers[q.key]);
  const [step, setStep] = useState(() => (complete ? QUESTIONS.length : QUESTIONS.findIndex((q) => !saved.answers[q.key])));
  const headRef = useRef<HTMLHeadingElement>(null);
  // The state was already chosen when the visitor arrived (it's filled in): don't ask it again.
  const skips = (i: number) => QUESTIONS[i]?.key === 'state' && !!getMyState() && !!saved.answers.state;
  const nextFrom = (i: number) => (skips(i + 1) ? i + 2 : i + 1);
  const prevFrom = (i: number) => (skips(i - 1) ? i - 2 : i - 1);
  // How many questions this visitor is actually asked, for the counter and the intro.
  const total = QUESTIONS.filter((_, i) => !skips(i)).length;
  const asked = QUESTIONS.slice(0, step + 1).filter((_, i) => !skips(i)).length;

  useEffect(() => save(saved), [saved]);
  // Every move between questions, forward or back, puts focus on the question (not on the first load).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headRef.current?.focus();
  }, [step]);

  const answer = (key: string, value: string) => {
    setSaved((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
    if (key === 'state') setMyState(value as StateCode);
  };
  // Tapping or clicking an answer moves on by itself; Back changes it. Arrow keys only select (they move between
  // radio buttons), so keyboard users go on with Next. Going to a fixed step means a double click can't skip one.
  const advanceFrom = (from: number) => {
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep((s) => (s === from ? nextFrom(from) : s)), 250);
  };
  // Only a primary click or tap that selects an answer moves on (not a right-click, not arrow keys).
  const pointerPick = useRef(false);
  const advanceTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);
  const toggle = (id: string) => setSaved((s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] }));

  const q = QUESTIONS[step];
  const matches = step >= QUESTIONS.length ? rank(saved.answers).slice(0, 3) : [];
  // The same “What you keep owing” warning on two or more cards is shown once, above them.
  const owing = matches.map((m) => m.strategy.risk.ongoing).filter((x): x is string => !!x);
  const sharedOwing = owing.find((x) => owing.filter((y) => y === x).length > 1);
  const stateName = stateByCode(saved.answers.state ?? '')?.name;

  return (
    <main className="page decide">
      <PageHero
        eyebrow={<span className="eyebrow">{stepEyebrow('decide')}</span>}
        title={<>Decide <span className="grad">your focus</span></>}
        sub={q ? `Answer ${total === 9 ? 'nine' : total === 8 ? 'eight' : total} quick questions about your money, time and goals. You’ll get the strategies that fit best and a checklist for each.` : undefined}
      />

      {q ? (
        <section className="decide-card" aria-labelledby="decide-q">
          <p className="decide-progress">
            Question {asked} of {total}
            <span className="decide-bar" aria-hidden><span style={{ width: `${(asked / total) * 100}%` }} /></span>
          </p>
          <fieldset>
            <legend>
              <h2 id="decide-q" ref={headRef} tabIndex={-1}>{q.ask}</h2>
            </legend>
            {q.help && <p className="muted">{q.help}</p>}
            <div className="decide-options">
              {q.options.map((o) => (
                <label key={o.value} className={`decide-option${saved.answers[q.key] === o.value ? ' on' : ''}`} onPointerDown={(e) => { pointerPick.current = e.button === 0; }}>
                  <input
                    type="radio"
                    name={q.key}
                    value={o.value}
                    checked={saved.answers[q.key] === o.value}
                    onChange={() => answer(q.key, o.value)}
                    onClick={() => {
                      if (!pointerPick.current) return;
                      pointerPick.current = false;
                      advanceFrom(step);
                    }}
                  />
                  <span>{o.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="decide-nav">
            {step > 0 && <button type="button" className="btn btn-secondary" onClick={() => setStep(Math.max(0, prevFrom(step)))}>← Back</button>}
            <button type="button" className="btn" disabled={!saved.answers[q.key]} onClick={() => setStep(nextFrom(step))}>
              {nextFrom(step) >= QUESTIONS.length ? 'See my results\u00a0→' : 'Next\u00a0→'}
            </button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="decide-results">
          <h2 id="decide-results" ref={headRef} tabIndex={-1} className="decide-results-title">Strategies that fit you{stateName ? ` in ${stateName}` : ''}</h2>
          <p className="muted">Ranked from your answers. This is a starting point, not advice; talk with qualified professionals before you commit money.</p>
          {notYetWhy(saved.answers) && (
            <OwlNote>
              <strong>Worth checking first: {notYetWhy(saved.answers) === 'debt' ? 'your debt' : notYetWhy(saved.answers) === 'nofund' ? 'your emergency fund' : 'your savings'}.</strong>{' '}
              {notYetWhy(saved.answers) === 'debt'
                ? 'High-interest debt can cost more each year than a rental earns,* and lenders count it against you. Many people pay it down before buying; your situation, finances and risk tolerance decide what fits you.'
                : notYetWhy(saved.answers) === 'nofund'
                  ? 'Every strategy has surprises. Without an emergency fund, one vacancy or repair can force you to borrow at high rates or sell at a loss. Many investors build one first; what fits depends on your situation.'
                  : 'Under $10,000 makes most purchases hard: an auction wants the full price in cash within days, and a loan needs a down payment, closing costs and reserves. Some low-down-payment programs exist; a loan officer can tell you what you’d qualify for.'}{' '}
              Meanwhile, learn and practice for free. <a href="#/learn/financing">Compare financing options&nbsp;→</a>{' '}<a href="#/learn/red-flags">Seminar red flags&nbsp;→</a>
            </OwlNote>
          )}
          {sharedOwing && (
            <OwlNote>
              <strong>What you keep owing with {joinReasons(matches.filter((m) => m.strategy.risk.ongoing === sharedOwing).map((m) => m.strategy.title))}:</strong> {sharedOwing}
            </OwlNote>
          )}
          <ol className="decide-matches">
            {matches.map((m, i) => {
              const note = stateNote(m.strategy.key, saved.answers.state);
              const doneCount = m.strategy.checklist.filter((c) => saved.done.includes(c.id) || seenDone(c)).length;
              return (
                <li key={m.strategy.key} className="decide-match">
                  <div className="decide-match-head">
                    <span className="path-n" aria-hidden>{i + 1}</span>
                    <div>
                      <h3>{m.strategy.title}</h3>
                      {i > 0 && m.cautions.length > 0 && <p className="decide-later">Could fit later</p>}
                      <p>{m.strategy.what} {m.strategy.key !== 'practice' && <a href={strategyHref(m.strategy.key)}>How it makes money&nbsp;→</a>}</p>
                    </div>
                  </div>
                  {m.fits.length > 0 && <p className="decide-why"><strong>Fits you</strong> because you {joinReasons(m.fits)}.</p>}
                  {m.cautions.length > 0 && <p className="decide-why caution"><strong>Holding it back:</strong> you {joinReasons(m.cautions)}.</p>}
                  {note && <p className="decide-note">{note}</p>}
                  {m.strategy.key === 'auction' && <p className="decide-note">{AUCTION_REALITY}</p>}
                  <dl className="decide-risk" aria-label="Risk check">
                    <div><dt>What could go seriously wrong</dt><dd>{m.strategy.risk.worst}</dd></div>
                    <div><dt>Cash needed to start</dt><dd>{m.strategy.risk.atRisk}</dd></div>
                    {m.strategy.risk.ongoing && m.strategy.risk.ongoing !== sharedOwing && <div><dt>What you keep owing</dt><dd>{m.strategy.risk.ongoing}</dd></div>}
                    <div><dt>Time to a first deal</dt><dd>{m.strategy.risk.time}</dd></div>
                  </dl>
                  <CheckFold title="Your checklist" done={doneCount} total={m.strategy.checklist.length} open={i === 0}>
                  <ul className="decide-checklist">
                    {m.strategy.checklist.map((c) => (
                      <li key={c.id}>
                        <label>
                          <input type="checkbox" checked={saved.done.includes(c.id) || seenDone(c)} disabled={seenDone(c)} onChange={() => toggle(c.id)} />
                          <span>{c.text}{seenDone(c) && <span className="muted"> (done: the site saw you finish it)</span>}</span>
                        </label>
                        {c.href && <a href={c.href}>{linkLabel(c.href)}&nbsp;→</a>}
                      </li>
                    ))}
                  </ul>
                  </CheckFold>
                </li>
              );
            })}
          </ol>
          <details className="decide-others">
            <summary>Other strategies, and why they rank lower for you</summary>
            <ul>
              {rank(saved.answers).slice(3).map((m) => (
                <li key={m.strategy.key}>
                  <strong>{m.strategy.title}.</strong> {m.cautions.length ? `Ranks lower because you ${joinReasons(m.cautions)}.` : 'It fits your answers less well than the three above.'}
                  {m.strategy.key === 'auction' && <> {AUCTION_REALITY}</>}
                </li>
              ))}
            </ul>
          </details>
          <div className="decide-nav">
            {getMode() === 'guided' ? (() => { const plan = planNow(); return <a className="btn" href={plan.task.href}>Next: {plan.task.label}&nbsp;→</a>; })() : <><a className="btn" href="#/learn">Next: step 2 of 6 · Learn&nbsp;→</a> <a href="#/toolkit/buy-box">Write your buy box (your price, area and deal-breakers)&nbsp;→</a></>}
            <a href="#/toolkit/cash">Turn your cash range into one number (2 minutes)&nbsp;→</a>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>Change my answers</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSaved({ answers: {}, done: [] });
                setStep(0);
              }}
            >
              Start over
            </button>
          </div>
          <p className="muted">Your answers are kept in this browser. To keep a copy, <a href="#/toolkit/backup">download your progress</a> in My plan.</p>
        </section>
      )}
      <AdSpot spot="decide" />
    </main>
  );
}
