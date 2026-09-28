// Which optional services this server has set up (GET /api/features). Pages use it to say "coming soon" instead of
// offering sign-ups that can't work yet: email alerts need an email service, advertising needs email and online payments.
import { useEffect, useState } from 'react';

export interface SiteFeatures {
  email: boolean;
  payments: boolean;
}

const OFF: SiteFeatures = { email: false, payments: false };
let pending: Promise<SiteFeatures> | null = null;
let known: SiteFeatures | null = null;

function load(): Promise<SiteFeatures> {
  pending ??= fetch('/api/features', { credentials: 'same-origin', cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : OFF))
    .then((f: Partial<SiteFeatures>) => (known = { email: f.email === true, payments: f.payments === true }))
    .catch(() => (known = OFF)); // no server (a static preview) or unreachable: treat as not set up
  return pending;
}

/** `null` while loading, so a page doesn't flash "coming soon" before it knows. */
export function useSiteFeatures(): SiteFeatures | null {
  const [f, setF] = useState<SiteFeatures | null>(known);
  useEffect(() => {
    if (known) return;
    let live = true;
    void load().then((x) => live && setF(x));
    return () => {
      live = false;
    };
  }, []);
  return f;
}

/** Advertising takes applications only once confirmation emails and card payments both work. */
export const advertisingOpen = (f: SiteFeatures | null) => !!f && f.email && f.payments;
