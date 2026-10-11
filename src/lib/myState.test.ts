import { describe, expect, it } from 'vitest';
import { dropStateLead, showFor, statesOf } from './myState';

describe('statesOf', () => {
  it('reads which states a line is about', () => {
    expect(statesOf('In a California trustee sale covered by Civil Code 2924m')).toEqual(['CA']);
    expect(statesOf('In a Nevada resale covered by NRS 116.4109')).toEqual(['NV']);
    expect(statesOf('In Nevada, a licensee must disclose')).toEqual(['NV']);
    expect(statesOf('Arizona and Utah have their own disclosure rules')).toEqual(['AZ', 'UT']);
    expect(statesOf('California: 3 months after a judicial foreclosure sale')).toEqual(['CA']);
    expect(statesOf('Clark County (NV) Assessor')).toEqual(['NV']);
    expect(statesOf('In Texas, the seller must give the disclosure notice')).toEqual(['TX']);
    expect(statesOf('Harris County (TX) Appraisal District')).toEqual(['TX']);
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

describe('forStateText', () => {
  it('drops sentences about other states and keeps general ones', async () => {
    const { forStateText } = await import('./myState');
    const t = 'Condos share costs. California has its own balcony law. In Nevada, an HOA lien can come first.';
    expect(forStateText('NV', t)).toBe('Condos share costs. An HOA lien can come first.');
    expect(forStateText('CA', t)).toBe('Condos share costs. California has its own balcony law.');
    expect(forStateText(null, t)).toBe(t);
  });

  it('splits after a sentence that ends with an asterisk', async () => {
    const { forStateText } = await import('./myState');
    const t = 'In California, a joint tenancy carries survivorship.* In Nevada, a joint tenancy carries survivorship.* In Utah, it does too.*';
    expect(forStateText('NV', t)).toBe('A joint tenancy carries survivorship.*');
    expect(forStateText('UT', t)).toBe('It does too.*');
    expect(forStateText('TX', t)).toBe('');
  });

  it('drops the sentences that continue another state’s rule, so nothing is left dangling', async () => {
    const { forStateText } = await import('./myState');
    const lender = 'In California, a private lender may hold a DFPI license. Check it with that regulator. Get every term in writing.';
    expect(forStateText('TX', lender)).toBe('');
    const inspector = 'Rules differ by state. Look the inspector up on your state’s lookup. In Nevada, the state certifies inspectors. A residential inspector there needs 40 hours. In Texas, TREC licenses three levels.';
    expect(forStateText('TX', inspector)).toBe('Rules differ by state. Look the inspector up on your state’s lookup. TREC licenses three levels.');
    expect(forStateText('NV', inspector)).toBe('Rules differ by state. Look the inspector up on your state’s lookup. The state certifies inspectors. A residential inspector there needs 40 hours.');
    expect(forStateText('NV', 'In Texas, notice is posted 21 days ahead. The sale is held on the first Tuesday. Other states differ, so read the guide.')).toBe('Other states differ, so read the guide.');
  });
});

describe('dropStateLead', () => {
  it('drops a several-state lead-in that includes the chosen state, keeps it otherwise', () => {
    const s = 'Escrow pays everyone. In California, Nevada, Arizona and Utah, title companies close.';
    expect(dropStateLead(s, 'CA')).toBe('Escrow pays everyone. Title companies close.');
    expect(dropStateLead(s, 'TX')).toBe(s);
    expect(dropStateLead('In Nevada or Utah, x happens.', 'UT')).toBe('X happens.');
    expect(dropStateLead('In Nevada, Texas and many other states, the HOA can foreclose.', 'NV')).toBe('In Nevada, Texas and many other states, the HOA can foreclose.');
    expect(dropStateLead('In Nevada, Nevada Legal Services helps.', 'NV')).toBe('Nevada Legal Services helps.');
  });
  it('drops the chosen state’s lead-in from each sentence', () => {
    expect(dropStateLead('In California, the county sells it. In California, you can pay.', 'CA')).toBe('The county sells it. You can pay.');
    expect(dropStateLead('Texas: trustee sales are on the first Tuesday.', 'TX')).toBe('Trustee sales are on the first Tuesday.');
  });
  it('keeps other states’ lead-ins and leaves text alone with no state chosen', () => {
    expect(dropStateLead('In Nevada, the HOA can foreclose.', 'CA')).toBe('In Nevada, the HOA can foreclose.');
    expect(dropStateLead('In California, the county sells it.', null)).toBe('In California, the county sells it.');
  });
});
