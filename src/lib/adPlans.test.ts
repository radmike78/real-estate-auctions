import { describe, expect, it } from 'vitest';
import { AD_TOPICS, topicForPage } from './adTopics';
import { CAPS, capMessage, capProblem, foundingFull, pickRandom, RESPA_CATEGORIES, rotatingPool, TIER_INFO, topicAllowed, topicCap, topicsFor, type AdTier, type Placement } from './adPlans';
import { LESSONS } from './lessons';
import { DRILLS } from '../practice/drills';
import { RENTAL_CASE } from '../practice/rentalCase';
import { CATEGORIES, searchPros, type Category, type ProQuery } from './pros';
import { validateAdLine, validateApplication, withProfileDefaults, type ProProfile } from './proApplication';
import { sanitizePro } from '../feed/prosFeed';
import { SAMPLE_PROS } from '../data/samplePros';
import { LICENSE_LOOKUPS } from './licenseLookups';
import { proGuideByKey } from './proGuide';

describe('ad line rules', () => {
  const ok = 'We help first-time buyers compare bank-owned homes. Ask us how it works.';
  it('accepts plain first-person text, or nothing', () => {
    expect(validateAdLine(ok, 'agent')).toBeNull();
    expect(validateAdLine('', 'agent')).toBeNull();
    expect(validateAdLine(undefined, 'agent')).toBeNull();
  });
  it('enforces length and plain text', () => {
    expect(validateAdLine('Too short', 'agent')).toMatch(/20 to 180/);
    expect(validateAdLine('x'.repeat(181), 'agent')).toMatch(/20 to 180/);
    expect(validateAdLine('We help buyers <b>every</b> single day here.', 'agent')).toMatch(/Plain text/);
    expect(validateAdLine('We help buyers\nevery single day of the week.', 'agent')).toMatch(/Plain text/);
    expect(validateAdLine(42, 'agent')).toMatch(/plain text/);
  });
  it('rejects contact details: buyers use the buttons', () => {
    expect(validateAdLine('Visit www.example-realty.com to learn more about us.', 'agent')).toMatch(/web addresses/);
    expect(validateAdLine('See example.com for our buyer guide and free tips.', 'agent')).toMatch(/web addresses/);
    expect(validateAdLine('Email avery@example.com for a buyer consultation today.', 'agent')).toMatch(/emails/);
    expect(validateAdLine('Call 702-555-0100 for a buyer consultation today.', 'agent')).toMatch(/phone/);
  });
  it('rejects claims of being the best, trusted, recommended or guaranteed, and DeedOwl', () => {
    for (const w of ['the best agent in town for you', 'the #1 team for first-time buyers', 'number one for short sales here', 'top-rated buyer agents in Henderson', 'top rated buyer agents in Henderson', 'a trusted name for buyers here', 'recommended by local investors', 'endorsed by local investors', 'guaranteed closings on time', 'the lowest fees for buyers', 'the cheapest closing help', 'as seen on DeedOwl every day'])
      expect(validateAdLine(`We are ${w}, ask us.`, 'agent'), w).not.toBeNull();
  });
  it('keeps Truth in Lending trigger terms out of lender ad lines, but not other categories', () => {
    for (const w of ['rates from 5.9%', 'a low APR for you', 'great rates for investors', '$0 down for veterans', 'payments you can afford', 'a 3 percent down payment option'])
      expect(validateAdLine(`We offer ${w}, ask us today.`, 'loan_officer'), w).toMatch(/Lenders/);
    expect(validateAdLine('Ask us how renovation loans work for a home that needs repairs.', 'mortgage_company')).toBeNull();
    // A contractor talking about payment schedules isn't advertising credit terms.
    expect(validateAdLine('We take payments in stages as the work is finished.', 'contractor')).toBeNull();
  });
  it('is checked on the application, and older stored profiles get empty ad fields', () => {
    const base = { category: 'agent', name: 'Robin Payer', company: 'Example Brokerage LLC', licenseId: 'S.0012345', state: 'NV', serviceCounties: ['Clark'], serviceCities: ['Las Vegas'], serviceZips: '', services: ['Short sales'], creditProfiles: [], languages: ['English'], headline: 'Short-sale specialist', phone: '702-555-0100', email: 'robin@example.com', website: '', bio: 'I help buyers navigate short sales and lender approval in the valley.', attestLicensed: true, attestAccurate: true, consentVerification: true, attestAdvertising: true, attestOriginal: true };
    const good = validateApplication({ ...base, adLine: ` ${ok} ` });
    expect(good.ok && good.profile.adLine).toBe(ok);
    const bad = validateApplication({ ...base, adLine: 'The best agent in Las Vegas, guaranteed.' });
    expect(bad.ok ? null : bad.errors.adLine).toMatch(/best/);
    const old = withProfileDefaults({ name: 'x' } as unknown as ProProfile);
    expect([old.adLine, old.adTopic, old.adLinePending]).toEqual(['', '', '']);
  });
});

