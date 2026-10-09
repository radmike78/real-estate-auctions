import { beforeEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlanNext from './PlanNext';
import { FirstDealRoadmap } from './ToolkitPage';
import { saveDeals, type Deal } from '../lib/analyze';

beforeEach(() => {
  const values = new Map<string, string>();
  Object.assign(globalThis, {
    localStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) },
    window: { dispatchEvent: () => true },
    CustomEvent: class { constructor(public type: string) {} },
  });
});

const deal: Deal = { id: 'flow-check', name: 'Fictional flow test', state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent', notes: '', done: [], updatedAt: '2026-10-09T00:00:00Z' };

it('keeps a focused property’s next action in one recommendation', () => {
  saveDeals([deal]);
  const main = renderToStaticMarkup(<PlanNext variant="plan" />);
  const roadmap = renderToStaticMarkup(<FirstDealRoadmap />);
  expect(main).toContain('Next task');
  expect(roadmap).not.toContain('Next roadmap task');
  expect(roadmap).toContain('All tasks');
});

it('shows parallel contract work and the actual next milestone, including when it opens the roadmap', () => {
  saveDeals([{ ...deal, stage: 'contract' }]);
  const html = renderToStaticMarkup(<PlanNext variant="plan" />);
  expect(html).toContain('contract deadlines on its calendar');
  expect(html).toContain('Start these workstreams together');
  expect(html).toContain('Underwriting and appraisal');
  expect(html).toContain('Responsible people');
});
