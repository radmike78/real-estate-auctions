import { beforeEach, describe, expect, it } from 'vitest';
import { carryDraftNumbers, clearDraftNumbers, forgetDeal } from './analyze';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  keys() { return [...this.m.keys()]; }
}
let store: MemStorage;
beforeEach(() => {
  store = new MemStorage();
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = store;
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
});

// The Fix and sell draft, with the fields typed (a confirmed $0 repairs) and the region whose transfer tax it carries.
const draft = () => {
  localStorage.setItem('fsf.bid.analyze-draft.v1', JSON.stringify({ exitValue: 400000, repairs: 0 }));
  localStorage.setItem('fsf.bid.analyze-draft.v1.typed.v1', JSON.stringify(['exitValue', 'repairs']));
  localStorage.setItem('fsf.bid.analyze-draft.v1.region', '2.55');
};

describe('calculator numbers follow a deal', () => {
  it('saving moves the numbers, the typed list and the region stamp to the deal', () => {
    draft();
    carryDraftNumbers('d1', true);
    expect(localStorage.getItem('fsf.bid.analyzed-d1.v1')).toContain('400000');
    expect(JSON.parse(localStorage.getItem('fsf.bid.analyzed-d1.v1.typed.v1') ?? '[]')).toEqual(['exitValue', 'repairs']);
    expect(localStorage.getItem('fsf.bid.analyzed-d1.v1.region')).toBe('2.55');
    // The next new deal starts clean: nothing of the draft is left, typed list included.
    expect(store.keys().filter((k) => k.startsWith('fsf.bid.analyze-draft'))).toEqual([]);
  });
  it('clearing the draft forgets what was typed in it', () => {
    draft();
    clearDraftNumbers();
    expect(store.keys().filter((k) => k.startsWith('fsf.bid.analyze-draft'))).toEqual([]);
  });
  it('forgetting a deal removes its typed list and region stamp too', () => {
    draft();
    carryDraftNumbers('d1', true);
    forgetDeal('d1');
    expect(store.keys().filter((k) => k.includes('analyzed-d1'))).toEqual([]);
  });
});
