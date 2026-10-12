import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useRef, useState } from 'react';
import { proGuideByKey } from '../lib/proGuide';
import { resolved, TEAM_QUESTIONS, teamFor, UNSURE, type TeamAnswers } from '../lib/teamBuilder';

const KEY = 'deedowl.team.v1';

function load(): TeamAnswers {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    const out: TeamAnswers = {};
    for (const q of TEAM_QUESTIONS) {
      const a = v[q.key];
      if (typeof a === 'string' && (a === UNSURE || q.options.some((o) => o.value === a))) out[q.key] = a;
    }
    return out;
  } catch {
    return {};
  }
}

/** One question at a time; then the team that fits the answers, with a way to see everyone. */
export default function TeamBuilder() {
  const [answers, setAnswers] = useState<TeamAnswers>(load);
  const [step, setStep] = useState(() => TEAM_QUESTIONS.findIndex((q) => !load()[q.key]));
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(answers));
    } catch {
      /* private mode: not kept */
    }
  }, [answers]);
  const done = step === -1 || step >= TEAM_QUESTIONS.length;
  const q = done ? null : TEAM_QUESTIONS[step];
  const picked = q ? answers[q.key] : undefined;
  const suggestion = q && picked === UNSURE ? q.suggest(resolved(answers)) : null;
  const next = () => setStep((s) => (s + 1 >= TEAM_QUESTIONS.length ? -1 : s + 1));
  // Choosing an answer moves on by itself (Back changes it); "I'm not sure" waits so the suggestion can be read.
  const choose = (v: string) => {
    setAnswers((a) => ({ ...a, [q!.key]: v }));
    const from = step;
    window.clearTimeout(timer.current);
    if (v !== UNSURE) timer.current = window.setTimeout(() => { moved.current = true; setStep((s) => (s !== from ? s : from + 1 >= TEAM_QUESTIONS.length ? -1 : from + 1)); }, 250);
  };
  // After moving on, focus goes to the new question (not a button that now means a different answer); a pending move
  // is cancelled by Back, Close or leaving the page.
  const timer = useRef<number | undefined>(undefined);
  const moved = useRef(false);
  const progress = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (moved.current) progress.current?.focus();
    moved.current = false;
  }, [step]);
  const final = resolved(answers);
  const labelOf = (key: keyof TeamAnswers) => TEAM_QUESTIONS.find((x) => x.key === key)!.options.find((o) => o.value === final[key])?.label ?? '';

  return (
    <section className="team-builder" aria-labelledby="team-builder-head">
      <h2 id="team-builder-head">Who you need</h2>
      {q ? (
        <>
          <p className="team-progress" ref={progress} tabIndex={-1}>Question {step + 1} of {TEAM_QUESTIONS.length}</p>
          <fieldset className="team-q" key={q.key}>
            <legend>{q.question}</legend>
            <div className="team-options">
              {q.options.map((o) => (
                <button key={o.value} type="button" aria-pressed={picked === o.value} onClick={() => choose(o.value)}>
                  <strong>{o.label}</strong>
                  {o.hint && <span>{o.hint}</span>}
                </button>
              ))}
              <button type="button" aria-pressed={picked === UNSURE} onClick={() => choose(UNSURE)}>
                <strong>I’m not sure</strong>
                <span>We’ll suggest one</span>
              </button>
            </div>
          </fieldset>
          {suggestion && (
            <p className="team-suggest" role="status">
              <strong>Our suggestion: {q.options.find((o) => o.value === suggestion.value)?.label}.</strong> {suggestion.why}{' '}
              <button type="button" className="linkish" onClick={() => choose(suggestion.value)}>Use this</button>
            </p>
          )}
          <div className="decide-nav">
            {step > 0 && <button type="button" className="btn btn-secondary" onClick={() => { window.clearTimeout(timer.current); setStep((s) => s - 1); }}>Back</button>}
            <button type="button" className="btn" disabled={!picked} onClick={next}>{step + 1 === TEAM_QUESTIONS.length ? 'Show my team' : 'Next'}</button>
          </div>
        </>
      ) : (
        <>
          <p>
            For <strong>{labelOf('property').replace(/^A /, 'a ').replace(/^An /, 'an ')}</strong>, bought <strong>{labelOf('buy').toLowerCase()}</strong>, paid <strong>{final.pay === 'cash' ? 'with cash' : 'with a loan'}</strong>, to <strong>{labelOf('plan').toLowerCase()}</strong>.{' '}
            <button type="button" className="linkish" onClick={() => setStep(0)}>Change my answers</button>
          </p>
          <ol className="team-result">
            {teamFor(answers).map((t, i) => {
              const g = proGuideByKey(t.pro)!;
              return (
                <li key={t.pro}>
                  <span className="team-n" aria-hidden>{i + 1}</span>
                  <span className="team-body">
                    <strong>{g.title}</strong>
                    <span>{t.why}</span>
                    <a href={`#/pros/${t.pro}`}>What they do and how to find one&nbsp;→</a>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
      <p className="team-all"><a href="#/pros">See everyone who could be on your team&nbsp;→</a></p>
    </section>
  );
}
