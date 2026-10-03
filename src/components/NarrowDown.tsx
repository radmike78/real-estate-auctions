import { useState } from 'react';
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
  const choose = (v: string) => setAnswers((a) => ({ ...a, [q!.key]: v }));
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="not-sure narrow" aria-labelledby="narrow-head">
      <h2 id="narrow-head">{title}</h2>
      {!open ? (
        <>
          <p>{intro}</p>
          <button type="button" className="btn" onClick={() => setOpen(true)}>Help me choose →</button>
        </>
      ) : q ? (
        <>
          <p className="team-progress">Question {step + 1} of {qs.length}</p>
          <fieldset className="team-q">
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
            <button type="button" className="btn btn-secondary" onClick={() => (step ? setStep((s) => s - 1) : setOpen(false))}>{step ? 'Back' : 'Close'}</button>
            <button type="button" className="btn" disabled={!picked} onClick={() => setStep((s) => s + 1)}>{step + 1 === qs.length ? 'Show me where to start' : 'Next'}</button>
          </div>
        </>
      ) : (
        <>
          <p><strong>Start here.</strong> Everything else is still on the page below.{' '}
            <button type="button" className="linkish" onClick={() => { setStep(0); setAnswers({}); }}>Start over</button>
          </p>
          <ol className="team-result">
            {config.result(resolveAnswers(config, answers)).map((r, i) => (
              <li key={r.label}>
                <span className="team-n" aria-hidden>{i + 1}</span>
                <span className="team-body">
                  <strong>{r.label}</strong>
                  <span>{r.why}</span>
                  {r.href ? <a href={r.href}>Go there →</a> : r.scrollTo ? <button type="button" className="linkish" onClick={() => jump(r.scrollTo!)}>Show me on this page ↓</button> : null}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
