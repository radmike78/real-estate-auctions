import { describe, expect, it } from 'vitest';
import { aliasesOf, markTerms } from './terms';

const NOI = { term: 'Net operating income (NOI)', meaning: 'Rent collected minus operating costs.' };
const COC = { term: 'Cash-on-cash return', meaning: 'A year’s cash flow ÷ the cash you put in.' };

describe('key terms where they first appear', () => {
  it('knows a term by its name and its short form', () => {
    expect(aliasesOf('Net operating income (NOI)')).toEqual(['Net operating income', 'NOI']);
    expect(aliasesOf('Mortgage insurance (PMI, MIP)')).toEqual(['Mortgage insurance', 'PMI', 'MIP']);
    expect(aliasesOf('“Subject-to”')).toEqual(['Subject-to']);
  });

  it('marks only the first mention of each term on the page', () => {
    const used = new Set<string>();
    const a = markTerms('First the NOI, then the NOI again.', [NOI], used);
    expect(a.filter((p) => typeof p !== 'string')).toHaveLength(1);
    expect(a.map((p) => (typeof p === 'string' ? p : `[${p.text}]`)).join('')).toBe('First the [NOI], then the NOI again.');
    expect(markTerms('Net operating income is key.', [NOI], used)).toEqual(['Net operating income is key.']);
  });

  it('matches whole words only, and plurals', () => {
    expect(markTerms('Cash-on-cash returns vary.', [COC], new Set()).some((p) => typeof p !== 'string')).toBe(true);
    expect(markTerms('NOIX is not it.', [NOI], new Set())).toEqual(['NOIX is not it.']);
  });
});
