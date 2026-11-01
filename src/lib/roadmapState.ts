import { workStorage as localStorage } from './workStorage';
// What My plan's roadmap has stored in this browser: the steps ticked, their statuses, the way of buying and the
// property being worked on. Read here so the roadmap, the home page and My plan's next step all count the same way.
import { loadDeals, type Deal } from './analyze';
import { ROADMAP, roadmapFor, type RoadmapPath, type RoadmapStep, type StepStatus } from './roadmap';
import { cleanDealSteps, DEAL_ID, DEAL_KEY, DEAL_STEPS_KEY } from './roadmapDeals';

export const ROADMAP_KEY = 'deedowl.roadmap.v1';
export const ROADMAP_PATH_KEY = 'deedowl.roadmap.path.v1';
export const STATUS_KEY = 'deedowl.roadmap.status.v1';
/** Fired when the roadmap, a deal's stage or the property being worked on changes, so every "next step" follows. */
export const PROGRESS_EVENT = 'deedowl:plan-progress';
export const progressChanged = () => {
  try {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    /* no window (tests) */
  }
};

export function readKey<T>(key: string, fallback: T, clean: (v: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? clean(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

export const cleanIds = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && ROADMAP.some((s) => s.id === x)) : []);
export const cleanPath = (v: unknown): RoadmapPath => (v === 'auction' || v === 'certificate' ? v : 'listing');
const STATUSES: StepStatus[] = ['doing', 'waiting', 'stopped', 'na'];
export const cleanStatus = (v: unknown): Record<string, StepStatus> => {
  const out: Record<string, StepStatus> = {};
  if (v && typeof v === 'object' && !Array.isArray(v))
    for (const [k, x] of Object.entries(v)) if (ROADMAP.some((s) => s.id === k) && STATUSES.includes(x as StepStatus)) out[k] = x as StepStatus;
  return out;
};

// Steps 4 to 7 (find, buy, own, exit) belong to one property. With a deal chosen, their progress is kept for that deal,
// so two properties can be at different stages; steps 1 to 3 are the learner's own, whatever the deal.
export const dealScoped = (s: RoadmapStep) => s.phase >= 4;

/** Ticked roadmap steps (the learner's own, not a property's). */
export const roadmapDone = () => readKey(ROADMAP_KEY, [] as string[], cleanIds);

const CREDITED_KEY = 'deedowl.roadmap.credited.v1';
/** Roadmap steps the site ticks for you when you do the work elsewhere: Decide (choose a strategy), the seminar red
 * flags lesson, the practice purchase (part 2's deal packet). Each is ticked once, so a reader who unticks it keeps it unticked. */
export const AUTO_STEPS: readonly string[] = ['goal', 'strategy', 'avoid', 'practice'];
export function creditStep(id: string) {
  try {
    const credited = readKey(CREDITED_KEY, [] as string[], cleanIds);
    if (credited.includes(id)) return;
    localStorage.setItem(CREDITED_KEY, JSON.stringify([...credited, id]));
    const done = roadmapDone();
    if (!done.includes(id)) localStorage.setItem(ROADMAP_KEY, JSON.stringify([...done, id]));
    progressChanged();
  } catch {
    /* storage unavailable */
  }
}
/** How the visitor plans to buy: through an agent, at an auction, or lien certificates. */
export const roadmapPath = () => readKey(ROADMAP_PATH_KEY, 'listing' as RoadmapPath, cleanPath);
/** The route that fits a property's kind of sale. */
export const pathForDeal = (d: Pick<Deal, 'kind'>): RoadmapPath => (d.kind === 'lien' ? 'certificate' : d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short' ? 'listing' : 'auction');

/**
 * Stored when "None yet (learning)" is chosen on purpose. An empty value only means nothing was chosen: My plan used
 * to store one on every visit.
 */
export const NO_DEAL = 'none';

const rawDealChoice = () => readKey(DEAL_KEY, '', (v) => (typeof v === 'string' && (v === NO_DEAL || DEAL_ID.test(v)) ? v : ''));

/**
 * The property My plan is working on: the one chosen in the roadmap, or, if none was chosen, the deal touched most
 * recently that you haven't passed on. Choosing "None yet (learning)" is kept as a choice.
 */
export function focusDealId(deals: Deal[] = loadDeals()): string {
  const chosen = rawDealChoice();
  if (chosen === NO_DEAL) return '';
  if (chosen && deals.some((d) => `analyzed:${d.id}` === chosen)) return chosen;
  const recent = [...deals].filter((d) => d.stage !== 'passed').sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0];
  return recent ? `analyzed:${recent.id}` : '';
}

/** Whether a property (or "None yet") was chosen in the roadmap. */
const dealChosen = () => rawDealChoice() !== '';

/** The route the roadmap shows: the stored choice, or, until a property is chosen, the route of the one in focus. */
export function planPath(deals: Deal[] = loadDeals()): RoadmapPath {
  if (dealChosen()) return roadmapPath();
  const d = deals.find((x) => `analyzed:${x.id}` === focusDealId(deals));
  // A route you picked holds while the property in focus is still being researched (a practice analysis, a listing
  // your agent sent): only a deal you've moved on with (an offer, a bid, a contract) changes the route.
  let picked = false;
  try { picked = localStorage.getItem(ROADMAP_PATH_KEY) !== null; } catch { /* storage unavailable */ }
  if (d && picked && (!d.stage || d.stage === 'researching')) return roadmapPath();
  return d ? pathForDeal(d) : roadmapPath();
}

/** Roadmap progress kept for one property (steps 4 to 7). */
export const dealProgress = (dealKey: string) => readKey(DEAL_STEPS_KEY, {}, cleanDealSteps)[dealKey] ?? { done: [] as string[], status: {} as Record<string, StepStatus> };

/** Whether a step is settled (done, or marked "doesn't apply"), counting steps 4 to 7 for the property in focus. */
export function settledFor(dealKey: string) {
  const done = roadmapDone();
  const status = readKey(STATUS_KEY, {}, cleanStatus);
  const per = dealKey ? dealProgress(dealKey) : null;
  return (s: RoadmapStep) => (per && dealScoped(s) ? per.done.includes(s.id) || per.status[s.id] === 'na' : done.includes(s.id) || status[s.id] === 'na');
}

/** Steps done out of the steps on the visitor's path. */
export function roadmapProgress() {
  const deals = loadDeals();
  const focus = focusDealId(deals);
  const steps = roadmapFor(planPath(deals));
  const settled = settledFor(focus);
  return { done: steps.filter(settled).length, total: steps.length };
}
