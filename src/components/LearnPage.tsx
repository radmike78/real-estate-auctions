import StatePicker from './StatePicker';
import PageHero from './PageHero';
import PathNext from './PathNext';
import { LEARN_MODULES, LEARN_PATHS } from '../lib/learn';
import { useMarkStep } from '../lib/path';
import { lessonByKey } from '../lib/lessons';
import { useState } from 'react';
import { useJourney } from '../lib/journey';
import { useMyState } from '../lib/myState';
import { guidesFor } from '../lib/playbooks';
import { STATES, stateByCode } from '../lib/regions';

/** The step-by-step sale guides, for the chosen state (or a way into each state's guides). */
function SaleGuides() {
  const [mine] = useMyState();
  const st = mine ? stateByCode(mine) : null;
  return (
    <section className="learn-path" aria-labelledby="path-guides">
      <h2 id="path-guides">{st ? `Sale guides for ${st.name}` : 'Sale guides for your state'}</h2>
      <p className="muted">How each kind of forced sale works, step by step: who sells, what you pay and when, and what can go wrong.</p>
      <ul className="lesson-list">
        {st
          ? guidesFor(st.code).map((g) => (
              <li key={g.key}>
                <a className="lesson-card ready" href={`#/playbooks/${g.key}`}>
                  <span className="lesson-body"><strong>{g.title}</strong><span>{g.oneLine}</span></span>
                  <span className="lesson-go" aria-hidden>→</span>
                </a>
              </li>
            ))
          : STATES.map((x) => (
              <li key={x.code}>
                <a className="lesson-card ready" href={`#/playbooks?state=${x.code}`}>
                  <span className="lesson-body"><strong>{x.name} sale guides</strong><span>{guidesFor(x.code).length} guides{x.code === 'NV' ? ', for Clark County' : ''}</span></span>
                  <span className="lesson-go" aria-hidden>→</span>
                </a>
              </li>
            ))}
      </ul>
    </section>
  );
}

/** Step 1 of the path: the lessons, in order. */
export default function LearnPage() {
  useMarkStep('learn');
  const { mode, read } = useJourney();
  // Guided visitors see the first two groups; everything stays one click away.
  const [showAll, setShowAll] = useState(false);
  const paths = mode === 'guided' && !showAll ? LEARN_PATHS.slice(0, 2) : LEARN_PATHS;
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 1 of 6</span>}
        title={<>Learn <span className="grad">real estate investing</span></>}
        sub="Residential and commercial: the markets, the property types, and how deals are found, analyzed and paid for."
      />
      <StatePicker label="Show rules for" />
      {paths.map((path) => (
        <section key={path.title} className="learn-path" aria-labelledby={`path-${path.keys[0]}`}>
          <h2 id={`path-${path.keys[0]}`}>{path.title}</h2>
          <p className="muted">{path.what}</p>
          <ol className="lesson-list" start={LEARN_MODULES.findIndex((m) => m.key === path.keys[0]) + 1}>
            {path.keys.map((k) => {
              const m = LEARN_MODULES.find((x) => x.key === k)!;
              const i = LEARN_MODULES.indexOf(m);
              const href = lessonByKey(m.key) ? `#/learn/${m.key}` : m.href;
              return (
                <li key={m.key}>
                  {href ? (
                    <a className="lesson-card ready" href={href}>
                      <span className="lesson-n" aria-hidden>{i + 1}</span>
                      <span className="lesson-body">
                        <strong>{m.title}</strong>
                        <span>{m.summary}</span>
                        {(lessonByKey(m.key) || read.includes(m.key)) && (
                          <span className="lesson-meta">
                            {lessonByKey(m.key) && `${lessonByKey(m.key)!.minutes} min`}
                            {read.includes(m.key) && <> · <span className="lesson-read">✓ Read</span></>}
                          </span>
                        )}
                      </span>
                      <span className="lesson-go" aria-hidden>→</span>
                    </a>
                  ) : (
                    <div className="lesson-card">
                      <span className="lesson-n" aria-hidden>{i + 1}</span>
                      <span className="lesson-body"><strong>{m.title}</strong><span>{m.summary}</span></span>
                      <span className="badge tone-info">Coming soon</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )).flatMap((el, i) => (i === 0 ? [el, <SaleGuides key="guides" />] : [el]))}
      {paths.length < LEARN_PATHS.length && (
        <p className="show-all-row">
          <button type="button" className="btn btn-secondary" onClick={() => setShowAll(true)}>Show all {LEARN_MODULES.length} lessons</button>
        </p>
      )}
      <PathNext step="learn" />
    </main>
  );
}
