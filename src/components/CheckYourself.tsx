import { useState } from 'react';
import type { LessonCheck } from '../lib/lessons/checks';

/** Three questions at the end of a lesson: answer first, then see why. Recalling beats rereading. */
export default function CheckYourself({ checks }: { checks: LessonCheck[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => checks.map(() => null));
  const score = picked.filter((p, i) => p === checks[i].answer).length;
  const done = picked.every((p) => p !== null);
  return (
    <section className="check-yourself" aria-labelledby="check-head">
      <h2 id="check-head">Check yourself</h2>
      <p className="muted">Answer from memory first, then look back if you need to. Your score appears here after you answer. It is not saved.</p>
      <ol className="check-list">
        {checks.map((c, i) => {
          const p = picked[i];
          return (
            <li key={c.q}>
              <fieldset>
                <legend>{c.q}</legend>
                <div className="check-options">
                  {c.options.map((o, j) => (
                    <button
                      key={o}
                      type="button"
                      disabled={p !== null}
                      className={p === null ? '' : j === c.answer ? 'right' : j === p ? 'wrong' : ''}
                      aria-pressed={p === j}
                      onClick={() => setPicked((cur) => cur.map((x, k) => (k === i ? j : x)))}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                {p !== null && (
                  <p className={`check-why ${p === c.answer ? 'right' : 'wrong'}`} role="status">
                    <strong>{p === c.answer ? 'You’ve got it.' : 'Let’s take another look.'}</strong> {c.why}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {done && (
        <p className="check-score">
          {score} of {checks.length} right.{' '}
          <button type="button" className="linkish" onClick={() => setPicked(checks.map(() => null))}>Try again</button>
        </p>
      )}
    </section>
  );
}
