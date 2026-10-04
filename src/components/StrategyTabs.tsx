import { useState, type ReactNode } from 'react';

export interface Strategy {
  key: string;
  label: string;
  /** One line under the tabs saying what this calculator answers. */
  about: string;
  render: () => ReactNode;
}

const KEY = 'fsf.calc.strategy.v1';

/** Tabs for the ways to use a property: flip it, keep and rent it, lend against it, or run it for income. */
export default function StrategyTabs({ strategies, initial, onChange }: { strategies: Strategy[]; initial?: string; onChange?: (key: string) => void }) {
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
  const current = strategies.find((s) => s.key === active) ?? strategies[0];
  return (
    <div className="strategy">
      <div className="strategy-tabs" role="tablist" aria-label="What you plan to do">
        {strategies.map((s) => (
          <button key={s.key} type="button" role="tab" id={`tab-${s.key}`} aria-selected={s.key === current.key} aria-controls={`panel-${s.key}`} className={s.key === current.key ? 'on' : ''} onClick={() => setActive(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="strategy-about">{current.about}</p>
      <div role="tabpanel" id={`panel-${current.key}`} aria-labelledby={`tab-${current.key}`}>{current.render()}</div>
    </div>
  );
}
