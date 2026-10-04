import { useEffect, useRef, useState } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import PathNext from './PathNext';
import OwlNote from './OwlNote';
import { useMarkStep } from '../lib/path';
import { DECIDE_KEY, QUESTIONS, rank, stateNote, type Answers } from '../lib/decide';
import { stateByCode, type StateCode } from '../lib/regions';
import { getMyState, setMyState } from '../lib/myState';
import CheckFold from './CheckFold';

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

function save(s: Saved) {
  try {
    localStorage.setItem(DECIDE_KEY, JSON.stringify(s));
  } catch {
    /* private mode: not kept */
  }
}

/** Step 2 of the path: a few questions, then the strategies that fit and a checklist for each. */
export default function DecidePage() {
  useMarkStep('decide');
  useLastActivity('#/decide', 'Decide: which strategy fits you');
  const [saved, setSaved] = useState<Saved>(load);
  const complete = QUESTIONS.every((q) => saved.answers[q.key]);
  const [step, setStep] = useState(() => (complete ? QUESTIONS.length : QUESTIONS.findIndex((q) => !saved.answers[q.key])));
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => save(saved), [saved]);
  useEffect(() => {
    if (step > 0) headRef.current?.focus();
  }, [step]);

  const answer = (key: string, value: string) => {
    setSaved((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
    if (key === 'state') setMyState(value as StateCode);
  };
  // Tapping or clicking an answer moves on by itself; Back changes it. Arrow keys only select (they move between
  // radio buttons), so keyboard users go on with Next. Going to a fixed step means a double click can't skip one.
  const advanceFrom = (from: number) => window.setTimeout(() => setStep((s) => (s === from ? from + 1 : s)), 250);
  const toggle = (id: string) => setSaved((s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] }));

  const q = QUESTIONS[step];
  const matches = step >= QUESTIONS.length ? rank(saved.answers).slice(0, 3) : [];
  const stateName = stateByCode(saved.answers.state ?? '')?.name;

  return (
    <main className="page decide">
      <PageHero
        eyebrow={<span className="eyebrow">Step 2 of 6</span>}
        title={<>Decide <span className="grad">your focus</span></>}
        sub="Answer nine quick questions about your money, time and goals. You’ll get the strategies that fit best and a checklist for each."
      />

      {q ? (
        <section className="decide-card" aria-labelledby="decide-q">
          <p className="decide-progress">
            Question {step + 1} of {QUESTIONS.length}
            <span className="decide-bar" aria-hidden><span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></span>
          </p>
          <fieldset>
            <legend>
              <h2 id="decide-q" ref={headRef} tabIndex={-1}>{q.ask}</h2>
            </legend>
            {q.help && <p className="muted">{q.help}</p>}
            <div className="decide-options">
              {q.options.map((o) => (
                <label key={o.value} className={`decide-option${saved.answers[q.key] === o.value ? ' on' : ''}`} onPointerUp={() => advanceFrom(step)}>
                  <input
                    type="radio"
                    name={q.key}
                    value={o.value}
                    checked={saved.answers[q.key] === o.value}
                    onChange={() => answer(q.key, o.value)}
                  />
                  <span>{o.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="decide-nav">
            {step > 0 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>← Back</button>}
            <button type="button" className="btn" disabled={!saved.answers[q.key]} onClick={() => setStep(step + 1)}>
              {step === QUESTIONS.length - 1 ? 'See my results →' : 'Next →'}
            </button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="decide-results">
          <h2 id="decide-results" ref={headRef} tabIndex={-1} className="decide-results-title">Strategies that fit you{stateName ? ` in ${stateName}` : ''}</h2>
          <p className="muted">Ranked from your answers. This is a starting point, not advice; talk with qualified professionals before you commit money.</p>
          {(saved.answers.ready === 'debt' || saved.answers.ready === 'nofund') && (
            <OwlNote>
              <strong>Not yet: build your cushion first.</strong>{' '}
              {saved.answers.ready === 'debt'
                ? 'Pay down high-interest debt before you buy. Card interest costs more than most deals earn, and a lender will count that debt against you.'
                : 'Save an emergency fund before you buy. Every strategy has surprises, and without savings a vacancy or a repair can force you to borrow at high rates or sell at a loss.'}{' '}
              Meanwhile, learn and practice for free. Never borrow on credit cards, home equity or a 401(k) to pay for courses or to bid. <a href="#/learn/red-flags">Seminar red flags →</a>
            </OwlNote>
          )}
          <ol className="decide-matches">
            {matches.map((m, i) => {
              const note = stateNote(m.strategy.key, saved.answers.state);
              const doneCount = m.strategy.checklist.filter((c) => saved.done.includes(c.id)).length;
              return (
                <li key={m.strategy.key} className="decide-match">
                  <div className="decide-match-head">
                    <span className="path-n" aria-hidden>{i + 1}</span>
                    <div>
                      <h3>{m.strategy.title}</h3>
                      {i > 0 && m.cautions.length > 0 && <p className="decide-later">Possible later, once the gaps under “Watch” are resolved</p>}
                      <p>{m.strategy.what}</p>
                    </div>
                  </div>
                  {m.fits.length > 0 && <p className="decide-why"><strong>Fits</strong> {m.fits.join('; ')}.</p>}
                  {m.cautions.length > 0 && <p className="decide-why caution"><strong>Watch</strong> {m.cautions.join('; ')}.</p>}
                  {note && <p className="decide-note">{note}</p>}
                  <dl className="decide-risk" aria-label="Risk check">
                    <div><dt>What could go seriously wrong</dt><dd>{m.strategy.risk.worst}</dd></div>
                    <div><dt>Cash needed to start</dt><dd>{m.strategy.risk.atRisk}</dd></div>
                    {m.strategy.risk.ongoing && <div><dt>What you keep owing</dt><dd>{m.strategy.risk.ongoing}</dd></div>}
                    <div><dt>Time to a first deal</dt><dd>{m.strategy.risk.time}</dd></div>
                  </dl>
                  <CheckFold title="Your checklist" done={doneCount} total={m.strategy.checklist.length} open={i === 0}>
                  <ul className="decide-checklist">
                    {m.strategy.checklist.map((c) => (
                      <li key={c.id}>
                        <label>
                          <input type="checkbox" checked={saved.done.includes(c.id)} onChange={() => toggle(c.id)} />
                          <span>{c.text}</span>
                        </label>
                        {c.href && <a href={c.href}>Go →</a>}
                      </li>
                    ))}
                  </ul>
                  </CheckFold>
                </li>
              );
            })}
          </ol>
          <div className="decide-nav">
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
          <p className="muted">Your answers and checked items are saved only in this browser.</p>
        </section>
      )}
      <PathNext step="decide" />
    </main>
  );
}
