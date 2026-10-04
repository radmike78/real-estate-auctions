import { describe, expect, it } from 'vitest';
import { PLAYBOOKS, stateOf } from './playbooks';
import { SALE_SCRIPTS, saleDocsFor, saleKindOf } from './saleDocs';
import { PRO_SCRIPTS } from './proScripts';

describe('documents and scripts', () => {
  it('give every sale guide its documents and at least one script', () => {
    for (const p of PLAYBOOKS) {
      expect(saleDocsFor(p.key, stateOf(p)).length, p.key).toBeGreaterThan(3);
      expect(SALE_SCRIPTS[saleKindOf(p.key)].length, p.key).toBeGreaterThan(0);
    }
    expect(saleKindOf('catax')).toBe('deed');
    expect(saleKindOf('aztaxlien')).toBe('taxlien');
    expect(saleKindOf('utforeclosure')).toBe('trustee');
  });

  it('keep Nevada-only rules out of other states’ guides', () => {
    expect(saleDocsFor('cahoa', 'CA').some((d) => /super-priority/.test(d.name))).toBe(false);
    expect(saleDocsFor('hoa', 'NV').some((d) => /super-priority/.test(d.name))).toBe(true);
  });

  it('never address an owner, occupant or former owner', () => {
    const all = [...Object.values(SALE_SCRIPTS).flat().map((s) => s.to), ...Object.keys(PRO_SCRIPTS)];
    for (const to of all) expect(to).not.toMatch(/\b(owner|occupant|tenant|debtor|homeowner)\b/i);
  });
});
