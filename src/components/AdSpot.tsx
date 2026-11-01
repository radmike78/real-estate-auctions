// Fixed ad spots (adSpots.ts): which spots the site owner turned on, and the box each one shows.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { cleanSpots, DEFAULT_SPOTS, spotCategories, type SpotSettings } from '../lib/adSpots';
import type { Category } from '../lib/pros';
import { FixedAds, useFixedShown } from './AdBoxes';
import { useDirectory } from './ProDirectory';

// Read once per visit and shared by every spot on every page; the defaults hold until (or unless) the server answers.
let cached: SpotSettings = DEFAULT_SPOTS;
let loading: Promise<SpotSettings> | null = null;
const listeners = new Set<(s: SpotSettings) => void>();

function load(): Promise<SpotSettings> {
  loading ??= api<{ spots: unknown }>('/api/ad-spots')
    .then((r) => cleanSpots(r.spots))
    .catch(() => DEFAULT_SPOTS)
    .then((s) => {
      cached = s;
      listeners.forEach((f) => f(s));
      return s;
    });
  return loading;
}

/** Every spot's setting. After the owner saves in Admin, `refreshAdSpots` updates the open pages. */
export function useAdSpots(): SpotSettings {
  const [s, setS] = useState(cached);
  useEffect(() => {
    listeners.add(setS);
    load();
    return () => void listeners.delete(setS);
  }, []);
  return s;
}

export function refreshAdSpots(s: SpotSettings) {
  cached = s;
  loading = Promise.resolve(s);
  listeners.forEach((f) => f(s));
}

/** The professionals one spot shows right now (none when it's off). `auto`: what the page itself would pick. */
export function useSpotCategories(key: string, auto?: Category[]): Category[] {
  return spotCategories(useAdSpots(), key, auto);
}

/**
 * A spot at the end of a page: a heading bar, one plain line in DeedOwl's own voice (no names, no recommendation),
 * and fixed, labeled ads in the visitor's area, held by a placeholder while no advertiser fills it.
 * Nothing at all while the owner has the spot off.
 */
// Pages where professionals look before advertising keep an "Advertise here" box while no one fills the spot.
// Elsewhere (lessons, missions, guides, deals) an empty spot shows nothing, so readers don't meet empty boxes.
const PLACEHOLDER_SPOTS = new Set(['financing']);

/** `allow`: false on a page about a forced sale or a lien (contextAds.ts), where no ad shows even with the spot on. */
export default function AdSpot({ spot, auto, allow = true }: { spot: string; auto?: Category[]; allow?: boolean }) {
  const cats = useSpotCategories(spot, auto);
  const { pros } = useDirectory();
  const shown = useFixedShown(pros, cats);
  if (!allow || !cats.length) return null;
  if (!shown.length && !PLACEHOLDER_SPOTS.has(spot)) return null;
  return (
    <section className="ad-spot" aria-labelledby={`ad-spot-${spot}`}>
      <h2 id={`ad-spot-${spot}`} className="section-title">Want to ask someone about this?</h2>
      <div className="next-with-ad">
        <div>
          <p>Licensed professionals in your area advertise on DeedOwl. DeedOwl doesn’t recommend any of them: check the license, ask what they charge, and compare more than one before you hire.</p>
          <p><a href="#/pros">Who does what on your team&nbsp;→</a></p>
        </div>
        <FixedAds pros={pros} categories={cats} placeholder spot={spot} />
      </div>
    </section>
  );
}
