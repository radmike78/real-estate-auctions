import type { BidInputs } from '../lib/bidCalc';
import type { PracticeProperty } from './properties';

export type SaleKey = 'tax' | 'sid' | 'foreclosure' | 'hoa' | 'sheriff' | 'irs' | 'reo' | 'short';

export interface Choice {
  label: string;
  correct: boolean;
  feedback: string;
}

export interface ContactMessage {
  label: string; // what the button says ("Ask about quiet title")
  send: string; // the message the buyer sends
  reply: string; // the simulated reply
}

export type Task =
  | { kind: 'read'; id: string; title: string; body: string[] }
  | { kind: 'checklist'; id: string; title: string; intro?: string; items: { text: string; detail?: string }[] }
  | { kind: 'decision'; id: string; title: string; question: string; choices: Choice[] }
  | { kind: 'contact'; id: string; role: string; person: string; why: string; messages: ContactMessage[] }
  | { kind: 'document'; id: string; title: string; from: string; purpose: string; lines: { label: string; value: string }[]; note?: string }
  | { kind: 'numbers'; id: string; title: string; intro: string; inputs: BidInputs; compareTo: { label: string; amount: number }; lesson: string }
  | { kind: 'event'; id: string; title: string; body: string[] }
  /** An owner-occupant's budget: the most to offer is the lower of what comparable sales and the loan support. */
  | { kind: 'afford'; id: string; title: string; intro: string; asIsValue: number; loanAmount: number; downPct: number; repairs: number; list: number; maxOffer: number; lesson: string };

export interface Stage {
  key: string;
  title: string;
  summary: string;
  tasks: Task[];
}

export interface Scenario {
  id: string; // `${sale}-${property.id}`
  sale: SaleKey;
  saleTitle: string; // "Clark County tax sale (tax deed)"
  property: PracticeProperty;
  youGet: string;
  headline: string; // one line on the practice listing card
  sale_facts: { label: string; value: string }[];
  stages: Stage[];
  playbookKey: string;
}
