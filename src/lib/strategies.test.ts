import { describe, expect, it } from 'vitest';
import { STRATEGIES } from './decide';
import { lessonByKey } from './lessons';
import { proGuideByKey } from './proGuide';
import { drillById } from '../practice/drills';
import { scenarioById } from '../practice/scenarios';
import { STRATEGY_GUIDES, strategyBySlug, strategyHref } from './strategies';

describe('strategy pages', () => {
  it('cover every Decide strategy except "learn first", with unique slugs', () => {
    expect(STRATEGY_GUIDES.map((g) => g.key).sort()).toEqual(STRATEGIES.map((s) => s.key).filter((k) => k !== 'practice').sort());
    expect(new Set(STRATEGY_GUIDES.map((g) => g.slug)).size).toBe(STRATEGY_GUIDES.length);
    for (const g of STRATEGY_GUIDES) expect(strategyBySlug(g.slug)).toBe(g);
    expect(strategyHref('practice')).toBe('#/decide');
  });

  it('link only to lessons, team guides, drills and practice runs that exist', () => {
    for (const g of STRATEGY_GUIDES) {
      for (const k of g.lessons) expect(lessonByKey(k), `${g.key}: lesson ${k}`).toBeTruthy();
      for (const k of g.team) expect(proGuideByKey(k), `${g.key}: pro ${k}`).toBeTruthy();
      for (const p of g.practice) {
        const drill = p.href.match(/^#\/practice\/drills\/([a-z0-9-]+)$/);
        const run = p.href.match(/^#\/practice\/([a-z]+-[a-z]+)$/);
        if (drill) expect(drillById(drill[1]), p.href).toBeTruthy();
        else if (run) expect(scenarioById(run[1]), p.href).toBeTruthy();
        else expect(['#/practice/case', '#/playbooks'], p.href).toContain(p.href);
      }
      expect(g.makesMoney.length, g.key).toBeGreaterThan(1);
      expect(g.watchFor.length, g.key).toBeGreaterThan(1);
    }
  });
});
