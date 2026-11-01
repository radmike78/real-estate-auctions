import { drillAllowsAds } from '../lib/contextAds';
import NumInput from './NumInput';
import { workStorage as localStorage } from '../lib/workStorage';
import { shuffled } from '../lib/shuffle';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useJourney, useLastActivity } from '../lib/journey';
import { planNow } from '../lib/planNext';
import PageHero from './PageHero';
import StatePicker from './StatePicker';
import EmptyState from './EmptyState';
import { PracticeRibbon } from './PracticePage';
import { useNoIndex } from '../lib/noindex';
import { DRILLS, drillById, type Drill, type Mission } from '../practice/drills';
import { drillCard, HUE_COUNT, TOPIC_GROUPS, withoutState, type Topic, type TopicGroup } from '../practice/drillCards';
import OwlNote from './OwlNote';
import { fmtMoney } from '../lib/status';
import { useMyState } from '../lib/myState';
import TopicAd from './TopicAd';
import AdSpot from './AdSpot';

const KEY = 'deedowl.drills.v1';

/** Picks per mission (option labels, or the typed estimate), and the final verdict, per drill. */
type Answers = Record<string, { picks?: string[]; estimate?: number; done?: boolean }>;
type Saved = Record<string, { answers: Answers; verdict?: string }>;

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    // Keep only well-formed answers, so old, hand-edited or restored data can't break the page.
    const out: Saved = {};
    for (const d of DRILLS) {
      const x = v[d.id];
      if (!x || typeof x !== 'object') continue;
      const answers: Answers = {};
      for (const m of d.missions) {
        const a = x.answers?.[m.id];
        if (!a || typeof a !== 'object') continue;
        answers[m.id] = {
          picks: Array.isArray(a.picks) ? a.picks.filter((p: unknown): p is string => typeof p === 'string').slice(0, 20) : undefined,
          estimate: typeof a.estimate === 'number' && Number.isFinite(a.estimate) && a.estimate >= 0 ? a.estimate : undefined,
          done: a.done === true,
        };
      }
      out[d.id] = { answers, verdict: d.verdict.choices.some((c) => c.label === x.verdict) ? x.verdict : undefined };
    }
    return out;
  } catch {
    return {};
  }
}

/** How many missions are finished in a drill, for the list. */
export function drillProgress(d: Drill, s: Saved = load()): { done: number; total: number; verdict?: string; questions: number; matched: number } {
  const a = s[d.id]?.answers ?? {};
  // Checked choices are counted apart from finished missions: seeing the explanation after a miss is progress, but
  // not the same as making the call an experienced investor would.
  const checked = d.missions.filter((m): m is Extract<Drill['missions'][number], { kind: 'pick' }> => m.kind === 'pick' && !!a[m.id]?.done);
  const matched = checked.filter((m) => m.options.every((o) => o.good === (a[m.id]?.picks ?? []).includes(o.label))).length;
  return { done: d.missions.filter((m) => a[m.id]?.done).length, total: d.missions.length, verdict: s[d.id]?.verdict, questions: checked.length, matched };
}

/** The drills on the Practice page. */
const STATE_NAMES: Record<string, string> = { NV: 'Nevada', CA: 'California', AZ: 'Arizona', UT: 'Utah', TX: 'Texas' };

/** The state a drill's rules come from, or null when they apply anywhere. */
export function drillState(d: Drill): string | null {
  const text = `${d.title} ${d.where}`;
  return Object.keys(STATE_NAMES).find((k) => text.includes(STATE_NAMES[k])) ?? null;
}


/** A simple line icon for each topic. Icons always sit beside the text label; they never stand alone. */
const TOPIC_ICON: Record<Topic, string> = {
  trustee: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  tax: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  taxlien: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h3m-1.5-1.5v3M14 16h2',
  hoa: 'M4 21V9l5-3v15M9 21V4l11 5v12M12 10h2M12 14h2M16 12h2M16 16h2M3 21h18',
  sheriff: 'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z',
  irs: 'M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18',
  bank: 'M8 15a4 4 0 1 1 3.5-6H21v3h-2v2h-3v-2h-4.5A4 4 0 0 1 8 15zM7 11h.01',
  short: 'M3 12l6 6 12-12M3 6h7M14 18h7',
  brrrr: 'M20 11a8 8 0 0 0-14.5-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.5 4.5L21 15M21 20v-5h-5',
  rental: 'M15 7a4 4 0 1 1-3.5 6H9v2H7v2H4v-3l6.5-6.5A4 4 0 0 1 15 7zM16 10h.01',
  flip: 'M14 6l4 4M4 20l9.5-9.5M14 4l6 6-3 3-6-6zM3 21h7',
  commercial: 'M4 21V5h10v16M14 9h6v12M7 9h2M7 13h2M7 17h2M17 13h1M17 17h1M3 21h18',
  manufactured: 'M3 18h18M5 18V9h14v9M8 18v-4h3v4M14 12h3M7 21h2M15 21h2',
  land: 'M3 20l6-9 4 5 3-4 5 8zM15 6a2 2 0 1 0 0-.01',
};

