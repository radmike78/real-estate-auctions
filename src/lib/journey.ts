import { workStorage as localStorage } from './workStorage';
// How a visitor wants to start: "I'm new, guide me" (one recommended activity at a time) or "I know the basics, let
// me explore" (straight to the tools and references). Optional and easy to change; every page still shows
// everything. Kept only in this browser, with the lessons read to the end and the last activity opened, so a
// returning visitor can continue where they left off.
import { useEffect, useState } from 'react';
import { QUESTIONS } from './decide';
import { CHAPTERS, loadJourney } from '../practice/dealJourney';
import { trackAction } from './track';
import { creditStep } from './roadmapState';
import { getMyState } from './myState';
import { loadCase } from '../practice/caseProgress';
import { caseFor, caseResume } from '../practice/rentalCase';

/** Whether practice part 2 (Buy a rental, start to finish) is finished: for the reader's state, or already credited
 *  on the roadmap (finished under another state before switching, so the plan doesn't send you back to it). */
export function practicePart2Done(): boolean {
  const pc = caseFor(getMyState());
  if (caseResume(pc.stages, loadCase(pc.state)).packet) return true;
  try {
    const credited: unknown = JSON.parse(localStorage.getItem('deedowl.roadmap.credited.v1') ?? '[]');
    return Array.isArray(credited) && credited.includes('practice');
  } catch {
    return false;
  }
}

export type Mode = 'guided' | 'explore';

const MODE_KEY = 'deedowl.mode.v1';
const READ_KEY = 'deedowl.read.v1';
const LAST_KEY = 'deedowl.last.v1';
const EVENT = 'deedowl:journey';

function read<T>(key: string, ok: (v: unknown) => v is T): T | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return ok(v) ? v : null;
  } catch {
    return null;
  }
}

function write(key: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode: not kept, but this page still updates */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

const isMode = (v: unknown): v is Mode => v === 'guided' || v === 'explore';
export const getMode = (): Mode | null => read(MODE_KEY, isMode);
export const setMode = (m: Mode | null) => write(MODE_KEY, m);

const isKeys = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
/** Lessons read to the end (opening one isn't the same as finishing it). */
export const readLessons = (): string[] => read(READ_KEY, isKeys) ?? [];
export function markLessonRead(key: string) {
  const done = readLessons();
  if (done.includes(key)) return;
  write(READ_KEY, [...done, key]);
  trackAction('lesson_finished'); // a count only: never which lesson or who
  if (key === 'red-flags') creditStep('avoid');
}

export interface LastActivity {
  href: string;
  label: string;
}
const isLast = (v: unknown): v is LastActivity =>
  !!v && typeof v === 'object' && typeof (v as LastActivity).href === 'string' && (v as LastActivity).href.startsWith('#/') && typeof (v as LastActivity).label === 'string';
export const getLast = (): LastActivity | null => read(LAST_KEY, isLast);

/** Remembers the lesson, guide, drill or tool on screen, for "Continue where you left off". */
export function useLastActivity(href: string, label: string | undefined) {
  useEffect(() => {
    if (!label) return;
    const last = getLast();
    if (last?.href !== href || last.label !== label) write(LAST_KEY, { href, label: label.slice(0, 120) });
  }, [href, label]);
}

/** Re-renders when the mode, lessons read or last activity change, anywhere on the page. */
export function useJourney() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return { mode: getMode(), read: readLessons(), last: getLast() };
}

/** Real work done in this browser (not page visits), for "continue where you left off". */
export interface Progress {
  read: string[];
  /** Drill ids with a final call made. */
  drillsDone: string[];
  /** Every Decide question answered. */
  decided: boolean;
  /** Roadmap steps ticked. */
  roadmapDone: number;
}

/** Progress as this browser has it. */
export function currentProgress(): Progress {
  const drills = read('deedowl.drills.v1', (v): v is Record<string, { verdict?: unknown }> => !!v && typeof v === 'object');
  const decide = read('deedowl.decide.v1', (v): v is { answers?: Record<string, unknown> } => !!v && typeof v === 'object');
  const roadmap = read('deedowl.roadmap.v1', isKeys);
  return {
    read: readLessons(),
    drillsDone: Object.entries(drills ?? {}).filter(([, d]) => d && typeof d.verdict === 'string').map(([id]) => id),
    decided: QUESTIONS.every((q) => typeof decide?.answers?.[q.key] === 'string'),
    roadmapDone: roadmap?.length ?? 0,
  };
}

/** The last activity, unless it's already finished (a lesson read to the end, a drill with its call made). */
export function unfinished(last: LastActivity | null, p: Progress): LastActivity | null {
  if (!last) return null;
  // Only real work in progress is worth going back to: a lesson, a practice purchase or drill, a sale guide or a
  // professional's page. Hub pages (Practice, Find Deals, Your team, My plan) aren't "where you left off".
  if (!/^#\/(analyze$|learn\/[a-z-]+|practice\/(deal|case|drills\/|[a-z]+-[a-z])|playbooks\/[a-z]|pros\/[a-z])/.test(last.href)) return null;
  const lesson = last.href.match(/^#\/learn\/([a-z-]+)$/);
  if (lesson && p.read.includes(lesson[1])) return null;
  const drill = last.href.match(/^#\/practice\/drills\/([a-z0-9-]+)$/);
  if (drill && p.drillsDone.includes(drill[1])) return null;
  // A practice chapter already done isn't left unfinished.
  const chapter = last.href.match(/^#\/practice\/deal\/([a-z-]+)$/);
  if (chapter && loadJourney().completed.includes(chapter[1])) return null;
  // The practice deal with all its chapters done is finished too.
  if (/^#\/practice\/deal(\/|$)/.test(last.href) && loadJourney().completed.length === CHAPTERS.length) return null;
  // So is the practice purchase once its deal packet is done.
  if (/^#\/practice\/case(\/|$)/.test(last.href) && practicePart2Done()) return null;
  return last;
}

/** Ticks the roadmap steps already done elsewhere (Decide, the red flags lesson), for work done before the roadmap
 * learned to tick them. Each step is ticked at most once, so a reader's own untick stays. */
export function syncRoadmapCredits() {
  if (currentProgress().decided) creditStep('strategy');
  if (readLessons().includes('red-flags')) creditStep('avoid');
  if (practicePart2Done()) creditStep('practice');
  try { if ((JSON.parse(localStorage.getItem('deedowl.goal.v1') ?? '""') as string).trim().length >= 12) creditStep('goal'); } catch { /* unreadable goal: nothing to credit */ }
}
