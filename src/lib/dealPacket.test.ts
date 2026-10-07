import { beforeEach, describe, expect, it } from 'vitest';
import type { Deal } from './analyze';
import { cleanPacket, dealPacketText, EMPTY_PACKET, loadPacket, nextAction, nextDate, packetSections, savePacket, suggestedDates } from './dealPacket';
import { saveLog, cleanLog } from './evidence';
import { dealNumbers } from './propertyPacket';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const deal: Deal = { id: 'd1', name: '12 Test St', state: 'TX', county: 'Travis', kind: 'listing', plan: 'rent', notes: '', done: [], updatedAt: '2026-10-06T00:00:00Z' };
const now = new Date('2026-10-06T15:00:00Z');

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
});

describe('the deal packet', () => {
  it('cleans stored packets so bad data can’t break the page', () => {
    expect(cleanPacket(null)).toEqual(EMPTY_PACKET);
    const p = cleanPacket({ fit: 'maybe', dates: [{ when: 'soon', what: 'x'.repeat(500) }], earnest: -5, qa: 'nope' });
    expect(p.fit).toBe('');
    expect(p.dates[0].when).toBe('');
    expect(p.dates[0].what.length).toBe(200);
    expect(p.earnest).toBe(0);
    expect(p.qa).toEqual([]);
  });

  it('suggests the dates each kind of sale needs, in the state’s words', () => {
    expect(suggestedDates({ kind: 'listing', state: 'TX' }).join(' ')).toMatch(/Option period ends/);
    expect(suggestedDates({ kind: 'listing', state: 'NV' }).join(' ')).toMatch(/Inspection period ends/);
    expect(suggestedDates({ kind: 'taxSale', state: 'TX' })).toContain('Redemption period ends');
    expect(suggestedDates({ kind: 'court', state: 'TX' })).not.toContain('Redemption period ends');
    // Owners can't redeem after a tax sale in Nevada, California, Utah or Arizona.
    for (const state of ['NV', 'CA', 'UT', 'AZ'] as const) expect(suggestedDates({ kind: 'taxSale', state })).not.toContain('Redemption period ends');
    expect(suggestedDates({ kind: 'short', state: 'TX' }).join(' ')).toMatch(/approval/i);
  });

  it('marks every part missing on a new deal and points to one next action', () => {
    const secs = packetSections(deal, EMPTY_PACKET, now);
    expect(secs.map((s) => s.key)).toEqual(['plan', 'property', 'dates', 'cash', 'numbers', 'evidence', 'pros', 'decision']);
    expect(secs.every((s) => s.status === 'missing')).toBe(true);
    expect(nextAction(deal, EMPTY_PACKET, now).text).toMatch(/Keep and rent/);
  });

  it('puts a deadline within a week ahead of everything else', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-09', what: 'Option period ends (5 p.m.)', who: 'Me and my agent' }, { when: '2026-10-01', what: 'Offer accepted', who: '' }] };
    expect(nextDate(p, now)?.days).toBe(3);
    expect(nextAction(deal, p, now).text).toBe('In 3 days: Option period ends (5 p.m.). Who: Me and my agent.');
    const secs = packetSections(deal, p, now);
    expect(secs.find((s) => s.key === 'dates')?.status).toBe('done');
  });

  it('follows the evidence log and professionals’ answers', () => {
    const log = cleanLog({ rows: { title: { open: 'Does the 2023 roofing lien survive?', owner: 'Title company, Friday' } } });
    saveLog('analyzed:d1', log);
    expect(nextAction(deal, EMPTY_PACKET, now).text).toBe('Get an answer to: Does the 2023 roofing lien survive? (Title company, Friday).');
    const p = { ...EMPTY_PACKET, qa: [{ role: 'title', q: 'Will you insure it?', a: '', on: '' }] };
    expect(packetSections(deal, p, now).find((s) => s.key === 'pros')?.status).toBe('started');
  });

  it('saves per deal and prints every part', () => {
    savePacket('analyzed:d1', { ...EMPTY_PACKET, fit: 'more', fitWhy: 'rent unproven', earnest: 3000 });
    const p = loadPacket('analyzed:d1');
    expect(p.fit).toBe('more');
    const text = dealPacketText(deal, p, now);
    expect(text).toMatch(/^DEAL PACKET: 12 Test St/);
    expect(text).toMatch(/NEXT ACTION:/);
    expect(text).toMatch(/Need more evidence, because rent unproven/);
    expect(text).toMatch(/\$3,000 earnest money/);
  });

  it('shows only the numbers of the strategy the deal is saved with, never another calculator’s leftovers', () => {
    // A Fix and sell result left over from before the deal switched to Keep and rent, plus the current rental.
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000 }));
    localStorage.setItem('fsf.calc.rent.d1-offer.v1', JSON.stringify({ value: 300000, atPrice: 300000, monthlyRent: 2200 }));
    const rentDeal = { ...deal, plan: 'rent' as const };
    const text = packetSections(rentDeal, EMPTY_PACKET, now).map((x) => x.lines.join('\n')).join('\n');
    expect(text).toMatch(/Strategy: Keep and rent/);
    expect(text).toMatch(/Your offer \(your actual price\): \$300,000 → monthly cash flow/);
    expect(text).not.toMatch(/Walk-away price|\$250,000 resale/);
    const flip = packetSections({ ...deal, plan: 'flip' }, EMPTY_PACKET, now).map((x) => x.lines.join('\n')).join('\n');
    expect(flip).toMatch(/Strategy: Fix and sell/);
    expect(flip).toMatch(/Walk-away price: .*\$250,000 resale value/);
    expect(flip).not.toMatch(/Monthly cash flow/);
    expect(dealNumbers({ ...deal, plan: 'flip' })).toBeNull();
    expect(dealNumbers(rentDeal)?.price).toBe(300000);
  });

  it('shows a downside for Fix and sell and Commercial, and counts the numbers done only with one', () => {
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000 }));
    const flip = packetSections({ ...deal, plan: 'flip' }, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!;
    const flipText = flip.lines.join('\n');
    expect(flipText).toMatch(/If resale value 10% lower: (walk-away price \$[\d,]+|no price works)/);
    expect(flipText).toMatch(/If repairs 25% higher:/);
    expect(flipText).toMatch(/If takes 3 months longer:/);
    expect(flipText).toMatch(/If all three at once:/);
    expect(flip.status).toBe('done');
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 10000 }));
    const com = packetSections({ ...deal, plan: 'commercial' }, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!;
    expect(com.lines.join('\n')).toMatch(/If rent 10% lower: (highest price \$[\d,]+|no price works)/);
    expect(com.status).toBe('done');
    // Income too low for any price to meet the return: a result, not "No numbers yet".
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 500, repairs: 400000 }));
    const none = packetSections({ ...deal, plan: 'commercial' }, EMPTY_PACKET, now);
    const noneText = none.find((s) => s.key === 'numbers')!.lines.join('\n');
    expect(noneText).toMatch(/No price meets your 9% return on cost with the income and costs you entered/);
    expect(noneText).not.toMatch(/No numbers yet/);
    expect(none.find((s) => s.key === 'cash')!.lines.join('\n')).toMatch(/No price meets your 9% return on cost/);
  });
});
