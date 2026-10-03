import { describe, expect, it } from 'vitest';
import { GUIDED, guidedNext, type Progress } from './journey';
import { drillById } from '../practice/drills';
import { lessonByKey } from './lessons';

const none: Progress = { read: [], drillsDone: [], decided: false, roadmapDone: 0 };

describe('guided starter path', () => {
  it('starts with the introduction and moves on only when real work is done', () => {
    expect(guidedNext(none)?.step.key).toBe('intro');
    expect(guidedNext({ ...none, read: ['markets'] })?.step.key).toBe('example');
    expect(guidedNext({ ...none, read: ['markets', 'analyze'] })?.step.key).toBe('exercise');
    expect(guidedNext({ ...none, read: ['markets', 'analyze'], drillsDone: ['rental-265'] })?.n).toBe(4);
    expect(guidedNext({ read: ['markets', 'analyze'], drillsDone: ['rental-265'], decided: true, roadmapDone: 0 })?.step.key).toBe('plan');
    expect(guidedNext({ read: ['markets', 'analyze'], drillsDone: ['rental-265'], decided: true, roadmapDone: 1 })).toBeNull();
  });

  it('points only at pages that exist', () => {
    for (const s of GUIDED) {
      const lesson = s.href.match(/^#\/learn\/([a-z-]+)$/);
      if (lesson) expect(lessonByKey(lesson[1]), s.href).toBeTruthy();
      const drill = s.href.match(/^#\/practice\/drills\/([a-z0-9-]+)$/);
      if (drill) expect(drillById(drill[1]), s.href).toBeTruthy();
    }
  });
});

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
