import { beforeEach, describe, expect, it } from 'vitest';
import type { Deal } from './analyze';
import { cleanPacket, dealPacketText, EMPTY_PACKET, loadPacket, nextAction, nextDate, packetSections, savePacket, suggestedDates } from './dealPacket';
import { saveLog, cleanLog } from './evidence';

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
});
