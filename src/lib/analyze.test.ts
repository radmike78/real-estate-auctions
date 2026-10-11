import { describe, expect, it } from 'vitest';
import { checklistFor, cleanDeal, kindsFor, type Deal } from './analyze';

const texts = (d: Parameters<typeof checklistFor>[0]) => checklistFor(d).flatMap((g) => g.items.map((i) => i.text)).join('\n');

describe('Analyze a deal checklist', () => {
  it('shows only the chosen state’s rules', () => {
    const ca = texts({ state: 'CA', county: 'Riverside', kind: 'trustee', plan: 'flip' });
    expect(ca).toMatch(/California/);
    expect(ca).not.toMatch(/Nevada|Arizona|Utah/);
    const nv = texts({ state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent' });
    expect(nv).toMatch(/NRS 113\.130/);
    expect(nv).not.toMatch(/California|Arizona|Utah/);
  });

  it('offers only the sales each state has', () => {
    expect(kindsFor('AZ').map((k) => k.key)).toContain('lien');
    expect(kindsFor('AZ').map((k) => k.key)).not.toContain('taxSale');
    expect(kindsFor('CA').map((k) => k.key)).toContain('hoa');
  });

  it('links the county’s own offices and reminds auction buyers to use the official seller', () => {
    const groups = checklistFor({ state: 'UT', county: 'Salt Lake', kind: 'taxSale', plan: 'flip' });
    const items = groups.flatMap((g) => g.items);
    expect(items.find((i) => i.id === 'taxes')?.href).toMatch(/^https:\/\/.*saltlakecounty\.gov/);
    expect(items.some((i) => /official seller/.test(i.text) && /Never contact homeowners/.test(i.text))).toBe(true);
  });

  it('gives Texas short sales, HOA and court sales their own checklist lines', () => {
    const ids = (kind: Deal['kind']) => checklistFor({ state: 'TX', county: 'Dallas', kind, plan: 'flip' }).flatMap((g) => g.items.map((x) => x.id));
    expect(ids('short')).toEqual(expect.arrayContaining(['short-approval', 'short-foreclosure', 'tx-short']));
    expect(ids('hoa')).toEqual(expect.arrayContaining(['tx-hoa-type', 'tx-hoa-redeem']));
    expect(ids('hoa')).not.toContain('nv-hoa');
    const court = checklistFor({ state: 'TX', county: 'Dallas', kind: 'court', plan: 'flip' }).flatMap((g) => g.items).find((x) => x.id === 'court-redeem')!;
    expect(court.text).not.toMatch(/until it ends/);
    const contractor = checklistFor({ state: 'TX', county: 'Dallas', kind: 'listing', plan: 'flip' }).flatMap((g) => g.items).find((x) => x.id === 'contractor')!;
    expect(contractor.text).not.toMatch(/licensed in Texas/);
  });
});

it('keeps a location confirmation only for a valid property county', () => {
  const d = { id: 'loc', state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent', locationConfirmed: true };
  expect(cleanDeal(d)?.locationConfirmed).toBe(true);
  expect(cleanDeal({ ...d, locationConfirmed: 'true' })?.locationConfirmed).toBeUndefined();
  expect(cleanDeal({ ...d, county: 'Wrong county' })?.locationConfirmed).toBeUndefined();
  expect(cleanDeal({ ...d, locationConfirmed: undefined })?.locationConfirmed).toBeUndefined();
});
