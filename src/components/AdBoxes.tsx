// Paid ad boxes: the advertiser speaking, never DeedOwl. Each box is labeled at the top ("Featured ad" or
// "Advertisement"), shows who is advertising and their license, and ends with the same fine print. Nothing here
// ranks or recommends anyone; which advertiser appears is chosen at random on each page view.
import { useEffect, useMemo } from 'react';
import { AD_FINE_PRINT, CAPS, hasFeaturedBox, pickRandom, SHORT_LICENSE_LABEL } from '../lib/adPlans';
import { CATEGORIES, isListable, type Category, type Pro } from '../lib/pros';
import { track } from '../lib/track';
import ProAvatar from './ProAvatar';

/** One advertiser inside an ad box. The contact button opens their profile, where the contact form is. */
export function AdCard({ p }: { p: Pro }) {
  const info = CATEGORIES[p.category];
  const company = p.company && p.company !== p.name ? p.company : p.name;
  return (
    <div className="ad-card">
      <ProAvatar name={p.name} photo={p.photo} />
      <div className="ad-card-body">
        <div className="pro-kicker">{info.label}{p.isSample && <span className="badge tone-info">Sample</span>}</div>
        <strong className="ad-card-name">{p.name}</strong>
        {company !== p.name && <span className="small">{company}</span>}
        <span className="small muted">{SHORT_LICENSE_LABEL[p.category]} {p.licenseId}</span>
        <p className="ad-card-line">{p.adLine ?? p.headline}</p>
        <a className="btn btn-secondary" href={`#/pros/${p.id}`} onClick={() => track('ad_click', p.id)}>Contact {company}</a>
      </div>
    </div>
  );
}

/** Counts an ad box being shown, once per advertiser per page view. */
export function useAdImpressions(shown: Pro[]) {
  const seen = useMemo(() => new Set<string>(), []);
  const key = shown.map((p) => p.id).join();
  useEffect(() => {
    const fresh = shown.map((p) => p.id).filter((id) => !seen.has(id));
    fresh.forEach((id) => seen.add(id));
    if (fresh.length) track('ad_impression', fresh);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * The "Featured ad" box on a category's directory pages: Premium and Premium Plus advertisers of these categories,
 * up to the featured cap, in a fresh random order on each page view. It sits apart from (above) the directory list,
 * isn't tied to the visitor's search, and never changes anyone's place in the list.
 */
export function FeaturedAds({ pros, categories }: { pros: Pro[]; categories: Category[] }) {
  const key = categories.join();
  const pool = pros.filter((p) => categories.includes(p.category) && hasFeaturedBox(p.tier) && isListable(p)).map((p) => p.id).join();
  // Chosen once per page view (and when the categories shown change), not on every keystroke in the filters.
  const shown = useMemo(() => pickRandom(pros.filter((p) => pool.split(',').includes(p.id)), CAPS.featured), [key, pool]); // eslint-disable-line react-hooks/exhaustive-deps
  useAdImpressions(shown);
  if (!shown.length) return null;
  return (
    <aside className="ad-box featured-ads" aria-label="Featured ad">
      <div className="ad-box-label">Featured ad</div>
      <div className="ad-box-grid">{shown.map((p) => <AdCard key={p.id} p={p} />)}</div>
      <p className="ad-fine-print">{AD_FINE_PRINT}</p>
    </aside>
  );
}

/**
 * The rotating ad at the top of the Your Team page: one Spotlight or Mentor Connect advertiser from any category,
 * picked at random on each page view. Labeled "Advertisement" with the same fine print; nothing when no one qualifies.
 */
export function RotatingAd({ pros }: { pros: Pro[] }) {
  const pool = pros.filter((p) => hasFeaturedBox(p.tier) && isListable(p)).map((p) => p.id).join();
  const shown = useMemo(() => pickRandom(pros.filter((p) => pool.split(',').includes(p.id)), 1), [pool]); // eslint-disable-line react-hooks/exhaustive-deps
  useAdImpressions(shown);
  if (!shown.length) return null;
  return (
    <aside className="ad-box rotating-ad" aria-label="Advertisement">
      <div className="ad-box-label">Advertisement</div>
      <AdCard p={shown[0]} />
      <p className="ad-fine-print">{AD_FINE_PRINT}</p>
    </aside>
  );
}
