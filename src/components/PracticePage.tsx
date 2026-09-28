import { useState } from 'react';
import PageHero from './PageHero';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { playbookByKey } from '../lib/playbooks';
import { PRACTICE_PROPERTIES } from '../practice/properties';
import { buildScenario, SALE_ORDER, whyUnavailable } from '../practice/scenarios';
import { completion } from '../practice/progress';
import type { SaleKey } from '../practice/types';
import OwlNote from './OwlNote';

export function PracticeRibbon() {
  return (
    <div className="practice-ribbon" role="note">
      <p>
        <strong>Practice mode.</strong> Fictional properties for hands-on learning. Nothing here is for sale, and every name, address and number is made up.
      </p>
      <p>
        <strong>Get professional advice.</strong> You can do every step on your own, but we still recommend professional advice, especially if you’re new
        to investing. It matters most for complex investments, financing and taxes: talk with a real estate attorney, a licensed lender and a tax
        advisor before you commit to a real deal.
      </p>
    </div>
  );
}

/** Step 1: pick a kind of sale. Step 2: pick a property that fits it. Then practice buying it step by step. */
export default function PracticePage({ sale }: { sale?: string }) {
  const [cls, setCls] = useState<ClassFilter>('all');
  const chosen = sale && (SALE_ORDER as string[]).includes(sale) ? (sale as SaleKey) : null;
  const titleOf = (s: SaleKey) => playbookByKey(s)?.title ?? s;

  if (!chosen) {
    return (
      <main className="page practice">
        <PageHero
          eyebrow={<span className="practice-tag">Hands-on practice</span>}
          title={<>Practice <span className="grad">buying</span></>}
          sub="Buy a fictional property step by step, from research to the day after the sale."
        />
        <PracticeRibbon />
        <h2 className="practice-step"><span aria-hidden>1</span> Choose a kind of sale</h2>
        <div className="practice-sales">
          {SALE_ORDER.map((s) => {
            const runs = PRACTICE_PROPERTIES.map((p) => buildScenario(s, p)).filter((x): x is NonNullable<typeof x> => !!x);
            const pct = runs.map((r) => completion(r.id, r.stages.reduce((n, st) => n + st.tasks.length, 0)));
            const done = pct.filter((x) => x === 1).length;
            const started = pct.filter((x) => x > 0 && x < 1).length;
            return (
              <a key={s} href={`#/practice?sale=${s}`} className="practice-sale-tile">
                <strong>{titleOf(s)}</strong>
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
      </main>
    );
  }

  const props = PRACTICE_PROPERTIES.filter((p) => (cls === 'all' || p.cls === cls) && !whyUnavailable(chosen, p));
  return (
    <main className="page practice">
      <PageHero
        eyebrow={<span className="practice-tag">Hands-on practice</span>}
        title={<>Practice: <span className="grad">{titleOf(chosen)}</span></>}
        sub={playbookByKey(chosen)?.oneLine}
      />
      <PracticeRibbon />
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
    </main>
  );
}
