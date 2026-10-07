// The one "Continue" on DeedOwl: My plan's next real-world task, shown the same way on My plan, the home page and
// the header. With a property in progress it's that property's next task for its stage; before any real work, the
// short Getting started tour; otherwise the next step of the investing roadmap. Lessons and practice missions are
// supporting activities, linked from the task they help with.
import { loadDeals, type Deal, type DealStage } from './analyze';
import { dealNextTask, stageLabel, stageOf, stageTasks, type PlanTask } from './dealStage';
import { currentProgress, getMode, GUIDED, guidedNext } from './journey';
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

/** What the Getting started steps give you, so the tour's steps read like plan tasks. */
const STARTER_PRODUCES: Record<string, string> = {
  example: 'a worked example of what a rental costs, what it earns and what to check before you commit',
  exercise: 'your own call on a fictional $265,000 rental, with each mission’s answer to compare',
  intro: 'the basics of how investment property is bought, valued and paid for',
  decide: 'the strategies that fit your money, time and goals, with their risks',
};

export function planNow(now = new Date()): PlanNow {
  const goal = readKey(GOAL_KEY, '', cleanGoal).trim();
  const deals = loadDeals();
  const focus = focusDealId(deals);
  const deal = deals.find((d) => `analyzed:${d.id}` === focus);
  if (deal) {
    const stage = stageOf(deal);
    return { goal, source: 'deal', context: `${deal.name} · ${stageLabel(stage, deal)}`, task: dealNextTask(deal, undefined, now, stage), deal, stage, tasks: stageTasks(deal, stage, undefined, now) };
  }
  // Before any real work, the short tour comes first, unless you said you know the basics.
  const roadmapStarted = roadmapFor(planPath(deals)).some(settledFor(''));
  const starter = guidedNext(currentProgress());
  if (getMode() !== 'explore' && !roadmapStarted && starter && starter.step.key !== 'plan' && STARTER_PRODUCES[starter.step.key]) {
    return {
      goal,
      source: 'starter',
      context: `Getting started · stop ${starter.n} of ${GUIDED.length}`,
      task: { key: `starter-${starter.step.key}`, label: starter.step.label, produces: STARTER_PRODUCES[starter.step.key], href: starter.step.href, support: [], done: false, text: `${starter.step.label}.` },
    };
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
