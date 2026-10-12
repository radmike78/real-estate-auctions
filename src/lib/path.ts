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

export const PATH: PathStep[] = [
  { key: 'learn', n: 1, label: 'Learn', href: '#/learn', blurb: 'How real estate investing works: markets, property types, deals and financing.' },
  { key: 'decide', n: 2, label: 'Decide', href: '#/decide', blurb: 'Choose the kind of property and market that fits your money, time and goals.' },
  { key: 'team', n: 3, label: 'Your team', href: '#/pros', blurb: 'Who helps with a purchase, when you need them, and how to find them.' },
  { key: 'practice', n: 4, label: 'Practice', href: '#/practice', blurb: 'Buy a fictional property step by step before you risk real money.' },
  { key: 'deals', n: 5, label: 'Find deals', href: '#/find-deals', blurb: 'Where to look in your state and county, starting with official sources.' },
  { key: 'analyze', n: 6, label: 'Analyze a deal', href: '#/analyze', blurb: 'Run the numbers on a real deal and work through buying it.' },
];

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
