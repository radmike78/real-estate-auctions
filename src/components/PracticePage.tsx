import { stateByCode } from '../lib/regions';
import { practiceState, routePractice, guidedPracticeDone } from '../lib/planNext';
import { planPath, roadmapDone } from '../lib/roadmapState';
import { practicePart2Done } from '../lib/journey';
import NarrowDown from './NarrowDown';
import { practiceConfig } from '../lib/narrow';
import PracticeStateNote from './PracticeStateNote';
import { DealJourneyEntry } from './DealJourneyPage';
import { getMyState, useMyState } from '../lib/myState';
import { useMarkStep, stepEyebrow } from '../lib/path';
import PathNext from './PathNext';
import { useEffect, useState } from 'react';
import PageHero from './PageHero';
import { DrillList, hasSavedDrillScroll, TopicIcon, presetDrillTopic } from './DrillPage';
import { HUE_COUNT, type Topic } from '../practice/drillCards';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { playbookByKey } from '../lib/playbooks';
import { PRACTICE_PROPERTIES, type PracticeProperty } from '../practice/properties';
import { buildScenario, SALE_ORDER, whyUnavailable } from '../practice/scenarios';
import { completion } from '../practice/progress';
import type { SaleKey } from '../practice/types';
import OwlNote from './OwlNote';
import { useLastActivity } from '../lib/journey';
import { loadCase } from '../practice/caseProgress';
import { caseFor, caseResume } from '../practice/rentalCase';
import AdSpot from './AdSpot';

/** Each kind of sale keeps the same colour and icon as its drills. */
const SALE_TOPIC: Record<SaleKey, Topic> = { tax: 'tax', foreclosure: 'trustee', reo: 'bank', short: 'short', hoa: 'hoa', sheriff: 'sheriff', irs: 'irs', sid: 'taxlien' };

/**
 * One short line per kind of sale for the auction-practice cards. These runs follow Clark County, Nevada rules, so the
 * lines describe the sale as it works there, in plain words (the sale guides have the details and sources).
 */
const SALE_BLURB: Record<SaleKey, string> = {
  tax: 'Homes and land years behind on property taxes, auctioned in person by the County Treasurer.',
  foreclosure: 'The owner stopped paying the loan, and a trustee auctions the home without a court case.',
  reo: 'A home the lender took back at a foreclosure auction, now sold through its broker.',
  short: 'The owner sells for less than they owe, with the lender’s approval.',
  hoa: 'The homeowners association sells a home to collect unpaid dues.',
  sheriff: 'Property sold to pay a court judgment, including court-ordered foreclosures.',
  irs: 'The IRS sells property it seized for unpaid federal taxes.',
  sid: 'You buy the county’s lien for unpaid improvement-district charges: a debt that earns interest, not the property.',
};

/** One plain line, not a banner: readers skip anything styled like a notice. */
export function PracticeRibbon() {
  return (
    <p className="practice-ribbon" role="note">
      <strong>Practice mode:</strong> fictional properties, so nothing here is for sale. Before a real deal, talk with a real estate attorney, a
      licensed lender and a tax advisor.
    </p>
  );
}

/** A practice property's look on its card: homes, commercial buildings and land each get their own colour and icon. */
const propLook = (p: PracticeProperty): { hue: number; icon: Topic; kind: string } =>
  !p.hasBuilding ? { hue: 7, icon: 'land', kind: p.cls === 'commercial' ? 'Commercial land' : 'Land' }
  : p.cls === 'commercial' ? { hue: 3, icon: 'commercial', kind: 'Commercial' }
  : { hue: 0, icon: 'trustee', kind: 'Residential' };

