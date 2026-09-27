import dataIndex from '../data/index.ts?raw';
import dataLive from '../data/live.ts?raw';
import searchLib from '../lib/search.ts?raw';
import tracker from '../../server/tracker.ts?raw';
import { describe, expect, it } from 'vitest';
import { maxSafeBid } from '../lib/bidCalc';
import { CHECKLISTS, forCommercial } from '../lib/buyerChecklists';
import { playbookByKey } from '../lib/playbooks';
import { PRACTICE_PROPERTIES, incomeValue } from './properties';
import { allScenarios, buildScenario, FLOWS, HOME_ONLY_FACTS, SALE_ORDER, scenarioById, stepsFor } from './scenarios';
import type { Scenario, Task } from './types';

const ALL = allScenarios();
const tasks = (s: Scenario) => s.stages.flatMap((st) => st.tasks);
/** Every piece of text a learner can see in a scenario. */
function text(s: Scenario): string {
  const parts: string[] = [s.youGet, s.property.watchOut ?? '', ...s.sale_facts.map((f) => `${f.label} ${f.value}`)];
  for (const st of s.stages) {
    parts.push(st.title, st.summary);
    for (const t of st.tasks) parts.push(JSON.stringify(t));
  }
  return parts.join('\n');
}

describe('practice properties', () => {
  it('are obviously fictional: made-up street names and parcel book 999', () => {
    for (const p of PRACTICE_PROPERTIES) {
      expect(p.address, p.id).toMatch(/Practice|Example|Sample/);
      expect(p.apn, p.id).toMatch(/^999-\d{2}-\d{3}-\d{3}$/);
    }
  });

  it('cover every residential and commercial type, with values that follow from the income approach', () => {
    expect(PRACTICE_PROPERTIES.filter((p) => p.cls === 'residential').map((p) => p.type)).toEqual(['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Vacant Land']);
    expect(PRACTICE_PROPERTIES.filter((p) => p.cls === 'commercial').map((p) => p.type)).toEqual(['Apartments (5+ units)', 'Retail', 'Office', 'Industrial', 'Hotel / Motel', 'Commercial Land']);
    for (const p of PRACTICE_PROPERTIES) {
      if (p.income) expect(p.value, p.id).toBe(incomeValue(p.income).value);
      if (!p.hasBuilding) expect(p.repairs, p.id).toBe(0);
    }
  });
});

