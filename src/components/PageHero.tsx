import type { ReactNode } from 'react';

/** Dark, full-bleed page header matching the homepage hero (grid + glow). `compact` for sub-pages. */
export default function PageHero(props: {
  title: ReactNode;
  eyebrow?: ReactNode;
  sub?: ReactNode;
  top?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  const { title, eyebrow, sub, top, aside, children, compact } = props;
  return (
    <header className={`page-hero${compact ? ' compact' : ''}`}>
      <div className="hero-grid" aria-hidden />
      <div className="page-hero-glow" aria-hidden />
      <div className="page-hero-inner">
        {top && <div className="page-hero-top">{top}</div>}
        <div className="page-hero-row">
          <div className="page-hero-main">
            {eyebrow && <div className="page-hero-eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
            {sub && <p className="page-hero-sub">{sub}</p>}
          </div>
          {aside && <div className="page-hero-aside">{aside}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
