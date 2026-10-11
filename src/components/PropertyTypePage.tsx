import { useRef } from 'react';
import { useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import WhyBlock from './WhyBlock';
import StoryList from './StoryList';
import StatePicker from './StatePicker';
import OwlNote from './OwlNote';
import { useMarkStep } from '../lib/path';
import { forStateText, showFor, mentionsOtherState, statesOf, useMyState } from '../lib/myState';
import { PROPERTY_TOPICS, topicBySlug, topicHref } from '../lib/deep/propertyTopics';
import { PROPERTY_DEEP } from '../lib/deep/propertyDeep';
import { PROPERTY_WHY } from '../lib/lessons/propertyWhy';
import type { Story } from '../lib/deep/types';
import { STATES, type StateCode } from '../lib/regions';
import { Cited } from './Cited';
import AdSpot from './AdSpot';
import { splitLead } from './LessonPage';
import '../styles/review-lessons.css';

/** A bullet with its topic keyword ("Legal rules:") in bold, when it has one. */
const Item = ({ x }: { x: string }) => {
  const [lead, rest] = splitLead(x);
  return <li>{lead && <><strong className="li-lead">{lead}:</strong>{' '}</>}<Cited text={rest} /></li>;
};
const List = ({ items }: { items: string[] }) => <ul className="deep-list">{items.map((x) => <Item key={x} x={x} />)}</ul>;

// Where a story happened, from how it's described: a covered state by name or by its cities; "national" stories
// belong everywhere; anything else is outside the five states we cover.
const PLACES: [RegExp, StateCode][] = [
  [/Nevada|Las Vegas|Reno|Henderson|Summerlin/, 'NV'],
  [/California|Los Angeles|San Francisco|San Diego|Sacramento|Fresno|Napa|Inland Empire|San Mateo|El Cajon|Bay Area/, 'CA'],
  [/Arizona|Phoenix|Tucson|Glendale|Mesa|Scottsdale/, 'AZ'],
  [/Utah|Salt Lake/, 'UT'],
  [/Texas|Houston|Dallas|Austin|San Antonio|Fort Worth|El Paso/, 'TX'],
];
type Where = { states: StateCode[]; national: boolean };
const whereOf = (s: Story): Where => ({ states: PLACES.filter(([re]) => re.test(s.who)).map(([, c]) => c), national: /\bnational\b/i.test(s.who) });
const stateName = (c: StateCode) => STATES.find((s) => s.code === c)!.name;

/** A property type in depth: what owning it is like, who it suits, real stories, costs, financing and what to check. */
export default function PropertyTypePage({ slug }: { slug: string }) {
  const mainRef = useRef<HTMLElement>(null);
  useMarkStep('learn');
  const [st] = useMyState();
  const t = topicBySlug(slug)!;
  useLastActivity(`#/learn/types/${slug}`, `Property type: ${t.title}`);
  const d = PROPERTY_DEEP[t.key];
  const why = PROPERTY_WHY[t.key];
  const keep = (x: string) => showFor(st, x) && forStateText(st, x) !== '' && !mentionsOtherState(st, forStateText(st, x));
  const fit = (xs: string[]) => xs.filter(keep).map((x) => forStateText(st, x)).filter(Boolean);
  const i = PROPERTY_TOPICS.findIndex((x) => x.key === t.key);
  const next = PROPERTY_TOPICS[i + 1];
  // Stories: the chosen state's and national ones up front; others folded under "other places", so nothing is lost.
  const stories = (d?.stories ?? []).filter((story) => !mentionsOtherState(st, JSON.stringify(story)));
  const inCoverage = (w: Where) => w.national || w.states.length > 0;
  const mainStories = stories.filter((s) => {
    const w = whereOf(s);
    return st ? w.national || w.states.includes(st) : inCoverage(w);
  });
  const placeOf = (s: Story) => {
    const w = whereOf(s);
    if (w.national) return 'National';
    if (w.states.length) return w.states.map(stateName).join(' and ');
    return 'Outside the states we cover';
  };
  // The state switch shows only when something on the page changes with the state.
  const all = d ? [...d.overview, ...d.bestFor, ...d.notFor, ...d.costs, ...d.money, ...d.checklist, ...d.facts.map((f) => f.text)] : [];
  const varies = all.some((x) => x.split(/(?<=[.!?])\s+/).some((y) => statesOf(y).length > 0)) || [...why.yes, ...why.no].some((p) => statesOf(p.text).length > 0) || stories.some((s) => whereOf(s).states.length > 0);
  return (
    <main className="page lesson deep-page" ref={mainRef}>
      <PageHero
        top={<a href="#/learn/types">← Types of property</a>}
        eyebrow={<span className="eyebrow">{t.group} property · in depth</span>}
        title={t.title}
        sub={d ? forStateText(st, d.overview[0]) : undefined}
      />
      {varies && <StatePicker label="Show rules for" />}
      {d && (
        <section className="lesson-takeaways" aria-labelledby="takeaways">
          <h2 id="takeaways">What you’ll learn</h2>
          <ul>
            <li>Who it suits, and who it doesn’t.</li>
            <li>The costs to plan for, and how people pay for it.</li>
            <li>What to check before you buy.</li>
            <li>Why you would, or wouldn’t, and what owning it is really like.</li>
            <li>Real stories from other buyers, good and bad.</li>
          </ul>
        </section>
      )}
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
            {d.facts.filter((f) => keep(f.text) && !mentionsOtherState(st, f.source.label)).map((f) => <li key={f.text}>{forStateText(st, f.text)} <a href={f.source.url} target="_blank" rel="noopener noreferrer">{f.source.label}&nbsp;↗</a></li>)}
          </ul>
        </section>
      )}
      {d && stories.length > 0 && (
        <section>
          <h2>Real stories: what happened to other buyers</h2>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named.</p>
          {mainStories.length > 0 ? (
            <StoryList stories={mainStories} grid placeOf={placeOf} />
          ) : (
            <OwlNote>We don’t have a story from {st ? stateName(st) : 'the states we cover'} for this kind of property yet. The general guidance above can still help you research this property type.</OwlNote>
          )}

        </section>
      )}
      {d && (
        <section className="lesson-practice" aria-labelledby="practice-head">
          <h2 id="practice-head">Put it into practice</h2>
          <p>If this kind of property fits your money, time and goals, add it to your buy box, then see where these are sold.</p>
          <p className="lesson-practice-actions">
            <a className="btn" href="#/toolkit/buy-box">Add it to your buy box&nbsp;→</a>
            <a className="btn btn-secondary" href="#/find-deals">See where these are sold&nbsp;→</a>
          </p>
        </section>
      )}
      {d && (
        <section className="lesson-sources">
          <h2>Where this comes from</h2>
          <details className="sources-more">
            <summary>See the {d.sources.filter((s) => keep(s.label)).length} sources we checked</summary>
            <ul className="source-links">{d.sources.filter((s) => keep(s.label)).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}&nbsp;↗</a></li>)}</ul>
          </details>
          <p className="muted">General education, not legal, tax or financial advice. Stories describe what happened to others; your results depend on your own deal.</p>
        </section>
      )}
      {!d && <p className="pro-next"><a className="btn" href="#/toolkit/buy-box">Fits you? Add it to your buy box&nbsp;→</a> <a href="#/find-deals">See where these are sold</a></p>}
      <nav className="path-next" aria-label="Next">
        {next ? <><span className="muted">Next property type</span><a className="btn" href={topicHref(next.key)}>{next.title}&nbsp;→</a></> : <a className="btn" href="#/learn/types">Back to Types of property&nbsp;→</a>}
      </nav>
      <AdSpot spot="propertyType" />
    </main>
  );
}
