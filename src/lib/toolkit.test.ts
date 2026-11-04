import { describe, expect, it } from 'vitest';
import { dealBreakersFor, LIEN_STRATEGY } from './toolkit';

describe('buy box deal breakers', () => {
  it('offers no minimum-rate deal breaker for Nevada lien certificates, whose rate is set by law (NRS 271.610)', () => {
    expect(dealBreakersFor(LIEN_STRATEGY, 'NV')).not.toContain('Interest rate below the minimum in my notes');
    expect(dealBreakersFor(LIEN_STRATEGY, 'NV')).toContain('Redemption period longer than my notes allow (2 years with a building)');
    expect(dealBreakersFor(LIEN_STRATEGY, 'AZ')).toContain('Interest rate below the minimum in my notes');
  });
});
