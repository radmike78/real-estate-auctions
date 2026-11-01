import { describe, expect, it } from 'vitest';
import { analyzeAdCategories, findDealsAllowsAds, stepAdCategories } from './contextAds';
import { ROADMAP, type RoadmapPath } from './roadmap';
import { CATEGORIES } from './pros';
import type { SaleKind } from './analyze';

describe('"at the moment you need one" ads', () => {
  it('Analyze a deal: only for listings and bank-owned homes, matched to the plan', () => {
    expect(analyzeAdCategories('listing', 'flip')).toEqual(['contractor', 'home_inspector', 'private_lender']);
    expect(analyzeAdCategories('reo', 'rent')).toEqual(expect.arrayContaining(['loan_officer', 'insurance', 'property_manager']));
    for (const kind of ['trustee', 'taxSale', 'lien', 'court', 'hoa', 'irs'] as SaleKind[]) {
      for (const plan of ['flip', 'rent', 'commercial', 'lien'] as const) expect(analyzeAdCategories(kind, plan), `${kind}/${plan}`).toEqual([]);
    }
    expect(analyzeAdCategories('listing', 'lien')).toEqual([]);
  });

  it('Find deals: ads only on the agent (listing) route', () => {
    expect(findDealsAllowsAds('listing')).toBe(true);
    expect(findDealsAllowsAds('auction')).toBe(false);
    expect(findDealsAllowsAds('certificate')).toBe(false);
  });

  it('My plan: never on auction or lien-certificate routes, nor on steps for those routes only', () => {
    for (const s of ROADMAP) {
      for (const path of ['auction', 'certificate'] as RoadmapPath[]) expect(stepAdCategories(s, path), `${s.id} on ${path}`).toEqual([]);
      if (s.path && !s.path.includes('listing')) expect(stepAdCategories(s, 'listing'), s.id).toEqual([]);
    }
  });

  it('My plan: matches who the step says to call, and never an official (county, trustee, sheriff)', () => {
    const listing = ROADMAP.filter((s) => !s.path || s.path.includes('listing'));
    const by = (to: RegExp) => listing.filter((s) => to.test(s.say?.to ?? '')).map((s) => stepAdCategories(s, 'listing'));
    expect(by(/^Insurance agent/).every((c) => c.join() === 'insurance')).toBe(true);
    expect(by(/^Your agent/).every((c) => c[0] === 'agent')).toBe(true);
    // The inspection step also shows inspectors, beside the agent you call.
    expect(stepAdCategories(ROADMAP.find((s) => s.href === '#/pros/inspector')!, 'listing')).toEqual(['agent', 'home_inspector']);
    expect(by(/^(Title|Escrow)/).every((c) => c.join() === 'title_escrow')).toBe(true);
    expect(by(/^Loan officer/)[0]).toEqual(['loan_officer', 'mortgage_company', 'bank', 'credit_union']);
    for (const s of ROADMAP) {
      if (/treasurer|trustee|sheriff|county/i.test(s.say?.to ?? '')) expect(stepAdCategories(s, 'listing'), s.id).toEqual([]);
      for (const c of stepAdCategories(s, 'listing')) expect(CATEGORIES[c], c).toBeTruthy();
    }
    // At least the main moments carry one.
    expect(listing.filter((s) => stepAdCategories(s, 'listing').length).length).toBeGreaterThanOrEqual(6);
  });
});