describe('caps', () => {
  const p = (id: string, tier: Placement['tier'], category: Category = 'agent', topic: string | null = null): Placement => ({ id, category, tier, topic });
  it('caps listings per category, counting every plan, and leaves the requester out', () => {
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => p(id, 'standard'));
    expect(capProblem(five, p('new', 'standard'))).toEqual({ kind: 'listing', cap: CAPS.listing });
    expect(capProblem(five, p('a', 'standard'))).toBeNull(); // renewing
    expect(capProblem(five, p('new', 'standard', 'cpa'))).toBeNull(); // another category
    expect(capProblem(five, { ...p('new', 'standard'), state: 'AZ' })).toBeNull(); // another state has its own spots
    expect(capProblem(five.map((x) => ({ ...x, state: 'NV' as const })), p('new', 'standard'))).toEqual({ kind: 'listing', cap: CAPS.listing }); // no state = Nevada
  });
  it('caps Featured spots (Premium and Premium Plus) per category', () => {
    const two = [p('a', 'premium'), p('b', 'premium_plus', 'agent', 'offer')];
    expect(capProblem(two, p('new', 'premium'))?.kind).toBe('featured');
    expect(capProblem(two, p('new', 'premium_plus', 'agent', 'offer'))?.kind).toBe('featured');
    expect(capProblem(two, p('new', 'standard'))).toBeNull();
  });
  it('shares a topic among 3 settlement-service advertisers, and gives it to 1 in other categories', () => {
    expect(RESPA_CATEGORIES.has('loan_officer') && !RESPA_CATEGORIES.has('contractor')).toBe(true);
    expect([topicCap('attorney'), topicCap('home_inspector')]).toEqual([CAPS.topicSettlement, CAPS.topicOther]);
    // Featured is checked against the category's own count; use separate categories' worth of featured spots.
    const lenders = [p('a', 'premium_plus', 'bank', 'financing'), p('b', 'premium_plus', 'bank', 'financing')];
    expect(capProblem(lenders, p('c', 'premium_plus', 'bank', 'financing'))?.kind).toBe('featured');
    const inspector = [p('a', 'premium_plus', 'home_inspector', 'inspections')];
    expect(capProblem(inspector, p('b', 'premium_plus', 'home_inspector', 'inspections'))).toEqual({ kind: 'topic', cap: 1 });
    expect(capProblem(inspector, p('b', 'premium_plus', 'contractor', 'inspections'))).toBeNull();
  });
  it('says clearly what is full', () => {
    expect(capMessage({ kind: 'listing', cap: 5 }, 'agent')).toMatch(/Real estate agents directory is full/);
    expect(capMessage({ kind: 'featured', cap: 2 }, 'agent')).toMatch(/Featured ad spots/);
    expect(capMessage({ kind: 'topic', cap: 1 }, 'home_inspector', 'inspections')).toMatch(/Inspections & repairs ad spot .* is taken/);
  });
  it('picks a random subset without repeats', () => {
    const r = pickRandom([1, 2, 3, 4], 2, () => 0.5);
    expect(r).toHaveLength(2);
    expect(new Set(r).size).toBe(2);
  });
});

