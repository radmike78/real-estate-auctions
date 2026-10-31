import { workStorage as localStorage } from './workStorage';
// The path to becoming an investor: the six steps the site is built around, in order. Progress (which steps
// someone has opened) is kept only in this browser.
import { useEffect, useState } from 'react';

export type StepKey = 'learn' | 'decide' | 'team' | 'practice' | 'deals' | 'analyze';

export interface PathStep {
  key: StepKey;
  n: number;
  label: string;
  href: string;
  /** One line: what you do in this step. */
  blurb: string;
}

// The order follows the CFPB's homebuying steps (know your goal and budget first; meet lenders once you have a budget
// and priorities, before an offer) and learning research (beginners learn best from worked examples before solving
// problems alone): decide, learn, rehearse at no risk, then line up professionals, find, analyze and buy.
export const PATH: PathStep[] = [
  { key: 'decide', n: 1, label: 'Decide', href: '#/decide', blurb: 'Your goal and your investable cash first, then the strategies that fit them (about 2 minutes).' },
  { key: 'learn', n: 2, label: 'Learn', href: '#/learn', blurb: 'How investing works, starting with the lessons for the strategy you chose.' },
  { key: 'practice', n: 3, label: 'Practice', href: '#/practice', blurb: 'Buy a fictional property step by step before you risk real money.' },
  { key: 'team', n: 4, label: 'Your team', href: '#/pros', blurb: 'Line up a lender, agent and the other professionals before you make an offer or bid.' },
  { key: 'deals', n: 5, label: 'Find deals', href: '#/find-deals', blurb: 'Where to look in your state and county, starting with official sources.' },
  { key: 'analyze', n: 6, label: 'Analyze a deal', href: '#/analyze', blurb: 'Run the numbers on a real deal and work through buying it.' },
];

/** "Step N of 6" for a step's page header. */
export const stepEyebrow = (key: StepKey) => {
  const st = PATH.find((x) => x.key === key)!;
  return `Step ${st.n} of ${PATH.length}`;
};

const KEY = 'deedowl.path.v1';

function load(): StepKey[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is StepKey => PATH.some((s) => s.key === x)) : [];
  } catch {
    return [];
  }
}

/** Remember that someone opened a step (called by each step's page). */
export function markStep(key: StepKey) {
  const seen = load();
  if (seen.includes(key)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen, key]));
  } catch {
    /* private mode: progress isn't kept */
  }
}

/** Mark a step as visited when its page opens. */
export function useMarkStep(key: StepKey) {
  useEffect(() => markStep(key), [key]);
}

/** The steps this browser has opened. */
export function useStepsSeen(): StepKey[] {
  const [seen] = useState(load);
  return seen;
}
