// The one "Continue" on DeedOwl: My plan's next real-world task, shown the same way on My plan, the home page and
// the header. With a property in progress it's that property's next task for its stage; before any real work, the
// core practice deal; otherwise the next step of the investing roadmap. Lessons and practice missions are
// supporting activities, linked from the task they help with.
import { CHAPTERS, journeyHref, loadJourney, resumeChapter } from '../practice/dealJourney';
import { loadDeals, type Deal, type DealStage } from './analyze';
import { dealNextTask, stageLabel, stageOf, stageTasks, type PlanTask } from './dealStage';
import { currentProgress, getMode, practicePart2Done, readLessons } from './journey';
import { getMyState } from './myState';
import { loadCase } from '../practice/caseProgress';
import { caseFor, caseResume } from '../practice/rentalCase';
import { LEARN_MODULES } from './learn';
import { cleanGoal, GOAL_KEY } from './myPlan';
import { ROADMAP_PHASES, roadmapFor, type RoadmapStep } from './roadmap';
import { AUTO_STEPS, cleanStatus, focusDealId, planPath, readKey, roadmapDone, settledFor, STATUS_KEY } from './roadmapState';

export interface PlanNow {
  /** Your goal in one sentence, or '' when it isn't written yet. */
  goal: string;
  source: 'deal' | 'starter' | 'roadmap';
  /** Where the task comes from: "123 Main St · Researching", "Practice · Build your first deal", "Roadmap · Get ready". */
  context: string;
  task: PlanTask;
  deal?: Deal;
  stage?: DealStage;
  /** The deal's tasks for its stage, in order. */
  tasks?: PlanTask[];
}

export const ROADMAP_TASK_HREF = '#/toolkit/roadmap';
/** How many of Learn's first lessons (its "Start here" group) a guided beginner reads before the practice deal. */
export const START_LESSONS = 2;

/** False until the practice deal has any work in it: the button then says Start, not Continue. */
export function planStarted(now: PlanNow): boolean {
  if (now.source !== 'starter') return true;
  if (now.task.key === 'practice-case') return loadCase(caseFor(getMyState()).state).done.length > 0;
  if (now.task.key !== 'practice-deal') return false;
  const p = loadJourney();
  return p.completed.length > 0 || Object.keys(p.answers).length > 0;
}

/** A roadmap step named by the site's six steps, so pages agree on where you are: the planning tasks before the team
 *  belong to step 4 (they're what you bring to your team), then the team itself, then Find deals from "find" on. */
export function stepContext(step: RoadmapStep): string {
  const steps = roadmapFor(planPath());
  const at = steps.findIndex((s) => s.id === step.id);
  const team = steps.findIndex((s) => /(^|-)team$/.test(s.id));
  // Finding a property starts with the first phase-4 step on every route (find, a-find, c-sale).
  const find = steps.findIndex((s) => s.phase >= 4);
  const phase = ROADMAP_PHASES[step.phase];
  // Only after practice: before it, the plan is still on steps 1 to 3.
  const practiced = loadJourney().completed.length === CHAPTERS.length;
  if (!practiced || at < 0 || team < 0 || find < 0 || step.phase >= 6) return `Roadmap · ${phase}`;
  // Step 6 (Analyze a deal) is where you run the numbers and work through buying it.
  if (step.phase === 5) return 'Step 6 · Analyze and buy';
  if (/(^|-)practice$/.test(step.id)) return 'Step 3 · Practice';
  if (at < team) return 'Step 4 · Your team · first, finish your plan';
  if (at < find) return 'Step 4 · Your team';
  return 'Step 5 · Find deals';
}

/** The roadmap's next step for the learner (no property chosen): a step you walked away at stays next. */
export function roadmapNextStep(): RoadmapStep | null {
  const steps = roadmapFor(planPath());
  const settled = settledFor('');
  const done = roadmapDone();
  const status = readKey(STATUS_KEY, {}, cleanStatus);
  return steps.find((s) => status[s.id] === 'stopped' && !done.includes(s.id)) ?? steps.find((s) => !settled(s) && status[s.id] !== 'stopped') ?? null;
}

/** A roadmap step as a plan task: what to do, what you'll have, and the page that helps. */
export const roadmapTask = (s: RoadmapStep): PlanTask => ({
  key: `roadmap-${s.id}`,
  label: s.title,
  produces: s.outcome.charAt(0).toLowerCase() + s.outcome.slice(1).replace(/\.$/, ''),
  href: ROADMAP_TASK_HREF,
  support: s.href ? [{ label: s.action ?? 'Open', href: s.href }] : [],
  done: false,
  text: s.text,
});


