import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { lessonByKey } from '../lib/lessons';
import type { LessonBlock } from '../lib/lessons/types';
import { useMarkStep } from '../lib/path';
import { fmtDate } from '../lib/status';

function Block({ b }: { b: LessonBlock }) {
  if (typeof b === 'string') return <p>{b}</p>;
  if ('list' in b) return <ul>{b.list.map((x) => <li key={x}>{x}</li>)}</ul>;
  if ('links' in b)
    return (
      <ul className="lesson-links">
        {b.links.map((x) => (
          <li key={x.url}>
            <a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>
            <span className="muted">{x.what}</span>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="table-wrap">
      <table className="lesson-table">
        <thead><tr>{b.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {b.table.rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i} data-label={b.table.head[i]}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One lesson in Learn (step 1): reading, key terms, sources, and the next lesson. */
export default function LessonPage({ lessonKey }: { lessonKey: string }) {
  useMarkStep('learn');
  const m = LEARN_MODULES.find((x) => x.key === lessonKey)!;
  const l = lessonByKey(lessonKey)!;
  const n = LEARN_MODULES.indexOf(m) + 1;
  const ready = LEARN_MODULES.filter((x) => lessonByKey(x.key) || x.href);
  const next = ready[ready.indexOf(m) + 1];
  const nextHref = next && (lessonByKey(next.key) ? `#/learn/${next.key}` : next.href!);
  return (
    <main className="page lesson">
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">Lesson {n} of {LEARN_MODULES.length} · {l.minutes} min read</span>}
        title={m.title}
        sub={l.intro}
      />
      <section className="lesson-takeaways" aria-labelledby="takeaways">
        <h2 id="takeaways">What you’ll learn</h2>
        <ul>{l.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
      <article className="lesson-body-text">
        {l.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.blocks.map((b, i) => <Block key={i} b={b} />)}
          </section>
        ))}
      </article>
      <section className="lesson-terms" aria-labelledby="terms">
        <h2 id="terms">Key terms</h2>
        <dl>{l.terms.map((t) => <div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl>
      </section>
      {l.tryIt && <p className="lesson-try"><a className="btn btn-secondary" href={l.tryIt.href}>{l.tryIt.label} →</a></p>}
      <section className="lesson-sources" aria-labelledby="sources">
        <h2 id="sources">Sources</h2>
        <ul className="source-links">
          {l.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}
        </ul>
        <p className="muted">Checked {fmtDate(l.reviewed)}. General education, not legal, tax or financial advice.</p>
      </section>
      <nav className="path-next" aria-label="Next lesson">
        {next ? (
          <>
            <span className="muted">Next lesson</span>
            <a className="btn" href={nextHref}>{next.title} →</a>
          </>
        ) : (
          <>
            <span className="muted">Next: step 2 of 6</span>
            <a className="btn" href="#/decide">Decide →</a>
          </>
        )}
      </nav>
    </main>
  );
}

