import { useState } from 'react';
import PageHero from './PageHero';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { playbookByKey } from '../lib/playbooks';
import { PRACTICE_PROPERTIES } from '../practice/properties';
import { buildScenario, SALE_ORDER, whyUnavailable } from '../practice/scenarios';
import { completion } from '../practice/progress';
import type { SaleKey } from '../practice/types';

export function PracticeRibbon() {
  return (
    <div className="practice-ribbon" role="note">
      <strong>Practice mode.</strong> Fictional properties for hands-on learning. Nothing here is for sale, and every name, address and number is made up.
    </div>
  );
}

/** Pick a kind of sale and a kind of property, then practice buying it step by step. */
export default function PracticePage({ sale }: { sale?: string }) {
  const [cls, setCls] = useState<ClassFilter>('all');
  const sales = SALE_ORDER.filter((s) => !sale || s === sale);
  const props = PRACTICE_PROPERTIES.filter((p) => cls === 'all' || p.cls === cls);

  return (
    <main className="page practice">
      <PageHero
        eyebrow={<span className="practice-tag">Hands-on practice</span>}
        title={<>Practice <span className="grad">buying</span></>}
        sub="Walk through a real buying process on a fictional property: research it, contact the professionals you’d need, run the numbers, prepare your documents and money, and see what happens at the sale and after."
      />
      <PracticeRibbon />
      <p>
        Choose a kind of sale, then a kind of property. Each practice run follows the rules for that kind of sale in Clark County, Nevada, taken from our{' '}
        <a href="#/playbooks">Nevada playbooks</a>. The people you contact are fictional and their replies are simulated, so nothing is sent anywhere.
      </p>
      <div className="row practice-filter">
        <ClassSwitch value={cls} onChange={setCls} label="Residential or commercial" />
        {sale && <a href="#/practice">Show every kind of sale</a>}
      </div>

      {sales.map((s) => {
        const pb = playbookByKey(s === 'foreclosure' ? 'foreclosure' : s);
        return (
          <section key={s} className="practice-sale" aria-labelledby={`ps-${s}`}>
            <h2 id={`ps-${s}`}>{pb?.title}</h2>
            <p className="muted">{pb?.oneLine}</p>
            <div className="practice-grid">
              {props.map((p) => {
                const why = whyUnavailable(s as SaleKey, p);
                if (why) {
                  return (
                    <div key={p.id} className="practice-card unavailable" title={why}>
                      <span className="practice-card-type">{p.label}</span>
                      <span className="small muted">{why}</span>
                    </div>
                  );
                }
                const sc = buildScenario(s as SaleKey, p)!;
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
          </section>
        );
      })}
    </main>
  );
}
