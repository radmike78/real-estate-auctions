import { describe, expect, it } from 'vitest';
import { COUNTY_OFFICES } from './countyOffices';
import { countyOfficeCards, officeLabelsFor } from './findDeals';
import { STATES } from './regions';

describe('county office directory', () => {
  it('preserves all five office purposes for every supported county, including shared pages', () => {
    for (const state of STATES) for (const county of state.counties) {
      const offices = COUNTY_OFFICES[`${state.code}/${county}`];
      const cards = countyOfficeCards(state.code, offices);
      for (const label of officeLabelsFor(state.code)) {
        expect(offices?.[label.key], `${state.code}/${county}: ${label.key}`).toBeDefined();
        expect(cards.find((c) => c.url === offices[label.key]!.url)?.name).toContain(label.name);
      }
      expect(new Set(cards.map((c) => c.url)).size).toBe(cards.length);
    }
  });

  it('distinguishes contact pages from auction instructions without inventing a verification date', () => {
    const cards = countyOfficeCards('TX', {
      taxSale: { url: 'https://example.com/office', checked: null, contactOnly: true },
    });
    expect(cards[0].name).toContain('contact / directory');
    expect(cards[0].what).toContain('No verification date recorded');
    expect(cards[0].what).not.toContain('dates, rules');
  });

  it('keeps tax, assessment and recording purposes on Wayne’s shared official page', () => {
    const cards = countyOfficeCards('UT', COUNTY_OFFICES['UT/Wayne']);
    expect(cards).toHaveLength(2);
    const combined = cards.find((c) => c.url.endsWith('/pages/county-offices'))!;
    for (const name of ['Tax sale', 'Treasurer / tax collector', 'Assessor', 'Recorder']) expect(combined.name).toContain(name);
  });

  it('does not describe Crosby’s appraisal search as an auction listing', () => {
    const cards = countyOfficeCards('TX', COUNTY_OFFICES['TX/Crosby']);
    expect(cards.find((c) => c.url === 'https://www.crosbycentral.org/')?.what).toContain('not an auction listing');
    expect(officeLabelsFor('AZ').find((o) => o.key === 'sheriff')?.name).toBe('Sheriff or constable');
  });
});
