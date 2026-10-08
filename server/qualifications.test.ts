import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { approvalBlockers, validateApplication, type ApplicationInput } from '../src/lib/proApplication';
import { validPro } from '../src/feed/prosFeed';
import { toPro } from './directory';
import { openDb } from './db';

const input: ApplicationInput = {
  category: 'contractor', state: 'TX', name: 'Example Repairs', company: 'Example Repairs LLC',
  licenseId: '', serviceCounties: ['Harris'], serviceCities: [], serviceZips: '',
  services: ['General contractor'], creditProfiles: [], languages: ['English'],
  headline: 'Repairs for investment properties', phone: '702-555-0199', email: 'repairs@example.com',
  website: '', bio: 'We provide general renovation services for investment properties.',
  attestLicensed: true, attestAccurate: true, consentVerification: true, attestAdvertising: true, attestOriginal: true,
};
const checked = { licenseStatus: 'Active' as const, licenseExpires: null, nameMatches: true,
  typeMatches: true, companyMatches: true, identityConfirmed: true, contentReviewed: true };

describe('advertiser alternative qualifications', () => {
  it('accepts a Texas general contractor without an invented license number', () => {
    const result = validateApplication(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.profile.licenseId).toBe('');
  });
  it('allows an unlicensed California inspector but still requires licensed categories to give a number', () => {
    expect(validateApplication({ ...input, category: 'home_inspector', state: 'CA', serviceCounties: ['Los Angeles'], services: ['Pre-purchase home inspection'] }).ok).toBe(true);
    for (const state of ['NV', 'CA', 'AZ', 'UT', 'TX'] as const) {
      const result = validateApplication({ ...input, category: 'agent', state, services: ['Investors'] });
      expect(!result.ok && result.errors.licenseId, state).toBeTruthy();
    }
  });
  it('rejects unsafe credential values even where a number is optional', () => {
    const result = validateApplication({ ...input, licenseId: '=HYPERLINK("bad")' });
    expect(!result.ok && result.errors.licenseId).toBeTruthy();
  });
  it('keeps credentials, identity, authorization and content review mandatory', () => {
    expect(approvalBlockers('contractor', checked, '2026-10-08', 'TX')).toEqual([]);
    for (const field of ['nameMatches', 'typeMatches', 'companyMatches', 'identityConfirmed', 'contentReviewed'] as const) {
      expect(approvalBlockers('contractor', { ...checked, [field]: false }, '2026-10-08', 'TX').length).toBeGreaterThan(0);
    }
    expect(approvalBlockers('contractor', { ...checked, licenseStatus: 'Not found' }, '2026-10-08', 'TX').length).toBeGreaterThan(0);
  });
  it('publishes an approved alternative-qualification profile and still rejects blank licensed profiles', () => {
    const folder = mkdtempSync(join(tmpdir(), 'deedowl-qualification-'));
    const db = openDb(join(folder, 'test.sqlite'));
    try {
      const result = validateApplication(input);
      if (!result.ok) throw new Error('Invalid test application');
      const now = '2026-10-08T15:00:00.000Z';
      db.insertApplication({ id: 'one', profile: result.profile, tokenHash: 'one', tokenExpires: '2027-01-01', now });
      db.update('one', { status: 'APPROVED', verification: { ...checked, verifiedAt: now.slice(0, 10), verifiedBy: 'test' }, billing: { plan: 'Test plan', paidThrough: '2026-11-08' } }, now);
      const pro = toPro(db.get('one')!);
      expect(pro && validPro(pro, new Date(now))).toBe(true);
      expect(pro && validPro({ ...pro, category: 'agent' }, new Date(now))).toBe(false);
      db.insertApplication({ id: 'two', profile: { ...result.profile, email: 'another@example.com' }, tokenHash: 'two', tokenExpires: '2027-01-01', now });
      expect(db.duplicates(db.get('two')!)).toEqual([]);
      db.insertApplication({ id: 'three', profile: result.profile, tokenHash: 'three', tokenExpires: '2027-01-01', now });
      expect(db.duplicates(db.get('three')!)).toEqual([{ id: 'one', status: 'APPROVED', field: 'email' }]);
    } finally { db.raw.close(); rmSync(folder, { recursive: true, force: true }); }
  });
});