export function TopicIcon({ topic }: { topic: Topic }) {
  return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={TOPIC_ICON[topic]} /></svg>;
}

/** The drill list's filters and scroll position, kept for this visit only (sessionStorage). */
type Browse = { showAll: boolean; others: boolean; st: string; topic: 'all' | TopicGroup; prog: 'all' | 'new' | 'started' | 'done'; scrollY: number };
const BROWSE_KEY = 'deedowl.drillBrowse.v1';
function readBrowse(): Browse {
  const base: Browse = { showAll: false, others: false, st: 'all', topic: 'all', prog: 'all', scrollY: 0 };
  try {
    const v = JSON.parse(sessionStorage.getItem(BROWSE_KEY) ?? 'null');
    if (!v || typeof v !== 'object') return base;
    return {
      showAll: v.showAll === true,
      others: v.others === true,
      st: typeof v.st === 'string' && /^(all|any|NV|CA|AZ|UT|TX)$/.test(v.st) ? v.st : 'all',
      topic: TOPIC_GROUPS.some((g) => g.key === v.topic) ? v.topic : 'all',
      prog: ['new', 'started', 'done'].includes(v.prog) ? v.prog : 'all',
      scrollY: typeof v.scrollY === 'number' && Number.isFinite(v.scrollY) && v.scrollY > 0 ? Math.min(v.scrollY, 200_000) : 0,
    };
  } catch {
    return base;
  }
}
/** Whether the drill list will restore a saved place on the page (coming back from a drill). */
export const hasSavedDrillScroll = () => readBrowse().scrollY > 0;
/** Open the drill list filtered to one topic (for example auctions), before the list mounts. */
export function presetDrillTopic(topic: TopicGroup) {
  writeBrowse({ ...readBrowse(), topic, prog: 'all', scrollY: 0 });
}
function writeBrowse(b: Browse) {
  try { sessionStorage.setItem(BROWSE_KEY, JSON.stringify(b)); } catch { /* private mode: not kept */ }
}

/** Where a reader is in a drill, and what the card's button says. */
export function drillStatus(d: Drill, s: Saved = load()): { state: 'new' | 'started' | 'done'; action: string; text: string; pct: number } {
  const p = drillProgress(d, s);
  const missed = p.questions - p.matched;
  if (p.verdict) return { state: 'done', action: 'Review answers', text: `Completed · Your call: ${p.verdict}${missed > 0 ? ` · ${missed} ${missed === 1 ? 'mission' : 'missions'} to revisit` : ''}`, pct: 100 };
  if (p.done > 0) return { state: 'started', action: 'Continue drill', text: `${p.done} of ${p.total} missions done`, pct: Math.round((p.done / p.total) * 100) };
  return { state: 'new', action: 'Start drill', text: `0 of ${p.total} missions done`, pct: 0 };
}

