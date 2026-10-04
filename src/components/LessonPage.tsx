import { useEffect, useRef } from 'react';
import { currentProgress, GUIDED, guidedNext, markLessonRead, useJourney, useLastActivity } from '../lib/journey';
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
import CheckYourself from './CheckYourself';
import { LESSON_CHECKS } from '../lib/lessons/checks';
import { Pieces } from './Term';
import { markTerms, type Piece } from '../lib/terms';
import { Cited } from './Cited';
import TopicAd from './TopicAd';

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

/** Paragraphs and list items come with their key terms already marked (`marked`), in reading order. */
function Block({ b, marked }: { b: LessonBlock; marked?: Piece[][] }) {
  if (typeof b === 'string') return <p>{marked ? <Pieces pieces={marked[0]} /> : <Cited text={b} />}</p>;
  if ('list' in b) return <ul>{b.list.map((x, i) => <li key={x}>{marked ? <Pieces pieces={marked[i]} /> : <Cited text={x} />}</li>)}</ul>;
  // Folded: the table above gives the short answer; each type's case for and against opens on a tap.
  if ('why' in b)
    return (
      <details className="why-fold">
        <summary>{b.why.title ? `${b.why.title}: why you would, or wouldn’t` : 'Why you would, or wouldn’t'}</summary>
        <WhyBlock yes={b.why.yes} no={b.why.no} more={b.why.more} />
      </details>
    );
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
            <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i} data-label={b.table.head[i]}><Cited text={c} /></td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One lesson in Learn (step 1): reading, key terms, sources, and the next lesson. */
export default function LessonPage({ lessonKey }: { lessonKey: string }) {
  const bodyRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  useMarkStep('learn');
  const m = LEARN_MODULES.find((x) => x.key === lessonKey)!;
  useLastActivity(`#/learn/${lessonKey}`, `Lesson: ${m.title}`);
  const { mode } = useJourney();
  // A lesson counts as read once its key terms, the end of the reading, come on screen: opening it isn't enough.
  useEffect(() => {
    const el = endRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        markLessonRead(lessonKey);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [lessonKey]);
  const guided = mode === 'guided' ? guidedNext(currentProgress()) : null;
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
  const checks = (LESSON_CHECKS[lessonKey] ?? []).filter((c) => showFor(st, `${c.q} ${c.options.join(' ')} ${c.why}`));
  const terms = l.terms.filter((t) => showFor(st, t.meaning));
  // Each key term is explained where it first appears, in reading order (worked out once, before rendering).
  const used = new Set<string>();
  const marked = new Map<LessonBlock, Piece[][]>();
  for (const sec of sections)
    for (const b of sec.blocks) {
      if (typeof b === 'string') marked.set(b, [markTerms(b, terms, used)]);
      else if ('list' in b) marked.set(b, b.list.map((x) => markTerms(x, terms, used)));
    }
  return (
    <main className="page lesson" ref={bodyRef}>
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">Lesson library · {n} of {LEARN_MODULES.length} · {l.minutes} min read</span>}
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
      {/* Wide screens: the lesson on the left, "What you'll learn" beside it and in view as you read. The page stays
          full width; the side column keeps the reading lines shorter. Phones get one column, summary first. */}
      <div className="lesson-layout">
        <section className="lesson-takeaways" aria-labelledby="takeaways">
          <h2 id="takeaways">What you’ll learn</h2>
          <ul>{l.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
          {l.tryIt && <p className="lesson-side-try"><a href={l.tryIt.href}>{l.tryIt.label} →</a></p>}
        </section>
        <article className="lesson-body-text">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.blocks.map((b, i) => <Block key={i} b={b} marked={marked.get(b)} />)}
            </section>
          ))}
        </article>
      </div>
      <section className="lesson-terms" aria-labelledby="terms" ref={endRef}>
        <h2 id="terms">Key terms</h2>
        <dl>{terms.map((t) => <div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl>
      </section>
      {/* Questions about another state's rules are left out when you've chosen a state: its text is hidden above. */}
      {checks.length > 0 && <CheckYourself key={`${lessonKey}-${st ?? 'all'}`} checks={checks} />}
      {l.practice && (
        <section className="lesson-practice" aria-labelledby="practice-head">
          <h2 id="practice-head">Put it into practice</h2>
          <p>{l.practice}</p>
          {l.tryIt && <a className="btn" href={l.tryIt.href}>{l.tryIt.label} →</a>}
        </section>
      )}
      {!l.practice && l.tryIt && <p className="lesson-try"><a className="btn btn-secondary" href={l.tryIt.href}>{l.tryIt.label} →</a></p>}
      {/* After the lesson and its questions, never inside them. */}
      <TopicAd lesson={lessonKey} />
      <section className="lesson-sources" aria-labelledby="sources">
        <h2 id="sources">Where this comes from</h2>
        <details className="sources-more">
          <summary>See the {sources.length} sources we checked</summary>
          <ul className="source-links">
            {sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}
          </ul>
        </details>
        <p className="muted">Checked {fmtDate(l.reviewed)}. General education, not legal, tax or financial advice.</p>
      </section>
      <nav className="path-next" aria-label="Next lesson">
        {guided && guided.step.href !== `#/learn/${lessonKey}` ? (
          <>
            <span className="muted">Next in Getting started ({guided.n} of {GUIDED.length})</span>
            <a className="btn" href={guided.step.href}>{guided.step.label} →</a>
          </>
        ) : next ? (
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

