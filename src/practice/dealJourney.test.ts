import { describe, expect, it } from 'vitest';
import { accepts, answerTask, calculateDeal, CHAPTERS, cleanJourney, DEFAULT_LAB, emptyJourney, journeyHref, JOURNEY_KEY, originalDecision, payment, resumeChapter, SOURCES, SPECIALTIES, taskKey, workbookText } from './dealJourney';
import { backedUp, readBackup } from '../lib/progressBackup';
import { lessonByKey } from '../lib/lessons';
import { topicBySlug } from '../lib/deep/propertyTopics';
import { strategyBySlug } from '../lib/strategies';

describe('fictional deal calculations', () => {
  it('matches independently amortized payment fixtures, including zero interest', () => {
    // These cents were independently calculated with a Python monthly amortization formula.
    for (const [principal, expected] of [[225000, 1496.93], [213750, 1422.08], [202500, 1347.24], [195000, 1297.34]]) expect(payment(principal)).toBeCloseTo(expected, 2);
    expect(payment(225000, 6.5)).toBeCloseTo(1422.15, 2);
    expect(payment(12000, 0, 12)).toBe(1000);
    expect(() => payment(100, 7, 0)).toThrow();
    expect(() => payment(-1)).toThrow();
    expect(() => payment(100, Infinity)).toThrow();
  });
  it('counts tax and insurance once, keeps capital separate, and detects a negative base case', () => {
    const result = calculateDeal(DEFAULT_LAB);
    expect(result.income).toBe(2375);
    expect(result.operating).toBe(775);
    expect(result.noi).toBe(1600);
    expect(result.cash).toBeCloseTo(-21.93, 2);
    expect(result.initialCash).toBe(110000);
  });
  it('retains downside risk after a lower price reaches the base-case target', () => {
    const goodBase = calculateDeal({ ...DEFAULT_LAB, price: 260000 });
    expect(goodBase.cash).toBeCloseTo(177.66, 2);
    const stress = calculateDeal({ ...DEFAULT_LAB, rent: 2400, vacancy: 10 });
    expect(stress.noi).toBe(1393);
    expect(stress.cash).toBeCloseTo(-228.93, 2);
    expect(calculateDeal({ ...DEFAULT_LAB, price: 260000, rent: 2400, vacancy: 10 }).cash).toBeCloseTo(-29.34, 2);
    expect(() => calculateDeal({ ...DEFAULT_LAB, rent: NaN })).toThrow();
    expect(() => calculateDeal({ ...DEFAULT_LAB, vacancy: 101 })).toThrow();
  });
  it('separates a positive monthly result from sufficient investment cash', () => {
    const result = calculateDeal({ ...DEFAULT_LAB, price: 350000, rent: 3000 });
    expect(result.cash).toBeCloseTo(163.58, 2);
    expect(result.initialCash).toBe(122500);
    expect(result.initialCash - 110000).toBe(12500);
  });
  it('reconciles the deposit, revised repair allocation, actual month and flip stress', () => {
    const expected = (id: string, task: string) => CHAPTERS.find((c) => c.id === id)!.tasks.find((t) => t.id === task)!.expected;
    expect(expected('evidence', 'revised-budget')).toBe(260000 * .25 + 8000 + 22000 + 15000);
    expect(expected('closing', 'funds')).toBe(65000 + 8000 - 5000);
    expect(expected('ownership', 'actual')).toBeCloseTo(2300 - 759 - payment(195000) - 125, 2);
    expect(300000 - (200000 + 40000 + 6000 + 12000 + 18000)).toBe(24000);
    expect(270000 - (200000 + 40000 + 6000 + 12000 + 18000 + 10000)).toBe(-16000);
  });
});

