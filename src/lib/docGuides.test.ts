import { describe, expect, it } from 'vitest';
import { DOC_GUIDES, docGuide } from './docGuides';
import { ROADMAP } from './roadmap';
import { EVIDENCE_AREAS } from './evidence';
import { RENTAL_CASE } from '../practice/rentalCase';

describe('document guides', () => {
  it('say who gives each document, what to find, who fills it in, and how to check a correction', () => {
    expect(new Set(DOC_GUIDES.map((g) => g.key)).size).toBe(DOC_GUIDES.length);
    for (const g of DOC_GUIDES) {
      expect(g.from.length, g.key).toBeGreaterThan(20);
      expect(g.parts.length, g.key).toBeGreaterThan(1);
      for (const x of g.parts) expect(x.who.length, `${g.key}: ${x.part}`).toBeGreaterThan(3);
      expect(g.changes.length, g.key).toBeGreaterThan(20);
      expect(g.corrected.length, g.key).toBeGreaterThan(20);
    }
  });

  it('every guide and evidence area a roadmap step or practice document names exists', () => {
    for (const s of ROADMAP) {
      for (const k of s.guides ?? []) expect(docGuide(k), `${s.id} → ${k}`).toBeDefined();
      if (s.evidence) expect(EVIDENCE_AREAS.some((a) => a.key === s.evidence), s.id).toBe(true);
    }
    for (const st of RENTAL_CASE) for (const d of st.docs) if (d.guide) expect(docGuide(d.guide), d.kind).toBeDefined();
  });
});
