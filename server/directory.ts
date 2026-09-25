// Publishes the signed professional directory from approved, verified, paid advertisers.

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { isListable, type Pro } from '../src/lib/pros';
import type { ProsFeed } from '../src/feed/prosFeed';
import { signBytes } from '../ingest/lib/sign';
import type { ApplicationRow } from './db';

export const DIRECTORY_TTL_DAYS = 7;

export function toPro(row: ApplicationRow): Pro | null {
  const v = row.verification;
  if (row.status !== 'APPROVED' || !v || !row.billing) return null;
  const p = row.profile;
  return {
    id: row.id,
    category: p.category,
    name: p.name,
    company: p.company,
    licenseId: p.licenseId,
    licenseStatus: v.licenseStatus === 'Active' ? 'Active' : 'Inactive',
    licenseExpires: v.licenseExpires,
    licenseVerifiedAt: v.verifiedAt,
    licenseVerifiedBy: 'Forced-Sale Finder staff', // the individual admin is never published
    paidThrough: row.billing.paidThrough,
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
    isSample: false,
  };
}

export function buildProsFeed(rows: ApplicationRow[], now: Date): ProsFeed {
  const pros = rows.map(toPro).filter((p): p is Pro => !!p && isListable(p, now));
  return {
    version: 1,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DIRECTORY_TTL_DAYS * 86_400_000).toISOString(),
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
