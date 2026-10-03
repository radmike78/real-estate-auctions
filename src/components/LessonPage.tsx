import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { lessonByKey } from '../lib/lessons';
import type { LessonBlock } from '../lib/lessons/types';
import { useMarkStep } from '../lib/path';
import { fmtDate } from '../lib/status';
import { showFor, useMyState } from '../lib/myState';
import { STATES, type StateCode } from '../lib/regions';
import StatePicker from './StatePicker';
import WhyBlock from './WhyBlock';

const STATE_NAMES = new Set(STATES.map((s) => s.name));

/** The block as it applies to one state: other states' rows, columns, items and paragraphs removed. */
function forState(b: LessonBlock, st: StateCode | null): LessonBlock | null {
  if (!st) return b;
  if (typeof b === 'string') return showFor(st, b) ? b : null;
  if ('list' in b) {
    const list = b.list.filter((x) => showFor(st, x));
    return list.length ? { list } : null;
  }
  if ('links' in b) {
    const links = b.links.filter((x) => showFor(st, x.label));
    return links.length ? { links } : null;
  }
  if ('why' in b) {
    const yes = b.why.yes.filter((p) => showFor(st, p.text));
    const no = b.why.no.filter((p) => showFor(st, p.text));
    return yes.length || no.length ? { why: { ...b.why, yes, no } } : null;
  }
  const { head, rows } = b.table;
  if (head.slice(1).some((h) => STATE_NAMES.has(h))) {
    const name = STATES.find((s) => s.code === st)!.name;
    const keep = head.map((h, i) => i === 0 || !STATE_NAMES.has(h) || h === name);
    if (!head.some((h) => h === name)) return null;
    return { table: { head: head.filter((_, i) => keep[i]), rows: rows.map((r) => r.filter((_, i) => keep[i])) } };
  }
  const kept = rows.filter((r) => showFor(st, r[0]));
  return kept.length ? { table: { head, rows: kept } } : null;
}

function Block({ b }: { b: LessonBlock }) {
  if (typeof b === 'string') return <p>{b}</p>;
  if ('list' in b) return <ul>{b.list.map((x) => <li key={x}>{x}</li>)}</ul>;
  if ('why' in b) return <WhyBlock title={b.why.title} yes={b.why.yes} no={b.why.no} more={b.why.more} />;
  if ('links' in b)
    return (
      <ul className="lesson-links">
        {b.links.map((x) => (
          <li key={x.label}>
            {x.url.startsWith('#/') ? <a href={x.url}>{x.label} →</a> : <a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>}
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
  const [st] = useMyState();
  const sections = l.sections
    .map((s) => ({ heading: s.heading, blocks: s.blocks.map((b) => forState(b, st)).filter((b): b is LessonBlock => b !== null) }))
    .filter((s) => s.blocks.length > 0);
  const sources = l.sources.filter((s) => showFor(st, s.label));
  const terms = l.terms.filter((t) => showFor(st, t.meaning));
  return (
    <main className="page lesson">
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">Lesson {n} of {LEARN_MODULES.length} · {l.minutes} min read</span>}
        title={m.title}
        sub={l.intro}
      />
      <StatePicker label="Show rules for" />
      {lessonKey === 'types' && (
        <section className="not-sure" aria-labelledby="types-not-sure">
          <h2 id="types-not-sure">Not sure which kind of property fits you?</h2>
          <p>There are a lot of choices below. Answer a few questions about your money, time and goals, and we’ll suggest the kinds of property that fit. Every type is still listed here.</p>
          <a className="btn" href="#/decide">Help me choose →</a>
        </section>
      )}
      <section className="lesson-takeaways" aria-labelledby="takeaways">
        <h2 id="takeaways">What you’ll learn</h2>
        <ul>{l.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
      <article className="lesson-body-text">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.blocks.map((b, i) => <Block key={i} b={b} />)}
          </section>
        ))}
      </article>
      <section className="lesson-terms" aria-labelledby="terms">
        <h2 id="terms">Key terms</h2>
        <dl>{terms.map((t) => <div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl>
      </section>
      {l.practice && (
        <section className="lesson-practice" aria-labelledby="practice-head">
          <h2 id="practice-head">Put it into practice</h2>
          <p>{l.practice}</p>
          {l.tryIt && <a className="btn" href={l.tryIt.href}>{l.tryIt.label} →</a>}
        </section>
      )}
      {!l.practice && l.tryIt && <p className="lesson-try"><a className="btn btn-secondary" href={l.tryIt.href}>{l.tryIt.label} →</a></p>}
      <section className="lesson-sources" aria-labelledby="sources">
        <h2 id="sources">Sources</h2>
        <ul className="source-links">
          {sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}
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

