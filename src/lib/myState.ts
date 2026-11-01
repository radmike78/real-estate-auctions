import { workStorage as localStorage } from './workStorage';
// The visitor's state (NV, CA, AZ, UT or TX), chosen once and used across the site so people see only the rules
// that apply where they invest. Kept only in this browser; null means "choose a state before viewing local guidance".
import { useEffect, useState } from 'react';
import { STATES, type StateCode } from './regions';

const KEY = 'deedowl.state.v1';
const EVENT = 'deedowl:state';
let inMemoryState: StateCode | null = null;

const isState = (v: unknown): v is StateCode => STATES.some((s) => s.code === v);

export function getMyState(): StateCode | null {
  try {
    const v = localStorage.getItem(KEY);
    return isState(v) ? v : inMemoryState;
  } catch {
    return inMemoryState;
  }
}

export function setMyState(v: StateCode | null) {
  inMemoryState = v;
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

export const US_STATE_NAMES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

/** Historical examples from a different state do not belong on this state's page. */
// Names that contain a state's name but aren't about that state: a Las Vegas casino, a Las Vegas shopping center, a
// California county, newspapers.
const NOT_A_STATE = /Texas Station|Maryland Square|Nevada County|New York Times|Hawaii Tribune-Herald|Billings, Montana|S\.D\. West Virginia/g;
export function mentionsOtherState(state: StateCode | null, text: string): boolean {
  const own = STATES.find((s) => s.code === state)?.name;
  const plain = text.replace(NOT_A_STATE, '');
  return US_STATE_NAMES.some((name) => name !== own && plain.includes(name));
}

/** Explicit place references, including examples that do not begin with a state name. */
export const statesMentioned = (text: string): StateCode[] => NAMES.filter(([re]) => re.test(text)).map(([, code]) => code);

/**
 * The states a piece of text is specifically about, judged from how it starts: "In Nevada, …", "Arizona and Utah
 * have…", "Clark County (NV) Assessor", "NRS 107: …". Empty when the text applies everywhere.
 */
export function statesOf(text: string): StateCode[] {
  const lead = text.match(/^(?:(?:In|For) (?:a |an )?)?((?:(?:Nevada|California|Arizona|Utah|Texas)(?:,\s*|\s+and\s+|\s+or\s+)?)+)/);
  if (lead) return NAMES.filter(([re]) => re.test(lead[1])).map(([, c]) => c);
  const head = text.slice(0, 60);
  const tagged = NAMES.filter(([re]) => re.test(head) && /^(?:[A-Z][\w.’' ]*\((?:NV|CA|AZ|UT|TX)\)|NRS\b|Washoe|San Diego County|Los Angeles County)/.test(text)).map(([, c]) => c);
  return tagged;
}

/** Whether to show text for the chosen state (untagged text always shows). */
export const showFor = (state: StateCode | null, text: string) => {
  if (!state) return true;
  const s = statesOf(text);
  return s.length === 0 || s.includes(state);
};

const NAME_OF: Record<StateCode, string> = { NV: 'Nevada', CA: 'California', AZ: 'Arizona', UT: 'Utah', TX: 'Texas' };

/**
 * Once the reader has picked a state, "In California, the county…" says the state twice: drops that lead-in ("In
 * California, ", "For California, ", "California: ") from each sentence about the chosen state, capitalizing what follows.
 * A lead-in listing several states that include the chosen one ("In California, Nevada and Utah, ") is dropped whole,
 * since the sentence holds for the reader's state. Lead-ins naming only other states are kept.
 */
export function dropStateLead(text: string, state: StateCode | null): string {
  if (!state) return text;
  const name = NAME_OF[state];
  // Not when another state follows ("In California, Nevada and Utah, …"): that sentence covers several states.
  const lead = new RegExp(`(^|[.!?]\\*?\\s+)(?:(?:In|For) ${name},|${name}:)\\s+(?!(?:Nevada|California|Arizona|Utah|Texas)(?:,|\\s+and\\b|\\s+or\\b))(\\S)`, 'g');
  const S = '(?:Nevada|California|Arizona|Utah|Texas)';
  const list = new RegExp(`(^|[.!?]\\*?\\s+)(?:In|For) (${S}(?:, ${S})*,? (?:and|or) ${S}),\\s+(?!${S}(?:,|\\s+and\\b|\\s+or\\b))(\\S)`, 'g');
  return text
    .replace(lead, (_m, before: string, first: string) => before + first.toUpperCase())
    .replace(list, (m, before: string, states: string, first: string) => (states.includes(name) ? before + first.toUpperCase() : m));
}

// After a sentence about another state, the sentences that follow belong to it too ("In Texas, the notice of sale is
// posted 21 days ahead. The sale is held on the first Tuesday."), until one names a state or is plainly general.
export const GENERAL_AGAIN = /^(?:Other states|In other states|In every state|Every state|In all (?:five|four) states|Elsewhere|Everywhere|Rules differ|Check your state|Wherever you buy)\b/;

/**
 * The text as it applies to one state: drops sentences about other states (untagged sentences stay), and the sentences
 * that continue them, so no orphaned "there", "that rule" or other state's detail is left behind.
 */
export const forStateText = (state: StateCode | null, text: string) => {
  if (!state) return text;
  let dropped = false;
  return text
    .split(/(?<=[.!?]\*?)\s+(?=[A-Z“"])/)
    .filter((x) => {
      const tagged = statesOf(x).length > 0;
      dropped = tagged ? !showFor(state, x) : dropped && !GENERAL_AGAIN.test(x);
      // A mid-sentence example from another covered state must not bypass the lead-in classifier: it and what follows
      // go. A state outside our five ("as Arkansas found") drops only its own sentence; what follows is general again.
      const plain = dropStateLead(x, state);
      if (mentionsOtherState(state, plain)) {
        if (statesMentioned(plain).some((c) => c !== state)) dropped = true;
        else return false;
      }
      return !dropped;
    })
    .map((x) => dropStateLead(x, state))
    .join(' ');
};
