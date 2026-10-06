import { useLastActivity } from '../lib/journey';
import { useMarkStep } from '../lib/path';
import { stateNote } from '../lib/decide';
import { LEARN_MODULES } from '../lib/learn';
import { useMyState } from '../lib/myState';
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
        {STRATEGY_GUIDES.map((g) => {
          const s = strategyOf(g);
          return (
            <li key={g.key}>
              <a className="lesson-card ready" href={`#/learn/strategies/${g.slug}`}>
                <span className="lesson-body">
                  <strong>{s.title}</strong>
                  <span>{s.what}</span>
                  <span className="lesson-meta">Makes money from: {g.makesMoney[0].replace(/[.:].*$/, '').toLowerCase()}</span>
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
  const note = stateNote(g.key, st ?? undefined);
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
      <p className="page-summary"><strong>What you’ll learn:</strong> how this strategy makes money, the cash at risk and the worst realistic outcome, what usually goes wrong on a first deal, and your first steps, with links to practice it and run your own numbers.</p>
      {note && <div className="notice" role="note">{note}</div>}
      <section>
        <h2>How it makes money</h2>
        <ul className="deep-list">{g.makesMoney.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section>
        <h2>The honest risk</h2>
        <dl className="calc-kv">
          <div><dt>Cash you need to start</dt><dd>{s.risk.atRisk}</dd></div>
          <div><dt>Worst realistic outcome</dt><dd>{s.risk.worst}</dd></div>
          {s.risk.ongoing && <div><dt>What you keep owing</dt><dd>{s.risk.ongoing}</dd></div>}
          <div><dt>How long a first deal takes</dt><dd>{s.risk.time}</dd></div>
        </dl>
      </section>
      <section>
        <h2>What goes wrong on a first deal</h2>
        <ul className="deep-list">{g.watchFor.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section>
        <h2>Your first steps</h2>
        <ol className="deep-list">{s.checklist.map((c) => <li key={c.id}>{c.href ? <a href={c.href}>{c.text}</a> : c.text}</li>)}</ol>
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
              {g.practice.map((p) => <li key={p.href}><a href={p.href}>{p.label}</a></li>)}
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
        {next ? <><span className="muted">Next strategy</span><a className="btn" href={`#/learn/strategies/${next.slug}`}>{strategyOf(next).title} →</a></> : <a className="btn" href="#/decide">Choose yours in Decide →</a>}
      </nav>
      <AdSpot spot="learn" />
    </main>
  );
}