/** One drill as a card: the kind of sale big and in its colour, then the question, one labelled fact and the missions. */
export function DrillCardLink({ d, saved, hue = 0, mine = null }: { d: Drill; saved: Saved; /** Position in its row of cards: neighbours never share a colour. */ hue?: number; /** The visitor's state: its name is left out of its own drills' text. */ mine?: string | null }) {
  const c = drillCard(d);
  const p = drillStatus(d, saved);
  const local = (t: string) => (mine && drillState(d) === mine ? withoutState(t, mine) : t);
  return (
    <a href={`#/practice/drills/${d.id}`} className={`drill-card hue-${hue % HUE_COUNT}`} onClick={() => writeBrowse({ ...readBrowse(), scrollY: window.scrollY })}>
      <span className="drill-card-band">
        <span className="drill-card-icon"><TopicIcon topic={c.topic} /></span>
        <span className="drill-card-head">
          <span className="drill-card-sale">{c.sale}</span>
          <span className="drill-card-tags">Drill · {c.property}</span>
        </span>
      </span>
      <span className="drill-card-body">
        <span className="drill-card-q">{local(c.question)}</span>
        {c.fact && <span className="drill-card-fact"><span>{c.fact.label}</span> <strong>{c.fact.value}</strong></span>}
        <span className="drill-card-teaser">{local(d.teaser)}</span>
        {/* Numbered, one per line: a mission title can itself hold two sentences ("You won. What’s true now?"). */}
        <span className="drill-card-missions">
          <strong>Your missions</strong>
          {c.missions.map((m, i) => <span key={m} className="drill-card-mission"><span className="drill-card-mission-n" aria-hidden>{i + 1}</span><span><span className="sr-only">{`Mission ${i + 1}: `}</span>{m}</span></span>)}
        </span>
        <span className="drill-card-foot">
          <span className="drill-card-progress">
            <span>{p.text}</span>
            <span className="drill-card-bar" aria-hidden><i style={{ width: `${p.pct}%` }} /></span>
          </span>
          <span className={`drill-card-go${p.state === 'done' ? ' quiet' : ''}`}>{p.action}&nbsp;→</span>
        </span>
      </span>
    </a>
  );
}

/** The top of a drill page: the same colour, icon and sale name as its card. */
function DrillBand({ d, mine }: { d: Drill; mine: string | null }) {
  const c = drillCard(d);
  const st = drillState(d);
  // With a state chosen, the state goes in one small note under the title instead (see DrillPage).
  return (
    <p className={`drill-card-band drill-page-band hue-${Math.max(0, DRILLS.indexOf(d)) % HUE_COUNT}`}>
      <span className="drill-card-icon"><TopicIcon topic={c.topic} /></span>
      <span className="drill-card-head">
        <span className="drill-card-sale">{c.sale}</span>
        <span className="drill-card-tags">Drill · {mine ? '' : `${st ? STATE_NAMES[st] : 'Any state'} · `}{c.property}</span>
      </span>
    </p>
  );
}

type Filter<T extends string> = { value: T; set: (v: T) => void; options: { key: T; label: string }[]; label: string };

