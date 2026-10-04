// Per-property progress on the roadmap: steps 4 to 6 belong to one property, so with a property chosen their
// progress is kept for that property. Kept apart from the page so removing a deal can forget it too.
import { ROADMAP, type StepStatus } from './roadmap';

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

const STATUSES: StepStatus[] = ['doing', 'waiting', 'stopped', 'na'];
const isStep = (x: unknown): x is string => typeof x === 'string' && ROADMAP.some((s) => s.id === x);

/** Per-property roadmap progress read back from storage or a backup: only known deals, steps and statuses. */
export function cleanDealSteps(v: unknown): DealSteps {
  const out: DealSteps = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, x] of Object.entries(v).slice(0, 200)) {
    if (!DEAL_ID.test(k) || !x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const status: Record<string, StepStatus> = {};
    if (o.status && typeof o.status === 'object' && !Array.isArray(o.status))
      for (const [id, st] of Object.entries(o.status)) if (isStep(id) && STATUSES.includes(st as StepStatus)) status[id] = st as StepStatus;
    out[k] = { done: Array.isArray(o.done) ? o.done.filter(isStep) : [], status };
  }
  return out;
}