describe('practice scenarios', () => {
  it('exist for every sale type and property, except combinations that don’t happen or aren’t covered', () => {
    expect(ALL).toHaveLength(73);
    const count = (sale: string) => ALL.filter((s) => s.sale === sale).length;
    for (const sale of ['tax', 'sid', 'foreclosure', 'sheriff', 'irs', 'reo']) expect(count(sale), sale).toBe(11);
    expect(ALL.filter((s) => s.sale === 'hoa').map((s) => s.property.id)).toEqual(['house', 'condo', 'townhouse']);
    expect(ALL.filter((s) => s.sale === 'short').map((s) => s.property.id)).toEqual(['house', 'condo', 'townhouse', 'fourplex']);
    // Every excluded combination explains why.
    for (const sale of SALE_ORDER) {
      for (const p of PRACTICE_PROPERTIES) {
        if (!buildScenario(sale, p)) expect(FLOWS[sale].available(p)?.length ?? 0, `${sale}-${p.id}`).toBeGreaterThan(40);
      }
    }
    expect(scenarioById('tax-house')?.id).toBe('tax-house');
    expect(scenarioById('hoa-retail')).toBeNull();
    expect(scenarioById('nope-house')).toBeNull();
  });

  it('show the playbook’s own facts, so the practice and the guide never disagree', () => {
    for (const s of ALL) {
      const pb = playbookByKey(s.playbookKey)!;
      expect(s.sale_facts, s.id).toEqual(s.property.cls === 'commercial' ? pb.glance.filter((f) => !HOME_ONLY_FACTS.has(f.label)) : pb.glance);
      expect(s.youGet, s.id).toBe(pb.youGet);
      const steps = tasks(s).find((t) => t.id === 'official-steps') as Extract<Task, { kind: 'checklist' }>;
      expect(steps.items.map((i) => i.text), s.id).toEqual(stepsFor(pb.key, pb.steps, s.property.cls === 'commercial').map((x) => x.title));
      if (s.property.cls === 'residential') expect(steps.items.map((i) => i.detail), s.id).toEqual(pb.steps.map((x) => x.detail));
    }
  });

  it('use the reviewed buyer checklist, with commercial wording for commercial property', () => {
    for (const s of ALL) {
      const list = tasks(s).find((t) => t.id === 'buyer-checklist') as Extract<Task, { kind: 'checklist' }>;
      const base = CHECKLISTS[FLOWS[s.sale].checklist];
      expect(list.items, s.id).toEqual((s.property.cls === 'commercial' ? forCommercial(base) : base).items);
    }
  });

  it('have exactly one right answer in every decision, and unique task ids in every step', () => {
    for (const s of ALL) {
      for (const st of s.stages) {
        const ids = st.tasks.map((t) => t.id);
        expect(new Set(ids).size, `${s.id}/${st.key}`).toBe(ids.length);
        for (const t of st.tasks) if (t.kind === 'decision') expect(t.choices.filter((c) => c.correct), `${s.id}/${t.id}`).toHaveLength(1);
      }
    }
  });

  it('only simulate fictional people, and label every reply as simulated', () => {
    for (const s of ALL) {
      for (const t of tasks(s)) {
        if (t.kind !== 'contact') continue;
        expect(t.person, `${s.id}/${t.id}`).toMatch(/\(fictional\)/);
        for (const m of t.messages) expect(m.reply, `${s.id}/${t.id}`).toMatch(/\(Simulated reply\.\)$/);
      }
    }
  });

  it('never apply home-only rules to commercial property', () => {
    for (const s of ALL.filter((x) => x.property.cls === 'commercial')) {
      const t = text(s);
      expect(t, s.id).not.toMatch(/HUD-registered broker|“First Look”|foreclosure mediation|[Hh]omeowner’s insurance/);
      // The federal 90-day tenant notice protects residential tenants: apartments yes, stores and offices no.
      if (s.property.id !== 'apartments') expect(t, s.id).not.toMatch(/Protecting Tenants at Foreclosure Act/);
    }
  });

  it('teach the right redemption period for SID certificates: 2 years with a building, 120 days without', () => {
    for (const s of ALL.filter((x) => x.sale === 'sid')) {
      const q = tasks(s).find((t) => t.id === 'redemption-period') as Extract<Task, { kind: 'decision' }>;
      const right = q.choices.find((c) => c.correct)!.label;
      expect(right, s.id).toMatch(s.property.hasBuilding ? /^2 years/ : /^120 days/);
      expect(text(s), s.id).not.toMatch(/window\.|repairs?, with a/); // no max-bid worksheet for a certificate
    }
  });

  it('never mention a building on vacant land', () => {
    for (const s of ALL.filter((x) => !x.property.hasBuilding)) {
      expect(text(s), s.id).not.toMatch(/next to the building|the building’s|inside access|walk-through/i);
    }
  });

  it('run the numbers with the real calculator, and keep every practice price within the buyer’s maximum', () => {
    for (const s of ALL) {
      const n = tasks(s).find((t) => t.kind === 'numbers') as Extract<Task, { kind: 'numbers' }> | undefined;
      if (s.sale === 'sid') {
        expect(n).toBeUndefined();
        continue;
      }
      expect(n, s.id).toBeDefined();
      const max = maxSafeBid(n!.inputs).maxBid;
      const all = text(s);
      if (s.sale === 'hoa') {
        // The recorded lender payment means the first mortgage survives: these are walk-away lessons.
        expect(max, s.id).toBeLessThan(n!.compareTo.amount);
        expect(all, s.id).toMatch(/Walk away/);
      } else if (s.sale === 'reo' || s.sale === 'short') {
        expect(n!.inputs.financedPct, s.id).toBeGreaterThan(0);
      } else {
        expect(n!.inputs.financedPct, `${s.id}: auctions need cash`).toBe(0);
        expect(max, s.id).toBeGreaterThan(n!.compareTo.amount);
      }
      // Any "you win at $X" or "you offer $X" price is at or below the maximum.
      for (const m of all.matchAll(/(?:win at|you offer|You offer) \$([\d,]+)/g)) {
        expect(Number(m[1].replace(/,/g, '')), `${s.id}: ${m[0]}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it('holds buyers for the whole redemption period in the numbers', () => {
    const months = (id: string) => (tasks(scenarioById(id)!).find((t) => t.kind === 'numbers') as Extract<Task, { kind: 'numbers' }>).inputs.holdingMonths;
    expect(months('sheriff-house')).toBeGreaterThan(12); // 1-year redemption
    expect(months('irs-house')).toBeGreaterThanOrEqual(6); // 180 days
    expect(months('hoa-condo')).toBeGreaterThanOrEqual(2); // 60 days
  });
});

describe('practice stays separate from real listings', () => {
  it('is never mixed into search, live listings or alerts', () => {
    for (const [f, src] of Object.entries({ dataIndex, dataLive, searchLib, tracker })) {
      expect(src.length, f).toBeGreaterThan(100);
      expect(src, f).not.toMatch(/practice/);
    }
  });
});
