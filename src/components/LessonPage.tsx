import { LESSON_CHAPTER, journeyHref } from '../practice/dealJourney';
import { useEffect, useRef } from 'react';
import { markLessonRead, useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { lessonByKey } from '../lib/lessons';
import type { Lesson, LessonBlock } from '../lib/lessons/types';
import { useMarkStep } from '../lib/path';
import { fmtDate } from '../lib/status';
import { dropStateLead, forStateText, showFor, statesOf, useMyState } from '../lib/myState';
import { STATES, type StateCode } from '../lib/regions';
import StatePicker from './StatePicker';
import WhyBlock from './WhyBlock';
import CheckYourself from './CheckYourself';
import { LESSON_CHECKS } from '../lib/lessons/checks';
import { Pieces } from './Term';
import { markTerms, type Piece } from '../lib/terms';
import { Cited } from './Cited';
import TopicAd from './TopicAd';
import AdSpot from './AdSpot';
import { AMAZON_TAG, BOOK_GROUPS, type Book } from '../lib/books';
import { BookGrid } from './BookCards';
import '../styles/review-lessons.css';

const STATE_NAMES = new Set(STATES.map((s) => s.name));
const nameOf = (st: StateCode) => STATES.find((s) => s.code === st)!.name;

/**
 * Text that speaks to all five states, once the reader has chosen one: "in all five states" becomes "in Texas", and
 * "Choose your state above to see only its …" goes, since they already have.
 */
export function oneState(text: string, st: StateCode | null): string {
  if (!st) return text;
  return text
    .replace(/\s*Choose your state (?:above|below) to see only its [^.]*\./g, '')
    .replace(/\b(in|across) (?:all five states|Nevada, California, Arizona, Utah and Texas)\b/g, `$1 ${nameOf(st)}`)
    .trim();
}

/** "Texas execution sales: none after…" reads "Execution sales: none after…" once Texas is chosen. */
const dropStateKeyword = (text: string, st: StateCode | null) =>
  st ? text.replace(new RegExp(`^${nameOf(st)}(?:’s)? ([^:.]{2,48}):\\s`), (_m, k: string) => `${k[0].toUpperCase()}${k.slice(1)}: `) : text;

/** A list item's topic keyword ("Buying:", "Inspector:") and the rest, so the keyword can stand out in bold. */
export function splitLead(text: string): [string | null, string] {
  const m = text.match(/^([^:.]{2,60}):\s+(?=\S)/);
  // A short label, not a sentence that happens to end in a colon ("Have insurance in place from the day you…:").
  const label = m && m[1].split(/\s+/).length <= 7 && !/\byou(?:r|’ll|’re)?\b/i.test(m[1]);
  return m && label ? [m[1], text.slice(m[0].length)] : [null, text];
}

/** The block as it applies to one state: other states' rows, columns, items, sentences and paragraphs removed. */
function forState(b: LessonBlock, st: StateCode | null): LessonBlock | null {
  if (!st) return b;
  const plain = (x: string) => oneState(dropStateKeyword(dropStateLead(forStateText(st, x), st), st), st);
  if (typeof b === 'string') {
    // Sentence by sentence: a paragraph that opens with another state can still hold the reader's.
    const t = plain(b);
    return t || null;
  }
  if ('list' in b) {
    const list = b.list.filter((x) => showFor(st, x)).map(plain).filter(Boolean);
    return list.length ? { list } : null;
  }
  if ('links' in b) {
    // Once a state is chosen, "Harris County (TX) Clerk" needn't say (TX) on every line.
    const links = b.links.filter((x) => showFor(st, x.label)).map((x) => ({ ...x, label: x.label.replace(` (${st})`, '') }));
    return links.length ? { links } : null;
  }
  if ('why' in b) {
    const yes = b.why.yes.filter((p) => showFor(st, p.text)).map((p) => ({ ...p, text: plain(p.text) }));
    const no = b.why.no.filter((p) => showFor(st, p.text)).map((p) => ({ ...p, text: plain(p.text) }));
    return yes.length || no.length ? { why: { ...b.why, yes, no } } : null;
  }
  const { head, rows } = b.table;
  if (head.slice(1).some((h) => STATE_NAMES.has(h))) {
    const name = nameOf(st);
    const keep = head.map((h, i) => i === 0 || !STATE_NAMES.has(h) || h === name);
    if (!head.some((h) => h === name)) return null;
    return { table: { head: head.filter((_, i) => keep[i]), rows: rows.map((r) => r.filter((_, i) => keep[i])) } };
  }
  const kept = rows.filter((r) => showFor(st, r[0]));
  return kept.length ? { table: { head, rows: kept } } : null;
}

const sentences = (t: string) => t.split(/(?<=[.!?])\s+/);

/** Whether anything in the lesson changes with the chosen state; if not, the "Show rules for" switch is left off. */
function variesByState(l: Lesson, checks: { q: string }[]): boolean {
  const texts: string[] = [];
  for (const s of l.sections) {
    texts.push(s.heading);
    for (const b of s.blocks) {
      if (typeof b === 'string') texts.push(...sentences(b));
      else if ('list' in b) texts.push(...b.list.flatMap(sentences));
      else if ('links' in b) texts.push(...b.links.map((x) => x.label));
      else if ('why' in b) texts.push(...b.why.yes.map((p) => p.text), ...b.why.no.map((p) => p.text));
      else if (b.table.head.slice(1).some((h) => STATE_NAMES.has(h))) return true;
      else texts.push(...b.table.rows.map((r) => r[0]));
    }
  }
  texts.push(...l.terms.flatMap((t) => sentences(t.meaning)), ...checks.map((c) => c.q));
  return texts.some((t) => statesOf(t).length > 0);
}

/** Paragraphs and list items come with their key terms already marked (`marked`), in reading order. */
function Block({ b, marked }: { b: LessonBlock; marked?: Piece[][] }) {
  if (typeof b === 'string') return <p>{marked ? <Pieces pieces={marked[0]} /> : <Cited text={b} />}</p>;
  if ('list' in b)
    return (
      <ul>
        {b.list.map((x, i) => {
          const [lead, rest] = splitLead(x);
          return (
            <li key={x}>
              {lead && <><strong className="li-lead">{lead}:</strong>{' '}</>}
              {marked ? <Pieces pieces={marked[i]} /> : <Cited text={rest} />}
            </li>
          );
        })}
      </ul>
    );
  // Folded: the table above gives the short answer; each type's case for and against opens on a tap.
  if ('why' in b)
    return (
      <details className="why-fold">
        <summary>{b.why.title ? `${b.why.title}: pros and cons` : 'Pros and cons'}</summary>
        <WhyBlock yes={b.why.yes} no={b.why.no} more={b.why.more} />
      </details>
    );
  if ('links' in b)
    return (
      <ul className="lesson-links">
        {b.links.map((x) => {
          const words = x.label.split(' ');
          const last = words.pop();
          const ext = !x.url.startsWith('#/');
          // The arrow stays with the last word, so it never wraps onto a line of its own.
          return (
            <li key={x.label}>
              <a href={x.url} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {words.join(' ')}{words.length ? ' ' : ''}<span className="nowrap">{last}&nbsp;{ext ? '↗' : '→'}</span>
              </a>
              <span className="muted">{x.what}</span>
            </li>
          );
        })}
      </ul>
    );
  return (
    <div className="table-wrap">
      <table className={`lesson-table cols-${b.table.head.length}${b.table.rows.some((r) => r[0].length > 30) ? ' long-first' : ''}`}>
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

/** The books from Recommended reading that go with this lesson, with their covers. */
function LessonBooks({ isbns }: { isbns: string[] }) {
  const all = BOOK_GROUPS.flatMap((g) => g.books);
  const books = isbns.map((i) => all.find((b) => b.isbn10 === i)).filter((b): b is Book => !!b);
  if (!books.length) return null;
  return (
    <section className="lesson-books" aria-labelledby="lesson-books">
      <details><summary id="lesson-books">Recommended books for this lesson</summary>
      <BookGrid books={books} />
      <p className="lesson-books-more"><a href="#/learn/reading">All our recommended books&nbsp;→</a></p>
      {AMAZON_TAG && <p className="fine-print">As an Amazon Associate, DeedOwl earns from qualifying purchases.</p>}</details>
    </section>
  );
}

/** One lesson in Learn (step 1): reading, key terms, sources, and the next lesson. */
export default function LessonPage({ lessonKey }: { lessonKey: string }) {
  const bodyRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  useMarkStep('learn');
  const m = LEARN_MODULES.find((x) => x.key === lessonKey)!;
  useLastActivity(`#/learn/${lessonKey}`, `Lesson: ${m.title}`);
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
  const l = lessonByKey(lessonKey)!;
  const n = LEARN_MODULES.indexOf(m) + 1;
  const ready = LEARN_MODULES.filter((x) => lessonByKey(x.key) || x.href);
  const next = ready[ready.indexOf(m) + 1];
  const nextHref = next && (lessonByKey(next.key) ? `#/learn/${next.key}` : next.href!);
  const [st] = useMyState();
  // A section about one state ("Texas: getting a rental ready…") shows only for that state; its heading drops the
  // state name once that state is chosen, and "…, state by state" goes when only one state is shown.
  const sections = l.sections
    .filter((s) => showFor(st, s.heading))
    .map((s) => ({
      heading: st ? dropStateLead(s.heading, st).replace(/, state by state$/, '') : s.heading,
      blocks: s.blocks.map((b) => forState(b, st)).filter((b): b is LessonBlock => b !== null),
    }))
    .filter((s) => s.blocks.length > 0);
  const sources = l.sources.filter((s) => showFor(st, s.label)).map((s) => ({ ...s, label: s.label.replace(` (${st})`, '') }));
  const allChecks = LESSON_CHECKS[lessonKey] ?? [];
  const checks = allChecks.filter((c) => showFor(st, `${c.q} ${c.options.join(' ')} ${c.why}`));
  const terms = l.terms
    .filter((t) => showFor(st, t.meaning))
    .map((t) => ({ ...t, meaning: forStateText(st, t.meaning) }))
    .filter((t) => t.meaning);
  const varies = variesByState(l, allChecks);
  // Each key term is explained where it first appears, in reading order (worked out once, before rendering).
  const used = new Set<string>();
  const marked = new Map<LessonBlock, Piece[][]>();
  for (const sec of sections)
    for (const b of sec.blocks) {
      if (typeof b === 'string') marked.set(b, [markTerms(b, terms, used)]);
      else if ('list' in b) marked.set(b, b.list.map((x) => markTerms(splitLead(x)[1], terms, used)));
    }
  // The practice button matches the practice task; the lesson's other link sits beside it only when it differs.
  const practiceLink = l.practiceLink === undefined ? l.tryIt : l.practiceLink;
  const dealChapter = LESSON_CHAPTER[lessonKey];
  const extraTry = l.tryIt && l.tryIt !== practiceLink ? l.tryIt : null;
  return (
    <main className="page lesson" ref={bodyRef}>
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">Lesson {n} of {LEARN_MODULES.length} · {l.minutes} min</span>}
        title={m.title}
        sub={oneState(l.intro, st)}
      />
      {varies && <StatePicker label="Show rules for" />}
      {/* Summary first, full width: what the reader will learn, then (on Types) help choosing, then the lesson. */}
      <section className="lesson-takeaways" aria-labelledby="takeaways">
        <h2 id="takeaways">What you’ll learn</h2>
        <ul>{l.takeaways.slice(0, 3).map((t) => <li key={t}>{oneState(t, st)}</li>)}</ul>
        {l.takeaways.length > 3 && <details><summary>More in this lesson</summary><ul>{l.takeaways.slice(3).map((t) => <li key={t}>{oneState(t, st)}</li>)}</ul></details>}
      </section>
      {lessonKey === 'types' && (
        <section className="not-sure" aria-labelledby="types-not-sure">
          <h2 id="types-not-sure">Not sure which kind of property fits you?</h2>
          <p>There are a lot of choices below. Answer a few questions about your money, time and goals, and we’ll suggest the kinds of property that fit. Every type is still listed here.</p>
          <a className="btn" href="#/decide">Help me choose&nbsp;→</a>
        </section>
      )}
      <article className="lesson-body-text">
        {sections.map((s, index) => (
          <details key={s.heading} className="lesson-topic" open={index === 0}>
            <summary><h2>{s.heading}</h2></summary>
            {s.blocks.map((b, i) => <Block key={i} b={b} marked={marked.get(b)} />)}
          </details>
        ))}
      </article>
      {/* Hiring help for this topic goes with the reading, before the terms and questions that wrap the lesson up. */}
      <TopicAd lesson={lessonKey} />
      <section className="lesson-terms" aria-labelledby="terms" ref={endRef}>
        <details><summary id="terms">Terms explained ({terms.length})</summary>
        <dl>{terms.map((t) => <div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl></details>
      </section>
      {/* Questions about another state's rules are left out when you've chosen a state: its text is hidden above. */}
      {checks.length > 0 && <CheckYourself key={`${lessonKey}-${st ?? 'all'}`} checks={checks} />}
      {(l.practice || dealChapter) && (
        <section className="lesson-practice" aria-labelledby="practice-head">
          <h2 id="practice-head">Put it into practice</h2>
          {dealChapter ? <div className="deal-lesson-link">
            <p>Apply this lesson to Cedar House, your continuing fictional practice deal.</p>
            <a className="btn deal-primary" href={journeyHref(dealChapter)}>Try this decision →</a>
            <details><summary>Other ways to apply this lesson</summary>
              {l.practice && <p>{oneState(l.practice, st)}</p>}
              {practiceLink && <a href={practiceLink.href}>{practiceLink.label} →</a>}
              {extraTry && <p><a href={extraTry.href}>{extraTry.label} →</a></p>}
            </details>
          </div> : <>
            {l.practice && <p>{oneState(l.practice, st)}</p>}
            {practiceLink && <a className="btn" href={practiceLink.href}>{practiceLink.label} →</a>}
            {extraTry && <p className="lesson-also"><a className="btn btn-secondary" href={extraTry.href}>{extraTry.label} →</a></p>}
          </>}
        </section>
      )}
      {!l.practice && !dealChapter && l.tryIt && <p className="lesson-try"><a className="btn btn-secondary" href={l.tryIt.href}>{l.tryIt.label}&nbsp;→</a></p>}
      {l.books && <LessonBooks isbns={l.books} />}
      <section className="lesson-sources" aria-labelledby="sources">
        <h2 id="sources">Where this comes from</h2>
        <details className="sources-more">
          <summary>See the {sources.length} sources we checked</summary>
          <ul className="source-links">
            {sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}&nbsp;↗</a></li>)}
          </ul>
        </details>
        <p className="muted">Checked {fmtDate(l.reviewed)}. General education, not legal, tax or financial advice.</p>
      </section>
      <nav className="path-next" aria-label="Next lesson">
        {next ? (
          <>
            <span className="muted">Next lesson</span>
            <a className="btn" href={nextHref}>{next.title}&nbsp;→</a>
          </>
        ) : (
          <>
            <span className="muted">Next: step 2 of 6</span>
            <a className="btn" href="#/decide">Decide&nbsp;→</a>
          </>
        )}
      </nav>
      <AdSpot spot="lesson" />
    </main>
  );
}
