// Publishes the signed professional directory from approved, verified, paid advertisers.

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { topicAllowed, type AdTier, type Placement } from '../src/lib/adPlans';
import { billingTier, paidAreas } from '../src/lib/proApplication';
import { isListable, type Pro } from '../src/lib/pros';
import type { ProsFeed } from '../src/feed/prosFeed';
import { signBytes } from '../ingest/lib/sign';
import type { ApplicationRow } from './db';

// Republished hourly by the server; a short lifetime limits how long a replayed old copy could be used.
export const DIRECTORY_TTL_HOURS = 24;

export function toPro(row: ApplicationRow, photo: string | null = null): Pro | null {
  const v = row.verification;
  if (row.status !== 'APPROVED' || !v || !row.billing || !v.contentReviewed) return null;
  const p = row.profile;
  const tier: AdTier = billingTier(row.billing);
  return {
    id: row.id,
    state: p.state,
    category: p.category,
    name: p.name,
    company: p.company,
    licenseId: p.licenseId,
    licenseStatus: v.licenseStatus === 'Active' ? 'Active' : 'Inactive',
    licenseExpires: v.licenseExpires,
    licenseVerifiedAt: v.verifiedAt,
    licenseVerifiedBy: 'DeedOwl staff', // the individual admin is never published
    paidThrough: row.billing.paidThrough,
    serviceCounties: p.serviceCounties,
    adAreas: paidAreas(p, row.billing),
    serviceCities: p.serviceCities,
    serviceZips: p.serviceZips,
    services: p.services,
    creditProfiles: p.creditProfiles,
    languages: p.languages,
    headline: p.headline,
    bio: p.bio,
    phone: p.phone,
    email: p.email,
    website: p.website,
    photo,
    tier,
    adLine: p.adLine || null,
    adTopic: tier === 'premium_plus' && topicAllowed(p.category, p.adTopic) ? p.adTopic : null,
    isSample: false,
  };
}

/** Every currently listed advertiser's plan and topic: what counts toward the caps (src/lib/adPlans.ts). */
export function placements(rows: ApplicationRow[], now: Date): Placement[] {
  return rows.flatMap((r) => {
    const p = toPro(r);
    return p && isListable(p, now) ? [{ id: p.id, state: p.state, category: p.category, tier: p.tier, topic: p.adTopic, areas: p.adAreas }] : [];
  });
}

export function buildProsFeed(rows: ApplicationRow[], now: Date, photos: Map<string, string> = new Map()): ProsFeed {
  const pros = rows
    .map((r) => {
      const p = toPro(r, photos.get(r.id) ?? null);
      // Ads turned off by an admin: published as a plain listing (no Featured, rotating or topic ad), while the plan
      // they pay for still holds its spot in the caps (placements() reads the real plan).
      return p && r.adsHidden ? { ...p, tier: 'standard' as AdTier, adLine: null, adTopic: null, adsOff: true } : p;
    })
    .filter((p): p is Pro => !!p && isListable(p, now));
  return {
    version: 1,
    type: 'pros',
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DIRECTORY_TTL_HOURS * 3_600_000).toISOString(),
    pros,
  };
}

export function writeSignedJson(dir: string, name: string, value: unknown, key: KeyObject) {
  mkdirSync(dir, { recursive: true });
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const sig = signBytes(bytes, key);
  for (const [file, data] of [[name, bytes], [`${name}.sig`, sig]] as const) {
    writeFileSync(join(dir, `${file}.tmp`), data);
    renameSync(join(dir, `${file}.tmp`), join(dir, file));
  }
}
