import PracticeStateNote from './PracticeStateNote';
import NarrowDown from './NarrowDown';
import { practiceConfig } from '../lib/narrow';
import { getMyState } from '../lib/myState';
import { useMarkStep } from '../lib/path';
import PathNext from './PathNext';
import { useState } from 'react';
import PageHero from './PageHero';
import { DrillList, TopicIcon } from './DrillPage';
import type { Topic } from '../practice/drillCards';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { playbookByKey } from '../lib/playbooks';
import { PRACTICE_PROPERTIES } from '../practice/properties';
import { buildScenario, SALE_ORDER, whyUnavailable } from '../practice/scenarios';
import { completion } from '../practice/progress';
import type { SaleKey } from '../practice/types';
import OwlNote from './OwlNote';
import { useLastActivity } from '../lib/journey';
import { loadCase } from '../practice/caseProgress';
import { caseFor } from '../practice/rentalCase';
import AdSpot from './AdSpot';

/** Each kind of sale keeps the same colour and icon as its drills. */
const SALE_TOPIC: Record<SaleKey, Topic> = { tax: 'tax', foreclosure: 'trustee', reo: 'listed', short: 'listed', hoa: 'hoa', sheriff: 'sheriff', irs: 'irs', sid: 'taxlien' };

/** One plain line, not a banner: readers skip anything styled like a notice. */
export function PracticeRibbon() {
  return (
    <p className="practice-ribbon" role="note">
      <strong>Practice mode:</strong> fictional properties, so nothing here is for sale. Before a real deal, talk with a real estate attorney, a
      licensed lender and a tax advisor.
    </p>
  );
}

