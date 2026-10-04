import { describe, expect, it } from 'vitest';
import { analyzeHref, prefillParam } from './analyze';

describe('Analyze this property', () => {
  it('builds a link from a listing and reads it back', () => {
    const href = analyzeHref({ address: '1 Example St', city: 'Las Vegas', state: 'NV', county: 'Clark County', saleType: 'TAX_DEED' })!;
    const f = prefillParam(new URLSearchParams(href.split('?')[1]))!;
    expect(f).toEqual({ name: '1 Example St, Las Vegas', state: 'NV', county: 'Clark', kind: 'taxSale' });
  });
  it('rejects counties and kinds it does not cover', () => {
    expect(analyzeHref({ address: 'x', state: 'NV', county: 'Nowhere', saleType: 'REO' })).toBeNull();
    expect(prefillParam(new URLSearchParams('state=NV&county=Clark&kind=bogus'))).toBeUndefined();
    expect(prefillParam(new URLSearchParams('state=XX&county=Clark&kind=reo'))).toBeUndefined();
  });
});
