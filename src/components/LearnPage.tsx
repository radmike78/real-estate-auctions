import StatePicker from './StatePicker';
import { LESSON_CHAPTER, journeyHref } from '../practice/dealJourney';
import PageHero from './PageHero';
import PathNext from './PathNext';
import { LEARN_MODULES, LEARN_PATHS } from '../lib/learn';
import NarrowDown from './NarrowDown';
import { learnConfig } from '../lib/narrow';
import { useMarkStep } from '../lib/path';
import { lessonByKey } from '../lib/lessons';
import { useJourney } from '../lib/journey';
import { useMyState } from '../lib/myState';
import { guidesFor } from '../lib/playbooks';
import { STATES, stateByCode, type StateCode } from '../lib/regions';
import { oneState } from './LessonPage';
import '../styles/review-lessons.css';
import AdSpot from './AdSpot';

/**
 * Under a heading that already names the state, "Texas tax sales" reads "Tax sales" and "Most Texas home loans" reads
 * "Most home loans". Only the state's name as a describing word goes; "under Texas law" and the like stay.
 */
function withoutState(text: string, st: StateCode): string {
  const name = stateByCode(st)!.name;
  return text
    .replace(new RegExp(`^${name} (\\S)`), (_m, c: string) => c.toUpperCase())
    .replace(new RegExp(`\\b(A|a) ${name} ([aeiou])`, 'g'), '$1n $2')
    .replace(new RegExp(`\\b(a|A|an|An|the|The|Most|most|each|Each) ${name} (?=[a-z])`, 'g'), '$1 ');
}

/** The step-by-step sale guides, for the chosen state (or a way into each state's guides). */
function SaleGuides() {
  const [mine] = useMyState();
  const st = mine ? stateByCode(mine) : null;
  return (
    <section className="learn-path" aria-labelledby="path-guides">
      <h2 id="path-guides">{st ? `Sale guides for ${st.name}` : 'Sale guides for your state'}</h2>
      <p className="muted">How each kind of forced sale works, step by step: who sells, what you pay and when, and what can go wrong.</p>
      <ul className="lesson-list sale-guide-list">
        {st
          ? guidesFor(st.code).map((g) => (
              <li key={g.key}>
                <a className="lesson-card ready" href={`#/playbooks/${g.key}`}>
                  <span className="lesson-body"><strong>{withoutState(g.title, st.code)}</strong><span className="sale-guide-line">{withoutState(g.oneLine, st.code)}</span></span>
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
  const { read } = useJourney();
  const [mine] = useMyState();
  const paths = LEARN_PATHS;
  const next = LEARN_MODULES.find((m) => lessonByKey(m.key) && !read.includes(m.key)) ?? LEARN_MODULES[0];
  const lesson = lessonByKey(next.key)!;
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 1 of 6</span>}
        title={<>Learn <span className="grad">real estate investing</span></>}
        sub="Residential and commercial: the markets, the property types, and how deals are found, analyzed and paid for."
      />
      <section className="learn-path" aria-labelledby="learn-next">
        <h2 id="learn-next">Your next lesson: {next.title}</h2>
        <p>{oneState(lesson.takeaways[0], mine)}</p>
        <a className="btn" href={`#/learn/${next.key}`}>Read the lesson →</a>
        <p className="muted">{lesson.minutes} minutes. Then apply it to Cedar House, your fictional practice property.</p>
        <a href={journeyHref(LESSON_CHAPTER[next.key])}>Practice this idea →</a>
      </section>
      <details className="plan-section"><summary>Browse all lessons</summary>
      <details><summary>Help choosing a strategy or lesson</summary>
      <section className="learn-money" aria-labelledby="learn-money">
        <div>
          <h2 id="learn-money">Ways to make money</h2>
          <p>Renting, flipping, BRRRR, auctions, apartments and more, each with how the money is made and what goes wrong.</p>
        </div>
        <a className="btn" href="#/learn/strategies">Compare the strategies&nbsp;→</a>
      </section>
      <NarrowDown config={learnConfig()} intro="Answer two quick questions and we’ll suggest which lessons to read first. Browse the lessons below, or follow your next lesson above." />
      </details>
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
                        <span>{oneState(m.summary, mine)}</span>
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
      ))}
      </details>
      <details className="plan-section"><summary>Sale guides for your selected state</summary><StatePicker label="Show rules for" /><SaleGuides /></details>
      <AdSpot spot="learn" />
      <PathNext step="learn" />
    </main>
  );
}
