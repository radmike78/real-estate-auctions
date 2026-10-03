import { describe, expect, it } from 'vitest';
import { backedUp, makeBackup, readBackup, restoreBackup } from './progressBackup';
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
