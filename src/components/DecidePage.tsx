import { useEffect, useRef, useState } from 'react';
import PageHero from './PageHero';
import PathNext from './PathNext';
import { useMarkStep } from '../lib/path';
import { DECIDE_KEY, QUESTIONS, rank, stateNote, type Answers } from '../lib/decide';
import { stateByCode, type StateCode } from '../lib/regions';
import { getMyState, setMyState } from '../lib/myState';

interface Saved {
  answers: Answers;
  done: string[];
}

function load(): Saved {
  const mine = getMyState();
  try {
    const v = JSON.parse(localStorage.getItem(DECIDE_KEY) ?? 'null');
    if (v && typeof v === 'object') return { answers: { ...(v.answers ?? {}), ...(mine ? { state: mine } : {}) }, done: Array.isArray(v.done) ? v.done : [] };
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
  const toggle = (id: string) => setSaved((s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] }));

  const q = QUESTIONS[step];
  const matches = step >= QUESTIONS.length ? rank(saved.answers).slice(0, 3) : [];
  const stateName = stateByCode(saved.answers.state ?? '')?.name;

  return (
    <main className="page decide">
      <PageHero
        eyebrow={<span className="eyebrow">Step 2 of 6</span>}
        title={<>Decide <span className="grad">your focus</span></>}
        sub="Answer eight quick questions about your money, time and goals. You’ll get the strategies that fit best and a checklist for each."
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
                <label key={o.value} className={`decide-option${saved.answers[q.key] === o.value ? ' on' : ''}`}>
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
                      <p>{m.strategy.what}</p>
                    </div>
                  </div>
                  {m.fits.length > 0 && <p className="decide-why"><strong>Fits</strong> {m.fits.join('; ')}.</p>}
                  {m.cautions.length > 0 && <p className="decide-why caution"><strong>Watch</strong> {m.cautions.join('; ')}.</p>}
                  {note && <p className="decide-note">{note}</p>}
                  <h4>Your checklist <span className="muted">({doneCount} of {m.strategy.checklist.length} done)</span></h4>
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
