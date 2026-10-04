import { useEffect, useRef, useState, type ReactNode } from 'react';
import { currentProgress, GUIDED, guidedNext, useJourney, useLastActivity } from '../lib/journey';
import PageHero from './PageHero';
import EmptyState from './EmptyState';
import { PracticeRibbon } from './PracticePage';
import { DRILLS, drillById, type Drill, type Mission } from '../practice/drills';
import { fmtMoney } from '../lib/status';
import { useMyState } from '../lib/myState';
import TopicAd from './TopicAd';

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
export function drillProgress(d: Drill, s: Saved = load()): { done: number; total: number; verdict?: string } {
  const a = s[d.id]?.answers ?? {};
  return { done: d.missions.filter((m) => a[m.id]?.done).length, total: d.missions.length, verdict: s[d.id]?.verdict };
}

/** The drills on the Practice page. */
const STATE_NAMES: Record<string, string> = { NV: 'Nevada', CA: 'California', AZ: 'Arizona', UT: 'Utah' };

/** The state a drill's rules come from, or null when they apply anywhere. */
export function drillState(d: Drill): string | null {
  const text = `${d.title} ${d.where}`;
  return Object.keys(STATE_NAMES).find((k) => text.includes(STATE_NAMES[k])) ?? null;
}

/** Under a state's heading, "A Nevada foreclosure auction: …" reads "Foreclosure auction: …": cards differ in their first words. */
const cardTitle = (t: string) => t.replace(/^An? (Nevada|California|Arizona|Utah) /, '').replace(/^./, (c) => c.toUpperCase());

