import { beforeEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DealJourneyPage from './DealJourneyPage';
import { CHAPTERS, JOURNEY_KEY, answerTask, emptyJourney, saveJourney } from '../practice/dealJourney';
import { planNow } from '../lib/planNext';
import { DECIDE_KEY, QUESTIONS } from '../lib/decide';
import { markLessonRead } from '../lib/journey';
import { saveDeals, type Deal } from '../lib/analyze';

beforeEach(() => {
  const values = new Map<string, string>();
  Object.assign(globalThis, { localStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) }, window: { dispatchEvent: () => true }, CustomEvent: class { constructor(public type: string) {} } });
});
it('introduces one primary exercise without exposing every decision or term at once', () => {
  const html = renderToStaticMarkup(<DealJourneyPage />);
  expect(html).toContain('Try the first decision');
  expect(html).toContain('check current local'); // location check is present in the rendered start notice
  expect(html).not.toContain('checked=""');
});
it('renders each chapter with a local check and accessible answer controls', () => {
  for (const c of CHAPTERS) {
    const html = renderToStaticMarkup(<DealJourneyPage chapterKey={c.id} />);
    expect(html, c.id).toContain('For a real property:');
    expect(html, c.id).toContain('deal-question');
  }
});
it('keeps real property tasks ahead of the learning journey and uses one beginner recommendation', () => {
  localStorage.setItem('deedowl.mode.v1', JSON.stringify('guided'));
  // The site's order: Decide, then Learn's two "Start here" lessons, then the practice deal.
  expect(planNow().task.href).toBe('#/decide');
  localStorage.setItem(DECIDE_KEY, JSON.stringify({ answers: Object.fromEntries(QUESTIONS.map((q) => [q.key, q.options[0].value])), done: [] }));
  expect(planNow().task.href).toBe('#/learn/types');
  markLessonRead('types');
  expect(planNow().task.href).toBe('#/learn/red-flags');
  markLessonRead('red-flags');
  expect(planNow().task.href).toBe('#/practice/deal/first-decision');
  const c = CHAPTERS[0];
  saveJourney(answerTask(emptyJourney(), c, c.tasks[0], 1));
  expect(planNow().task.href).toBe('#/practice/deal/boundaries');
  const d: Deal = { id: 'journey-real', name: 'Real task priority', state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent', notes: '', done: [], stage: 'contract', updatedAt: '2026-10-09T00:00:00Z' };
  saveDeals([d]);
  expect(planNow().source).toBe('deal');
  expect(planNow().task.key).not.toBe('practice-deal');
  expect(localStorage.getItem(JOURNEY_KEY)).toBeTruthy();
});
it('shows incomplete workbook output and handles an unknown chapter explicitly', () => {
  const html = renderToStaticMarkup(<DealJourneyPage chapterKey="workbook" />);
  expect(html).toContain('Not answered');
  expect(html).toContain('Download workbook');
  expect(renderToStaticMarkup(<DealJourneyPage chapterKey="unknown" />)).toContain('That chapter isn’t');
});
it('shows the cash gap even when the lab meets the monthly target', () => {
  const nc = CHAPTERS.find((c) => c.id === 'numbers')!;
  saveJourney({ ...answerTask(emptyJourney(), nc, nc.tasks.find((t) => t.kind === 'number')!, -21.93), lab: { price: 350000, rent: 3000, vacancy: 5, rate: 7 } });
  const html = renderToStaticMarkup(<DealJourneyPage chapterKey="numbers" />);
  expect(html).toContain('$163.58');
  expect(html).toContain('$122,500.00');
  expect(html).toContain('$12,500.00');
  expect(html).toContain('over budget');
  expect(html).toContain('Not counting costs while you repair and find a tenant');
});
it('keeps the numbers chapter answer hidden until the question is answered', () => {
  saveJourney({ ...emptyJourney(), lab: { price: 300000, rent: 2500, vacancy: 5, rate: 7 } });
  const html = renderToStaticMarkup(<DealJourneyPage chapterKey="numbers" />);
  expect(html).not.toContain('21.93');
  expect(html).toContain('Answer this chapter’s question first');
});
