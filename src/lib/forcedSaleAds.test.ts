// The owner's fixed ad spots can be switched on for every guide, lesson, drill and deal packet; pages about forced
// sales or liens still never show an ad (contextAds.ts).
import { describe, expect, it } from 'vitest';
import { drillAllowsAds, lessonAllowsAds, playbookAllowsAds, analyzeAllowsAds } from './contextAds';
import { DRILLS } from '../practice/drills';

describe('no ads on forced-sale pages', () => {
  it('keeps sale guides for forced sales and liens ad-free', () => {
    for (const k of ['tax', 'foreclosure', 'hoa', 'sheriff', 'irs', 'sid', 'commercial']) expect(playbookAllowsAds(k), k).toBe(false);
    for (const k of ['reo', 'short']) expect(playbookAllowsAds(k), k).toBe(true);
  });
  it('keeps the forced-sales lesson and forced-sale drills ad-free', () => {
    expect(lessonAllowsAds('forced-sales')).toBe(false);
    expect(lessonAllowsAds('financing')).toBe(true);
    const forced = DRILLS.filter((d) => /trustee|tax-|hoa-|sheriff|irs|receiver|short-sale|lien/.test(d.id));
    expect(forced.length).toBeGreaterThan(10);
    for (const d of forced) expect(drillAllowsAds(d.id), d.id).toBe(false);
    expect(drillAllowsAds('rental-265')).toBe(true);
  });
  it('keeps deal packets for forced sales ad-free', () => {
    for (const k of ['trustee', 'taxSale', 'lien', 'court', 'hoa', 'irs'] as const) expect(analyzeAllowsAds(k)).toBe(false);
  });
});
