import type { ReactNode } from 'react';

/** The owl, a heading and a short explanation: for pages with nothing to show yet, or features that are coming soon. */
export default function EmptyState({ title, soon, children }: { title: ReactNode; soon?: boolean; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <img className="owl-empty" src="/logo.svg" alt="" width={112} height={112} />
      {soon && <span className="badge tone-info">Coming soon</span>}
      {/* The title is announced when it appears (a filter that empties a list); not the whole panel. */}
      <h2><span role="status">{title}</span></h2>
      {children}
    </div>
  );
}
