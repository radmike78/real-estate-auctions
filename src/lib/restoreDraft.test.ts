import { beforeEach, expect, it } from 'vitest';
import { restoreDraftNumbers } from './analyze';

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
