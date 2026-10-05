import { describe, expect, it } from 'vitest';
import { CATEGORIES, type Category } from './pros';
import { STATES, type StateCode } from './regions';
import { regulatorFor, shortLicenseLabel } from './regulators';

describe('where an advertiser’s license is checked', () => {
  it('names a regulator (and a link or a note) for every category in every state', () => {
    for (const s of STATES) {
      for (const c of Object.keys(CATEGORIES) as Category[]) {
        const r = regulatorFor(c, s.code as StateCode);
        expect(r.name.length, `${c} ${s.code}`).toBeGreaterThan(3);
        expect(!!r.url || !!r.note, `${c} ${s.code}`).toBe(true);
        if (r.url) expect(r.url).toMatch(/^https:\/\//);
        expect(shortLicenseLabel(c, s.code as StateCode).length).toBeGreaterThan(2);
      }
    }
  });

  it('keeps Nevada’s own lookups and uses each state’s for the others', () => {
    expect(regulatorFor('agent', 'NV').name).toBe(CATEGORIES.agent.regulator);
    expect(regulatorFor('agent', 'CA').name).not.toBe(CATEGORIES.agent.regulator);
    expect(regulatorFor('bank', 'UT').name).toBe(CATEGORIES.bank.regulator); // FDIC, national
    expect(shortLicenseLabel('agent', 'AZ')).toBe('Arizona license');
    expect(shortLicenseLabel('loan_officer', 'UT')).toBe('NMLS ID');
  });
});
