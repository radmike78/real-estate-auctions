// The three advertising plans as cards, for the Advertise page and the advertiser dashboard. Prices come from the
// server (GET /api/ad-plans), which reads the operator's Stripe settings; nothing about price is set in the browser.
import { useEffect, useState, type ReactNode } from 'react';
import { AD_TIERS, TIER_INFO, type AdTier } from '../lib/adPlans';
import type { Category } from '../lib/pros';

export interface PlanLabel {
  available: boolean;
  amountLabel: string | null;
  foundingLabel: string | null;
}
export interface AdPlansInfo {
  available: boolean;
  caps: { listing: number; featured: number; topicSettlement: number; topicOther: number };
  categories: Record<Category, Record<AdTier, PlanLabel>>;
}

let pending: Promise<AdPlansInfo | null> | null = null;
/** The plan price labels, or null when the server has none (no server, or payments not set up). */
export function useAdPlans(): AdPlansInfo | null | 'loading' {
  const [v, setV] = useState<AdPlansInfo | null | 'loading'>('loading');
  useEffect(() => {
    let live = true;
    pending ??= fetch('/api/ad-plans', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<AdPlansInfo>) : null))
      .catch(() => null);
    void pending.then((x) => live && setV(x));
    return () => {
      live = false;
    };
  }, []);
  return v;
}

/** One card per plan. `price` gives each plan's price line; `extra` adds controls (a radio button, a note). */
export function PlanCards({ price, extra, selected }: { price: (t: AdTier) => ReactNode; extra?: (t: AdTier) => ReactNode; selected?: AdTier | null }) {
  return (
    <div className="plan-grid">
      {AD_TIERS.map((t) => (
        <div key={t} className={`plan-option${selected === t ? ' on' : ''}`}>
          <h3>{TIER_INFO[t].label}{TIER_INFO[t].badge && <> <span className="badge tone-go">{TIER_INFO[t].badge}</span></>}</h3>
          <div className="plan-price">{price(t)}</div>
          <ul>{TIER_INFO[t].includes.map((x) => <li key={x}>{x}</li>)}</ul>
          {extra?.(t)}
        </div>
      ))}
    </div>
  );
}
