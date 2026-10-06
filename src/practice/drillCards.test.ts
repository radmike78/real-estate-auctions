import { describe, expect, it } from 'vitest';
import { DRILLS } from './drills';
import { drillCard, hasCard, withoutState } from './drillCards';

describe('drill cards', () => {
  it('every drill has its own sale type and property, not the placeholder', () => {
    const missing = DRILLS.filter((d) => !hasCard(d.id)).map((d) => d.id);
    expect(missing).toEqual([]);
  });

  it('shows a short question, a labelled dollar fact taken from the drill, and its missions', () => {
    for (const d of DRILLS) {
      const c = drillCard(d);
      expect(c.question.length).toBeGreaterThan(5);
      expect(c.question.charAt(0)).toBe(c.question.charAt(0).toUpperCase());
      expect(c.missions).toHaveLength(d.missions.length);
      if (c.fact) {
        expect(c.fact.value).toMatch(/^(about )?\$[\d,]+/);
        // The amount appears in the drill's own fact of that name: nothing is invented for the card.
        expect(d.facts.find((f) => f.label === c.fact!.label)?.value.toLowerCase()).toContain(c.fact.value.toLowerCase());
      }
    }
  });

  it('labels an HOA sale and its opening bid', () => {
    const c = drillCard(DRILLS.find((d) => d.id === 'hoa-sale-nv')!);
    expect(c.sale).toBe('HOA sale');
    expect(c.question).toBe('Does the mortgage survive?');
    expect(c.fact).toEqual({ label: 'Opening bid', value: '$9,000' });
  });

  it('gives the key value when a drill has no bid or price, keeping "about"', () => {
    expect(drillCard(DRILLS.find((d) => d.id === 'trustee-sale-tx')!).fact).toEqual({ label: 'Value as-is', value: 'about $300,000' });
  });

  it('never repeats one big label across a commercial, land or manufactured row', () => {
    for (const group of ['commercial', 'land', 'manufactured'] as const) {
      const sales = DRILLS.filter((d) => drillCard(d).group === group).map((d) => drillCard(d).sale);
      expect(new Set(sales).size, group).toBe(sales.length);
    }
  });

  it('drops the chosen state from drill text, fixing the article', () => {
    expect(withoutState('A Texas sheriff is selling a rental house.', 'TX')).toBe('A sheriff is selling a rental house.');
    expect(withoutState('A Texas HOA is selling a house.', 'TX')).toBe('An HOA is selling a house.');
    expect(withoutState('You win a house at a first-Tuesday courthouse auction in Texas for $210,000.', 'TX')).toBe('You win a house at a first-Tuesday courthouse auction for $210,000.');
    expect(withoutState('A fictional house in fictional Bluebonnet County, Texas.', 'TX')).toBe('A fictional house in fictional Bluebonnet County.');
    expect(withoutState('An Arizona trustee’s sale: are you ready?', 'AZ')).toBe('A trustee’s sale: are you ready?');
    expect(withoutState('A Texas trustee’s sale', 'NV')).toBe('A Texas trustee’s sale');
    expect(withoutState('A Texas trustee’s sale', null)).toBe('A Texas trustee’s sale');
  });
});

describe('drill answers', () => {
  it('every single-choice mission has exactly one right answer, so the feedback can name it', () => {
    for (const d of DRILLS) for (const m of d.missions) if (m.kind === 'pick') {
      const good = m.options.filter((o) => o.good).length;
      expect(good, `${d.id}/${m.id}`).toBeGreaterThan(0);
      if (!m.multi) expect(good, `${d.id}/${m.id}`).toBe(1);
    }
  });
});
