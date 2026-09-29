import { describe, expect, it } from 'vitest';
import { showFor, statesOf } from './myState';

describe('statesOf', () => {
  it('reads which states a line is about', () => {
    expect(statesOf('In Nevada, a licensee must disclose')).toEqual(['NV']);
    expect(statesOf('Arizona and Utah have their own disclosure rules')).toEqual(['AZ', 'UT']);
    expect(statesOf('California: 3 months after a judicial foreclosure sale')).toEqual(['CA']);
    expect(statesOf('Clark County (NV) Assessor')).toEqual(['NV']);
    expect(statesOf('NRS 107: deeds of trust')).toEqual(['NV']);
    expect(statesOf('Washoe County Treasurer: tax sales FAQ')).toEqual(['NV']);
    expect(statesOf('California Civil Code 2924')).toEqual(['CA']);
    expect(statesOf('Utah Code 57-1-24')).toEqual(['UT']);
    expect(statesOf('IRS sales: the IRS sells seized property')).toEqual([]);
    expect(statesOf('Most home loans in these states are deeds of trust.')).toEqual([]);
    expect(statesOf('Read the county’s rules; Nevada counties differ.')).toEqual([]);
  });
  it('shows untagged text everywhere and tagged text only in its states', () => {
    expect(showFor('NV', 'In California, agents give')).toBe(false);
    expect(showFor('CA', 'In California, agents give')).toBe(true);
    expect(showFor('AZ', 'Arizona and Utah have')).toBe(true);
    expect(showFor('NV', 'Check the title.')).toBe(true);
    expect(showFor(null, 'In California, agents give')).toBe(true);
  });
});
