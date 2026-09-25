// Publishes the signed agent directory from approved applications.

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { isListable, type Agent } from '../src/lib/agents';
import type { AgentsFeed } from '../src/feed/agentsFeed';
import { signBytes } from '../ingest/lib/sign';
import type { ApplicationRow } from './db';

export const DIRECTORY_TTL_DAYS = 7;

export function toAgent(row: ApplicationRow): Agent | null {
  const v = row.verification;
  if (row.status !== 'APPROVED' || !v) return null;
  const p = row.profile;
  return {
    id: row.id,
    name: p.name,
    brokerage: p.brokerage,
    licenseNumber: p.licenseNumber,
    licenseType: p.licenseType,
    licenseStatus: v.licenseStatus === 'Active' ? 'Active' : 'Inactive',
    licenseExpires: v.licenseExpires,
    licenseVerifiedAt: v.verifiedAt,
    licenseVerifiedBy: 'Forced-Sale Finder staff', // the individual admin is never published
    serviceCities: p.serviceCities,
    serviceZips: p.serviceZips,
    specialties: p.specialties,
    languages: p.languages,
    shortSaleExperience: p.shortSaleExperience,
    phone: p.phone,
    email: p.email,
    website: p.website,
    bio: p.bio,
    isSample: false,
  };
}

export function buildAgentsFeed(rows: ApplicationRow[], now: Date): AgentsFeed {
  const agents = rows
    .map(toAgent)
    .filter((a): a is Agent => !!a && isListable(a, now))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: 1,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DIRECTORY_TTL_DAYS * 86_400_000).toISOString(),
    agents,
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
