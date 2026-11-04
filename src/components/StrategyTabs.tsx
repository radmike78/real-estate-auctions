import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface Strategy {
  key: string;
  label: string;
  /** One line under the tabs saying what this calculator answers. */
  about: string;
  render: () => ReactNode;
}

const KEY = 'fsf.calc.strategy.v1';

/** Tabs for the ways to use a property: flip it, keep and rent it, lend against it, or run it for income. */
export default function StrategyTabs({ strategies, initial, onChange, hideTabs = false }: { strategies: Strategy[]; initial?: string; onChange?: (key: string) => void; /** The page already has its own plan picker (Analyze): show only the chosen calculator. */ hideTabs?: boolean }) {
  const [active, setActiveState] = useState(() => {
    if (initial && strategies.some((s) => s.key === initial)) return initial;
    try {
      const saved = localStorage.getItem(KEY);
      return strategies.some((s) => s.key === saved) ? (saved as string) : strategies[0].key;
    } catch {
      return strategies[0].key;
    }
  });
  const setActive = (k: string) => {
    setActiveState(k);
    onChange?.(k);
    try {
      localStorage.setItem(KEY, k);
    } catch {
      /* storage unavailable */
    }
  };
  // Follow `initial` when the page changes it (the deal's plan was changed elsewhere).
  useEffect(() => {
    if (initial && strategies.some((s) => s.key === initial)) setActiveState(initial);
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = strategies.find((s) => s.key === active) ?? strategies[0];
  // The calculator's result boxes aren't live regions (they'd be re-read on every keystroke): once you stop typing,
  // one short summary of the result is announced instead.
  const root = useRef<HTMLDivElement>(null);
  const [said, setSaid] = useState('');
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const box = [...el.querySelectorAll<HTMLElement>('.calc-verdict, .calc-max')].find((b) => b.offsetParent !== null || b.getClientRects().length > 0);
        const text = (box?.innerText ?? '').replace(/\s+/g, ' ').trim();
        // The first two sentences: the result, not every line under it.
        const short = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
        if (short) setSaid(`Result updated: ${short.length > 260 ? `${short.slice(0, 257)}…` : short}`);
      }, 1200);
    };
    el.addEventListener('input', on);
    el.addEventListener('change', on);
    return () => { el.removeEventListener('input', on); el.removeEventListener('change', on); if (t) clearTimeout(t); };
  }, []);
  return (
    <div className="strategy" ref={root}>
      <p className="sr-only" aria-live="polite">{said}</p>
      {hideTabs ? null : <div className="strategy-tabs" role="tablist" aria-label="What you plan to do">
        {strategies.map((s) => (
          <button key={s.key} type="button" role="tab" id={`tab-${s.key}`} aria-selected={s.key === current.key} aria-controls={`panel-${s.key}`} className={s.key === current.key ? 'on' : ''} onClick={() => setActive(s.key)}>
            {s.label}
          </button>
        ))}
      </div>}
      <p className="strategy-about">{current.about}</p>
      {hideTabs ? <div>{current.render()}</div> : <div role="tabpanel" id={`panel-${current.key}`} aria-labelledby={`tab-${current.key}`}>{current.render()}</div>}
    </div>
  );
}
