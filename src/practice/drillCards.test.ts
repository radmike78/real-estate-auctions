import { describe, expect, it } from 'vitest';
import { DRILLS } from './drills';
import { drillCard, hasCard } from './drillCards';

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
        expect(c.fact.value).toMatch(/^\$[\d,]+/);
        // The amount appears in the drill's own fact of that name: nothing is invented for the card.
        expect(d.facts.find((f) => f.label === c.fact!.label)?.value).toContain(c.fact.value);
      }
    }
  });

  it('labels an HOA sale and its opening bid', () => {
    const c = drillCard(DRILLS.find((d) => d.id === 'hoa-sale-nv')!);
    expect(c.sale).toBe('HOA sale');
    expect(c.question).toBe('Does the mortgage survive?');
    expect(c.fact).toEqual({ label: 'Opening bid', value: '$9,000' });
  });
});
