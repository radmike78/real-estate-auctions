// A list item that doesn't name a state up front is meant for every reader. If the state filter hides it from most
// states (because a state name appears inside it), readers silently lose a step, as once happened to "Title and HOA".
import { describe, expect, it } from 'vitest';
import { LESSONS } from './index';
import { forStateText, statesMentioned } from '../myState';
import { STATES } from '../regions';

const LEAD = new RegExp(`^(?:In |For )?(?:${STATES.map((s) => s.name).join('|')})\\b`);

describe('lesson list items for every reader', () => {
  it('stay visible in every state when they don’t start with a state', () => {
    const lost: string[] = [];
    for (const l of LESSONS) for (const sec of l.sections.filter((x) => !LEAD.test(x.heading))) for (const b of sec.blocks) {
      if (typeof b !== 'object' || !('list' in b)) continue;
      for (const item of b.list) {
        if (LEAD.test(item) || statesMentioned(item).length === 0) continue;
        const hidden = STATES.filter((s) => !forStateText(s.code, item).trim());
        if (hidden.length >= 3) lost.push(`${l.key}: ${item.slice(0, 80)} (hidden for ${hidden.map((s) => s.code).join(', ')})`);
      }
    }
    expect(lost).toEqual([]);
  });
});