export function planNow(now = new Date()): PlanNow {
  const goal = readKey(GOAL_KEY, '', cleanGoal).trim();
  const deals = loadDeals();
  const focus = focusDealId(deals);
  const deal = deals.find((d) => `analyzed:${d.id}` === focus);
  // A guided beginner who saved a property while still learning keeps the guided steps first, until the practice
  // purchase is done; a deal that has moved past researching (an offer, a contract) always leads.
  const researching = !!deal && stageOf(deal) === 'researching';
  // So does a reader practicing paper analyses ("Practice checking real properties without buying"): saving one
  // doesn't turn the plan into that property's buying steps.
  const paperPractice = researching && ['paper', 'c-paper'].includes(roadmapNextStep()?.id ?? '');
  const guidedLearning = (getMode() === 'guided' && !practicePart2Done() && researching) || paperPractice;
  if (deal && !guidedLearning) {
    const stage = stageOf(deal);
    return { goal, source: 'deal', context: `${deal.name} · ${stageLabel(stage, deal)}`, task: dealNextTask(deal, undefined, now, stage), deal, stage, tasks: stageTasks(deal, stage, undefined, now) };
  }
  // Before any real work, unless you said you know the basics, the site's order: Decide (your goal and cash), the
  // "Start here" lessons, then the practice deal.
  // Steps the site ticked for you (Decide, the red flags lesson) don't count as starting the roadmap.
  // Only work from the team step on counts as starting the roadmap: ticking a planning or practice task early
  // (your cash, your walk-away rules) doesn't skip the lessons and practice.
  const steps = roadmapFor(planPath(deals));
  const fromTeam = Math.max(0, steps.findIndex((s) => /(^|-)team$/.test(s.id)));
  const roadmapStarted = steps.slice(fromTeam).filter((s) => !AUTO_STEPS.includes(s.id)).some(settledFor(''));
  const practice = loadJourney();
  const practiceDone = practice.completed.length === CHAPTERS.length;
  const learning = getMode() !== 'explore' && !roadmapStarted && !practiceDone;
  // Decide comes first unless the reader already started the practice deal; the two Start-here lessons stay ahead of
  // practice until one of its chapters is finished, even if a lesson's practice link was tried early.
  if (learning && practice.completed.length === 0 && !currentProgress().decided && Object.keys(practice.answers).length === 0) {
    return { goal, source: 'starter', context: 'Step 1 · Decide', task: { key: 'decide', label: 'Decide: your goal and investable cash', produces: 'the strategies that fit your money, time and goals, in about 2 minutes', href: '#/decide', support: [], done: false, text: 'A few questions about your goal, your cash and your time.' } };
  }
  // The two Start-here lessons stay next until both are read, even if a lesson's practice link was tried early.
  if (learning) {
    const read = readLessons();
    const lesson = LEARN_MODULES.slice(0, START_LESSONS).find((m) => !read.includes(m.key));
    if (lesson) {
      return { goal, source: 'starter', context: 'Step 2 · Learn', task: { key: `lesson-${lesson.key}`, label: `Lesson: ${lesson.title}`, produces: 'the basics you’ll use in the practice deal', href: `#/learn/${lesson.key}`, support: [], done: false, text: lesson.summary } };
    }
  }
  if (getMode() !== 'explore' && !roadmapStarted && !practiceDone) {
    const chapter = CHAPTERS.find((c) => c.id === resumeChapter(practice))!;
    return { goal, source: 'starter', context: 'Step 3 · Practice part 1: Cedar House (the decisions)', task: { key: 'practice-deal', label: chapter.title, produces: 'practical experience checking a deal, recorded in your workbook', href: journeyHref(chapter.id), support: [], done: false, text: chapter.purpose } };
  }
  // Practice part 2 (the paperwork) follows part 1 before the roadmap takes over.
  if (getMode() !== 'explore' && !roadmapStarted && practiceDone) {
    const pc = caseFor(getMyState());
    const prog = loadCase(pc.state);
    const next = caseResume(pc.stages, prog);
    if (!next.packet) {
      const started = prog.done.length > 0;
      return { goal, source: 'starter', context: 'Step 3 · Practice part 2: Buy a rental (the paperwork)', task: { key: 'practice-case', label: 'Buy a rental, start to finish', produces: 'a practice deal packet: budget, deadline calendar, evidence log and your questions', href: `#/practice/case${started ? `/${next.key}` : ''}`, support: [], done: false, text: 'Work one fictional purchase with the paperwork, about 45 minutes.' } };
    }
  }
  const step = roadmapNextStep();
  if (step) return { goal, source: 'roadmap', context: stepContext(step), task: roadmapTask(step) };
  return {
    goal,
    source: 'roadmap',
    context: 'Roadmap · every step done',
    task: { key: 'next-deal', label: 'Find your next property', produces: 'a new candidate saved in Analyze, starting at Researching', href: '#/find-deals', support: [{ label: 'Analyze a deal', href: '#/analyze' }], done: false, text: 'Find your next property.' },
  };
}
