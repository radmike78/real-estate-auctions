// Per-property progress on the roadmap: steps 4 to 6 belong to one property, so with a property chosen their
// progress is kept for that property. Kept apart from the page so removing a deal can forget it too.
import type { StepStatus } from './roadmap';

export const DEAL_KEY = 'deedowl.roadmap.deal.v1';
export const DEAL_STEPS_KEY = 'deedowl.roadmap.deals.v1';
export const DEAL_ID = /^analyzed:[A-Za-z0-9_-]{1,64}$/;
export type DealSteps = Record<string, { done: string[]; status: Record<string, StepStatus> }>;

/** Forget a removed deal's roadmap progress, and stop pointing at it. */
export function forgetRoadmapDeal(dealKey: string) {
  try {
    const raw = localStorage.getItem(DEAL_STEPS_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, unknown>;
      if (all && typeof all === 'object' && dealKey in all) {
        delete all[dealKey];
        localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify(all));
      }
    }
    if (localStorage.getItem(DEAL_KEY) === JSON.stringify(dealKey)) localStorage.setItem(DEAL_KEY, JSON.stringify(''));
  } catch {
    /* storage unavailable */
  }
}
