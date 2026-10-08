import { describe, expect, it } from 'vitest';
import { backedUp, makeBackup, readBackup, restoreBackup } from './progressBackup';
import { readConfirmed, saveConfirmed } from './calcConfirmation';
import { cleanLog, logText } from './evidence';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('progress backup', () => {
  it('backs up learning progress but never sign-in or alert links', () => {
    const s = new MemStorage();
    s.setItem('deedowl.roadmap.v1', '["goal"]');
    s.setItem('fsf.dd.abc123.v1', '["title"]');
    s.setItem('fsf.alerts.manage.v1', '"secret-token"');
    s.setItem('fsf.pro-login', 'x');
    const b = makeBackup(s);
    expect(Object.keys(b.data).sort()).toEqual(['deedowl.roadmap.v1', 'fsf.dd.abc123.v1']);
    expect(backedUp('fsf.alerts.manage.v1')).toBe(false);
  });

  it('backs up the pre-foreclosure watchlist', () => {
    const s = new MemStorage();
    s.setItem('fsf.preforeclosure.watch.v1', '{"p1":"nod"}');
    expect(makeBackup(s).data['fsf.preforeclosure.watch.v1']).toBe('{"p1":"nod"}');
    expect(backedUp('fsf.preforeclosure.watch.v1')).toBe(true);
  });

  it('restores only known keys from a valid file, and rejects other files', () => {
    const file = JSON.stringify({ app: 'deedowl', version: 1, saved: 'x', data: { 'deedowl.roadmap.v1': '["goal"]', 'fsf.alerts.manage.v1': '"t"', 'evil.key': '1', 'deedowl.state.v1': 'NV', 'deedowl.buybox.v1': 'not json' } });
    const r = readBackup(file);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.data).sort()).toEqual(['deedowl.roadmap.v1', 'deedowl.state.v1']);
    const s = new MemStorage();
    expect(restoreBackup(r.data, s)).toBe(2);
    expect(readBackup('{"app":"other"}').ok).toBe(false);
    expect(readBackup('not json').ok).toBe(false);
  });
});

describe('evidence log', () => {
  it('cleans stored logs and prints every area with the decision', () => {
    const l = cleanLog({ rows: { title: { source: 'Title report', checked: 'bad-date', done: true } }, gate: 'nonsense' });
    expect(l.rows.title.checked).toBe('');
    expect(l.gate).toBe('');
    const t = logText('Test', { ...l, gate: 'investigate' });
    expect(t).toMatch(/\[x\] Title and liens/);
    expect(t).toMatch(/Decision: Investigate/);
    expect(t).toMatch(/does not clear title/);
  });
});

describe('restored data is cleaned before it reaches a page', () => {
  it('fixes malformed analyzed deals and buy boxes, and covers per-property calculator inputs', () => {
    const file = JSON.stringify({ app: 'deedowl', version: 1, saved: '2026-10-03T00:00:00Z', data: {
      'deedowl.analyze.v1': JSON.stringify([{ id: 'a', state: 'NV', name: {}, done: 'x' }, { id: 'b', state: 'ZZ' }]),
      'deedowl.buybox.v1': JSON.stringify({ types: [{}], priceMax: 'lots', notes: 5 }),
      'fsf.calc.rent.abc.v1': '{}',
    } });
    const r = readBackup(file);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const deals = JSON.parse(r.data['deedowl.analyze.v1']);
    expect(deals).toHaveLength(1);
    expect(deals[0].name).toBe('');
    expect(deals[0].done).toEqual([]);
    const box = JSON.parse(r.data['deedowl.buybox.v1']);
    expect(box.types).toEqual([]);
    expect(box.priceMax).toBe(0);
    expect(r.data['fsf.calc.rent.abc.v1']).toBe('{}');
    expect(r.saved).toBe('2026-10-03T00:00:00Z');
  });
});

describe('large items', () => {
  it('keeps an item of several hundred kilobytes', async () => {
    const { makeBackup } = await import('./progressBackup');
    const big = JSON.stringify([{ id: 'x', notes: 'n'.repeat(300_000) }]);
    const store = new Map<string, string>([['deedowl.analyze.v1', big]]);
    const storage = { get length() { return store.size; }, key: (i: number) => [...store.keys()][i] ?? null, getItem: (k: string) => store.get(k) ?? null } as unknown as Storage;
    expect(makeBackup(storage).data['deedowl.analyze.v1']).toBe(big);
  });
});

describe('calculator region settings and per-property steps', () => {
  it('keeps the region key with each calculator and cleans per-property steps', () => {
    expect(backedUp('fsf.calc.rent.d1-offer.v1.region')).toBe(true);
    expect(backedUp('fsf.calc.commercial.v1.region')).toBe(true);
    const text = JSON.stringify({ app: 'deedowl', version: 1, saved: '2026-10-04T00:00:00Z', data: { 'deedowl.roadmap.deals.v1': JSON.stringify({ 'analyzed:dX': { done: 5 } }) } });
    const r = readBackup(text);
    expect(r.ok && JSON.parse(r.data['deedowl.roadmap.deals.v1'])).toEqual({ 'analyzed:dX': { done: [], status: {} } });
  });
});


describe('calculator confirmations survive a backup', () => {
  it('keeps an intentional zero and an example-matching value confirmed on another device', () => {
    const source = new MemStorage();
    const key = 'fsf.calc.rent.d1-offer.v1';
    source.setItem(key, JSON.stringify({ repairs: 0, monthlyRent: 2000 }));
    saveConfirmed(key, new Set(['repairs', 'monthlyRent']), source);
    source.setItem('fsf.bid.analyzed-d1.v1.region', '2.55');
    source.setItem(`${key}.region`, '2.55|NV');
    const checked = readBackup(JSON.stringify(makeBackup(source)));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const destination = new MemStorage();
    restoreBackup(checked.data, destination);
    expect([...readConfirmed(key, destination)]).toEqual(['repairs', 'monthlyRent']);
    expect(destination.getItem('fsf.bid.analyzed-d1.v1.region')).toBe('2.55');
    expect(destination.getItem(`${key}.region`)).toBe('2.55|NV');
  });
  it('restoring old numbers removes confirmations from this device', () => {
    const s = new MemStorage();
    const key = 'fsf.calc.commercial.v1';
    saveConfirmed(key, new Set(['monthlyRent']), s);
    restoreBackup({ [key]: '{"monthlyRent":2000}' }, s);
    expect([...readConfirmed(key, s)]).toEqual([]);
  });
});

it('migrates existing flip confirmations to the new key without losing deliberate zeros', () => {
  const s = new MemStorage();
  const key = 'fsf.bid.analyzed-d1.v1';
  s.setItem('fsf.bid.analyzed-d1.typed.v1', '["repairs"]');
  expect([...readConfirmed(key, s)]).toEqual(['repairs']);
  saveConfirmed(key, new Set(['repairs', 'exitValue']), s);
  expect(s.getItem('fsf.bid.analyzed-d1.typed.v1')).toBeNull();
  expect([...readConfirmed(key, s)]).toEqual(['repairs', 'exitValue']);
});