/** One compact filter: a labelled drop-down, so the filters sit on one line beside the state switch. */
function FilterSelect<T extends string>({ value, set, options, label }: Filter<T>) {
  return (
    <label className="drill-filter-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => set(e.target.value as T)}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** The drills on the Practice page, grouped by state, with the visitor's state first, and filters to narrow them. */
export function DrillList() {
  const saved = load();
  const [mine] = useMyState();
  const next = DRILLS.find((d) => (drillState(d) === null || drillState(d) === mine) && drillStatus(d, saved).state === 'started');
  const { mode } = useJourney();
  // Filters and the place in the list are kept for this visit, so coming back from a drill lands where you were.
  const remembered = readBrowse();
  const [showAll, setShowAll] = useState(remembered.showAll);
  // With a state picked, only its drills show (plus ones that apply anywhere) throughout this page.
  const others = false;
  const [stRaw, setSt] = useState<string>(remembered.st);
  const [topic, setTopic] = useState<'all' | TopicGroup>(remembered.topic);
  const [prog, setProg] = useState<'all' | 'new' | 'started' | 'done'>(remembered.prog);
  useEffect(() => writeBrowse({ ...readBrowse(), showAll, others, st: stRaw, topic, prog }), [showAll, others, stRaw, topic, prog]);
  useEffect(() => {
    const y = readBrowse().scrollY;
    if (!y) return;
    const t = window.setTimeout(() => { window.scrollTo(0, y); writeBrowse({ ...readBrowse(), scrollY: 0 }); }, 60);
    return () => window.clearTimeout(t);
  }, []);
  const onlyMine = !!mine;
  const st = onlyMine && stRaw !== 'all' && stRaw !== 'any' && stRaw !== mine ? 'all' : stRaw;
  const own = (d: Drill) => d.commercial || d.flipBrrrr || d.manufactured || d.land;
  // Every drill set in a state (a Nevada park, Arizona land) belongs to that state, whatever its group.
  const keep = (d: Drill) =>
    (!onlyMine || drillState(d) === null || drillState(d) === mine) &&
    (st === 'all' ||(st === 'any' ? drillState(d) === null : drillState(d) === st)) &&
    (topic === 'all' || drillCard(d).group === topic) &&
    (prog === 'all' || drillStatus(d, saved).state === prog);
  const states = mine ? [mine] : [];
  const groups: { key: string; title: string; drills: Drill[] }[] = [
    ...states.map((k) => ({ key: k, title: `${STATE_NAMES[k]} rules`, drills: DRILLS.filter((d) => !own(d) && drillState(d) === k) })),
    { key: 'any', title: 'Any state (federal rules and listed homes)', drills: DRILLS.filter((d) => !own(d) && drillState(d) === null) },
    { key: 'flip-brrrr', title: 'Flips and BRRRR', drills: DRILLS.filter((d) => d.flipBrrrr) },
    { key: 'manufactured', title: 'Manufactured homes', drills: DRILLS.filter((d) => d.manufactured) },
    { key: 'land', title: 'Land', drills: DRILLS.filter((d) => d.land) },
    { key: 'commercial', title: 'Commercial property', drills: DRILLS.filter((d) => d.commercial) },
  ].map((g) => ({ ...g, drills: g.drills.filter(keep) }));
  // Guided visitors start with three drills: a rental, then a foreclosure and a tax sale in their state.
  const code = (mine ?? 'NV').toLowerCase();
  const starter = ['rental-265', `trustee-sale-${code}`, code === 'az' ? 'tax-lien-az' : code === 'ut' ? 'tax-sale-ut' : `tax-deed-${code}`]
    .map((id) => DRILLS.find((d) => d.id === id))
    .filter((d): d is Drill => !!d);
  const guided = mode === 'guided' && !showAll;
  const shown = guided ? [{ key: 'starter', title: 'Start with these three', drills: starter }] : groups;
  // Explorers see the same three first, above the full list, until they filter it.
  const recommended = !guided && st === 'all' && topic === 'all' && prog === 'all' ? starter : [];
  // A recommended drill shows once, up top, not again in its group below.
  const listed = recommended.length ? shown.map((g) => ({ ...g, drills: g.drills.filter((d) => !recommended.includes(d)) })) : shown;
  const count = shown.reduce((n, g) => n + g.drills.length, 0);
  const filtered = st !== 'all' || topic !== 'all' || prog !== 'all';
  const switchButton = null;
  return (
    <>
      {!guided && (
        <div className="drill-toolbar" role="group" aria-label="Choose which drills to show">
          {switchButton}
          <FilterSelect label="Topic" value={topic} set={setTopic} options={[{ key: 'all', label: 'All topics' }, ...TOPIC_GROUPS]} />
          <FilterSelect label="Progress" value={prog} set={setProg} options={[{ key: 'all', label: 'All' }, { key: 'new', label: 'Not started' }, { key: 'started', label: 'In progress' }, { key: 'done', label: 'Completed' }]} />
          <span className="drill-filter-count" role="status">
            Showing {count} of {DRILLS.length} drills{onlyMine ? `: ${STATE_NAMES[mine]} and any-state` : ''}
            {filtered && <> · <button type="button" className="linkish" onClick={() => { setSt('all'); setTopic('all'); setProg('all'); }}>Clear filters</button></>}
          </span>
        </div>
      )}
      {next && (
        <div className="drill-next" role="region" aria-label="Pick up where you left off">
          <h3 className="drill-group">Pick up where you left off</h3>
          <div className="practice-grid drill-grid"><DrillCardLink d={next} saved={saved} hue={DRILLS.indexOf(next)} mine={mine} /></div>
        </div>
      )}
      {recommended.length > 0 && (
        <div className="drill-next" role="region" aria-label="Recommended to start with">
          <h3 className="drill-group">Recommended to start with</h3>
          <div className="practice-grid drill-grid">{recommended.map((d, i) => <DrillCardLink key={d.id} d={d} saved={saved} hue={i} mine={mine} />)}</div>
        </div>
      )}
      {count === 0 && <OwlNote>No drills match these filters. Try another state or topic, or clear the filters.</OwlNote>}
      {listed.filter((g) => g.drills.length).map((g) => (
        <div key={g.key} className="drill-group-block" role="region" aria-label={`${g.title} drills`}>
          <h3 className="drill-group">{g.title}</h3>
          <div className="practice-grid drill-grid">
            {g.drills.map((d, i) => <DrillCardLink key={d.id} d={d} saved={saved} hue={i} mine={mine} />)}
          </div>
        </div>
      ))}
      {!guided && switchButton && <p className="drill-state-switch">{switchButton}</p>}
      {guided && (
        <p className="show-all-row">
          <button type="button" className="btn btn-secondary" onClick={() => setShowAll(true)}>Show all {DRILLS.length} drills, with filters</button>
        </p>
      )}
    </>
  );
}

/** Feedback after an answer: announced to screen readers and given keyboard focus, so it's read right away. */
function Feedback({ tone, focus, children }: { tone: string; focus: boolean; children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return <p ref={ref} tabIndex={-1} role="status" className={`drill-feedback ${tone}`}>{children}</p>;
}

/** Three questions to keep in view while working through any deal. */
function InvestigationNotes() {
  return (
    <section className="drill-mission drill-notes" aria-labelledby="drill-notes-head">
      <h2 id="drill-notes-head">Keep three questions in view</h2>
      <ol>
        <li>What do I actually know, and from what source?</li>
        <li>What am I assuming?</li>
        <li>What would change my decision?</li>
      </ol>
    </section>
  );
}

/** "Mission 2: What will it rent for?" reads "Mission 2 of 4: What will it rent for?", so the reader sees how far along they are. */
const numbered = (title: string, total: number) => title.replace(/^Mission (\d+):/, `Mission $1 of ${total}:`);

/** What the typed estimate is, by mission: most are repair budgets. */
const ESTIMATE_LABEL: Record<string, string> = { 'lease-up': 'Your lease-up cost estimate ($)', utilities: 'Your cost to make it buildable ($)' };

function MissionCard({ m, a, set, fresh, total }: { m: Mission; a: Answers[string]; set: (v: Answers[string]) => void; fresh: boolean; total: number }) {
  const done = !!a?.done;
  if (m.kind === 'facts')
    return (
      <section className="drill-mission">
        <h2>{numbered(m.title, total)}</h2>
        <dl className="drill-facts">{m.lines.map((l) => <div key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></div>)}</dl>
        {done ? <p className="drill-lesson">{m.lesson}</p> : <button type="button" className="btn" onClick={() => set({ done: true })}>What does this tell you?</button>}
      </section>
    );
  if (m.kind === 'estimate') {
    const low = m.items.reduce((t, i) => t + i.low, 0);
    const high = m.items.reduce((t, i) => t + i.high, 0);
    const est = a?.estimate;
    return (
      <section className="drill-mission">
        <h2>{numbered(m.title, total)}</h2>
        <p>{m.question}</p>
        <ul>{m.items.map((i) => <li key={i.label}>{i.label}{done && <span className="muted"> · example {fmtMoney(i.low)}–{fmtMoney(i.high)}. {i.note}</span>}</li>)}</ul>
        {!done ? (
          <form className="drill-estimate" onSubmit={(e) => { e.preventDefault(); if (est !== undefined && !e.currentTarget.querySelector('[aria-invalid="true"]')) set({ ...a, done: true }); }}>
            <label className="field">
              <span>{ESTIMATE_LABEL[m.id] ?? 'Your repair budget ($)'}</span>
              <NumInput blank value={est} onValue={(n) => set({ ...a, estimate: n })} />
            </label>
            <button type="submit" className="btn" disabled={est === undefined}>Compare</button>
          </form>
        ) : (
          <>
            <Feedback focus={fresh} tone={est! < low ? 'bad' : 'good'}>
              {ESTIMATE_LABEL[m.id] ? 'You estimated' : 'You budgeted'} {fmtMoney(est!)}. The example range is {fmtMoney(low)} to {fmtMoney(high)}.{' '}
              {est! < low ? 'That’s below even the low end: the most common way flips and rentals lose money.' : est! > high ? 'Cautious, which is safer than too low.' : 'Inside the range. Budget a cushion on top for what you can’t see.'}
            </Feedback>
            <p className="drill-lesson">{m.lesson}</p>
          </>
        )}
      </section>
    );
  }
  const picks = a?.picks ?? [];
  const toggle = (label: string) => set({ ...a, picks: m.multi ? (picks.includes(label) ? picks.filter((x) => x !== label) : [...picks, label]) : [label] });
  const right = m.options.filter((o) => o.good === picks.includes(o.label)).length;
  return (
    <section className="drill-mission">
      <h2>{numbered(m.title, total)}</h2>
      <fieldset disabled={done}>
        <legend>{m.question}</legend>
        <div className="decide-options">
          {shuffled(m.options.length, m.question).map((i) => m.options[i]).map((o) => (
            <label key={o.label} className={`decide-option${picks.includes(o.label) ? ' on' : ''}${done ? (o.good ? ' good' : picks.includes(o.label) ? ' bad' : '') : ''}`}>
              <input type={m.multi ? 'checkbox' : 'radio'} name={m.id} checked={picks.includes(o.label)} onChange={() => toggle(o.label)} />
              <span>
                <strong>{o.label}</strong>
                {o.detail && <> · {o.detail}</>}
                {done && <span className="drill-why">{o.good ? '✓ ' : '✗ '}{o.why}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {!done ? (
        <button type="button" className="btn" disabled={!picks.length} onClick={() => set({ ...a, done: true })}>Check my answer</button>
      ) : (
        <>
          {(() => {
            // A single choice is right or wrong; counting the options you rightly left alone would sound like partial credit.
            const ok = right === m.options.length;
            const best = m.options.filter((o) => o.good).map((o) => `“${o.label}”`).join(' and ');
            const text = m.multi
              ? ok ? 'Exactly the choices an experienced investor would make. Read why with each choice above.' : `Not quite: you matched ${right} of ${m.options.length} choices. An experienced investor would pick ${best}. Read why with each choice above.`
              : ok ? 'Correct. Read why with your choice above.' : `Not quite. An experienced investor would choose ${best}. Read why with each choice above.`;
            return <Feedback focus={fresh} tone={ok ? 'good' : 'bad'}>{text}</Feedback>;
          })()}
          {right !== m.options.length && <button type="button" className="btn btn-secondary" onClick={() => set({ picks: [], done: false })}>Try this mission again</button>}
          <p className="drill-lesson">{m.lesson}</p>
          {VALUE_MISSIONS.includes(m.id) && <p className="drill-lesson">On a real property, comparable sales give you an estimate. The best way to determine the value is a professional appraisal by a <a href="#/pros/appraiser">licensed or certified appraiser</a>; it is an opinion of value, not a guaranteed sale price. Until then, your <a href="#/pros/agent">real estate agent</a> can estimate it from recent sales.</p>}
        </>
      )}
    </section>
  );
}

/** Missions that pick comparable sales to value a property. */
const VALUE_MISSIONS = ['comps', 'arv'];

/** One "Would you buy it?" drill: missions, then your decision and what an experienced investor would weigh. */
/**
 * The calculator a drill's numbers belong in, so it never depends on the tab used last: commercial and 5+ unit
 * income property in Commercial income, rentals and BRRRR in Keep and rent, flips in Fix and sell.
 */
export const calcPlanFor = (id: string) =>
  /^(apartments|office|retail|warehouse|commercial)/.test(id) ? '?plan=commercial' : /^(rental|brrrr)/.test(id) ? '?plan=rent' : /^flip/.test(id) ? '?plan=flip' : '';

export default function DrillPage({ id }: { id: string }) {
  const { mode } = useJourney();
  const [myState] = useMyState();
  const d = drillById(id);
  useLastActivity(`#/practice/drills/${id}`, d ? `Practice: ${d.title}` : undefined);
  useNoIndex(!d);
  const [saved, setSaved] = useState<Saved>(load);
  // The answer just given, so only its feedback takes focus (not every finished mission on a return visit).
  const [fresh, setFresh] = useState('');
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      /* private mode: not kept */
    }
  }, [saved]);
  if (!d)
    return (
      <main className="page">
        <h1 className="sr-only">Drill not found</h1>
        <EmptyState title="We couldn’t find that drill"><p>It may have been renamed. <a href="#/practice">Back to Practice&nbsp;→</a></p></EmptyState>
      </main>
    );
  if (drillState(d) && drillState(d) !== myState) return (
    <main className="page">
      <PageHero compact top={<a href="#/practice">← Practice</a>} title="Choose this exercise’s state" sub={`This exercise uses ${STATE_NAMES[drillState(d)!]} rules. Change your investing state to open it, or return to your own practice.`} />
      <section aria-labelledby="drill-state-head">
        <h2 id="drill-state-head">Your investing state</h2>
        <StatePicker label="Show rules for" />
        <p><a className="btn btn-secondary" href="#/practice">Back to Practice</a></p>
      </section>
    </main>
  );
  const mine = saved[d.id] ?? { answers: {} };
  const setMission = (mid: string, v: Answers[string]) => {
    if (v.done && !mine.answers[mid]?.done) setFresh(mid);
    setSaved((s) => ({ ...s, [d.id]: { ...mine, answers: { ...mine.answers, [mid]: v } } }));
  };
  const allDone = d.missions.every((m) => mine.answers[m.id]?.done);
  // A drill in the visitor's own state drops the state's name from its title and description; one note says it instead.
  const ownState = myState && drillState(d) === myState ? myState : null;
  const local = (t: string) => (ownState ? withoutState(t, ownState) : t);
  const verdict = d.verdict.choices.find((c) => c.label === mine.verdict);
  return (
    <main className="page drill">
      <p className="drill-back-top"><a className="btn btn-secondary" href="#/practice/drills">← All practice</a></p>
      <PracticeRibbon />
      <DrillBand d={d} mine={myState} />
      <PageHero
        eyebrow={<><span className="practice-tag">Simulation · Would you buy it?</span>{ownState && <span className="drill-rules-note">{STATE_NAMES[ownState]} rules</span>}</>}
        title={local(d.title)}
        sub={local(d.where)}
      />
      <section className="drill-mission">
        <h2>The deal</h2>
        <dl className="drill-facts">{d.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{local(f.value)}</dd></div>)}</dl>
      </section>
      <InvestigationNotes />
      {d.missions.map((m, i) => (i === 0 || mine.answers[d.missions[i - 1].id]?.done ? <MissionCard key={m.id} m={m} a={mine.answers[m.id] ?? {}} set={(v) => setMission(m.id, v)} fresh={fresh === m.id} total={d.missions.length} /> : null))}
      {allDone && (
        <section className="drill-mission">
          <h2>Your decision</h2>
          <p>{d.verdict.question}</p>
          <div className="drill-verdict">
            {d.verdict.choices.map((c) => (
              <button key={c.label} type="button" className={`btn ${mine.verdict === c.label ? '' : 'btn-secondary'}`} aria-pressed={mine.verdict === c.label} onClick={() => { setFresh('verdict'); setSaved((s) => ({ ...s, [d.id]: { ...mine, verdict: c.label } })); }}>{c.label}</button>
            ))}
          </div>
          {verdict && (
            <>
              <Feedback key={verdict.label} focus={fresh === 'verdict'} tone="">{verdict.feedback}</Feedback>
              <h3>What an experienced investor would weigh</h3>
              <p className="drill-lesson">{d.verdict.expert}</p>
              <p className="muted">There’s no single right answer: compare your reasoning with the expert’s. This is a simulation: the property and prices are made up, and finishing a drill doesn’t mean you’re ready for a real transaction. Verify real deals with qualified local professionals.</p>
            </>
          )}
        </section>
      )}
      {/* Only once the verdict and the expert's view are shown, outside the missions and their feedback. */}
      {allDone && verdict && <TopicAd drill={d.id} />}
      <div className="decide-nav">
        <a className="btn btn-secondary" href="#/practice/drills">← All practice</a>
        <button type="button" className="btn btn-secondary" onClick={() => setSaved((s) => ({ ...s, [d.id]: { answers: {} } }))}>Start this drill over</button>
        <a className="btn btn-secondary" href={`#/analyze${calcPlanFor(d.id)}`}>Open the calculators</a>
      </div>
      {mode === 'guided' && (() => {
        // The same next step as My plan, the home page and the header: never a tour of its own.
        const plan = planNow();
        return plan.task.href !== `#/practice/drills/${d.id}` ? (
          <nav className="path-next" aria-label="Next step">
            <span className="muted">Next: {plan.context}</span>
            <a className="btn" href={plan.task.href}>{plan.task.label}&nbsp;→</a>
          </nav>
        ) : null;
      })()}
      <AdSpot spot="drill" allow={drillAllowsAds(d.id)} />
    </main>
  );
}
