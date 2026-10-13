import { describe, expect, it } from 'vitest';
import type { Progress } from './journey';

describe('continue where you left off', () => {
  it('skips activities already finished', async () => {
    const { unfinished } = await import('./journey');
    const p: Progress = { read: ['markets'], drillsDone: ['rental-265'], decided: false, roadmapDone: 0 };
    expect(unfinished({ href: '#/learn/markets', label: 'x' }, p)).toBeNull();
    expect(unfinished({ href: '#/practice/drills/rental-265', label: 'x' }, p)).toBeNull();
    expect(unfinished({ href: '#/learn/analyze', label: 'x' }, p)?.href).toBe('#/learn/analyze');
    expect(unfinished({ href: '#/analyze', label: 'x' }, p)?.href).toBe('#/analyze');
  });
});
