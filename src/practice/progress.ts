// Practice progress, kept only in this browser: which tasks are done, and which answers were chosen.

const KEY = 'fsf.practice.v1';

export interface ScenarioProgress {
  done: string[]; // "stage/task" keys
  answers: Record<string, number>; // "stage/task" -> chosen option
  firstTry: Record<string, boolean>; // "stage/task" -> right on the first try
  sent: Record<string, number[]>; // "stage/task" -> messages sent
}

type All = Record<string, ScenarioProgress>;

const empty = (): ScenarioProgress => ({ done: [], answers: {}, firstTry: {}, sent: {} });

function loadAll(): All {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as All) : {};
  } catch {
    return {};
  }
}

/** Progress for one scenario, cleaned up: old or hand-edited storage never breaks the page. */
export function loadProgress(id: string): ScenarioProgress {
  const p = loadAll()[id];
  if (!p || typeof p !== 'object') return empty();
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length < 100) : []);
  const record = <T,>(v: unknown, ok: (x: unknown) => x is T): Record<string, T> =>
    v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter((e): e is [string, T] => ok(e[1]))) : {};
  return {
    done: strings(p.done),
    answers: record(p.answers, (x): x is number => Number.isInteger(x)),
    firstTry: record(p.firstTry, (x): x is boolean => typeof x === 'boolean'),
    sent: record(p.sent, (x): x is number[] => Array.isArray(x) && x.every(Number.isInteger)),
  };
}

export function saveProgress(id: string, p: ScenarioProgress) {
  try {
    const all = loadAll();
    all[id] = p;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: progress lasts for this visit */
  }
}

export function resetProgress(id: string) {
  try {
    const all = loadAll();
    delete all[id];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** Share of tasks done, per scenario, for the index page. */
export function completion(id: string, totalTasks: number): number {
  if (!totalTasks) return 0;
  return Math.min(1, loadProgress(id).done.length / totalTasks);
}
