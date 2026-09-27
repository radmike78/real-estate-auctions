import { useEffect, useRef, type ReactNode } from 'react';

export type Tone = 'go' | 'wait' | 'stop' | 'info';

export interface DrillSection {
  key: string;
  title: string;
  /** One short line shown on the tile. */
  summary: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  content: () => ReactNode;
  /** Content is already a titled card (e.g. a checklist box): render it without the section wrapper. */
  bare?: boolean;
}

/** A clickable section box: icon + large title, a one-line summary, and "Open". */
export function Tile(props: { href: string; title: string; summary: ReactNode; icon?: ReactNode; tone?: Tone; index?: number }) {
  const { href, title, summary, icon, tone } = props;
  return (
    <a href={href} className={`drill-tile${tone ? ` tone-${tone}` : ''}`}>
      <span className="drill-head">
        {icon && <span className="drill-icon" aria-hidden>{icon}</span>}
        <h2 className="drill-title">{title}</h2>
      </span>
      <span className="drill-summary">{summary}</span>
      <span className="drill-open" aria-hidden>Open <span className="drill-arrow">→</span></span>
    </a>
  );
}

function Body({ s }: { s: DrillSection }) {
  if (s.bare) return <div className="drill-bare">{s.content()}</div>;
  return (
    <section className="drill-section">
      <h2>{s.title}</h2>
      {s.content()}
    </section>
  );
}

/**
 * Shows each section as a tile; clicking one opens just that section at `${baseHref}/${key}`.
 * With `printAll` (or the "all" section, offered when `showAll` is set), every section is rendered in order.
 */
export default function DrillDown(props: { sections: DrillSection[]; active?: string; baseHref: string; label: string; printAll?: boolean; showAll?: boolean }) {
  const { sections, active, baseHref, label, printAll, showAll } = props;
  const nav = useRef<HTMLElement>(null);
  // On narrow screens the section bar scrolls sideways: bring the open section's button into view.
  useEffect(() => {
    const bar = nav.current;
    const cur = bar?.querySelector<HTMLElement>('[aria-current]');
    if (bar && cur) bar.scrollLeft = cur.offsetLeft - (bar.clientWidth - cur.offsetWidth) / 2;
  }, [active]);

  if (printAll) {
    return (
      <>
        {sections.map((s) => (
          <Body key={s.key} s={s} />
        ))}
      </>
    );
  }
  if (showAll && active === 'all') {
    return (
      <div className="drill-view">
        <nav className="drill-nav no-print" aria-label={label}>
          <a href={baseHref} className="drill-back">← Overview</a>
        </nav>
        {sections.map((s) => (
          <Body key={s.key} s={s} />
        ))}
      </div>
    );
  }

  const i = sections.findIndex((s) => s.key === active);
  if (i < 0) {
    return (
      <>
      {active && active !== 'all' && <p className="notice" role="status">We couldn’t find that section. Here’s everything on this page.</p>}
      <nav className="drill-tiles" aria-label={label}>
        {sections.map((s, n) => (
          <Tile key={s.key} href={`${baseHref}/${s.key}`} index={n + 1} title={s.title} summary={s.summary} icon={s.icon} tone={s.tone} />
        ))}
        {showAll && <a href={`${baseHref}/all`} className="drill-all">Read everything on one page</a>}
      </nav>
      </>
    );
  }

  const cur = sections[i];
  const prev = sections[i - 1];
  const next = sections[i + 1];
  return (
    <div className="drill-view">
      <nav ref={nav} className="drill-nav no-print" aria-label={label}>
        <a href={baseHref} className="drill-back">← Overview</a>
        {sections.map((s) => (
          <a key={s.key} href={`${baseHref}/${s.key}`} aria-current={s.key === cur.key ? 'page' : undefined}>
            {s.title}
          </a>
        ))}
      </nav>
      <Body s={cur} />
      <div className="drill-pager no-print">
        {prev ? <a href={`${baseHref}/${prev.key}`}>← {prev.title}</a> : <a href={baseHref}>← Overview</a>}
        {next ? <a href={`${baseHref}/${next.key}`}>{next.title} →</a> : <a href={baseHref}>Back to overview</a>}
      </div>
    </div>
  );
}
