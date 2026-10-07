import { describe, expect, it } from 'vitest';
import { PLAYBOOKS, stateOf } from './playbooks';
import { SALE_SCRIPTS, saleDocsFor, saleKindOf, saleScriptsFor } from './saleDocs';
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
    expect(saleKindOf('txforeclosure')).toBe('trustee');
    expect(saleKindOf('txreo')).toBe('reo');
    expect(saleKindOf('txshort')).toBe('short');
    expect(saleKindOf('txirs')).toBe('irs');
  });

  it('give each Texas guide its own route’s papers, never another route’s deed or office', () => {
    const tx = PLAYBOOKS.filter((p) => stateOf(p) === 'TX');
    expect(tx.length).toBe(8);
    for (const p of tx) {
      const words = [...saleDocsFor(p.key, 'TX').map((d) => `${d.name} ${d.check}`), ...saleScriptsFor(p.key, 'TX').map((x) => `${x.to} ${x.script}`)].join(' ');
      expect(words, p.key).not.toMatch(/treasurer/i);
      // An execution sale needs the same no-delinquent-taxes statement or bidder registration (Civ. Prac. & Rem. Code 34.0445).
      if (p.key === 'txsheriff') expect(words, p.key).not.toMatch(/tax deed/i);
      else if (p.key !== 'txtax') expect(words, p.key).not.toMatch(/tax deed|bidder registration|no delinquent taxes|tax assessor/i);
    }
    expect(saleDocsFor('txshort', 'TX').map((d) => d.name).join(' ')).toMatch(/Short Sale Addendum/);
    expect(saleDocsFor('txtax', 'TX').map((d) => d.name).join(' ')).toMatch(/no delinquent taxes/);
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
