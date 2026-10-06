// Progress through "Buy a rental, start to finish", kept in this browser (and in the toolkit's backup).
import type { Verdict } from './rentalCase';

export const CASE_KEY = 'deedowl.case.v1';
/** The Texas practice house keeps its own progress. */
export const CASE_KEY_TX = 'deedowl.case.tx.v1';
const keyFor = (state?: string | null) => (state === 'TX' ? CASE_KEY_TX : CASE_KEY);

export interface CaseProgress {
  /** Task keys ("stage/task") that are finished. */
  done: string[];
  /** The answer you settled on: a choice index, the options you ticked, a number, or what you wrote. */
  answers: Record<string, number | number[] | string>;
  /** How your first try went, for the summary. */
  first: Record<string, Verdict | 'right' | 'wrong'>;
  /** The step where you walked away, if you did. */
  walked?: string;
}

export const emptyCase = (): CaseProgress => ({ done: [], answers: {}, first: {} });

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Keeps only well-formed values, so old or restored data can't break the page. */
export function cleanCase(v: unknown): CaseProgress {
  if (!isRecord(v)) return emptyCase();
  const done = Array.isArray(v.done) ? v.done.filter((x): x is string => typeof x === 'string' && x.length < 80).slice(0, 200) : [];
  const answers: CaseProgress['answers'] = {};
  if (isRecord(v.answers))
    for (const [k, a] of Object.entries(v.answers).slice(0, 200)) {
      if (typeof a === 'number' && Number.isFinite(a)) answers[k] = a;
      else if (typeof a === 'string') answers[k] = a.slice(0, 2000);
      else if (Array.isArray(a) && a.every((x) => typeof x === 'number')) answers[k] = a.slice(0, 20) as number[];
    }
  const first: CaseProgress['first'] = {};
  if (isRecord(v.first))
    for (const [k, a] of Object.entries(v.first).slice(0, 200)) if (a === 'best' || a === 'ok' || a === 'poor' || a === 'right' || a === 'wrong') first[k] = a;
  const walked = typeof v.walked === 'string' && v.walked.length < 40 ? v.walked : undefined;
  return { done, answers, first, ...(walked ? { walked } : {}) };
}

export function loadCase(state?: string | null): CaseProgress {
  try {
    return cleanCase(JSON.parse(localStorage.getItem(keyFor(state)) ?? 'null'));
  } catch {
    return emptyCase();
  }
}

export function saveCase(p: CaseProgress, state?: string | null) {
  try {
    localStorage.setItem(keyFor(state), JSON.stringify(p));
  } catch {
    /* private mode: progress lasts for this visit */
  }
}
