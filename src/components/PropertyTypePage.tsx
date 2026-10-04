import { useRef } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import WhyBlock from './WhyBlock';
import StoryList from './StoryList';
import StatePicker from './StatePicker';
import { useMarkStep } from '../lib/path';
import { forStateText, showFor, useMyState } from '../lib/myState';
import { PROPERTY_TOPICS, topicBySlug, topicHref } from '../lib/deep/propertyTopics';
import { PROPERTY_DEEP } from '../lib/deep/propertyDeep';
import { PROPERTY_WHY } from '../lib/lessons/propertyWhy';
import { Cited } from './Cited';

const List = ({ items }: { items: string[] }) => <ul className="deep-list">{items.map((x) => <li key={x}><Cited text={x} /></li>)}</ul>;

/** A property type in depth: what owning it is like, who it suits, real stories, costs, financing and what to check. */
export default function PropertyTypePage({ slug }: { slug: string }) {
  const mainRef = useRef<HTMLElement>(null);
  useMarkStep('learn');
  const [st] = useMyState();
  const t = topicBySlug(slug)!;
  useLastActivity(`#/learn/types/${slug}`, `Property type: ${t.title}`);
  const d = PROPERTY_DEEP[t.key];
  const why = PROPERTY_WHY[t.key];
  const keep = (x: string) => showFor(st, x) && forStateText(st, x) !== '';
  const fit = (xs: string[]) => xs.filter(keep).map((x) => forStateText(st, x)).filter(Boolean);
  const i = PROPERTY_TOPICS.findIndex((x) => x.key === t.key);
  const next = PROPERTY_TOPICS[i + 1];
  return (
    <main className="page lesson deep-page" ref={mainRef}>
      <PageHero
        top={<a href="#/learn/types">← Types of property</a>}
        eyebrow={<span className="eyebrow">{t.group} property · in depth</span>}
        title={t.title}
        sub={d ? forStateText(st, d.overview[0]) : undefined}
      />
      <StatePicker label="Show rules for" />
      {d && <p className="page-summary"><strong>What you’ll learn:</strong> who it suits, what it costs, how people pay for it, what to check before you buy, and what owning it is really like, with real stories from other buyers.</p>}
      {/* Answer first: who it fits, what it costs, how it's paid for and what to check. Background and stories after. */}
      {d && (
        <section>
          <h2>Who it suits, and who it doesn’t</h2>
          <div className="deep-two">
            <div><h3>Good fit for</h3><List items={fit(d.bestFor)} /></div>
            <div><h3>Not a good fit for</h3><List items={fit(d.notFor)} /></div>
          </div>
        </section>
      )}
      {d && (
        <>
          <section><h2>Costs to plan for</h2><List items={fit(d.costs)} /></section>
          <section><h2>How people pay for it</h2><List items={fit(d.money)} /></section>
          <section><h2>Check before you buy</h2><List items={fit(d.checklist)} /></section>
        </>
      )}
      <section>
        <h2>Why you would, or wouldn’t</h2>
        <WhyBlock yes={why.yes.filter((p) => keep(p.text))} no={why.no.filter((p) => keep(p.text))} />
      </section>
      {d && d.overview.length > 1 && (
        <section><h2>What owning it is really like</h2>{fit(d.overview.slice(1)).map((p) => <p key={p}><Cited text={p} /></p>)}</section>
      )}
      {d && d.facts.length > 0 && (
        <section>
          <h2>By the numbers</h2>
          <ul className="deep-list">
            {d.facts.filter((f) => keep(f.text)).map((f) => <li key={f.text}>{f.text} <a href={f.source.url} target="_blank" rel="noopener noreferrer">{f.source.label} ↗</a></li>)}
          </ul>
        </section>
      )}
      {d && d.stories.length > 0 && (
        <section>
          <h2>Real stories: what happened to other buyers</h2>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named.</p>
          <StoryList stories={d.stories.filter((s) => keep(s.who))} />
        </section>
      )}
      {d && (
        <section className="lesson-sources">
          <h2>Where this comes from</h2>
          <details className="sources-more">
            <summary>See the {d.sources.filter((s) => keep(s.label)).length} sources we checked</summary>
            <ul className="source-links">{d.sources.filter((s) => keep(s.label)).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul>
          </details>
          <p className="muted">General education, not legal, tax or financial advice. Stories describe what happened to others; your results depend on your own deal.</p>
        </section>
      )}
      <p className="pro-next"><a className="btn" href="#/toolkit/buy-box">Fits you? Add it to your buy box →</a> <a href="#/find-deals">See where these are sold</a></p>
      <nav className="path-next" aria-label="Next">
        {next ? <><span className="muted">Next property type</span><a className="btn" href={topicHref(next.key)}>{next.title} →</a></> : <a className="btn" href="#/learn/types">Back to Types of property →</a>}
      </nav>
    </main>
  );
}
