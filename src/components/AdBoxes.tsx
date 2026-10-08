// Paid ad boxes: the advertiser speaking, never DeedOwl. Each box is labeled at the top ("Featured ad" or
// "Advertisement"), shows who is advertising and their license, and ends with the same fine print. Nothing here
// ranks or recommends anyone; fixed ads show all eligible advertisers; only the Rotating plan selects one at random.
import { useEffect, useMemo } from 'react';
import { AD_FINE_PRINT, fixedPool, pickRandom, rotatingPool } from '../lib/adPlans';
import { shortLicenseLabel } from '../lib/regulators';
import { CATEGORIES, isListable, type Category, type Pro } from '../lib/pros';
import { track } from '../lib/track';
import ProAvatar from './ProAvatar';
import { prosInArea } from '../lib/adAreas';
import { areaLabel, useMyArea, type Area } from '../lib/myArea';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';

/**
 * Holds an ad spot open while no advertiser fills it, so the page keeps its layout: a plain, labeled box that points
 * licensed professionals (in the visitor's area, when one is picked) to the Advertise page. It shows no one and
 * recommends no one. Hidden until advertising opens, so buyers don't see empty boxes pointing to a page that can't
 * take applications yet.
 */
export function AdSpace({ kind }: { kind: string }) {
  const [area] = useMyArea();
  const features = useSiteFeatures();
  if (!advertisingOpen(features)) return null;
  return (
    <aside className="ad-box ad-space" aria-label={`${kind} space`}>
      {/* One label for every empty spot, so it reads as an invitation rather than an unfinished box. */}
      <div className="ad-box-label">Advertise here</div>
      <p>Are you a professional{area ? ` in ${areaLabel(area)}` : ''}? Reach buyers and investors on this page.</p>
      <a className="btn btn-secondary" href="#/advertise">Advertise on DeedOwl&nbsp;→</a>
    </aside>
  );
}

/**
 * Whether an ad spot with these categories shows anything: a RotatingAd with a placeholder always renders a box while
 * advertising is open, and nothing while it isn't. Pages use it to give the ad a column only when there is one.
 */
export function useAdShows(categories: readonly unknown[]): boolean {
  const features = useSiteFeatures();
  return categories.length > 0 && advertisingOpen(features);
}

/**
 * Advertisers whose ads show in the visitor's area: their state, and when the visitor chose a city (or county), an ad
 * area covering it. Every advertiser when no area is picked.
 */
export const inArea = (pros: Pro[], area: Area | null) => prosInArea(pros, area);

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
        {p.licenseId && <span className="small muted">{shortLicenseLabel(p.category, p.state)} {p.licenseId}</span>}
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

/** Fixed ads at enabled placements, filtered by category and the visitor's area. */
export function FixedAds({ pros: all, categories, placeholder = false, featured = false }: { pros: Pro[]; categories: Category[]; placeholder?: boolean; featured?: boolean }) {
  const [area] = useMyArea();
  const shown = fixedPool(inArea(all, area).filter((p) => isListable(p)), categories);
  useAdImpressions(shown);
  const label = featured ? 'Featured ad' : 'Advertisement';
  if (!shown.length) return placeholder ? <AdSpace kind={label} /> : null;
  return (
    <aside className="ad-box featured-ads" aria-label={label}>
      <div className="ad-box-label">{label}</div>
      <div className="ad-box-grid">{shown.map((p) => <AdCard key={p.id} p={p} />)}</div>
      <p className="ad-fine-print">{AD_FINE_PRINT}</p>
    </aside>
  );
}

export function FeaturedAds(props: { pros: Pro[]; categories: Category[]; placeholder?: boolean }) {
  return <FixedAds {...props} featured />;
}

/** One Rotating-plan advertiser in the Your Team ad, selected once per page view. */
export function RotatingAd({ pros: all, placeholder = false }: { pros: Pro[]; placeholder?: boolean }) {
  const [area] = useMyArea();
  const pros = inArea(all, area);
  const pool = rotatingPool(pros.filter((p) => isListable(p))).map((p) => p.id).join();
  const shown = useMemo(() => pickRandom(pros.filter((p) => pool.split(',').includes(p.id)), 1), [pool]); // eslint-disable-line react-hooks/exhaustive-deps
  useAdImpressions(shown);
  if (!shown.length) return placeholder ? <AdSpace kind="Advertisement" /> : null;
  return (
    <aside className="ad-box rotating-ad" aria-label="Advertisement">
      <div className="ad-box-label">Advertisement</div>
      <AdCard p={shown[0]} />
      <p className="ad-fine-print">{AD_FINE_PRINT}</p>
    </aside>
  );
}
