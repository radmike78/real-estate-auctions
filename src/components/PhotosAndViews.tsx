import type { ViewLink } from '../lib/propertyViews';

// Buttons that open pictures of a property at their source (see src/lib/propertyViews.ts).
export default function PhotosAndViews({ links, sample, maxBidHref, auction }: { links: ViewLink[]; sample: boolean; maxBidHref: string; auction: boolean }) {
  return (
    <>
      {sample && <p className="muted">This is a fictional sample property, so these buttons don’t open real pictures.</p>}
      <ul className="view-grid">
        {links.map((l) => (
          <li key={l.key} className="view-card">
            <div className="view-source">{l.source}</div>
            {sample ? (
              <span className="view-title muted">{l.label} (sample)</span>
            ) : (
              <a className="view-title" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}&nbsp;↗</a>
            )}
            <p>{l.detail}</p>
          </li>
        ))}
      </ul>
      {auction ? (
        <p>
          <strong>You usually can’t see inside before an auction.</strong> Street View and aerial pictures can be months or years old, and
          they show nothing of the interior. Drive by (from the street only; don’t enter or disturb anyone living there), assume repairs are
          needed, and build them into <a href={maxBidHref}>your maximum bid</a>.
        </p>
      ) : (
        <p>
          Pictures can be out of date. Visit the home with your agent before making an offer, and use your inspection period.
        </p>
      )}
    </>
  );
}