describe('Learn and Practice topics for ads', () => {
  const lessonKeys = LESSONS.map((l) => l.key);
  const drillIds = DRILLS.map((d) => d.id);
  const stageKeys = RENTAL_CASE.map((s) => s.key);
  it('maps only real pages, each to at most one topic', () => {
    const seen = new Map<string, string>();
    for (const t of AD_TOPICS) {
      for (const [kind, ids, known] of [['lesson', t.lessons, lessonKeys], ['drill', t.drills, drillIds], ['stage', t.caseStages ?? [], stageKeys]] as const) {
        for (const id of ids) {
          expect(known, `${t.key}: unknown ${kind} ${id}`).toContain(id);
          expect(seen.get(`${kind}:${id}`), `${kind} ${id} is in two topics`).toBeUndefined();
          seen.set(`${kind}:${id}`, t.key);
        }
      }
    }
    expect(topicForPage({ lesson: 'financing' })?.key).toBe('financing');
    expect(topicForPage({ caseStage: 'inspection' })?.key).toBe('inspections');
    expect(topicForPage({ drill: 'no-such-drill' })).toBeUndefined();
  });
  it('never sits beside forced sales, distressed owners, homeowner help or surplus money', () => {
    const forbiddenLessons = ['forced-sales', 'red-flags', 'creative'];
    const forbiddenDrill = /trustee|tax|lien|hoa|sheriff|irs|short-sale|foreclos|receiver|auction|redeem/;
    for (const t of AD_TOPICS) {
      for (const l of t.lessons) expect(forbiddenLessons, l).not.toContain(l);
      for (const d of t.drills) {
        expect(d, d).not.toMatch(forbiddenDrill);
        const drill = DRILLS.find((x) => x.id === d)!;
        expect(`${drill.title} ${drill.where}`, d).not.toMatch(/foreclos|short sale|tax sale|tax lien|sheriff|IRS|HOA (foreclosure|sale)|receiver|auction|surplus/i);
      }
    }
  });
  it('offers each topic to existing categories, with an official license lookup and a directory link', () => {
    for (const t of AD_TOPICS) {
      expect(t.categories.length, t.key).toBeGreaterThan(0);
      for (const c of t.categories) expect(CATEGORIES[c], `${t.key}: ${c}`).toBeTruthy();
      for (const k of t.editorial.lookups) {
        expect(proGuideByKey(k), k).toBeTruthy();
        for (const s of ['NV', 'CA', 'AZ', 'UT'] as const) expect(LICENSE_LOOKUPS[k]?.[s], `${k} has a ${s} lookup`).toBeTruthy();
      }
      expect(t.editorial.directories.length).toBeGreaterThan(0);
      for (const d of t.editorial.directories) {
        expect(d.href).toMatch(/^#\//);
        expect(d.label).toMatch(/listed on DeedOwl$/);
      }
    }
    expect(topicsFor('loan_officer').map((t) => t.key)).toEqual(['financing']);
    expect(topicAllowed('agent', 'financing')).toBe(false);
  });
  it('keeps our editorial voice neutral: no recommending, ranking or pointing to an advertiser', () => {
    const banned = /\b(reach out to|we recommend|our partner|trusted|best|top|preferred|recommended|endorse)/i;
    for (const t of AD_TOPICS) {
      const e = t.editorial;
      for (const text of [e.heading, e.body, ...e.questions, ...e.directories.map((d) => d.label)]) expect(text, t.key).not.toMatch(banned);
    }
  });
});

describe('advertising fields in the directory', () => {
  const sam = SAMPLE_PROS.find((p) => p.tier === 'premium_plus')!;
  it('includes one Premium and one Premium Plus sample, both with valid ad lines', () => {
    expect(SAMPLE_PROS.filter((p) => p.tier === 'premium')).toHaveLength(1);
    expect(sam.adTopic).toBe('financing');
    for (const p of SAMPLE_PROS) if (p.adLine) expect(validateAdLine(p.adLine, p.category), p.name).toBeNull();
  });
  it('sanitizes what the signed feed says: unknown plans, bad ad lines and wrong topics are dropped', () => {
    expect(sanitizePro({ ...sam, tier: 'gold' as never }).tier).toBe('standard');
    expect(sanitizePro({ ...sam, tier: 'gold' as never }).adTopic).toBeNull();
    expect(sanitizePro({ ...sam, adLine: 'Rates from 4.9% APR, call now!' }).adLine).toBeNull();
    expect(sanitizePro({ ...sam, adTopic: 'offer' }).adTopic).toBeNull(); // agents' topic, not lenders'
    expect(sanitizePro({ ...sam, adTopic: 'financing', tier: 'premium' }).adTopic).toBeNull();
    expect(sanitizePro({ ...sam, adLine: undefined as never, tier: undefined as never })).toMatchObject({ adLine: null, tier: 'standard' });
    expect(sanitizePro(sam)).toMatchObject({ tier: 'premium_plus', adTopic: 'financing', adLine: sam.adLine });
  });
  it('never moves a paying advertiser up the list', () => {
    const Q: ProQuery = { categories: [], location: '', service: 'any', creditProfile: 'any', language: 'any' };
    const at = new Date('2026-10-01T12:00:00Z');
    const order = searchPros(SAMPLE_PROS, Q, at).map((p) => p.id);
    const everyonePremium = SAMPLE_PROS.map((p) => ({ ...p, tier: 'premium_plus' as const }));
    const nobodyPremium = SAMPLE_PROS.map((p) => ({ ...p, tier: 'standard' as const }));
    expect(searchPros(everyonePremium, Q, at).map((p) => p.id)).toEqual(order);
    expect(searchPros(nobodyPremium, Q, at).map((p) => p.id)).toEqual(order);
  });
});

describe('founding cap', () => {
  const r = (id: string, founding = true, status = 'APPROVED', category: 'agent' | 'cpa' = 'agent') => ({ id, category, founding, status });
  it('allows up to CAPS.founding per category, counting neither rejected applications nor other categories', () => {
    expect(CAPS.founding).toBe(2);
    expect(foundingFull([r('a')], 'new', 'agent')).toBe(false);
    expect(foundingFull([r('a'), r('b')], 'new', 'agent')).toBe(true);
    expect(foundingFull([r('a'), r('b')], 'new', 'agent', 'CA')).toBe(false); // each state has its own founding spots
    expect(foundingFull([r('a'), r('b')], 'a', 'agent')).toBe(false); // already one of them
    expect(foundingFull([r('a'), r('b', true, 'REJECTED')], 'new', 'agent')).toBe(false);
    expect(foundingFull([r('a'), r('b', false)], 'new', 'agent')).toBe(false);
    expect(foundingFull([r('a', true, 'APPROVED', 'cpa'), r('b', true, 'APPROVED', 'cpa')], 'new', 'agent')).toBe(false);
  });
});

describe('who takes turns in the one-advertiser ad boxes', () => {
  const pro = (id: string, tier: AdTier, category: Category = 'agent', adsOff = false) => ({ id, tier, category, adsOff });
  const pros = [pro('r', 'standard'), pro('s', 'premium'), pro('m', 'premium_plus'), pro('m2', 'premium_plus', 'insurance'), pro('off', 'standard', 'agent', true)];

  it('the Your Team rotating ad takes every plan, but never an advertiser whose ads are off', () => {
    expect(rotatingPool(pros).map((p) => p.id)).toEqual(['r', 's', 'm', 'm2']);
  });

  it('the Mentor Connect ad spots take only Mentor Connect, in the spot’s categories', () => {
    expect(rotatingPool(pros, ['agent']).map((p) => p.id)).toEqual(['m']);
    expect(rotatingPool(pros, ['agent', 'insurance']).map((p) => p.id)).toEqual(['m', 'm2']);
  });

  it('describes the plans the way they work', () => {
    expect(TIER_INFO.standard.includes.join(' ')).toMatch(/rotating ad at the top of the Your Team page/);
    expect(TIER_INFO.premium.includes.join(' ')).toMatch(/doesn’t rotate/);
    expect(TIER_INFO.premium_plus.includes.join(' ')).toMatch(/Mentor Connect ad spots/);
  });
});
