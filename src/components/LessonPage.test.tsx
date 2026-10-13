import { parse } from 'node-html-parser';
import { beforeEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LessonPage from './LessonPage';
import { CashWorksheet } from './ToolkitPage';

beforeEach(() => {
  const values = new Map<string, string>([['deedowl.state.v1', 'CA']]);
  Object.assign(globalThis, {
    localStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) },
    window: { dispatchEvent: () => true },
    CustomEvent: class { constructor(public type: string) {} },
  });
});

it('opens the requested tax section for the property state without replacing the saved state', () => {
  const root = parse(renderToStaticMarkup(<LessonPage lessonKey="analyze" section="your-tax-bill-after-you-buy" state="NV" />));
  const tax = root.querySelector('#your-tax-bill-after-you-buy');
  expect(tax?.hasAttribute('open')).toBe(true);
  // A linked section opens alone, so the reader lands on it; the rest can be opened.
  expect(root.querySelectorAll('.lesson-topic[open]')).toHaveLength(1);
  expect(tax?.text).toContain('NRS 361.4722');
  expect(tax?.text).not.toContain('Proposition 13');
  expect(root.querySelector('.state-picker button[aria-pressed="true"]')?.text).toBe('Nevada');
  expect(localStorage.getItem('deedowl.state.v1')).toBe('CA');
});

it('keeps the normal lesson default when the section is missing or unknown', () => {
  for (const section of [undefined, 'missing-section']) {
    const root = parse(renderToStaticMarkup(<LessonPage lessonKey="analyze" section={section} />));
    // Every section is open and searchable; none closes when another opens.
    expect(root.querySelectorAll('.lesson-topic[open]')).toHaveLength(root.querySelectorAll('.lesson-topic').length);
    expect(root.querySelector('.lesson-topic[name]')).toBeNull();
    expect(root.querySelector('.state-picker button[aria-pressed="true"]')?.text).toBe('California');
  }
});

it('shows the cash-budget limitation without opening planning estimates', () => {
  localStorage.setItem('deedowl.cash.v1', JSON.stringify({ savings: 100000, spending: 3000, months: 6, promised: 10000, debt: 5000 }));
  const root = parse(renderToStaticMarkup(<CashWorksheet />));
  const note = root.querySelector('[role="note"]');
  expect(note?.text).toContain('not loan approval');
  expect(note?.closest('details')).toBeNull();
});
