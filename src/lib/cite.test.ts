import { describe, expect, it } from 'vitest';
import { splitCites } from './cite';

describe('splitCites', () => {
  it('pulls out statute citations, including nested subsections', () => {
    expect(splitCites('Pay in full at the sale (26 U.S.C. 6335(e); IRM 5.10.5.14).')).toEqual([
      'Pay in full at the sale ', { cite: '(26 U.S.C. 6335(e); IRM 5.10.5.14)' }, '.',
    ]);
    expect(splitCites('Notice is 7 court days (NRS 40.255) and (A.R.S. 33-810) applies.').filter((p) => typeof p !== 'string')).toHaveLength(2);
  });
  it('leaves ordinary parentheses alone', () => {
    expect(splitCites('A deposit (usually cash) is due (about 10%).')).toEqual(['A deposit (usually cash) is due (about 10%).']);
  });
});
