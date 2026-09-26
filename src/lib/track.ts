// Sends anonymous interaction counts for advertiser reports. No personal data is sent: the
// server counts events per professional per day and derives unique visitors from a salted
// daily hash it never stores long-term. Sample profiles are never tracked. Failures are ignored.

export type TrackKind = 'impression' | 'profile_view' | 'phone_click' | 'email_click' | 'website_click';

const real = (id: string) => /^[a-f0-9]{24}$/.test(id);

export function track(kind: TrackKind, ids: string | string[]) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter(real);
  if (!list.length) return;
  const body = JSON.stringify(kind === 'impression' ? { kind, proIds: list.slice(0, 50) } : { kind, proId: list[0] });
  try {
    void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}

import type { SiteAction, SitePage } from './siteStats';

function send(body: object) {
  try {
    void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit' }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}

/** Counts a page view for the site-wide stats (a section name only, never the address or query). */
export const trackPage = (page: SitePage) => send({ kind: 'pageview', page });

const doneOnce = new Set<string>();
/** Counts a research action (calculator used, deal saved, source visited). `once` limits it to once per page load. */
export function trackAction(action: SiteAction, once = false) {
  if (once) {
    if (doneOnce.has(action)) return;
    doneOnce.add(action);
  }
  send({ kind: 'action', action });
}
