import { describe, expect, it } from 'vitest';
import { stateNote, QUESTIONS, rank, STRATEGIES, type Answers } from './decide';

const top = (a: Answers) => rank(a)[0].strategy.key;

describe('Decide', () => {
  it('points typical people to the strategy that fits', () => {
    expect(top({ goal: 'learn', cash: 'under10', borrow: 'unsure', time: 'weekly', hands: 'hire', risk: 'low', market: 'unsure' })).toBe('practice');
    expect(top({ goal: 'income', cash: '10to50', borrow: 'live', time: 'weekly', hands: 'diy', risk: 'medium', market: 'res' })).toBe('househack');
    expect(top({ goal: 'income', cash: '50to150', borrow: 'invest', time: 'weekly', hands: 'hire', risk: 'medium', market: 'res' })).toBe('rental');
    expect(top({ goal: 'handsoff', cash: '10to50', borrow: 'cash', time: 'monthly', hands: 'none', risk: 'low', market: 'unsure' })).toBe('passive');
    expect(top({ goal: 'income', cash: 'over150', borrow: 'invest', time: 'weekly', hands: 'hire', risk: 'medium', market: 'com' })).toBe('apartments');
    expect(['flip', 'auction']).toContain(top({ goal: 'quick', cash: 'over150', borrow: 'cash', time: 'parttime', hands: 'diy', risk: 'high', market: 'res' }));
  });

  it('never sends a low-risk, low-cash beginner to auctions or flips', () => {
    const r = rank({ goal: 'learn', cash: 'under10', borrow: 'unsure', time: 'monthly', hands: 'none', risk: 'low', market: 'res' }).slice(0, 3).map((m) => m.strategy.key);
    expect(r).not.toContain('auction');
    expect(r).not.toContain('flip');
  });

  it('has a weight for every option and unique checklist ids', () => {
    for (const s of STRATEGIES) {
      for (const q of QUESTIONS) {
        if (q.key === 'state') continue;
        for (const o of q.options) expect(s.weights[q.key]?.[o.value], `${s.key} ${q.key}=${o.value}`).toBeTypeOf('number');
      }
    }
    const ids = STRATEGIES.flatMap((s) => s.checklist.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reminds auction buyers to buy only from the official seller (CLAUDE.md)', () => {
    const a = STRATEGIES.find((s) => s.key === 'auction')!;
    expect(a.checklist.some((c) => /official seller/.test(c.text) && /Never contact homeowners/.test(c.text))).toBe(true);
  });
});

describe('Decide readiness and risk', () => {
  it('puts learning first for anyone without savings or with high-interest debt', () => {
    for (const ready of ['debt', 'nofund'])
      expect(top({ goal: 'quick', cash: '50to150', ready, borrow: 'cash', time: 'parttime', hands: 'diy', risk: 'high', market: 'res' })).toBe('practice');
  });

  it('shows the worst outcome, money at risk and time for every strategy', () => {
    for (const s of STRATEGIES) for (const v of Object.values(s.risk)) expect(v.length, s.key).toBeGreaterThan(3);
  });
});

describe('not yet: under $10,000', () => {
  it('ranks learning first when the cash can’t fund any purchase', () => {
    const r = rank({ goal: 'quick', cash: 'under10', ready: 'ready', borrow: 'cash', time: 'parttime', hands: 'diy', risk: 'high', market: 'res' } as never);
    expect(r[0].strategy.key).toBe('practice');
  });
});

it('marks the strategy that serves the reader’s goal, even when it ranks lower', () => {
  const r = rank({ goal: 'quick', cash: '50to150', ready: 'ready', borrow: 'invest', time: 'weekly', hands: 'hire', risk: 'medium', market: 'res' });
  expect(r.find((m) => m.strategy.key === 'flip')!.goalFit).toBe(true);
  expect(r.find((m) => m.strategy.key === 'rental')!.goalFit).toBe(false);
});

it('gives Clark County’s SID note only to Clark County (or no county) readers', () => {
  expect(stateNote('auction', 'NV', 'Clark')).toMatch(/Clark County/);
  expect(stateNote('auction', 'NV', null)).toMatch(/Clark County/);
  expect(stateNote('auction', 'NV', 'Washoe')).not.toMatch(/Clark/);
  expect(stateNote('passive', 'NV', 'Washoe')).toBeNull();
});
