import { beforeEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DealJourneyPage from './DealJourneyPage';
import { CHAPTERS, JOURNEY_KEY, answerTask, emptyJourney, saveJourney } from '../practice/dealJourney';
import { planNow } from '../lib/planNext';
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
  saveJourney({ ...emptyJourney(), lab: { price: 350000, rent: 3000, vacancy: 5, rate: 7 } });
  const html = renderToStaticMarkup(<DealJourneyPage chapterKey="numbers" />);
  expect(html).toContain('$163.58');
  expect(html).toContain('$122,500.00');
  expect(html).toContain('$12,500.00');
  expect(html).toContain('over budget');
  expect(html).toContain('Before repair/lease-up holding costs');
});