describe('saved learning decisions', () => {
  it('opening a chapter or restoring claimed completion does not count as practice', () => {
    expect(resumeChapter(emptyJourney())).toBe('first-decision');
    expect(cleanJourney({ completed: CHAPTERS.map((c) => c.id) }).completed).toEqual([]);
    const c = CHAPTERS[0];
    expect(answerTask(emptyJourney(), c, c.tasks[0], 0).completed).toEqual([]);
    expect(answerTask(emptyJourney(), c, c.tasks[0], 1).completed).toEqual(['first-decision']);
  });
  it('preserves passing as a successful original decision through the alternate purchase', () => {
    const c = CHAPTERS.find((x) => x.id === 'numbers')!;
    let p = answerTask(emptyJourney(), c, c.tasks[0], -21.93);
    p = answerTask(p, c, c.tasks[1], 0);
    expect(p.completed).toContain('numbers');
    const close = CHAPTERS.find((x) => x.id === 'closing')!;
    p = answerTask(p, close, close.tasks[0], 68000);
    expect(originalDecision(p)).toBe('pass');
    expect(workbookText(p)).toContain('Original asking-price decision: pass');
    expect(workbookText(p)).toContain('Not answered');
  });
  it('revising to an incorrect answer removes chapter completion, and all chapters remain revisitable', () => {
    const c = CHAPTERS[0];
    let p = answerTask(emptyJourney(), c, c.tasks[0], 1);
    p = answerTask(p, c, c.tasks[0], 0);
    expect(p.completed).not.toContain(c.id);
    expect(resumeChapter(p)).toBe(c.id);
    expect(journeyHref('closing')).toBe('#/practice/deal/closing');
  });
  it('supports every task type, sensible rounding, and rejects incomplete checklists or blank reflection', () => {
    for (const c of CHAPTERS) for (const t of c.tasks) {
      const a = t.kind === 'choice' ? t.options!.findIndex((x) => x.accepted) : t.kind === 'number' ? t.expected! : t.kind === 'check' ? t.checks! : 'I would pass because cash is negative. I would ask a local professional to verify the rental rules.';
      expect(accepts(t, a), `${c.id}/${t.id}`).toBe(true);
      expect(accepts(t, undefined)).toBe(false);
    }
    const c = CHAPTERS.find((x) => x.id === 'offer')!;
    expect(accepts(c.tasks[1], [c.tasks[1].checks![0]])).toBe(false);
    expect(accepts(CHAPTERS[CHAPTERS.length - 1].tasks[0], ' ')).toBe(false);
    const n = CHAPTERS.find((x) => x.id === 'numbers')!.tasks[0];
    expect(accepts(n, -21.94)).toBe(true);
    expect(accepts(n, 21.93)).toBe(false);
  });
  it('can complete the whole practice without purchasing a real property', () => {
    let p = emptyJourney();
    for (const c of CHAPTERS) for (const t of c.tasks) p = answerTask(p, c, t, t.kind === 'choice' ? t.options!.findIndex((x) => x.accepted) : t.kind === 'number' ? t.expected! : t.kind === 'check' ? t.checks! : 'I would revise the deal after checking the cash shortfall and confirming local rental rules with an attorney.');
    expect(p.completed).toHaveLength(CHAPTERS.length);
    expect(resumeChapter(p)).toBe('workbook');
    expect(workbookText(p)).toContain('Not a real property plan');
  });
  it('keeps lab experiments separate from accepted teaching answers', () => {
    const c = CHAPTERS.find((x) => x.id === 'numbers')!;
    let p = answerTask(emptyJourney(), c, c.tasks[0], -21.93);
    p = cleanJourney({ ...p, lab: { ...DEFAULT_LAB, price: 260000 } });
    expect(p.answers[taskKey(c, c.tasks[0])]).toBe(-21.93);
    expect(workbookText(p)).toContain('separate from teaching-case answers');
  });
  it('cleans corrupt restored values and participates in the existing progress backup', () => {
    const c = cleanJourney({ answers: { 'unknown/key': 'x', 'numbers/base-cash': Infinity }, lab: { price: 'bad' }, specialty: 'missing', specialtyDone: ['missing'] });
    expect(c).toEqual(emptyJourney());
    expect(backedUp(JOURNEY_KEY)).toBe(true);
    const restored = readBackup(JSON.stringify({ app: 'deedowl', version: 1, data: { [JOURNEY_KEY]: JSON.stringify({ completed: ['closing'] }) } }));
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(JSON.parse(restored.data[JOURNEY_KEY]).completed).toEqual([]);
  });
});

describe('content integrity', () => {
  it('has real lesson and specialty destinations and known official source references', () => {
    for (const c of CHAPTERS) { expect(lessonByKey(c.lesson)).toBeTruthy(); for (const id of c.sources) expect(SOURCES.some((s) => s.id === id)).toBe(true); }
    for (const s of SPECIALTIES) {
      const type = s.href.match(/^#\/learn\/types\/(.+)$/);
      const strategy = s.href.match(/^#\/learn\/strategies\/(.+)$/);
      if (type) expect(topicBySlug(type[1]), s.title).toBeTruthy();
      else if (strategy) expect(strategyBySlug(strategy[1]), s.title).toBeTruthy();
      else if (s.href.startsWith('#/learn/')) expect(lessonByKey(s.href.slice(8)), s.title).toBeTruthy();
    }
  });
});

it('requires the new budget reasoning and does not credit the old arithmetic alone', () => {
  const c = CHAPTERS.find((x) => x.id === 'boundaries')!;
  let p = answerTask(emptyJourney(), c, c.tasks[0], 110000);
  expect(p.completed).not.toContain('boundaries');
  p = answerTask(p, c, c.tasks[1], 'I would increase reserves by reducing the repair allocation only after a contractor confirms the scope. Otherwise I would revise the price or pass.');
  expect(p.completed).toContain('boundaries');
  expect(workbookText(p)).toContain('increase reserves');
});
it('grades the fresh-case multi-answer question exactly, including unsupported shortcuts', () => {
  const c = CHAPTERS.find((x) => x.id === 'new-property')!;
  const t = c.tasks.find((x) => x.id === 'new-evidence')!;
  expect(accepts(t, t.checks)).toBe(true);
  expect(accepts(t, [...t.checks!, t.distractors![0]])).toBe(false);
  expect(accepts(t, t.checks!.slice(1))).toBe(false);
  expect(accepts(t, [...t.checks!, t.checks![0]])).toBe(false);
  expect(accepts(t, [...t.checks!.slice(1), t.distractors![0]])).toBe(false);
  const math = c.tasks[0];
  expect(2500 * .95 - 1000 - 150).toBe(1225);
  expect(accepts(math, 1225)).toBe(true);
  expect(accepts(math, 1375)).toBe(false); // NOI before the replacement reserve is not cash flow.
  expect(accepts(c.tasks[2], 1)).toBe(true);
  expect(accepts(c.tasks[2], 2)).toBe(true); // Both investigate and a reasoned pass are valid.
  expect(accepts(c.tasks[2], 0)).toBe(false);
});
