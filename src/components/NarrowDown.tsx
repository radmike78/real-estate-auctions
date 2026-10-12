import { useEffect, useRef, useState } from 'react';
import { NOT_SURE, resolveAnswers, type NarrowConfig } from '../lib/narrow';

/**
 * "Not sure where to start?" at the top of a crowded page. Closed by default so the full page is still there;
 * opened, it asks a few questions one at a time and ends with two or three places to begin, each with the reason.
 */
export default function NarrowDown({ config, title = 'Not sure where to start?', intro }: { config: NarrowConfig; title?: string; intro: string }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const qs = config.questions;
  const done = step >= qs.length;
  const q = done ? null : qs[step];
  const picked = q ? answers[q.key] : undefined;
  const suggestion = q && picked === NOT_SURE ? q.suggest(resolveAnswers(config, answers)) : null;
  // Choosing an answer moves on by itself (Back changes it); "I'm not sure" waits so the suggestion can be read.
  const choose = (v: string) => {
    setAnswers((a) => ({ ...a, [q!.key]: v }));
    const from = step;
    window.clearTimeout(timer.current);
    if (v !== NOT_SURE) timer.current = window.setTimeout(() => { moved.current = true; setStep((s) => (s === from ? from + 1 : s)); }, 250);
  };
  // After moving on, focus goes to the new question (not a button that now means a different answer); a pending move
  // is cancelled by Back, Close or leaving the page.
  const timer = useRef<number | undefined>(undefined);
  const moved = useRef(false);
  const progress = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const resultHead = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    // The last answer opens the suggestions: focus moves there, since the question it answered is gone.
    if (moved.current) (step >= qs.length ? resultHead.current : progress.current)?.focus();
    moved.current = false;
  }, [step, qs.length, open]);
  const jump = (id: string) => { const target = document.getElementById(id); for (let p = target; p; p = p.parentElement) { if (p instanceof HTMLDetailsElement) p.open = true; } target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <section className="not-sure narrow" aria-labelledby="narrow-head">
      <h2 id="narrow-head">{title}</h2>
      {!open ? (
        <>
          <p>{intro}</p>
          <button type="button" className="btn" onClick={() => { moved.current = true; setOpen(true); }}>Help me choose&nbsp;→</button>
        </>
      ) : q ? (
        <>
          <p className="team-progress" ref={progress} tabIndex={-1}>Question {step + 1} of {qs.length}</p>
          <fieldset className="team-q" key={q.key}>
            <legend>{q.question}</legend>
            <div className="team-options">
              {q.options.map((o) => (
                <button key={o.value} type="button" aria-pressed={picked === o.value} onClick={() => choose(o.value)}>
                  <strong>{o.label}</strong>
                  {o.hint && <span>{o.hint}</span>}
                </button>
              ))}
              <button type="button" aria-pressed={picked === NOT_SURE} onClick={() => choose(NOT_SURE)}>
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
            <button type="button" className="btn btn-secondary" onClick={() => { window.clearTimeout(timer.current); if (step) setStep((s) => s - 1); else setOpen(false); }}>{step ? 'Back' : 'Close'}</button>
            <button type="button" className="btn" disabled={!picked} onClick={() => setStep((s) => s + 1)}>{step + 1 === qs.length ? 'Show me where to start' : 'Next'}</button>
          </div>
        </>
      ) : (
        <>
          <p ref={resultHead} tabIndex={-1}><strong>Start with the first one.</strong> The others are good next steps, and everything else is still on the page below.{' '}
            <button type="button" className="linkish" onClick={() => { setStep(0); setAnswers({}); }}>Start over</button>
          </p>
          <ol className="team-result">
            {config.result(resolveAnswers(config, answers)).map((r, i) => (
              <li key={r.label} className={i === 0 ? 'top' : undefined}>
                <span className="team-n" aria-hidden>{i + 1}</span>
                <span className="team-body">
                  {i === 0 && <span className="team-top">Start with this one</span>}
                  <strong>{r.label}</strong>
                  <span>{r.why}</span>
                  {r.href ? <a href={r.href} className={i === 0 ? 'btn' : undefined}>{i === 0 ? 'Start\u00a0→' : 'Go there\u00a0→'}</a> : r.scrollTo ? <button type="button" className="linkish" onClick={() => jump(r.scrollTo!)}>Show me on this page&nbsp;↓</button> : null}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