/** Step 1: pick a kind of sale. Step 2: pick a property that fits it. Then practice buying it step by step. */
export default function PracticePage({ sale }: { sale?: string }) {
  // On the auction and lien routes, practice part 2 is the route's own practice; the rental case is extra.
  const ownPractice = routePractice(planPath());
  useMarkStep('practice');
  // A Nevada lien deal in focus (on the lien route) practices under Nevada rules, whatever your own state.
  const [mineRaw] = useMyState();
  // Practice part 2 settled on the auction or lien route before a listed home changed the route.
  const partTwoElsewhere = !practicePart2Done() && ['a-practice', 'c-practice'].some((id) => roadmapDone().includes(id));
  // Its own step marked done (or "doesn't apply") in My plan by hand: it's done, as My plan says.
  const partTwoMarked = !practicePart2Done() && !partTwoElsewhere && guidedPracticeDone('listing');
  // Practice part 2 settled as My plan counts it (the route's own step done or "doesn't apply", or another part 2
  // done): the page says so, and the route's practice is optional now.
  // Which other practice settled part 2 (for the note, and the rental section when it was the rental purchase).
  const ownOther: 'rental' | 'a-practice' | 'c-practice' = practicePart2Done() || roadmapDone().includes('practice') ? 'rental' : roadmapDone().includes('c-practice') && ownPractice?.id !== 'c-practice' ? 'c-practice' : 'a-practice';
  const ownSettled = !!ownPractice && guidedPracticeDone(planPath());
  const ownMarked: 'done' | 'na' | 'elsewhere' | null = !ownSettled ? null : roadmapDone().includes(ownPractice!.id) ? 'done' : (() => { try { return (JSON.parse(localStorage.getItem('deedowl.roadmap.status.v1') ?? '{}') as Record<string, string>)[ownPractice!.id] === 'na' ? 'na' : 'elsewhere'; } catch { return 'elsewhere'; } })();
  const ownNote = ownMarked && <p className="practice-step-intro"><strong>{ownMarked === 'done' ? 'This practice is done in My plan.' : ownMarked === 'na' ? 'You marked this practice “doesn’t apply” in My plan.' : `Practice part 2 is already done in My plan, with ${ownOther === 'rental' ? 'the rental purchase' : ownOther === 'c-practice' ? 'the lien practice' : 'the auction practice'}.`}</strong> This one is still here if you’d like more practice.</p>;
  const p2 = ownMarked ? 'this practice' : 'your part 2';
  const mine = practiceState() === 'NV' ? 'NV' : mineRaw;
  const [cls, setCls] = useState<ClassFilter>('all');
  const chosen = mine === 'NV' && sale && (SALE_ORDER as string[]).includes(sale) ? (sale as SaleKey) : null;
  const titleOf = (s: SaleKey) => playbookByKey(s)?.title ?? s;
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  useLastActivity(chosen ? `#/practice?sale=${chosen}` : '#/practice', chosen ? `Practice: ${titleOf(chosen)}` : 'Practice');
  // /practice/drills opens at the drills (step 3), unless the list is about to restore the reader's place in it.
  useEffect(() => {
    if (chosen || !/\/practice\/drills\/?$/.test(window.location.pathname + window.location.hash) || hasSavedDrillScroll()) return;
    const t = window.setTimeout(() => document.getElementById('practice-drills')?.scrollIntoView({ block: 'start' }), 80);
    return () => window.clearTimeout(t);
  }, [chosen]);

  const practiceCase = caseFor(getMyState());
  const caseP = loadCase(practiceCase.state);
  const caseStarted = caseP.done.length > 0 || !!caseP.walked;
  const caseNext = caseResume(practiceCase.stages, caseP);
  // A visitor from another state: these runs follow Nevada rules, so they sit behind one switch, and that state's own
  // drills (step 3) come first.
  const otherState = !!mine && mine !== 'NV';
  // Auction practice follows Clark County, Nevada rules. A link to it from another state (a lesson, the roadmap) opens
  // the auction drills instead, which cover that state's own sales.
  const toAuctionDrills = otherState && !!sale;
  useState(() => { if (toAuctionDrills) presetDrillTopic('auctions'); });
  useEffect(() => {
    if (!toAuctionDrills) return;
    const t = window.setTimeout(() => document.getElementById('practice-drills')?.scrollIntoView({ block: 'start' }), 80);
    return () => window.clearTimeout(t);
  }, [toAuctionDrills]);
  // SID lien certificates are a Clark County, Nevada sale only: not offered to visitors from other states.
  // On the lien route the SID run (part 2) comes first.
  // A reader in another state practicing for a Nevada lien deal gets the SID run only (the other Nevada runs follow
  // their own state's gate).
  const lienDealOnly = !!mineRaw && mineRaw !== 'NV' && mine === 'NV';
  const auctionSales = SALE_ORDER.filter((s) => (s !== 'sid' || !mine || mine === 'NV') && (!lienDealOnly || s === 'sid')).sort((a, b) => (planPath() === 'certificate' ? Number(b === 'sid') - Number(a === 'sid') : 0));
  const auctionTiles = (
    <div className="practice-sales">
      {auctionSales.map((s, i) => {
        const runs = PRACTICE_PROPERTIES.map((p) => buildScenario(s, p)).filter((x): x is NonNullable<typeof x> => !!x);
        const pct = runs.map((r) => completion(r.id, r.stages.reduce((n, st) => n + st.tasks.length, 0)));
        const done = pct.filter((x) => x === 1).length;
        const started = pct.filter((x) => x > 0 && x < 1).length;
        return (
          <a key={s} href={`#/practice?sale=${s}`} className={`practice-sale-tile hue-${i % HUE_COUNT}`}>
            <span className="sale-tile-head"><span className="drill-card-icon"><TopicIcon topic={SALE_TOPIC[s]} /></span><strong>{otherState ? cap(titleOf(s).replace(/^Nevada /, '')) : titleOf(s)}</strong></span>
            {/* The heading above and the tile titles already say Nevada, so the state isn't repeated on every card. */}
            <span className="muted">{SALE_BLURB[s]}</span>
            <span className="practice-card-foot">
              <span className="badge tone-info">{runs.length} {runs.length === 1 ? 'property' : 'properties'}</span>
              {done > 0 && <span className="badge tone-go">{done} completed</span>}
              {started > 0 && <span className="badge tone-info">{started} in progress</span>}
              <span aria-hidden>→</span>
            </span>
          </a>
        );
      })}
    </div>
  );
  if (!chosen) {
    return (
      <main className="page practice">
        <PageHero
          eyebrow={<span className="eyebrow">{stepEyebrow('practice')}</span>}
          title={<>Practice <span className="grad">buying</span></>}
          sub="Buy a fictional property step by step, from research to the day after the sale."
        />
        <PracticeRibbon />
        <DealJourneyEntry />
        <NarrowDown config={practiceConfig(!otherState)} intro="Answer two quick questions and we’ll point you to the best practice to start with. Everything else stays on this page below." />
        {/* Ads only here, above all the practice: never beside the forced-sale runs and drills, and not on the auction or lien routes. */}
        <AdSpot spot="practice" allow={!chosen && !sale && !ownPractice} />
        <details className="practice-more" open><summary>All the ways to practice: {otherState ? 'a full purchase and quick drills, including auction drills' : 'a full purchase, auctions and quick drills'}</summary>
        {/* On the auction and lien routes, their own practice (part 2) comes first; the rental purchase is extra. */}
        {ownPractice ? <>
        {otherState && <>
        <h2 id="practice-auction" tabIndex={-1} className="practice-step">{ownMarked ? 'Optional' : 'Practice part 2'}: {ownPractice.id === 'c-practice' && practiceState() === 'AZ' ? `${ownPractice.title} (the Arizona tax lien drill)` : `${ownPractice.title} (auction drills for ${stateByCode(mine!)?.name ?? 'your state'})`}</h2>
        {ownNote}
        <p className="practice-step-intro">{ownPractice.id === 'c-practice' && practiceState() === 'AZ' && mineRaw !== 'AZ' ? `The lien deal you saved is in Arizona, so ${p2} is the Arizona tax lien drill.` : <>Our auction and lien practice runs follow Nevada rules, so {p2} is {ownPractice.id === 'c-practice' && practiceState() === 'AZ' ? 'the Arizona tax lien drill' : 'the drills for your own state’s sales, below'}.</>} <a className="btn" href={ownPractice.id === 'c-practice' && practiceState() === 'AZ' ? '#/practice/drills/tax-lien-az' : ownPractice.href} onClick={(e) => { if (ownPractice.id === 'c-practice' && practiceState() === 'AZ') return; if (!sale) return; /* already on the auction drills: scroll to them, don't reload the page */ const el = document.getElementById('practice-drills'); if (el) { e.preventDefault(); el.scrollIntoView({ block: 'start' }); } }}>Open {ownPractice.id === 'c-practice' && practiceState() === 'AZ' ? 'the tax lien drill' : 'the auction drills'} →</a></p>
        </>}
        {!otherState && <>
        <h2 id="practice-auction" tabIndex={-1} className="practice-step">{ownPractice ? `${ownMarked ? 'Optional' : 'Practice part 2'}: ${ownPractice.title} (${lienDealOnly ? 'the Nevada SID lien run' : planPath() === 'certificate' ? 'Nevada auction and lien practice' : 'Nevada auction practice'})` : 'Nevada auction practice: choose a kind of sale'}</h2>
        {ownNote}
        <p className="practice-step-intro"><strong>{planPath() === 'certificate' ? (mineRaw && mineRaw !== 'NV' ? `The lien deal you saved is in Nevada, so ${p2} is the Nevada lien certificates (SID) run below.` : `The first run, Nevada lien certificates (SID), is ${p2}; the other runs are extra.`) : (ownMarked ? 'A run at an auction (tax, foreclosure, HOA, sheriff or IRS sale) and three auction drills make up this practice.' : 'A run at an auction (tax, foreclosure, HOA, sheriff or IRS sale) is part of it; the step also asks for three auction drills, so check its test before you mark it done.') + ' The bank-owned, short-sale and SID lien runs are extra.'}</strong></p>
        <p className="practice-step-intro">Buy a fictional property at one kind of sale, step by step, from research to the day after.</p>
        <p className="practice-nv-note" role="note"><strong>Clark County practice.</strong> These sales follow local rules. Check your county’s requirements before a real purchase.</p>
        {auctionTiles}
        </>}
        <h2 id="practice-case" className="practice-step">{ownMarked === 'elsewhere' && ownOther === 'rental' ? 'Practice part 2 (done): Buy a rental (the paperwork)' : ownPractice ? 'Optional: Buy a rental (the paperwork)' : 'Practice part 2: Buy a rental (the paperwork)'}</h2>
        <p className="practice-step-intro">{ownMarked === 'elsewhere' && ownOther === 'rental' ? 'This rental purchase counts as your practice part 2 in My plan.' : ownMarked ? 'This rental purchase is extra, if you may buy a listed home later.' : <>On your route, practice part 2 is “<a href="#/practice" onClick={(e) => { const el = document.getElementById('practice-auction'); if (el) { e.preventDefault(); el.scrollIntoView({ block: 'start' }); el.focus({ preventScroll: true }); } }}>{ownPractice.id === 'c-practice' && practiceState() === 'AZ' ? 'the Arizona tax lien drill' : ownPractice.title}</a>”, above; this rental purchase is extra, if you may buy a listed home later.</>} It’s the paperwork, on a new fictional house. Work one fictional purchase from your budget to the first months of renting it out. Read teaching versions of the paperwork (comparables, a loan quote, an inspection report, a title commitment, a closing statement), each with a guide to reading the real form, and make the calls when things go wrong. You finish with your own deal packet: a budget, a deadline calendar, an evidence log and your questions for each professional.</p>
        <div className="practice-case-go">
          <a className="btn big" href={`#/practice/case${caseStarted ? `/${caseNext.key}` : ''}`}>{!caseStarted ? 'Start the purchase\u00a0→' : caseNext.packet ? 'See your deal packet\u00a0→' : 'Continue the purchase\u00a0→'}</a>
          <span className="practice-case-meta">About 45 minutes · {practiceCase.property} · {practiceCase.stateName} rules{practiceCase.state === 'TX' ? ', with the TREC contract' : ''}</span>
        </div>
        </> : <>
        {/* Part 2 already settled on another route (an auction or lien practice): this one is extra now. */}
        <h2 id="practice-case" className="practice-step">{partTwoElsewhere || partTwoMarked ? 'Optional: Buy a rental (the paperwork)' : 'Practice part 2: Buy a rental (the paperwork)'}</h2>
        {partTwoMarked && <p className="practice-step-intro"><strong>{roadmapDone().includes('practice') ? 'You marked practice part 2 done in My plan.' : 'You marked practice part 2 “doesn’t apply” in My plan.'}</strong> The rental purchase is still here if you’d like the paperwork practice.</p>}
        {partTwoElsewhere && <p className="practice-step-intro"><strong>Your practice part 2 is done:</strong> you finished the {roadmapDone().includes('c-practice') ? 'lien practice' : 'auction practice'}. This rental purchase is extra, if you’d like the paperwork for a listed home too.</p>}
        <p className="practice-step-intro">{partTwoElsewhere || partTwoMarked ? 'This practice is the paperwork, on a new fictional house.' : 'Part 1 was the decisions; part 2 is the paperwork, on a new fictional house.'} Work one fictional purchase from your budget to the first months of renting it out. Read teaching versions of the paperwork (comparables, a loan quote, an inspection report, a title commitment, a closing statement), each with a guide to reading the real form, and make the calls when things go wrong. You finish with your own deal packet: a budget, a deadline calendar, an evidence log and your questions for each professional.</p>
        <div className="practice-case-go">
          <a className="btn big" href={`#/practice/case${caseStarted ? `/${caseNext.key}` : ''}`}>{!caseStarted ? 'Start the purchase\u00a0→' : caseNext.packet ? 'See your deal packet\u00a0→' : 'Continue the purchase\u00a0→'}</a>
          <span className="practice-case-meta">About 45 minutes · {practiceCase.property} · {practiceCase.stateName} rules{practiceCase.state === 'TX' ? ', with the TREC contract' : ''}</span>
        </div>
        {!otherState && <>
        <h2 id="practice-auction" tabIndex={-1} className="practice-step">Nevada auction practice: choose a kind of sale</h2>
        <p className="practice-step-intro">Buy a fictional property at one kind of sale, step by step, from research to the day after.</p>
        <p className="practice-nv-note" role="note"><strong>Clark County practice.</strong> These sales follow local rules. Check your county’s requirements before a real purchase.</p>
        {auctionTiles}
        </>}
        </>}
        <h2 id="practice-drills" className="practice-step">Quick drills: would you buy it?</h2>
        <p className="practice-step-intro"><strong>Each drill is one short, made-up deal.</strong> Work through 2 to 4 missions (value it, check the rent, price the repairs, find the liens, run the numbers), then decide: Buy, Investigate or Pass. Missions are rehearsal: finishing them builds skill, not readiness to buy a real property.</p>
        <DrillList presetTopic={toAuctionDrills ? 'auctions' : undefined} liensFirst={sale === 'sid'} />
        </details>
        <PathNext step="practice" />
      </main>
    );
  }

  const props = PRACTICE_PROPERTIES.filter((p) => (cls === 'all' || p.cls === cls) && !whyUnavailable(chosen, p));
  return (
    <main className="page practice">
      <PageHero
        title={<>Practice: <span className="grad">{titleOf(chosen)}</span></>}
        sub="Nevada (Clark County) practice"
      />
      <PracticeRibbon />
      {/* Which state's rules this is comes first, then how the sale works there. */}
      <PracticeStateNote sale={chosen} />
      <p className="practice-sale-about"><strong>{otherState ? 'How this sale works in Nevada (Clark County):' : 'How this sale works:'}</strong> {playbookByKey(chosen)?.oneLine}</p>
      <p><a href="#/practice">← Choose a different kind of sale</a></p>
      <h2 className="practice-step practice-step-plain">Choose a property</h2>
      <div className="row practice-filter">
        <ClassSwitch value={cls} onChange={setCls} label="Residential or commercial" />
      </div>
      <div className="practice-grid">
        {props.map((p) => {
          const sc = buildScenario(chosen, p)!;
          const total = sc.stages.reduce((n, st) => n + st.tasks.length, 0);
          const pct = Math.round(completion(sc.id, total) * 100);
          const look = propLook(p);
          const fact = p.facts[0];
          return (
            <a key={p.id} href={`#/practice/${sc.id}`} className={`practice-card practice-prop hue-${look.hue}`}>
              <span className="practice-prop-head">
                <span className="drill-card-icon"><TopicIcon topic={look.icon} /></span>
                <span className="practice-card-type">{p.label}</span>
              </span>
              <span className="practice-prop-kind">{look.kind} · {p.city}</span>
              {fact && <span className="practice-prop-fact"><span>{fact.label}</span> <strong>{fact.value}</strong></span>}
              <span className="practice-card-foot">
                {pct > 0 ? <span className="badge tone-go">{pct === 100 ? 'Completed' : `${pct}% done`}</span> : <span className="practice-prop-go">Practice this one</span>}
                <span aria-hidden>→</span>
              </span>
            </a>
          );
        })}
      </div>
      {props.length === 0 && <OwlNote>No {cls} properties for this kind of sale. Try All.</OwlNote>}
      <p className="muted practice-run-note">
        Each practice run follows the rules for this kind of sale in Clark County, from our <a href="#/playbooks">guides</a>. The people you
        contact are fictional and their replies are simulated, so nothing is sent anywhere.
      </p>
      <AdSpot spot="practice" allow={!chosen} />
    </main>
  );
}
