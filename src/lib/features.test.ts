import { describe, expect, it } from 'vitest';
import type { Property, PropertyEvent } from '../types';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { SAMPLE_PROS } from '../data/samplePros';
import { addDays, addMonths, foreclosureTrack } from './foreclosure';
import { isListable, listingProblems, rotationKey, safeMailto, safeTel, safeWebsite, searchPros, type Pro, type ProQuery } from './pros';
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

  it('uses 90 days for an HOA lien (NRS 116.31162) and a certificate of sale', () => {
    expect(addDays('2026-08-01', 90)).toBe('2026-10-30');
    const nod = ev('2026-08-01', 'NOTICE_OF_DEFAULT', 'HOA notice of default and election to sell');
    const t = foreclosureTrack(withEvents([nod]), now)!;
    expect(t).toMatchObject({ kind: 'HOA', earliestNoticeOfSale: '2026-10-30' });
    expect(t.next).toMatch(/90 days after/);
    expect(foreclosureTrack(withEvents([nod, ev('2026-09-20', 'SOLD', 'Sold to third-party bidder.')]), now)!.next).toMatch(/certificate of sale/);
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

describe('professional directory', () => {
  const good = SAMPLE_PROS[0];
  const at = (p: Partial<Pro>) => ({ ...good, ...p });
  const Q: ProQuery = { categories: [], location: '', service: 'any', creditProfile: 'any', language: 'any' };

  it('lists only verified, unexpired, paid professionals', () => {
    expect(listingProblems(good)).toEqual([]);
    expect(listingProblems(at({ licenseStatus: 'Revoked' }))).toContain('LICENSE_NOT_ACTIVE');
    expect(listingProblems(at({ licenseExpires: '2020-01-01' }))).toContain('LICENSE_EXPIRED');
    expect(listingProblems(at({ licenseVerifiedAt: '2020-01-01' }))).toContain('VERIFICATION_STALE');
    expect(listingProblems(at({ licenseVerifiedAt: '2999-01-01' }))).toContain('VERIFICATION_STALE');
    expect(listingProblems(at({ paidThrough: '2020-01-01' }))).toContain('NOT_PAID');
    // Banks and credit unions have no expiring license.
    const bank = SAMPLE_PROS.find((p) => p.category === 'bank')!;
    expect(bank.licenseExpires).toBeNull();
    expect(isListable(bank)).toBe(true);
    const hidden = SAMPLE_PROS.filter((p) => !isListable(p)).map((p) => p.name);
    expect(hidden).toEqual(['Casey Stale-Example', 'Drew Unpaid-Example']);
  });

  it('only allows safe contact links', () => {
    expect(safeTel('+17025550101')).toBe('tel:+17025550101');
    expect(safeTel('javascript:alert(1)')).toBeNull();
    expect(safeMailto('a@example.com')).toBe('mailto:a@example.com');
    expect(safeMailto('a@example.com?bcc=x@evil.com')).toBeNull();
    expect(safeWebsite('https://example.com/a')).toBe('https://example.com/a');
    expect(safeWebsite('javascript:alert(1)')).toBeNull();
    expect(safeWebsite('http://example.com')).toBeNull();
    expect(listingProblems(at({ website: 'javascript:alert(1)' }))).toContain('UNSAFE_CONTACT');
    expect(listingProblems(at({ phone: null, email: null }))).toContain('MISSING_CONTACT');
  });

  it('filters by category, location, loan type and credit situation', () => {
    const names = (q: Partial<ProQuery>) => searchPros(SAMPLE_PROS, { ...Q, ...q }).map((p) => p.name).sort();
    expect(names({ categories: ['agent'], location: 'Henderson, NV' })).toEqual(['Jordan Sample', 'Riley Fixture']);
    expect(names({ categories: ['agent'], location: '89031' })).toEqual(['Avery Example']);
    expect(names({ categories: ['loan_officer', 'mortgage_company', 'bank', 'credit_union', 'private_lender'], service: 'Hard money', creditProfile: 'Rebuilding (below 620)' })).toEqual([
      'Fixture Private Funding',
      'Placeholder Bridge Capital',
    ]);
    expect(names({ categories: ['contractor'], service: 'Roofing' })).toEqual(['Example Roof & Solar']);
  });

  it('orders results neutrally: a daily rotation that ignores payment', () => {
    const day1 = searchPros(SAMPLE_PROS, Q, new Date('2026-10-01T12:00:00Z')).map((p) => p.id);
    const day1again = searchPros(SAMPLE_PROS, Q, new Date('2026-10-01T20:00:00Z')).map((p) => p.id);
    const day2 = searchPros(SAMPLE_PROS, Q, new Date('2026-10-02T12:00:00Z')).map((p) => p.id);
    expect(day1).toEqual(day1again); // same for everyone all day
    expect(day1).not.toEqual(day2); // rotates daily
    // Paying longer doesn't change position.
    const richer = SAMPLE_PROS.map((p) => (p.id === day1[day1.length - 1] ? { ...p, paidThrough: '2099-12-31' } : p));
    expect(searchPros(richer, Q, new Date('2026-10-01T12:00:00Z')).map((p) => p.id)).toEqual(day1);
    expect(rotationKey('a', '2026-10-01')).not.toBe(rotationKey('a', '2026-10-02'));
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

describe('feed loading on static hosts', () => {
  it('treats an HTML fallback page as "not published", not as a tampered file', async () => {
    const { isFeedResponse } = await import('../feed/verify');
    expect(isFeedResponse(new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }))).toBe(false);
    expect(isFeedResponse(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))).toBe(true);
    expect(isFeedResponse(new Response('x', { status: 404 }))).toBe(false);
  });
});

describe('disclaimers', () => {
  it('state the site role everywhere: finding options only, not a party, buyer due diligence, no financing', async () => {
    const { DISCLAIMERS, ROLE_SHORT } = await import('./disclaimers');
    expect(ROLE_SHORT).toMatch(/helps you find options/);
    expect(ROLE_SHORT).toMatch(/not a party/);
    expect(ROLE_SHORT).toMatch(/responsible for your own due diligence/);
    const { SOURCES_AND_ADVICE } = await import('./disclaimers');
    expect(SOURCES_AND_ADVICE).toMatch(/government and other official sources/);
    expect(SOURCES_AND_ADVICE).toMatch(/legal, tax, real estate or financial advice/);
    expect(DISCLAIMERS.financing.text).toMatch(/don't make, arrange, broker or negotiate loans/);
    expect(DISCLAIMERS.financing.text).toMatch(/aren't responsible/);
    expect(DISCLAIMERS.sales.text).toMatch(/don't take bids or money/);
    expect(DISCLAIMERS.professionals.text).toMatch(/pay to advertise/);
    expect(DISCLAIMERS.services.text).toMatch(/aren't a party/);
  });
});

describe('license lookup', () => {
  it('reads license formats and finds verified matches', async () => {
    const { analyzeQuery, findInDirectory } = await import('./licenseLookup');
    expect(analyzeQuery('agent', 's.0012345')).toMatchObject({ mode: 'license', normalized: 'S.0012345', formatOk: true, detail: expect.stringMatching(/salesperson/) });
    expect(analyzeQuery('agent', '12345')).toMatchObject({ mode: 'license', formatOk: false });
    expect(analyzeQuery('loan_officer', '123456')).toMatchObject({ formatOk: true });
    expect(analyzeQuery('agent', 'Avery')).toMatchObject({ mode: 'name', formatOk: null });
    expect(analyzeQuery('agent', '  ').mode).toBe('empty');
    const byNumber = findInDirectory(SAMPLE_PROS, ['agent'], analyzeQuery('agent', 'BS.0000102'));
    expect(byNumber.map((p) => p.name)).toEqual(['Jordan Sample']);
    expect(findInDirectory(SAMPLE_PROS, ['agent'], analyzeQuery('agent', 'desert realty')).map((p) => p.name)).toEqual(['Avery Example', 'Riley Fixture']);
    expect(findInDirectory(SAMPLE_PROS, ['agent'], analyzeQuery('agent', 'av'))).toEqual([]); // too short
    // A profile hidden for an overdue license check or lapsed payment is never reported as verified.
    expect(findInDirectory(SAMPLE_PROS, ['agent'], analyzeQuery('agent', 'S.0000105'))).toEqual([]);
    expect(findInDirectory(SAMPLE_PROS, ['agent'], analyzeQuery('agent', 'Unpaid-Example'))).toEqual([]);
  });
});

describe('homepage sale-type search', () => {
  it('routes each type of sale to the right place', async () => {
    const { saleSearchHref, SALE_SEARCH } = await import('./saleSearch');
    expect(saleSearchHref('all', '')).toBe('#/search');
    expect(saleSearchHref('tax', 'Henderson, NV')).toBe('#/search?q=Henderson%2C+NV&type=TAX_DEED%2CTAX_LIEN_CERTIFICATE');
    expect(saleSearchHref('foreclosure', '89123')).toBe('#/search?q=89123&type=TRUSTEE_SALE%2CJUDICIAL_FORECLOSURE');
    expect(saleSearchHref('liens', '')).toBe('#/search?status=NOT_FOR_SALE_LIEN_ONLY');
    expect(saleSearchHref('pre', '89031')).toBe('#/pre-foreclosures?q=89031');
    expect(saleSearchHref('short', '')).toBe('#/short-sales');
    expect(SALE_SEARCH.map((o) => o.label)).toContain('Short sales');
  });
});

describe('buyer checklists', () => {
  it('covers every homepage sale type and maps properties and filters to the right list', async () => {
    const { CHECKLISTS, checklistForProperty, checklistForFilters } = await import('./buyerChecklists');
    const { SALE_SEARCH } = await import('./saleSearch');
    for (const o of SALE_SEARCH) expect(CHECKLISTS[o.key], o.key).toBeTruthy();
    expect(CHECKLISTS.pre.forSale).toBe(false);
    expect(CHECKLISTS.liens.forSale).toBe(false);
    expect(CHECKLISTS.pre.items[0].text).toMatch(/Do not contact the homeowner/);
    expect(CHECKLISTS.tax.items.map((i) => i.text).join(' ')).toMatch(/\$5,000 deposit/);
    expect(CHECKLISTS.tax.items.map((i) => i.text).join(' ')).toMatch(/name you want on the deed/);
    expect(checklistForProperty('TRUSTEE_SALE', 'IN_PERSON_AUCTION').key).toBe('foreclosure');
    expect(checklistForProperty('FEDERAL_TAX_SEIZURE', 'SEALED_BID').key).toBe('sheriff');
    expect(checklistForProperty(null, 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE').key).toBe('pre');
    expect(checklistForProperty(null, 'NOT_FOR_SALE_LIEN_ONLY').key).toBe('liens');
    expect(checklistForFilters(['TRUSTEE_SALE', 'JUDICIAL_FORECLOSURE'], []).key).toBe('foreclosure');
    expect(checklistForFilters(['TRUSTEE_SALE', 'REO'], []).key).toBe('all');
    expect(checklistForFilters([], ['NOT_FOR_SALE_LIEN_ONLY']).key).toBe('liens');
  });
});

describe('privacy policy and terms', () => {
  it('has the business details in one place, with placeholders flagged until they are filled in', async () => {
    const { SITE_INFO, hasPlaceholders, PRIVACY_EFFECTIVE, TERMS_EFFECTIVE } = await import('./siteInfo');
    expect(SITE_INFO.governingLaw).toBe('Nevada');
    expect(PRIVACY_EFFECTIVE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TERMS_EFFECTIVE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof hasPlaceholders()).toBe('boolean');
  });
});

describe('sample-data switch', () => {
  it('shows sample data in development builds (the flag is unset in tests)', async () => {
    const { SHOW_SAMPLE_DATA, PROPERTIES, FALLBACK_PROS } = await import('../data');
    expect(SHOW_SAMPLE_DATA).toBe(true);
    expect(PROPERTIES.length).toBeGreaterThan(0);
    expect(FALLBACK_PROS.every((p) => p.isSample)).toBe(true);
  });
});

describe('bank-owned and government sources', () => {
  it('links only direct government, Fannie Mae / Freddie Mac, or bank sites, never auction marketplaces', async () => {
    const { REO_SOURCES } = await import('./reoSources');
    const { PLAYBOOKS } = await import('./playbooks');
    const allowed = /(\.gov|fanniemae\.com|homesteps\.com|bankofamerica\.com|firstcitizens\.com|usbank\.com|chase\.com)$/;
    const banned = /auction\.com|xome|hubzu|realtybid|bid4assets|servicelink|williamsauction|vrmproperties|zillow|realtor\.com|redfin/;
    const urls = [...REO_SOURCES.map((s) => s.url), ...PLAYBOOKS.flatMap((p) => p.sources.map((s) => s.url))];
    for (const u of urls) {
      if (u.startsWith('#/')) continue;
      const host = new URL(u).hostname;
      expect(u.startsWith('https://'), u).toBe(true);
      expect(banned.test(u), u).toBe(false);
      if (REO_SOURCES.some((s) => s.url === u)) expect(allowed.test(host), host).toBe(true);
    }
    expect(new Set(REO_SOURCES.map((s) => s.url)).size).toBe(REO_SOURCES.length);
  });
});

describe('photos & views links', () => {
  it('builds Street View, county aerial, sketch and Assessor links for a real parcel', async () => {
    const { propertyViews } = await import('./propertyViews');
    const v = propertyViews({ apn: '162-23-210-001', address: '1381 E University Ave', city: 'Las Vegas', lat: 36.1069, lng: -115.1398 });
    expect(v.map((x) => x.key)).toEqual(['street', 'aerial', 'sketch', 'assessor']);
    expect(v[0].url).toBe('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=36.106900,-115.139800');
    expect(v[1].url).toBe('https://maps.clarkcountynv.gov/openweb/?getParcel=16223210001');
    expect(v[2].url).toBe('https://maps.clarkcountynv.gov/assessor/webimages/default.asp?appID=2&txtAPN=16223210001');
    expect(v[3].url).toBe('https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/parceldetail.aspx?hdnParcel=16223210001');
    for (const x of v) expect(x.url.startsWith('https://')).toBe(true);
  });

  it('falls back to an address search, adds seller photos only for https links, and skips fake parcels', async () => {
    const { propertyViews, parcelDigits } = await import('./propertyViews');
    const v = propertyViews({ apn: '000-12-345-678', address: '1 Main St & 2nd', listingUrl: 'https://www.hudhomestore.gov/x' });
    expect(v.map((x) => x.key)).toEqual(['listing', 'street']);
    expect(v[1].url).toBe('https://www.google.com/maps/search/?api=1&query=1%20Main%20St%20%26%202nd%2C%20NV');
    expect(propertyViews({ apn: 'bad', address: null, listingUrl: 'javascript:alert(1)' })).toEqual([]);
    expect(parcelDigits('162-23-210-001')).toBe('16223210001');
    expect(parcelDigits('000-23-210-001')).toBeNull();
  });
});

describe('residential and commercial', () => {
  it('classifies Assessor land-use codes', async () => {
    const { classOfLandUse } = await import('./propertyClass');
    expect(classOfLandUse('20.110')).toBe('residential');
    expect(classOfLandUse('21.170.C')).toBe('residential');
    expect(classOfLandUse('12.000')).toBe('residential');
    expect(classOfLandUse('33.150')).toBe('commercial'); // apartments, 5+ units
    expect(classOfLandUse('42.311')).toBe('commercial');
    expect(classOfLandUse('51.250')).toBe('commercial');
    expect(classOfLandUse('14.000')).toBe('commercial');
    expect(classOfLandUse('90.440')).toBeNull(); // public park
    expect(classOfLandUse('10.000')).toBeNull(); // vacant, unknown use
    expect(classOfLandUse('13.000')).toBeNull(); // vacant multi-residential: may be zoned for apartments
    expect(classOfLandUse('41.460')).toBeNull(); // government facility
    expect(classOfLandUse('41.410')).toBeNull(); // school
    expect(classOfLandUse('41.335.C')).toBe('commercial');
    expect(classOfLandUse('44.470')).toBeNull(); // non-profit recreation
    expect(classOfLandUse(null)).toBeNull();
    expect(classOfLandUse('garbage')).toBeNull();
  });

  it('filters the property search by class', async () => {
    const { applyFilters, DEFAULT_FILTERS } = await import('./search');
    const { classOfType } = await import('./propertyClass');
    const com = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, propertyClass: 'commercial' });
    const res = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, propertyClass: 'residential' });
    expect(com.length).toBeGreaterThan(0);
    expect(com.every((p) => classOfType(p.propertyType) === 'commercial')).toBe(true);
    expect(res.every((p) => classOfType(p.propertyType) === 'residential')).toBe(true);
    expect(com.length + res.length).toBe(applyFilters(SAMPLE_PROPERTIES, DEFAULT_FILTERS).length);
  });

  it('tags every bank-owned source, and keeps home-only programs out of commercial', async () => {
    const { REO_SOURCES, reoSourcesIn } = await import('./reoSources');
    expect(REO_SOURCES.every((s) => s.classes.length > 0)).toBe(true);
    const commercial = [...reoSourcesIn('gse', 'commercial'), ...reoSourcesIn('government', 'commercial'), ...reoSourcesIn('bank', 'commercial')].map((s) => s.name);
    expect(commercial).toContain('Bank of America commercial properties');
    expect(commercial).not.toContain('HUD Home Store');
    expect(commercial).not.toContain('Fannie Mae HomePath');
  });
});

describe('commercial value by income', () => {
  it('computes NOI and value from rent, vacancy, costs and cap rate', async () => {
    const { incomeValue, sanitizeIncome } = await import('./incomeValue');
    const r = incomeValue({ monthlyRent: 10_000, otherMonthly: 0, vacancyPct: 10, expensePct: 35, capRatePct: 8 });
    expect(r.grossAnnual).toBe(120_000);
    expect(r.collected).toBe(108_000);
    expect(r.expenses).toBeCloseTo(37_800);
    expect(r.noi).toBeCloseTo(70_200);
    expect(r.value).toBe(878_000); // 70,200 / 0.08 = 877,500, rounded to the nearest $1,000
    expect(incomeValue({ monthlyRent: 10_000, otherMonthly: 0, vacancyPct: 10, expensePct: 35, capRatePct: 0 }).value).toBe(0);
    expect(incomeValue({ monthlyRent: 0, otherMonthly: 0, vacancyPct: 10, expensePct: 35, capRatePct: 8 }).value).toBe(0);
    expect(sanitizeIncome({ monthlyRent: -5, capRatePct: 'x', vacancyPct: 20, evil: 1 })).toEqual({ monthlyRent: 0, otherMonthly: 0, vacancyPct: 20, expensePct: 35, capRatePct: 0 });
  });

  it('has a commercial playbook and checklist', async () => {
    const { playbookByKey } = await import('./playbooks');
    const { CHECKLISTS } = await import('./buyerChecklists');
    const pb = playbookByKey('commercial');
    expect(pb?.sources.every((s) => s.url.startsWith('https://'))).toBe(true);
    expect(pb?.team.length).toBeGreaterThan(5);
    expect(CHECKLISTS.commercial.items.length).toBeGreaterThan(5);
  });
});

describe('business assets & closures', () => {
  it('links only official sellers and government sites, never private marketplaces', async () => {
    const { BUSINESS_SOURCES } = await import('./businessAssets');
    const official = /(\.gov|\.uscourts\.gov|clarkcountycourts\.us)$/;
    for (const s of BUSINESS_SOURCES) {
      const host = new URL(s.url).hostname;
      expect(s.url.startsWith('https://'), s.url).toBe(true);
      expect(official.test(host), host).toBe(true);
    }
    const { CHECKLISTS } = await import('./buyerChecklists');
    expect(CHECKLISTS.business.items.some((i) => /NRS 360\.525/.test(i.detail ?? ''))).toBe(true);
  });
});

describe('commercial wording in sale-type checklists', () => {
  it('drops home-only rules (HOA super-priority, PTFA, HUD) from every checklist on commercial properties', async () => {
    const { CHECKLISTS, forCommercial } = await import('./buyerChecklists');
    for (const list of Object.values(CHECKLISTS)) {
      if (list.key === 'pre' || list.key === 'short') continue; // not shown for commercial sale pages
      const c = forCommercial(list);
      const text = JSON.stringify(c.items) + c.intro;
      expect(text, list.key).not.toMatch(/super-priority|Protecting Tenants|HUD-registered|owns the home|the home is occupied/);
      expect(c.key).toBe(`${list.key}-commercial`);
    }
    expect(forCommercial(CHECKLISTS.reo).official).toBeUndefined();
    expect(forCommercial(CHECKLISTS.foreclosure).items.length).toBe(CHECKLISTS.foreclosure.items.length);
  });
});
