// The visitor's state (NV, CA, AZ or UT), chosen once and used across the site so people see only the rules
// that apply where they invest. Kept only in this browser; null means "show all four states".
import { useEffect, useState } from 'react';
import { STATES, type StateCode } from './regions';

const KEY = 'deedowl.state.v1';
const EVENT = 'deedowl:state';

const isState = (v: unknown): v is StateCode => STATES.some((s) => s.code === v);

export function getMyState(): StateCode | null {
  try {
    const v = localStorage.getItem(KEY);
    return isState(v) ? v : null;
  } catch {
    return null;
  }
}

export function setMyState(v: StateCode | null) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: not kept, but this page still updates */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
}

/** The chosen state, kept in sync across everything on the page. */
export function useMyState(): [StateCode | null, (v: StateCode | null) => void] {
  const [v, setV] = useState<StateCode | null>(getMyState);
  useEffect(() => {
    const on = (e: Event) => setV((e as CustomEvent<StateCode | null>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return [v, setMyState];
}

const NAMES: [RegExp, StateCode][] = [
  [/Nevada|\(NV\)|^NRS\b|Washoe|Clark County/, 'NV'],
  [/California|\(CA\)|San Diego|Los Angeles/, 'CA'],
  [/Arizona|\(AZ\)|Maricopa|Pima/, 'AZ'],
  [/Utah|\(UT\)|Salt Lake/, 'UT'],
  [/Texas|\(TX\)|Harris County|Bexar|Travis County/, 'TX'],
];

/**
 * The states a piece of text is specifically about, judged from how it starts: "In Nevada, …", "Arizona and Utah
 * have…", "Clark County (NV) Assessor", "NRS 107: …". Empty when the text applies everywhere.
 */
export function statesOf(text: string): StateCode[] {
  const lead = text.match(/^(?:In |For )?((?:(?:Nevada|California|Arizona|Utah)(?:,\s*|\s+and\s+|\s+or\s+)?)+)/);
  if (lead) return NAMES.filter(([re]) => re.test(lead[1])).map(([, c]) => c);
  const head = text.slice(0, 60);
  const tagged = NAMES.filter(([re]) => re.test(head) && /^(?:[A-Z][\w.’' ]*\((?:NV|CA|AZ|UT)\)|NRS\b|Washoe|San Diego County|Los Angeles County)/.test(text)).map(([, c]) => c);
  return tagged;
}

/** Whether to show text for the chosen state (untagged text always shows). */
export const showFor = (state: StateCode | null, text: string) => {
  if (!state) return true;
  const s = statesOf(text);
  return s.length === 0 || s.includes(state);
};

/** The text as it applies to one state: drops sentences about other states (untagged sentences stay). */
export const forStateText = (state: StateCode | null, text: string) =>
  state ? text.split(/(?<=[.!?])\s+(?=[A-Z“"])/).filter((x) => showFor(state, x)).join(' ') : text;