/** Step 1: pick a kind of sale. Step 2: pick a property that fits it. Then practice buying it step by step. */
export default function PracticePage({ sale }: { sale?: string }) {
  useMarkStep('practice');
  const [cls, setCls] = useState<ClassFilter>('all');
  const chosen = sale && (SALE_ORDER as string[]).includes(sale) ? (sale as SaleKey) : null;
  const titleOf = (s: SaleKey) => playbookByKey(s)?.title ?? s;
  useLastActivity(chosen ? `#/practice?sale=${chosen}` : '#/practice', chosen ? `Practice: ${titleOf(chosen)}` : 'Practice');

  const practiceCase = caseFor(getMyState());
  const caseP = loadCase(practiceCase.state);
  const caseStarted = caseP.done.length > 0;
  const caseNext = (practiceCase.stages.find((st) => !st.tasks.every((t) => caseP.done.includes(`${st.key}/${t.id}`))) ?? practiceCase.stages[0]).key;
  if (!chosen) {
    return (
      <main className="page practice">
        <PageHero
          title={<>Practice <span className="grad">buying</span></>}
          sub="Buy a fictional property step by step, from research to the day after the sale."
        />
        <PracticeRibbon />
        {/* One clear first action: the full worked purchase. The catalog stays below for anyone who wants more. */}
        <section className="case-feature" aria-labelledby="case-feature-head">
          <span className="practice-tag">Start here</span>
          <h2 id="case-feature-head">Buy a rental, start to finish</h2>
          <p>Work one fictional purchase from your budget to the first months of renting it out. Read teaching versions of the paperwork (comparables, a loan quote, an inspection report, a title commitment, a closing statement), each with a guide to reading the real form, and make the calls when things go wrong. You finish with your own deal packet: a budget, a deadline calendar, an evidence log and your questions for each professional.</p>
          <a className="btn big" href={`#/practice/case${caseStarted ? `/${caseNext}` : ''}`}>{caseStarted ? 'Continue the purchase →' : 'Start the purchase →'}</a>
          <span className="muted"> About 45 minutes · {practiceCase.property} · {practiceCase.stateName} rules{practiceCase.state === 'TX' ? ', with the TREC contract' : ''}</span>
        </section>
        <h2 className="section-title">More practice</h2>
        <p>The start-to-finish purchase has a practice house in each state we cover: Nevada, California, Arizona, Utah and Texas. You see the one for your state (Nevada if you haven’t chosen one). The auction practice below follows Nevada rules (Clark County), with Texas drills for Texas sales; other states’ rules are in the <a href="#/playbooks">sale guides</a>. The quick “Would you buy it?” drills are further down.</p>
        <NarrowDown config={practiceConfig(getMyState())} intro="Answer a few quick questions and we’ll suggest a practice purchase or drills to start with. Everything is still listed below." />
        <h2 className="practice-step"><span aria-hidden>1</span> Nevada auction practice: choose a kind of sale</h2>
        <p className="muted">These practice purchases follow Nevada rules (Clark County). Drills for every state are in step 2.</p>
        <div className="practice-sales">
          {/* SID lien certificates are a Clark County, Nevada sale only: not offered to visitors from other states. */}
          {SALE_ORDER.filter((s) => s !== 'sid' || !getMyState() || getMyState() === 'NV').map((s) => {
            const runs = PRACTICE_PROPERTIES.map((p) => buildScenario(s, p)).filter((x): x is NonNullable<typeof x> => !!x);
            const pct = runs.map((r) => completion(r.id, r.stages.reduce((n, st) => n + st.tasks.length, 0)));
            const done = pct.filter((x) => x === 1).length;
            const started = pct.filter((x) => x > 0 && x < 1).length;
            return (
              <a key={s} href={`#/practice?sale=${s}`} className={`practice-sale-tile topic-${SALE_TOPIC[s]}`}>
                <span className="sale-tile-head"><span className="drill-card-icon"><TopicIcon topic={SALE_TOPIC[s]} /></span><strong>{titleOf(s)}</strong></span>
                <span className="muted">{playbookByKey(s)?.oneLine}</span>
                <span className="practice-card-foot">
                  <span className="badge tone-info">{runs.length} {runs.length === 1 ? 'property' : 'properties'}</span>
                  {done > 0 && <span className="badge tone-go">{done} completed</span>}
                  {started > 0 && <span className="badge tone-wait">{started} in progress</span>}
                  <span aria-hidden>→</span>
                </span>
              </a>
            );
          })}
        </div>
        <h2 className="practice-step"><span aria-hidden>2</span> Quick drills: would you buy it?</h2>
        <p><strong>Each drill is one short, made-up deal.</strong> Work through 2 or 3 missions (value it, check the rent, price the repairs, find the liens, run the numbers), then decide: Buy, Investigate or Pass. Missions are rehearsal: finishing them builds skill, not readiness to buy a real property.</p>
        <DrillList />
        <PathNext step="practice" />
        <AdSpot spot="practice" />
      </main>
    );
  }

  const props = PRACTICE_PROPERTIES.filter((p) => (cls === 'all' || p.cls === cls) && !whyUnavailable(chosen, p));
  return (
    <main className="page practice">
      <PageHero
        title={<>Practice: <span className="grad">{titleOf(chosen)}</span></>}
        sub={playbookByKey(chosen)?.oneLine}
      />
      <PracticeRibbon />
      <PracticeStateNote sale={chosen} />
      <p><a href="#/practice">← Choose a different kind of sale</a></p>
      <h2 className="practice-step"><span aria-hidden>2</span> Choose a property</h2>
      <div className="row practice-filter">
        <ClassSwitch value={cls} onChange={setCls} label="Residential or commercial" />
      </div>
      <div className="practice-grid">
        {props.map((p) => {
          const sc = buildScenario(chosen, p)!;
          const total = sc.stages.reduce((n, st) => n + st.tasks.length, 0);
          const pct = Math.round(completion(sc.id, total) * 100);
          return (
            <a key={p.id} href={`#/practice/${sc.id}`} className="practice-card">
              <span className="practice-card-type">{p.label}</span>
              <span className="small muted">{p.cls === 'commercial' ? 'Commercial' : 'Residential'} · {p.city}</span>
              <span className="practice-card-foot">
                {pct > 0 ? <span className="badge tone-go">{pct === 100 ? 'Completed' : `${pct}% done`}</span> : <span className="badge tone-info">Practice</span>}
                <span aria-hidden>→</span>
              </span>
            </a>
          );
        })}
      </div>
      {props.length === 0 && <OwlNote>No {cls} properties for this kind of sale. Try All.</OwlNote>}
      <p className="muted">
        Each practice run follows the rules for this kind of sale in Clark County, from our <a href="#/playbooks">guides</a>. The people you
        contact are fictional and their replies are simulated, so nothing is sent anywhere.
      </p>
      <AdSpot spot="practice" />
    </main>
  );
}
