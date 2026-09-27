import { useState } from 'react';
import type { Property } from '../types';
import { ddSteps, loadDdDone, saveDdDone } from '../lib/ddFunnel';

const TAG: Record<string, string> = { ok: 'OK', flag: 'Flag', review: 'Review', manual: 'Check yourself' };

/** The 12-step due-diligence workflow for one property, with ticks remembered in this browser. */
export default function DueDiligenceFunnel({ p, maxBidHref }: { p: Property; maxBidHref: string }) {
  const steps = ddSteps(p);
  const [done, setDone] = useState<string[]>(() => loadDdDone(p.id));
  const toggle = (k: string) =>
    setDone((cur) => {
      const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      saveDdDone(p.id, next);
      return next;
    });
  const count = steps.filter((s) => done.includes(s.key)).length;

  return (
    <div className="dd">
      <div className="dd-progress" role="status">
        <div className="dd-bar" aria-hidden><span style={{ width: `${(count / steps.length) * 100}%` }} /></div>
        <strong>{count} of {steps.length} steps done</strong>
        <span className="muted">Automated screening only. It doesn’t clear title; a title company or attorney must make that call.</span>
      </div>
      <ol className="dd-steps">
        {steps.map((s, n) => {
          const isDone = done.includes(s.key);
          return (
            <li key={s.key} className={`dd-step${isDone ? ' done' : ''}${s.worst ? ` worst-${s.worst}` : ''}`}>
              <label className="dd-head">
                <input type="checkbox" checked={isDone} onChange={() => toggle(s.key)} />
                <span className="dd-num" aria-hidden>{n + 1}</span>
                <span className="dd-title">{s.title}</span>
                {s.worst && s.worst !== 'ok' && <span className={`check-tag dd-worst`}>{TAG[s.worst]}</span>}
              </label>
              <p className="dd-why">{s.why}</p>
              {s.checks.length > 0 && (
                <ul className="checks dd-checks">
                  {s.checks.map((c) => (
                    <li key={c.area} className={`check-${c.result}`}>
                      <span className="check-tag">{TAG[c.result]}</span>
                      <div><strong>{c.area}</strong><div>{c.detail}</div></div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="dd-how"><strong>How to check:</strong> {s.how}{s.who && <> <span className="muted">· Who helps: {s.who}</span></>}</p>
              {s.key === 'max-bid' && <a href={maxBidHref}>Open the maximum bid calculator for this property →</a>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
