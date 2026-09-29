import PageHero from './PageHero';
import PathNext from './PathNext';
import { LEARN_MODULES } from '../lib/learn';
import { useMarkStep } from '../lib/path';
import { lessonByKey } from '../lib/lessons';

/** Step 1 of the path: the lessons, in order. */
export default function LearnPage() {
  useMarkStep('learn');
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 1 of 6</span>}
        title={<>Learn <span className="grad">real estate investing</span></>}
        sub="Residential and commercial: the markets, the property types, and how deals are found, analyzed and paid for."
      />
      <ol className="lesson-list">
        {LEARN_MODULES.map((m, i) => {
          const href = lessonByKey(m.key) ? `#/learn/${m.key}` : m.href;
          return (
          <li key={m.key}>
            {href ? (
              <a className="lesson-card ready" href={href}>
                <span className="lesson-n" aria-hidden>{i + 1}</span>
                <span className="lesson-body"><strong>{m.title}</strong><span>{m.summary}</span></span>
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
      <PathNext step="learn" />
    </main>
  );
}
