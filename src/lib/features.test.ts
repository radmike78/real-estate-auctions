import { describe, expect, it } from 'vitest';
import type { Property, PropertyEvent } from '../types';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { SAMPLE_AGENTS } from '../data/sampleAgents';
import { addMonths, foreclosureTrack } from './foreclosure';
import { isListable, safeMailto, safeTel, safeWebsite, searchAgents, verificationProblems, type Agent } from './agents';
import { purchaseSteps } from './status';

const src = { agency: 't', url: null, lastVerified: '2026-01-01T00:00:00Z', confidence: 'high' as const };
const ev = (date: string, type: PropertyEvent['type'], description: string = type): PropertyEvent => ({ date, type, description, source: src });
const withEvents = (events: PropertyEvent[], sale: Partial<NonNullable<Property['sale']>> | null = null): Property => ({
  ...SAMPLE_PROPERTIES[0],
  events,
  sale: sale ? ({ ...SAMPLE_PROPERTIES.find((p) => p.sale?.saleType === 'TRUSTEE_SALE')!.sale!, ...sale } as Property['sale']) : null,
});
const now = new Date('2026-09-24T12:00:00Z');

describe('pre-foreclosure tracker', () => {
  it('computes the earliest notice-of-sale date (3 months after default)', () => {
    expect(addMonths('2026-06-15', 3)).toBe('2026-09-15');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
  });

  it('follows a foreclosure from default to auction to outcome', () => {
    const nod = ev('2026-08-01', 'NOTICE_OF_DEFAULT');
    const t0 = foreclosureTrack(withEvents([nod]), now)!;
    expect(t0).toMatchObject({ stage: 'DEFAULT_RECORDED', earliestNoticeOfSale: '2026-11-01', daysInForeclosure: 54 });
    expect(t0.next).toMatch(/can't be recorded before Nov 1, 2026/);

    const scheduled = withEvents([nod, ev('2026-09-10', 'NOTICE_OF_SALE')], { saleType: 'TRUSTEE_SALE', startsAt: '2026-10-05T17:00:00Z' });
    expect(foreclosureTrack(scheduled, now)!.stage).toBe('SALE_SCHEDULED');
    expect(foreclosureTrack(scheduled, new Date('2026-10-06T12:00:00Z'))!.stage).toBe('AWAITING_RESULT');

    expect(foreclosureTrack(withEvents([nod, ev('2026-09-01', 'SALE_POSTPONED')]), now)!.stage).toBe('POSTPONED');
    expect(foreclosureTrack(withEvents([nod, ev('2026-09-01', 'SALE_POSTPONED'), ev('2026-09-02', 'BANKRUPTCY_FILED')]), now)!.stage).toBe('BANKRUPTCY_STAY');
    expect(foreclosureTrack(withEvents([nod, ev('2026-09-01', 'SALE_CANCELLED')]), now)!.stage).toBe('CANCELLED');
    expect(foreclosureTrack(withEvents([nod, ev('2026-09-20', 'SOLD', 'Property reverted to the lender (REO).')]), now)!.stage).toBe('REVERTED_TO_LENDER');
    expect(foreclosureTrack(withEvents([nod, ev('2026-09-20', 'SOLD', "Trustee's deed to third-party bidder.")]), now)!.stage).toBe('SOLD_AT_AUCTION');
  });

  it('ignores events before the latest notice of default, and properties without one', () => {
    const old = [ev('2020-01-01', 'NOTICE_OF_DEFAULT'), ev('2020-03-01', 'SALE_CANCELLED')];
    expect(foreclosureTrack(withEvents([...old, ev('2026-08-01', 'NOTICE_OF_DEFAULT')]), now)!.stage).toBe('DEFAULT_RECORDED');
    expect(foreclosureTrack(withEvents([ev('2026-01-01', 'LIEN_RECORDED')]), now)).toBeNull();
  });

  it('sample data covers every stage family', () => {
    const stages = new Set(SAMPLE_PROPERTIES.map((p) => foreclosureTrack(p)?.stage).filter(Boolean));
    for (const s of ['DEFAULT_RECORDED', 'SALE_SCHEDULED', 'POSTPONED', 'CANCELLED', 'REVERTED_TO_LENDER']) expect(stages, s).toContain(s);
  });

  it('never advises contacting a homeowner in pre-foreclosure', () => {
    const p = SAMPLE_PROPERTIES.find((x) => x.status === 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE')!;
    const steps = purchaseSteps(p).join(' ');
    expect(steps).toMatch(/Do not contact the homeowner/);
    expect(steps).not.toMatch(/contact the owner about/i);
  });
});

describe('agent directory', () => {
  const good = SAMPLE_AGENTS[0];
  const at = (a: Partial<Agent>) => ({ ...good, ...a });

  it('lists only agents with an active, unexpired, recently verified license', () => {
    expect(verificationProblems(good)).toEqual([]);
    expect(verificationProblems(at({ licenseStatus: 'Revoked' }))).toContain('LICENSE_NOT_ACTIVE');
    expect(verificationProblems(at({ licenseExpires: '2020-01-01' }))).toContain('LICENSE_EXPIRED');
    expect(verificationProblems(at({ licenseVerifiedAt: '2020-01-01' }))).toContain('VERIFICATION_STALE');
    expect(verificationProblems(at({ licenseVerifiedAt: '2999-01-01' }))).toContain('VERIFICATION_STALE'); // future-dated = invalid
    const listed = SAMPLE_AGENTS.filter((a) => isListable(a)).map((a) => a.id);
    expect(listed).not.toContain('a5'); // stale verification
    expect(listed).not.toContain('a6'); // expired license
  });

  it('only allows safe contact links', () => {
    expect(safeTel('+17025550101')).toBe('tel:+17025550101');
    expect(safeTel('javascript:alert(1)')).toBeNull();
    expect(safeMailto('a@example.com')).toBe('mailto:a@example.com');
    expect(safeMailto('a@example.com?bcc=x@evil.com')).toBeNull();
    expect(safeWebsite('https://example.com/a')).toBe('https://example.com/a');
    expect(safeWebsite('javascript:alert(1)')).toBeNull();
    expect(safeWebsite('http://example.com')).toBeNull();
    expect(verificationProblems(at({ website: 'javascript:alert(1)' }))).toContain('UNSAFE_CONTACT');
    expect(verificationProblems(at({ phone: null, email: null }))).toContain('MISSING_CONTACT');
  });

  it('searches by city, ZIP, specialty and language', () => {
    const q = { location: '', specialty: 'any' as const, language: 'any' };
    expect(searchAgents(SAMPLE_AGENTS, { ...q, location: 'Henderson, NV' }).map((a) => a.id)).toEqual(['a2', 'a4']);
    expect(searchAgents(SAMPLE_AGENTS, { ...q, location: '89031' }).map((a) => a.id)).toEqual(['a1']);
    expect(searchAgents(SAMPLE_AGENTS, { ...q, specialty: 'Short sales' }).every((a) => a.specialties.includes('Short sales'))).toBe(true);
    expect(searchAgents(SAMPLE_AGENTS, { ...q, language: 'Spanish' }).map((a) => a.id)).toEqual(['a1', 'a4']);
  });
});

describe('date display', () => {
  it('shows calendar dates without a timezone shift and sale times in Las Vegas time', async () => {
    const { fmtDate, fmtDateTime } = await import('./status');
    const { pacificToIso } = await import('./time');
    expect(fmtDate('2026-11-28')).toBe('Nov 28, 2026');
    expect(pacificToIso(2026, 9, 5, 10)).toBe('2026-10-05T17:00:00.000Z'); // 10:00 PDT
    expect(pacificToIso(2026, 11, 5, 10)).toBe('2026-12-05T18:00:00.000Z'); // 10:00 PST
    expect(fmtDateTime('2026-10-05T17:00:00.000Z')).toMatch(/Oct 5, 2026, 10:00\sAM PDT/);
  });
});
