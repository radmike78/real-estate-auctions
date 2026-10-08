// Optional services: cache successful responses, retry failures, and bound every request.
import { useEffect, useState } from 'react';
export interface SiteFeatures { email: boolean; payments: boolean; unavailable?: boolean }
let known: SiteFeatures | null = null;
let pending: Promise<SiteFeatures> | null = null;
const listeners = new Set<(f: SiteFeatures | null) => void>();
const publish = (f: SiteFeatures | null) => { for (const listener of listeners) listener(f); };

export function loadSiteFeatures(): Promise<SiteFeatures> {
  if (pending) return pending;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  publish(null);
  pending = (async () => {
    try {
      const r = await fetch('/api/features', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (!r.ok) throw new Error('Features unavailable');
      const f: unknown = await r.json();
      if (!f || typeof f !== 'object' || !('email' in f) || !('payments' in f) || typeof f.email !== 'boolean' || typeof f.payments !== 'boolean') throw new Error('Invalid features');
      known = { email: f.email, payments: f.payments };
      publish(known);
      return known;
    } catch {
      const failure: SiteFeatures = { email: false, payments: false, unavailable: true };
      publish(failure);
      return failure;
    } finally { clearTimeout(timeout); pending = null; }
  })();
  return pending;
}

/** Null while loading; a connection failure is distinct from an unconfigured service. */
export function useSiteFeatures(): SiteFeatures | null {
  const [f, setF] = useState<SiteFeatures | null>(known);
  useEffect(() => {
    listeners.add(setF);
    if (!known) void loadSiteFeatures();
    else setF(known);
    const retry = () => { if (!known) void loadSiteFeatures(); };
    const timer = setInterval(retry, 10000);
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    return () => { listeners.delete(setF); clearInterval(timer); window.removeEventListener('online', retry); window.removeEventListener('focus', retry); };
  }, []);
  return f;
}
export const advertisingOpen = (f: SiteFeatures | null) => !!f && !f.unavailable && f.email && f.payments;
