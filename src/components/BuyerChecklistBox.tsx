import { useState, type CSSProperties } from 'react';
import type { BuyerChecklist } from '../lib/buyerChecklists';

// Checklist key → Nevada playbook with the full step-by-step process.
const PLAYBOOK_FOR: Record<string, string> = { tax: 'tax', sid: 'sid', foreclosure: 'foreclosure', reo: 'reo', commercial: 'commercial', hoa: 'hoa', sheriff: 'sheriff', short: 'short', pre: 'foreclosure' };

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
export default function BuyerChecklistBox(props: { list: BuyerChecklist; variant?: 'light' | 'wide' }) {
  // Remount per checklist so each one starts from its own saved ticks.
  return <ChecklistInner key={props.list.key} {...props} />;
}

function ChecklistInner({ list, variant = 'light' }: { list: BuyerChecklist; variant?: 'light' | 'wide' }) {
  const [done, setDone] = useState<number[]>(() => load(list.key));

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
          <span className={`checklist-tag${list.forSale ? '' : ' wait'}`}>{list.forSale ? 'For sale · what you need' : 'Not for sale yet · how to prepare'}</span>
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
          <a className="btn" href={list.official.href} target="_blank" rel="noopener noreferrer">{list.official.label} ↗</a>
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
                {it.detail && <small>{it.detail}</small>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="checklist-links">
        {PLAYBOOK_FOR[list.key.replace(/-commercial$/, '')] && <a className="checklist-link" href={`#/playbooks/${PLAYBOOK_FOR[list.key.replace(/-commercial$/, '')]}`}>Full Nevada playbook: every step, what stays, mistakes, your team →</a>}
        {list.link && <a className="checklist-link" href={list.link.href}>{list.link.label} →</a>}
      </div>
    </section>
  );
}
