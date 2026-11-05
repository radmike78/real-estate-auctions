import { workStorage as localStorage } from './workStorage';
// What My plan's roadmap has stored in this browser: the steps ticked, their statuses, the way of buying and the
// property being worked on. Read here so the roadmap, the home page and My plan's next step all count the same way.
import { loadDeals, type Deal } from './analyze';
import { loadOwned } from './owned';
import { getMyState } from './myState';
import { DECIDE_KEY, QUESTIONS, rank, type Answers } from './decide';
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
 * flags lesson, the practice purchase (part 2's deal packet), your county and route (Your area and How you'll buy). Each is ticked once, so a reader who unticks it keeps it unticked. */
export const AUTO_STEPS: readonly string[] = ['goal', 'strategy', 'avoid', 'practice', 'market'];
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
/** A step the reader marks done themselves from another page (e.g. practice run results): ticked whatever it was before,
 * as the roadmap's own Done does (unlike creditStep, which ticks a step for you only once). */
export function markStepDone(id: string) {
  try {
    const done = roadmapDone();
    if (!done.includes(id)) localStorage.setItem(ROADMAP_KEY, JSON.stringify([...done, id]));
    const status = readKey(STATUS_KEY, {} as Record<string, string>, cleanStatus) as Record<string, string>;
    if (id in status) { const { [id]: _drop, ...rest } = status; void _drop; localStorage.setItem(STATUS_KEY, JSON.stringify(rest)); }
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

export const rawDealChoice = () => readKey(DEAL_KEY, '', (v) => (typeof v === 'string' && (v === NO_DEAL || DEAL_ID.test(v)) ? v : ''));

/**
 * The property My plan is working on: the one chosen in the roadmap, or, if none was chosen, the deal touched most
 * recently that you haven't passed on. Choosing "None yet (learning)" is kept as a choice.
 */
export function focusDealId(deals: Deal[] = loadDeals()): string {
  const chosen = rawDealChoice();
  if (chosen === NO_DEAL) return '';
  // A chosen property you've since passed on gives way to the next one you save.
  // (A chosen deal that's finished, sold or repaid, gives way to any deal still open.)
  const ownedNow = loadOwned();
  const done = (d: Deal) => !!ownedNow[d.id]?.sold || repaid(d.id);
  const openOther = (d: Deal) => deals.some((x) => x.id !== d.id && x.stage !== 'passed' && !x.practice && !ownedNow[x.id]?.sold && !repaid(x.id));
  if (chosen && deals.some((d) => `analyzed:${d.id}` === chosen && !(done(d) && openOther(d)) && (d.stage !== 'passed' || done(d) || !deals.some((x) => x.stage !== 'passed' && !x.practice && x.updatedAt > d.updatedAt)))) return chosen;
  // Practice analyses are never picked on their own. A deal under way (an offer, a contract, a win, a home just bought,
  // or a flip still to sell) leads over a newer candidate you're only researching.
  const all = [...deals].filter((d) => d.stage !== 'passed' && !d.practice).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
  // (A sold flip is finished: a deal still being worked on comes first.)
  const owned = loadOwned();
  const open = all.some((d) => !owned[d.id]?.sold) ? all.filter((d) => !owned[d.id]?.sold) : all;
  const recent = open.find((d) => underWay(d)) ?? open[0];
  return recent ? `analyzed:${recent.id}` : '';
}

/** A deal whose redemption payoff is marked collected in its packet (read directly: no import cycle). */
function repaid(id: string): boolean {
  try {
    const all = JSON.parse(localStorage.getItem('deedowl.dealPacket.v1') ?? '{}') as Record<string, { dates?: { what?: string; resolved?: boolean }[] }>;
    return !!all[`analyzed:${id}`]?.dates?.some((x) => /^redemption money collected/i.test((x.what ?? '').trim()) && !!x.resolved);
  } catch { return false; }
}

/** A deal past researching that still has work before it's done: an owned rental or home (ongoing) and a sold flip don't count. */
export function underWay(d: Deal): boolean {
  if (d.practice || !d.stage || d.stage === 'researching' || d.stage === 'passed') return false;
  if (d.stage !== 'owned') return true;
  return d.plan === 'flip' && !loadOwned()[d.id]?.sold;
}

/** Whether a property (or "None yet") was chosen in the roadmap. */
const dealChosen = () => rawDealChoice() !== '';

/** The route the roadmap shows: the stored choice, or, until a property is chosen, the route of the one in focus. */
export function planPath(deals: Deal[] = loadDeals()): RoadmapPath {
  const d = deals.find((x) => `analyzed:${x.id}` === focusDealId(deals));
  const p = planPathRaw(d, deals);
  // Lien certificates are sold only in Nevada and Arizona: a lien route kept after switching to another state follows
  // the auction route there (its tasks would point to sales that don't exist), unless the lien deal you're working on
  // (lienDealFor) is in a state that sells them.
  const st = getMyState();
  return p === 'certificate' && st && st !== 'NV' && st !== 'AZ' && !lienDealFor(deals) ? 'auction' : p;
}

const nvAzLien = (d: Deal) => d.kind === 'lien' && (d.state === 'NV' || d.state === 'AZ');

/**
 * The Nevada or Arizona lien deal that keeps a lien route: the property in focus, or, with none in focus (you passed
 * on it), your most recent real one, so passing on it doesn't drop the lien route and the lien practice you finished.
 */
export function lienDealFor(deals: Deal[] = loadDeals()): Deal | null {
  const d = deals.find((x) => `analyzed:${x.id}` === focusDealId(deals));
  if (d) return nvAzLien(d) ? d : null;
  // "None yet (learning)" chosen: no property, so none keeps a route.
  if (rawDealChoice() === NO_DEAL) return null;
  return [...deals].filter((x) => !x.practice && nvAzLien(x)).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0] ?? null;
}

function planPathRaw(d: Deal | undefined, deals: Deal[]): RoadmapPath {
  let picked = false;
  try { picked = localStorage.getItem(ROADMAP_PATH_KEY) !== null; } catch { /* storage unavailable */ }
  // A property (or "None yet") chosen: the route you picked, else Decide's auctions pick, else the agent route.
  if (dealChosen()) return !picked && decideRoute() === 'auction' ? 'auction' : roadmapPath();
  // A route you picked holds while the property in focus is still being researched (a practice analysis, a listing
  // your agent sent): only a deal you've moved on with (an offer, a bid, a contract) changes the route.
  if (d && picked && (!d.stage || d.stage === 'researching')) return roadmapPath();
  // A guided beginner's listed home that waits while they finish the lessons and practice (My plan shows "None yet
  // (learning)" then) doesn't set the route yet: Decide's auctions pick does, so practice part 2 stays the auction one.
  // Once it leads (practice done, or you chose it), the route follows it.
  if (d && !picked && pathForDeal(d) === 'listing' && decideRoute() === 'auction' && guidedWaiting(d)) return 'auction';
  if (d) return pathForDeal(d);
  // No property in focus and no route picked (a state without lien sales offers no lien route button): the lien
  // deal you passed on keeps the lien route.
  const lien = !picked ? lienDealFor(deals) : null;
  if (lien) return 'certificate';
  // Nothing picked yet: Decide's top strategy decides when it's auctions (so its practice part 2 is the auction one).
  return !picked && decideRoute() === 'auction' ? 'auction' : roadmapPath();
}

/** A guided learner's saved property still waiting (being researched, not chosen, no practice part 2 done yet). */
function guidedWaiting(d: Deal): boolean {
  let guided = false;
  try { guided = JSON.parse(localStorage.getItem('deedowl.mode.v1') ?? 'null') === 'guided'; } catch { /* storage unavailable */ }
  // (Only a stage saved as researching: an older deal with none may be further along, as My plan works it out.)
  if (!guided || d.stage !== 'researching' || rawDealChoice() === `analyzed:${d.id}`) return false;
  return !practiceStepSettled(baseRoute());
}

/**
 * Practice part 2 settled: done on any route (the listed home's "Finish a practice purchase", the auction or the lien
 * practice, or the rental case credited), or marked "doesn't apply" on the route given. The one check the route
 * rule and My plan (planNext.guidedPracticeDone) share, so they never disagree.
 */
export function practiceStepSettled(path?: RoadmapPath): boolean {
  // "Doesn't apply" counts only on the route it was marked for; done counts on any route.
  if (path && roadmapFor(path).some((s) => PRACTICE_IDS.includes(s.id) && settledFor('')(s))) return true;
  return practiceStepDoneAnyRoute();
}

const PRACTICE_IDS = ['practice', 'a-practice', 'c-practice'];

// The rental purchase finished to its deal packet (journey.ts registers it: that module imports this one).
let rentalCaseDone: () => boolean = () => false;
export function setRentalCaseCheck(fn: () => boolean) { rentalCaseDone = fn; }
function rentalCredited(): boolean {
  try { if (readKey(CREDITED_KEY, [] as string[], cleanIds).includes('practice')) return true; } catch { /* storage unavailable */ }
  return rentalCaseDone();
}

/** Practice part 2 done (not just "doesn't apply") on any route, or the rental case finished or credited. */
export function practiceStepDoneAnyRoute(): boolean {
  const done = roadmapDone();
  if (PRACTICE_IDS.some((id) => done.includes(id))) return true;
  return rentalCredited();
}

/** A route's practice step (practice part 2) not ticked itself but settled by another practice: one done on another
 *  route, or the rental purchase finished. My plan, its roadmap, Download my plan and Practice count it done. The
 *  practice that did it, else null. */
export function practiceDoneElsewhere(id: string): 'practice' | 'a-practice' | 'c-practice' | null {
  if (!PRACTICE_IDS.includes(id)) return null;
  const done = roadmapDone();
  if (done.includes(id)) return null;
  const other = PRACTICE_IDS.find((o) => o !== id && done.includes(o));
  if (other) return other as 'practice' | 'a-practice' | 'c-practice';
  // The rental purchase settles another route's step; its own step ("Finish a practice purchase") keeps its own tick.
  return id !== 'practice' && rentalCredited() ? 'practice' : null;
}

/** How a practice that settled part 2 is named in a sentence. */
export const PRACTICE_NAME: Record<'practice' | 'a-practice' | 'c-practice', string> = { practice: 'the rental purchase', 'a-practice': 'the auction practice', 'c-practice': 'the lien practice' };

/** The route apart from any saved property: the one you picked, else Decide's auctions pick, else the agent route.
 *  A guided learner's waiting property is judged against it (here and in My plan), so the two always agree. */
export function baseRoute(): RoadmapPath {
  let picked = false;
  try { picked = localStorage.getItem(ROADMAP_PATH_KEY) !== null; } catch { /* storage unavailable */ }
  const r = !picked && decideRoute() === 'auction' ? 'auction' : roadmapPath();
  // As planPath: a lien route in a state without lien sales follows the auction route (its practice is the auction one).
  const st = getMyState();
  return r === 'certificate' && st && st !== 'NV' && st !== 'AZ' && !lienDealFor() ? 'auction' : r;
}

/** Whether a route is set: one you picked, or Decide's auctions pick (both show as pressed on the roadmap). */
export function routeSet(): boolean {
  try { if (localStorage.getItem(ROADMAP_PATH_KEY) !== null) return true; } catch { /* storage unavailable */ }
  return decideRoute() === 'auction';
}

/** The route of Decide's top strategy, when it's auctions (the other strategies follow the agent route). */
function decideRoute(): RoadmapPath | null {
  try {
    const answers = (JSON.parse(localStorage.getItem(DECIDE_KEY) ?? 'null') as { answers?: Answers } | null)?.answers;
    // Only once Decide has a result: every question answered (the state one aside).
    if (!answers || QUESTIONS.some((q) => q.key !== 'state' && !answers[q.key])) return null;
    return rank(answers)[0]?.strategy.key === 'auction' ? 'auction' : null;
  } catch {
    return null;
  }
}

/** Roadmap progress kept for one property (steps 4 to 7). */
export const dealProgress = (dealKey: string) => readKey(DEAL_STEPS_KEY, {}, cleanDealSteps)[dealKey] ?? { done: [] as string[], status: {} as Record<string, StepStatus> };

/** Whether a step is settled (done, or marked "doesn't apply"), counting steps 4 to 7 for the property in focus. */
export function settledFor(dealKey: string) {
  const done = roadmapDone();
  const status = readKey(STATUS_KEY, {}, cleanStatus);
  const per = dealKey ? dealProgress(dealKey) : null;
  return (s: RoadmapStep) => (per && dealScoped(s) ? per.done.includes(s.id) || per.status[s.id] === 'na' : done.includes(s.id) || status[s.id] === 'na' || !!practiceDoneElsewhere(s.id));
}

/** Steps done out of the steps on the visitor's path. */
/** Roadmap steps done, for the property given (My plan's: a guided learner's waiting property isn't tracked yet). */
export function roadmapProgress(dealKey?: string) {
  const deals = loadDeals();
  const focus = dealKey ?? focusDealId(deals);
  const steps = roadmapFor(planPath(deals));
  const settled = settledFor(focus);
  return { done: steps.filter(settled).length, total: steps.length };
}
