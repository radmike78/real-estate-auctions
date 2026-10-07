import { useState, type CSSProperties } from 'react';
import { detailForState, type BuyerChecklist } from '../lib/buyerChecklists';
import { useMyState } from '../lib/myState';
import { guideKey } from '../lib/narrow';

// Checklist key → kind of sale whose step-by-step guide has the full process.
const PLAYBOOK_FOR: Record<string, string> = { tax: 'tax', sid: 'sid', foreclosure: 'foreclosure', reo: 'reo', commercial: 'commercial', hoa: 'hoa', sheriff: 'sheriff', short: 'short', pre: 'foreclosure' };

/** The chosen state's guide for a kind of sale (Nevada with no state chosen); Nevada-only kinds like SIDs keep their own guide. */
const guideFor = (kind: string | undefined, state: string | null) => (kind ? guideKey(state ?? 'NV', kind) ?? kind : undefined);

const KEY = (k: string) => `fsf.checklist.${k}.v1`;

function load(k: string): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(k)) ?? '[]');
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

/** Tickable "what you'll need" box. Ticks are remembered in this browser only. */
/** `noTag` hides the "Not for sale yet" tag on a page that already says so (the pre-foreclosure guide). */
/** `guideState` ties the "Full guide" link to a property's own state (a listing in Clark County, Nevada links the Nevada
 *  guide whatever state the visitor chose); without it the link follows the visitor's chosen state. A forced
 *  `playbook` is used as given. */
export default function BuyerChecklistBox(props: { list: BuyerChecklist; variant?: 'light' | 'wide'; playbook?: string; guideState?: string; noTag?: boolean }) {
  // Remount per checklist so each one starts from its own saved ticks.
  return <ChecklistInner key={props.list.key} {...props} />;
}

function ChecklistInner({ list, variant = 'light', playbook: forced, guideState, noTag }: { list: BuyerChecklist; variant?: 'light' | 'wide'; playbook?: string; guideState?: string; noTag?: boolean }) {
  const [done, setDone] = useState<number[]>(() => load(list.key));
  const [state] = useMyState();
  // Commercial and land versions share their sale type's playbook (keys like "tax-commercial-land").
  const playbook = forced ?? guideFor(PLAYBOOK_FOR[list.key.replace(/-(commercial|land)(-.*)?$/, '')], guideState ?? state);

  const toggle = (i: number) =>
    setDone((cur) => {
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
      try {
        localStorage.setItem(KEY(list.key), JSON.stringify(next));
      } catch {
        /* storage unavailable: ticks last for this visit */
      }
      return next;
    });
  const count = done.filter((i) => i < list.items.length).length;

  return (
    <section className={`checklist-box ${variant}${list.forSale ? '' : ' not-for-sale'}`} aria-label={list.title}>
      <div className="checklist-head">
        <div>
          {!noTag && <span className={`checklist-tag${list.forSale ? '' : ' wait'}`}>{list.forSale ? 'For sale · what you need' : 'Not for sale yet · how to prepare'}</span>}
          <h2>{list.title}</h2>
          <p>{list.intro}</p>
        </div>
        <div
          className={`checklist-progress${count === list.items.length ? ' done' : ''}`}
          style={{ '--pct': `${(count / list.items.length) * 100}%` } as CSSProperties}
          aria-label={`${count} of ${list.items.length} done`}
        >
          <strong>{count}/{list.items.length}</strong>
          <span>ready</span>
        </div>
      </div>
      {list.official && (
        <div className="checklist-official">
          <a className="btn" href={list.official.href} target="_blank" rel="noopener noreferrer">{list.official.label}&nbsp;↗</a>
          <span>{list.official.note}</span>
        </div>
      )}
      <ul className="checklist-items">
        {list.items.map((it, i) => (
          <li key={it.text}>
            <label>
              <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
              <span>
                <strong>{it.text}</strong>
                {detailForState(it, state) && <small>{detailForState(it, state)}</small>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="checklist-links">
        {playbook && <a className="checklist-link" href={`#/playbooks/${playbook}`}>Full guide: every step, what stays, mistakes, your team&nbsp;→</a>}
        {list.link && <a className="checklist-link" href={list.link.href}>{list.link.label}&nbsp;→</a>}
      </div>
    </section>
  );
}
