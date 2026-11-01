import { beforeEach, expect, it } from 'vitest';
import { nextStamp, restoreDraftNumbers } from './analyze';

class MemStorage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
});

it('leaves another tab’s unsaved draft alone when the deleted deal had no numbers in that calculator', () => {
  localStorage.setItem('fsf.calc.rent.offer.v1', JSON.stringify({ monthlyRent: 1999 }));
  expect(restoreDraftNumbers('gone1', true)).toBe(false);
  expect(localStorage.getItem('fsf.calc.rent.offer.v1')).toContain('1999');
});

it('moves the deleted deal’s own numbers to the draft and removes its keys', () => {
  localStorage.setItem('fsf.calc.rent.gone2-offer.v1', JSON.stringify({ monthlyRent: 2345 }));
  expect(restoreDraftNumbers('gone2', true)).toBe(true);
  expect(localStorage.getItem('fsf.calc.rent.offer.v1')).toContain('2345');
  expect(localStorage.getItem('fsf.calc.rent.gone2-offer.v1')).toBeNull();
});

it('stamps an edit after the copy it changed, even when that copy is ahead of this clock', () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  expect(nextStamp(future) > future).toBe(true);
  const past = '2020-01-01T00:00:00.000Z';
  const s = nextStamp(past);
  expect(s > past).toBe(true);
  expect(Math.abs(Date.parse(s) - Date.now())).toBeLessThan(5_000);
  expect(nextStamp(s) > s).toBe(true);
  expect(nextStamp('not a date') > '2020').toBe(true);
});
