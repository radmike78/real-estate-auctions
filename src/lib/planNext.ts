// The one "Continue" on DeedOwl: My plan's next real-world task, shown the same way on My plan, the home page and
// the header. With a property in progress it's that property's next task for its stage; before any real work, the
// core practice deal; otherwise the next step of the investing roadmap. Lessons and practice missions are
// supporting activities, linked from the task they help with.
import { CHAPTERS, journeyHref, loadJourney, resumeChapter } from '../practice/dealJourney';
import { loadDeals, type Deal, type DealStage } from './analyze';
import { dealNextTask, stageLabel, stageOf, stageTasks, type PlanTask } from './dealStage';
import { getMode } from './journey';
import { cleanGoal, GOAL_KEY } from './myPlan';
import { ROADMAP_PHASES, roadmapFor, type RoadmapStep } from './roadmap';
import { cleanStatus, focusDealId, planPath, readKey, roadmapDone, settledFor, STATUS_KEY } from './roadmapState';

export interface PlanNow {
  /** Your goal in one sentence, or '' when it isn't written yet. */
  goal: string;
  source: 'deal' | 'starter' | 'roadmap';
  /** Where the task comes from: "123 Main St · Researching", "Getting started · stop 2 of 5", "Roadmap · Get ready". */
  context: string;
  task: PlanTask;
  deal?: Deal;
  stage?: DealStage;
  /** The deal's tasks for its stage, in order. */
  tasks?: PlanTask[];
}

export const ROADMAP_TASK_HREF = '#/toolkit/roadmap';

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
  text: `${s.title}.`,
});

export function planNow(now = new Date()): PlanNow {
  const goal = readKey(GOAL_KEY, '', cleanGoal).trim();
  const deals = loadDeals();
  const focus = focusDealId(deals);
  const deal = deals.find((d) => `analyzed:${d.id}` === focus);
  if (deal) {
    const stage = stageOf(deal);
    return { goal, source: 'deal', context: `${deal.name} · ${stageLabel(stage, deal)}`, task: dealNextTask(deal, undefined, now, stage), deal, stage, tasks: stageTasks(deal, stage, undefined, now) };
  }
  // Before any real work, the practice deal comes first, unless you said you know the basics.
  const roadmapStarted = roadmapFor(planPath(deals)).some(settledFor(''));
  const practice = loadJourney();
  const practiceDone = practice.completed.length === CHAPTERS.length;
  if (getMode() !== 'explore' && !roadmapStarted && !practiceDone) {
    const chapter = CHAPTERS.find((c) => c.id === resumeChapter(practice))!;
    return { goal, source: 'starter', context: 'Practice · Build your first deal', task: { key: 'practice-deal', label: chapter.title, produces: 'practical experience checking a deal, recorded in your workbook', href: journeyHref(chapter.id), support: [], done: false, text: chapter.purpose } };
  }
  const step = roadmapNextStep();
  if (step) return { goal, source: 'roadmap', context: `Roadmap · ${ROADMAP_PHASES[step.phase]}`, task: roadmapTask(step) };
  return {
    goal,
    source: 'roadmap',
    context: 'Roadmap · every step done',
    task: { key: 'next-deal', label: 'Find your next property', produces: 'a new candidate saved in Analyze, starting at Researching', href: '#/find-deals', support: [{ label: 'Analyze a deal', href: '#/analyze' }], done: false, text: 'Find your next property.' },
  };
}