/** The drills on the Practice page, grouped by state, with the visitor's state first. */
export function DrillList() {
  const saved = load();
  const [mine] = useMyState();
  const { mode } = useJourney();
  const [showAll, setShowAll] = useState(false);
  const own = (d: Drill) => d.commercial || d.flipBrrrr || d.manufactured || d.land;
  const groups: { key: string; title: string; drills: Drill[] }[] = [
    ...[...(mine ? [mine] : []), ...Object.keys(STATE_NAMES).filter((k) => k !== mine)].map((st) => ({ key: st, title: STATE_NAMES[st], drills: DRILLS.filter((d) => !own(d) && drillState(d) === st) })),
    { key: 'any', title: 'Any state', drills: DRILLS.filter((d) => !own(d) && drillState(d) === null) },
    { key: 'flip-brrrr', title: 'Flips and BRRRR', drills: DRILLS.filter((d) => d.flipBrrrr) },
    { key: 'manufactured', title: 'Manufactured homes', drills: DRILLS.filter((d) => d.manufactured) },
    { key: 'land', title: 'Land', drills: DRILLS.filter((d) => d.land) },
    { key: 'commercial', title: 'Commercial property', drills: DRILLS.filter((d) => d.commercial) },
  ];
  // Guided visitors start with three drills: a rental, then a foreclosure and a tax sale in their state.
  const st = (mine ?? 'NV').toLowerCase();
  const starter = ['rental-265', `trustee-sale-${st}`, st === 'az' ? 'tax-lien-az' : st === 'ut' ? 'tax-sale-ut' : `tax-deed-${st}`]
    .map((id) => DRILLS.find((d) => d.id === id))
    .filter((d): d is Drill => !!d);
  const shown = mode === 'guided' && !showAll ? [{ key: 'starter', title: 'Start with these three', drills: starter }] : groups;
  return (
    <>
      {shown.filter((g) => g.drills.length).map((g) => (
        <section key={g.key} aria-label={`${g.title} drills`}>
          <h3 className="drill-group">{g.title}</h3>
          <div className="practice-grid drill-grid">
            {g.drills.map((d) => {
              const p = drillProgress(d, saved);
              return (
                <a key={d.id} href={`#/practice/drills/${d.id}`} className="practice-card">
                  <strong>{g.key in STATE_NAMES ? cardTitle(d.title) : d.title}</strong>
                  <span>{d.teaser}</span>
                  <span className="practice-card-foot">{p.verdict ? `Your call: ${p.verdict}` : `${p.done} of ${p.total} missions done`} →</span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      {shown !== groups && (
        <p className="show-all-row">
          <button type="button" className="btn btn-secondary" onClick={() => setShowAll(true)}>Show all {DRILLS.length} drills</button>
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
    <aside className="drill-notes" aria-label="Investigation notes">
      <strong>Keep three questions in view</strong>
      <ol>
        <li>What do I actually know, and from what source?</li>
        <li>What am I assuming?</li>
        <li>What would change my decision?</li>
      </ol>
    </aside>
  );
}

function MissionCard({ m, a, set, fresh }: { m: Mission; a: Answers[string]; set: (v: Answers[string]) => void; fresh: boolean }) {
  const done = !!a?.done;
  if (m.kind === 'facts')
    return (
      <section className="drill-mission">
        <h2>{m.title}</h2>
        <dl className="calc-kv">{m.lines.map((l) => <div key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></div>)}</dl>
        {done ? <p className="drill-lesson">{m.lesson}</p> : <button type="button" className="btn" onClick={() => set({ done: true })}>What does this tell you?</button>}
      </section>
    );
  if (m.kind === 'estimate') {
    const low = m.items.reduce((t, i) => t + i.low, 0);
    const high = m.items.reduce((t, i) => t + i.high, 0);
    const est = a?.estimate;
    return (
      <section className="drill-mission">
        <h2>{m.title}</h2>
        <p>{m.question}</p>
        <ul>{m.items.map((i) => <li key={i.label}>{i.label}{done && <span className="muted"> · example {fmtMoney(i.low)}–{fmtMoney(i.high)}. {i.note}</span>}</li>)}</ul>
        {!done ? (
          <form className="drill-estimate" onSubmit={(e) => { e.preventDefault(); if (est !== undefined) set({ ...a, done: true }); }}>
            <label className="field">
              <span>Your repair budget ($)</span>
              <input type="number" inputMode="numeric" min={0} step={500} value={est ?? ''} onChange={(e) => set({ ...a, estimate: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} />
            </label>
            <button type="submit" className="btn" disabled={est === undefined}>Compare</button>
          </form>
        ) : (
          <>
            <Feedback focus={fresh} tone={est! < low ? 'bad' : 'good'}>
              You budgeted {fmtMoney(est!)}. The example range is {fmtMoney(low)} to {fmtMoney(high)}.{' '}
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
      <h2>{m.title}</h2>
      <fieldset disabled={done}>
        <legend>{m.question}</legend>
        <div className="decide-options">
          {m.options.map((o) => (
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
          <Feedback focus={fresh} tone={right === m.options.length ? 'good' : 'bad'}>{right === m.options.length ? 'Exactly what an experienced investor would choose.' : `${right} of ${m.options.length} choices match what an experienced investor would do. Read why below each one.`}</Feedback>
          <p className="drill-lesson">{m.lesson}</p>
          {VALUE_MISSIONS.includes(m.id) && <p className="drill-lesson">On a real property, comparable sales give you an estimate. The best way to determine the value is a professional appraisal by a <a href="#/pros/appraiser">licensed appraiser</a>; until then, your <a href="#/pros/agent">real estate agent</a> can estimate it from recent sales.</p>}
        </>
      )}
    </section>
  );
}

/** Missions that pick comparable sales to value a property. */
const VALUE_MISSIONS = ['comps', 'arv'];

/** One "Would you buy it?" drill: missions, then your decision and what an experienced investor would weigh. */
export default function DrillPage({ id }: { id: string }) {
  const { mode } = useJourney();
  const d = drillById(id);
  useLastActivity(`#/practice/drills/${id}`, d ? `Practice: ${d.title}` : undefined);
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
        <EmptyState title="We couldn’t find that drill"><p>It may have been renamed. <a href="#/practice">Back to Practice →</a></p></EmptyState>
      </main>
    );
  const mine = saved[d.id] ?? { answers: {} };
  const setMission = (mid: string, v: Answers[string]) => {
    if (v.done && !mine.answers[mid]?.done) setFresh(mid);
    setSaved((s) => ({ ...s, [d.id]: { ...mine, answers: { ...mine.answers, [mid]: v } } }));
  };
  const allDone = d.missions.every((m) => mine.answers[m.id]?.done);
  const verdict = d.verdict.choices.find((c) => c.label === mine.verdict);
  return (
    <main className="page drill">
      <PracticeRibbon />
      <PageHero eyebrow={<span className="practice-tag">Simulation · Would you buy it?</span>} title={d.title} sub={d.where} />
      <section className="drill-mission">
        <h2>The deal</h2>
        <dl className="calc-kv">{d.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
      </section>
      <InvestigationNotes />
      {d.missions.map((m, i) => (i === 0 || mine.answers[d.missions[i - 1].id]?.done ? <MissionCard key={m.id} m={m} a={mine.answers[m.id] ?? {}} set={(v) => setMission(m.id, v)} fresh={fresh === m.id} /> : null))}
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
        <a className="btn btn-secondary" href="#/practice">← All practice</a>
        <button type="button" className="btn btn-secondary" onClick={() => setSaved((s) => ({ ...s, [d.id]: { answers: {} } }))}>Start this drill over</button>
        <a className="btn btn-secondary" href={`#/analyze${/^(rental|brrrr|apartments|office|retail)/.test(d.id) ? '?plan=rent' : /^flip/.test(d.id) ? '?plan=flip' : ''}`}>Open the calculators</a>
      </div>
      {mode === 'guided' && (() => {
        const g = guidedNext(currentProgress());
        return g && g.step.href !== `#/practice/drills/${d.id}` ? (
          <nav className="path-next" aria-label="Next step">
            <span className="muted">Next in Getting started ({g.n} of {GUIDED.length})</span>
            <a className="btn" href={g.step.href}>{g.step.label} →</a>
          </nav>
        ) : null;
      })()}
    </main>
  );
}
