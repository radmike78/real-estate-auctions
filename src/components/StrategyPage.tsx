import { useLastActivity } from '../lib/journey';
import { getMyArea } from '../lib/myArea';
import { useMarkStep } from '../lib/path';
import { stateNote } from '../lib/decide';
import { LEARN_MODULES } from '../lib/learn';
import { useMyState } from '../lib/myState';
import { stateByCode } from '../lib/regions';
import '../styles/review-lessons.css';
import { proGuideByKey } from '../lib/proGuide';
import { STRATEGY_GUIDES, strategyBySlug, strategyOf } from '../lib/strategies';
import PageHero from './PageHero';
import StatePicker from './StatePicker';
import AdSpot from './AdSpot';

const lessonTitle = (k: string) => LEARN_MODULES.find((m) => m.key === k)?.title ?? k;


/** All the ways to make money, one card each, with a way to choose. */
function StrategyIndex() {
  useLastActivity('#/learn/strategies', 'Ways to make money with real estate');
  return (
    <main className="page lesson deep-page">
      <PageHero
        top={<a href="#/learn">← Learn</a>}
        title={<>Ways to make money with <span className="grad">real estate</span></>}
        sub="Eight strategies, each with how the money is made, what goes wrong, and where to practice and run the numbers."
      />
      <p className="page-summary"><strong>Not sure which fits you?</strong> <a href="#/decide">Answer a few questions in Decide</a> and we’ll rank them for your cash, time and comfort with risk. Or open any one below.</p>
      <ul className="lesson-list strategy-grid">
          {STRATEGY_GUIDES.map((g, i) => {
          const s = strategyOf(g);
          return (
            <li key={g.key}>
              <a className={`lesson-card ready strat-card strat-accent-${i % 5}`} href={`#/learn/strategies/${g.slug}`}>
                <span className="lesson-body">
                  <strong>{s.title}</strong>
                  <span>{s.what}</span>
                  <span className="strat-earns"><strong>Makes money from:</strong> {g.earns}</span>
                </span>
                <span className="lesson-go" aria-hidden>→</span>
              </a>
            </li>
          );
        })}
      </ul>
      <AdSpot spot="learn" />
    </main>
  );
}

/** One strategy in depth: how it makes money, the honest risk, what goes wrong, first steps, and where to go next. */
export default function StrategyPage({ slug }: { slug?: string }) {
  useMarkStep('learn');
  const [st] = useMyState();
  const g = slug ? strategyBySlug(slug) : undefined;
  if (!g) return <StrategyIndex />;
  const s = strategyOf(g);
  const note = stateNote(g.key, st ?? undefined, getMyArea()?.county);
  const i = STRATEGY_GUIDES.indexOf(g);
  const next = STRATEGY_GUIDES[i + 1];
  return (
    <main className="page lesson deep-page">
      <PageHero
        top={<a href="#/learn/strategies">← Ways to make money</a>}
        eyebrow={<span className="eyebrow">Strategy</span>}
        title={s.title}
        sub={s.what}
      />
      <StatePicker label="Show rules for" />
      <section className="lesson-takeaways" aria-labelledby="takeaways">
        <h2 id="takeaways">What you’ll learn</h2>
        <ul>
          <li>How this strategy makes money.</li>
          <li>The cash at risk and the worst realistic outcome.</li>
          <li>What usually goes wrong on a first deal.</li>
          <li>Your first steps, with links to practice it and run your own numbers.</li>
        </ul>
      </section>
      {note && <div className="notice" role="note">{note}</div>}
      <section>
        <h2>How it makes money</h2>
        <ul className="deep-list">{g.makesMoney.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section>
        <h2>The honest risk</h2>
        <dl className="decide-risk">
          {([
            ['Cash you need to start', s.risk.atRisk],
            ['Worst realistic outcome', s.risk.worst],
            ['What you keep owing', s.risk.ongoing ?? ''],
            ['How long a first deal takes', s.risk.time],
          ] as [string, string][]).filter((x) => x[1]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </section>
      <section>
        <h2>What goes wrong on a first deal</h2>
        <ul className="deep-list">{g.watchFor.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section>
        <h2>Your first steps</h2>
        {/* Every step reads as plain text; where we have a page for it, a small "Open" link follows. */}
        <ol className="deep-list first-steps">{s.checklist.map((c) => <li key={c.id}>{c.text}{c.href && <> <a className="step-open" href={c.href}>Open&nbsp;→</a></>}</li>)}</ol>
      </section>
      <section>
        <h2>Learn, practice and run the numbers</h2>
        <div className="deep-two">
          <div>
            <h3>Read</h3>
            <ul className="deep-list">{g.lessons.map((k) => <li key={k}><a href={`#/learn/${k}`}>{lessonTitle(k)}</a></li>)}</ul>
          </div>
          <div>
            <h3>Practice and analyze</h3>
            <ul className="deep-list">
              {g.practice.map((p) => {
                // The foreclosure-auction drill comes in every state: open the reader's own state's version.
                const name = st ? stateByCode(st)?.name : undefined;
                const mine = st && name && /-nv$/.test(p.href) && p.label.includes('(Nevada)') ? { href: p.href.replace(/-nv$/, `-${st.toLowerCase()}`), label: p.label.replace('(Nevada)', `(${name})`) } : p;
                return <li key={p.href}><a href={mine.href}>{mine.label}</a></li>;
              })}
              {g.calc && <li><a href={g.calc.href}>{g.calc.label}</a></li>}
              {!g.practice.length && !g.calc && <li>There’s nothing to buy and manage here; compare funds’ fees and read the offering documents.</li>}
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2>Your team for this strategy</h2>
        <ul className="deep-list link-columns">
          {g.team.map((k) => {
            const p = proGuideByKey(k);
            return p ? <li key={k}><a href={`#/pros/${k}`}>{p.title}</a>: {p.summary}</li> : null;
          })}
        </ul>
      </section>
      <nav className="path-next" aria-label="Next">
        {next ? <><span className="muted">Next strategy</span><a className="btn" href={`#/learn/strategies/${next.slug}`}>{strategyOf(next).title}&nbsp;→</a></> : <a className="btn" href="#/decide">Choose yours in Decide&nbsp;→</a>}
      </nav>
      {/* No ad on the auctions strategy: it is about forced sales (contextAds.ts). */}
      <AdSpot spot="learn" allow={g.slug !== 'auctions'} />
    </main>
  );
}
