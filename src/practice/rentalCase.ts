// "Buy a rental, start to finish": one fictional purchase through an agent, worked from your budget to the first
// months of renting it out. Each step hands you real documents to read (a listing, comparable rents and sales, a loan
// term sheet, an insurance quote, a contract, an inspection report, an appraisal, a title commitment, a closing
// statement) and asks you to decide. Things go wrong on purpose: the sewer line, the appraisal, a missing credit, a
// fake wiring email. Walking away at the right moment counts as a good result.
//
// Accuracy rules for this file:
// - Everything about the property, the people and the companies is fictional and labeled that way.
// - Contract terms (deadlines, deposit) are this practice contract's terms, not a state's law. Real contracts differ.
// - The rate, quote and costs are practice numbers, not current quotes.
// - Each state's version names its state wherever it uses that state's rule. Nevada: deposits and entry (NRS 118A.242,
//   118A.330). California, Arizona and Utah: see the notes above each state's settings below. Texas: the TREC resale contract and its addenda (20-19, 36-11, 40-11, 49-1), mechanic's liens (Property
//   Code 53.052, 53.158), rekeying (92.156), deposits (92.103, 92.104) and selection criteria (92.3515).
// - Federal rules: FCRA adverse-action notices (FTC guidance for landlords), lead disclosure for homes built before
//   1978 (40 CFR 745 subpart F), Fannie Mae's 2% limit on seller credits for investment properties (B3-4.1-02).
// - Every money figure comes from N below, so the steps always agree; rentalCase.test.ts checks the arithmetic.

/** Monthly principal and interest on a fixed-rate loan. */
export function payment(loan: number, rate = N0.rate, years = 30): number {
  const i = rate / 12;
  return Math.round((loan * i) / (1 - Math.pow(1 + i, -years * 12)));
}

const N0 = { rate: 0.0675 };

export type Verdict = 'best' | 'ok' | 'poor';

export interface CaseChoice {
  label: string;
  verdict: Verdict;
  /** Why this works or doesn't, with the evidence. */
  why: string;
  /** Choosing it ends the purchase: a walk-away, which can be the right call. */
  walk?: boolean;
  /** A line for the evidence log when this choice is made (for choices that change what happened). */
  log?: string;
}

export interface CaseDoc {
  /** e.g. "Listing sheet", "Inspection report (extract)". */
  kind: string;
  title: string;
  from: string;
  rows?: [string, string][];
  table?: { head: string[]; rows: string[][] };
  notes?: string[];
  /** The annotated guide to the real document this teaching extract stands for (docGuides.ts). */
  guide?: string;
  /** Shown only once this question in the step is answered (a contract appears after you make the offer). */
  after?: string;
}

/** Asked only when an earlier question in the same step got one of these answers (choice numbers, from 0). */
export interface TaskIf {
  if?: { task: string; is: number[] };
}

export type CaseTask = TaskIf &
  (
    | { kind: 'choice'; id: string; prompt: string; choices: CaseChoice[]; /** How a different fact would change the answer. */ ifDifferent?: string }
    | { kind: 'multi'; id: string; prompt: string; options: { label: string; right: boolean; why: string }[] }
    | { kind: 'number'; id: string; prompt: string; answer: number; tolerance: number; worked: string[]; hint?: string }
    | { kind: 'write'; id: string; prompt: string; to: string; model: string }
  );

export interface CaseStage {
  key: string;
  title: string;
  /** What you'll have when this step is finished. */
  outcome: string;
  brief: string[];
  docs: CaseDoc[];
  tasks: CaseTask[];
  /** Rows for your evidence log once the step is done. */
  log: { area: string; finding: string; open?: string }[];
  /** Deadlines this step adds to your calendar. */
  dates?: { when: string; what: string }[];
  learnMore?: { label: string; href: string }[];
}

/** The questions a step asks, given your answers so far: a question with `if` appears only after the answer it follows. */
export function tasksFor(st: CaseStage, answers: Record<string, unknown>): CaseTask[] {
  return st.tasks.filter((t) => !t.if || t.if.is.includes(answers[`${st.key}/${t.if.task}`] as number));
}

/** The step where your answers say you walked away, if any: the first one with a walk-away answer showing. */
export function walkedFrom(answers: Record<string, unknown>, stages: CaseStage[] = RENTAL_CASE): string | undefined {
  for (const st of stages)
    for (const t of tasksFor(st, answers)) {
      const a = answers[`${st.key}/${t.id}`];
      if (t.kind === 'choice' && typeof a === 'number' && t.choices[a]?.walk && t.choices[a].verdict !== 'poor') return st.key;
    }
  return undefined;
}

/**
 * Where "Continue the purchase" goes: the first step with a task still open (counting only the questions your answers
 * show), or the deal packet once every step is done or you walked away.
 */
export function caseResume(stages: CaseStage[], p: { done: string[]; answers: Record<string, unknown>; walked?: string }): { key: string; packet: boolean } {
  if (p.walked) return { key: 'packet', packet: true };
  const next = stages.find((st) => !tasksFor(st, p.answers).every((t) => p.done.includes(`${st.key}/${t.id}`)));
  return next ? { key: next.key, packet: false } : { key: 'packet', packet: true };
}

/** Steps before this one have no contract yet: walking away there costs nothing. */
export const CONTRACT_FROM = 'offer';

export const CASE_TITLE = 'Buy a rental, start to finish';


type Nums = Record<string, number>;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** What changes from one state's practice house to another's: place, costs, contract terms and landlord rules. */
interface CaseConfig {
  state: 'NV' | 'TX' | 'CA' | 'AZ' | 'UT';
  /** What you get back when you leave inside a contract deadline, if more than "you keep your earnest money". */
  walkKept?: (n: Nums) => string;
  stateName: string;
  abbr: string;
  city: string;
  savings: number;
  /** The property tax you'll pay as an owner who doesn't live there. */
  taxYear: number;
  /** What the listing shows for last year's taxes. */
  listedTax: string;
  insuranceYear: number;
  deductible: string;
  notCovered: string;
  exclusions: string;
  insuranceLog: string;
  /** Leased comparables A, B, C, D and the asking rent of E. */
  rents: [number, number, number, number, number];
  rent: number;
  rentClaim: number;
  loanTasks: (n: Nums) => CaseTask[];
  contractNote: string;
  contractRows: (n: Nums) => [string, string][];
  dates: { when: string; what: string }[] | ((n: Nums) => { when: string; what: string }[]);
  /** Extra questions at the end of the offer step (a state's contract deadlines). */
  offerTasks?: (n: Nums) => CaseTask[];
  /** Extra questions before the low-appraisal decision (what the state's appraisal right requires). */
  appraisalTasks?: (n: Nums) => CaseTask[];
  depositLog: (n: Nums) => string;
  roofFinding: string;
  /** The part of the roof that's wearing out, as named in questions: the inspection's own words. */
  roofPart: string;
  cancelInspection: string;
  leaveInspection: string;
  lateInspection: string;
  /** When answering the seller's reply to a repair request is due, if not the end of the inspection period (Day 10). */
  counterDue?: {
    ask: string;
    accept: string;
    /** The walk-away choice at that deadline. */
    cancel: string;
    late: string;
    why: string;
    /** When the answer is due, as a phrase for the step outcome and the log ("by …"). */
    by: string;
  };
  /** Why ignoring the HOA's leasing rules is wrong, if this state's contract has no separate HOA review period. */
  hoaRulesWhy?: string;
  /** The appraisal-and-title step's second sentence, when the title commitment and HOA rules came earlier (Utah). */
  titleBrief?: string;
  /** An extra line for the inspection step's brief (Utah: the title and HOA documents to read before due diligence ends). */
  inspectionBrief?: string;
  /** The HOA leasing-rules question, when the rules were read during due diligence. */
  hoaPrompt?: string;
  cancelShort: string;
  periodName: string;
  /** The ways out the offer keeps, in this state's words. */
  protections: string;
  licenseQuestion: string;
  appraisalName: string;
  cancelAppraisal: string;
  leaveAppraisal: string;
  /** Extra advice after the seller agrees to the lower price (e.g. Texas: put it in a signed amendment). */
  appraisalAskNote?: string;
  /** How the purchase log describes the price cut; defaults to "Price lowered to X under the <appraisalName>." */
  appraisalLog?: (finalPrice: string) => string;
  roofer: string;
  lienWhy: string;
  earnestPaid: string;
  earnestCredit: (n: Nums) => string;
  earnestShort: string;
  /** Who the earnest-money wiring email pretends to be from, and who to call (defaults: escrow). */
  wireFrom?: string;
  wireCall?: string;
  rentRulesNote: string;
  rekeyWhy: string;
  rentTasks: (n: Nums) => CaseTask[];
  rentLog: (n: Nums) => string;
}

const NV: CaseConfig = {
  state: 'NV',
  stateName: 'Nevada',
  abbr: 'NV',
  city: 'Henderson',
  savings: 142_000,
  taxYear: 1_704,
  listedTax: '$1,704',
  insuranceYear: 1_080,
  deductible: '$2,500',
  notCovered: 'Flood. Earthquake.',
  exclusions: 'This one already excludes flood, earthquake, and vandalism after 60 empty days.',
  insuranceLog: 'No flood or earthquake. 60-day vacancy limit.',
  rents: [2_100, 2_200, 2_150, 2_750, 2_395],
  rent: 2_150,
  rentClaim: 2_400,
  loanTasks: () => [],
  contractNote: 'The deadlines below are this practice contract’s terms. Real contracts set their own, and missing one can cost you your deposit.',
  contractRows: (n) => [
    ['Day 0', 'The day the signed acceptance is delivered to you. The other deadlines count from it.'],
    ['Earnest money', `${usd(n.earnest)}, to escrow within 3 business days of Day 0`],
    ['Inspection period', 'Ends Day 10. You can cancel for any reason before then.'],
    ['Appraisal contingency', 'Ends Day 17'],
    ['Loan contingency', 'Ends Day 21'],
    ['HOA documents', '5 days to review, counted from the day you receive them'],
    ['Closing', 'Day 30'],
    ['Counting days', 'Calendar days unless it says business days. A deadline on a weekend or holiday moves to the next business day.'],
  ],
  dates: [
    { when: 'Day 0', what: 'The signed acceptance is delivered to you. Every deadline below counts from here.' },
    { when: 'Within 3 business days of Day 0', what: 'Earnest money to escrow (confirm the instructions by phone first). You: the buyer.' },
    { when: 'Day 10', what: 'Inspection period ends: cancel, ask for changes, or go ahead in writing. You, with your agent.' },
    { when: '5 days after you receive the HOA documents', what: 'HOA review ends: cancel in writing if the rules block your plan. Write down the day they arrive.' },
    { when: 'Day 17', what: 'Appraisal contingency ends. You, with your lender’s appraisal.' },
    { when: 'Day 21', what: 'Loan contingency ends. Your lender confirms the loan is approved.' },
    { when: 'Day 30', what: 'Closing. Escrow and the title company.' },
  ],
  depositLog: (n) => `Earnest money ${usd(n.earnest)}`,
  roofFinding: 'Tile is fine. The underlayment beneath it has about 4–6 years left.',
  roofPart: 'roof underlayment',
  cancelInspection: 'Cancel before Day 10 and get the earnest money back.',
  leaveInspection: 'Your contract’s inspection period lets you leave with your deposit.',
  lateInspection: 'After Day 10, this contract’s inspection period is over. You’d lose the right to cancel for the inspection, and maybe your deposit.',
  cancelShort: 'Cancel before Day 10.',
  periodName: 'inspection deadline',
  protections: 'inspection, appraisal and loan contingencies',
  licenseQuestion: '“Are you licensed for this work in Nevada, and can I see your license number?”',
  appraisalName: 'appraisal contingency',
  cancelAppraisal: 'Cancel before Day 17 and get the deposit back.',
  leaveAppraisal: 'Your appraisal contingency protects your deposit until Day 17.',
  roofer: 'Desert Example Roofing',
  lienWhy: 'It’s a recorded claim against the house. In Nevada, a mechanic’s lien lapses after 6 months unless the contractor sues to enforce it or a recorded extension agreement extends it (NRS 108.233). Even so, the title company wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'into escrow within 3 business days of acceptance',
  earnestCredit: (n) => `${usd(n.earnest)} earnest money`,
  earnestShort: 'earnest money',
  rentRulesNote: 'Rules on deposits and entry are state law. The ones below are Nevada’s, because this practice house is in Nevada.',
  rekeyWhy: 'You don’t know who else has keys.',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'nv-deposit',
      prompt: `In Nevada, what is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: `${usd(n.maxDeposit)}: 3 months’ rent, counting any last month’s rent you collect`, verdict: 'best', why: 'In Nevada, the deposit plus any last month’s rent can’t exceed 3 months’ rent. You must return it, with an itemized list of deductions, within 30 days after the tenancy ends (NRS 118A.242).' },
        { label: 'Whatever the tenant agrees to', verdict: 'poor', why: 'In Nevada, the law caps it at 3 months’ rent (NRS 118A.242).' },
        { label: `${usd(n.rent)}: 1 month’s rent`, verdict: 'ok', why: 'A common choice, and lawful. But it’s your choice, not the limit.' },
      ],
    },
    {
      kind: 'choice',
      id: 'nv-entry',
      prompt: 'In Nevada, your tenant’s faucet leaks and you want to fix it. What notice do you give before going in?',
      choices: [
        { label: 'At least 24 hours’ notice, and enter only during normal business hours, unless it’s an emergency or the tenant agrees otherwise.', verdict: 'best', why: 'That’s Nevada’s rule (NRS 118A.330).' },
        { label: 'None. You own the house.', verdict: 'poor', why: 'Once it’s rented, the tenant has the right to possession. In Nevada, give 24 hours’ notice except in an emergency.' },
      ],
    },
  ],
  rentLog: (n) => `Deposit at or under ${usd(n.maxDeposit)}; returned within 30 days (Nevada).`,
};

// Texas: same house and price, but the costs and the paperwork are Texas's. Property tax is a practice rate of about
// 2.1% of value with no homestead exemption (rates come from the appraisal district and each taxing unit); rents are
// higher to match. The contract is the TREC resale contract 20-19 with its addenda: option period and fee (paragraph
// 5), HOA (36-11), financing (40-11) and appraisal (49-1).
const TX: CaseConfig = {
  state: 'TX',
  stateName: 'Texas',
  abbr: 'TX',
  city: 'Round Rock',
  savings: 146_000,
  taxYear: 6_072,
  listedTax: '$4,672 (the seller’s bill, with their homestead exemption)',
  insuranceYear: 2_160,
  deductible: '$2,500, or 2% of the dwelling coverage ($5,200) for wind and hail',
  notCovered: 'Flood.',
  exclusions: 'This one excludes flood, has a separate 2% deductible for wind and hail, and drops vandalism after 60 empty days.',
  insuranceLog: 'No flood. 2% wind and hail deductible. 60-day vacancy limit.',
  rents: [2_450, 2_550, 2_500, 3_150, 2_745],
  rent: 2_500,
  rentClaim: 2_750,
  loanTasks: (n) => [
    {
      kind: 'choice',
      id: 'tx-taxes',
      prompt: 'The listing shows $4,672 in property taxes last year. What do you budget, as an owner who won’t live there?',
      choices: [
        { label: `About ${usd(6_072)} a year (${usd(n.tax)} a month): the full bill with no homestead exemption.`, verdict: 'best', why: 'The seller’s bill was lower because they lived there. Texas gives the homestead exemption, including $140,000 off the school district value, only to an owner’s main home (Tax Code 11.13). A rental can’t have it. This practice uses about 2.1% of value; real rates come from the appraisal district and each taxing unit.' },
        { label: '$4,672: that’s what the listing says.', verdict: 'poor', why: 'That bill had the seller’s homestead exemption. Your bill as a landlord will be higher, and the gap comes out of your cash flow every month.' },
        { label: 'Ask the appraisal district for the value and each taxing unit for its rate, and budget from those.', verdict: 'ok', why: 'The right check before you offer. Until you have the numbers, budget the full bill, not the seller’s.' },
      ],
    },
  ],
  contractNote: 'The contract is the TREC resale contract (form 20-19) with its financing, appraisal and HOA addenda. The day counts below are this practice contract’s choices; real contracts fill in their own, and missing one can cost you your earnest money.',
  contractRows: (n) => [
    ['Effective Date (Day 0)', 'The day the last of you signs and the acceptance is delivered. The other deadlines count from it.'],
    ['Earnest money and option fee (20-19, paragraph 5A)', `${usd(n.earnest - 200)} earnest money and a $200 option fee, to the title company (the escrow agent) within 3 days after the Effective Date, paid together or separately. If the 3rd day is a Saturday, Sunday or legal holiday, you have until the end of the next day that isn’t one. Both are credited to you at closing.`],
    ['If the earnest money is late (paragraph 5C)', 'The seller can end the contract, or use its other remedies, by giving you notice before you deliver it.'],
    ['If the option fee is late (paragraph 5D)', 'You have no option period: no right to end the contract for any reason.'],
    ['Option period (paragraph 5B)', 'Ends at 5 p.m. on Day 10. You can end the contract for any reason before then and get the earnest money back; the seller keeps the option fee. The weekend and holiday extension for payments doesn’t move this deadline.'],
    ['Appraisal (addendum 49-1, option 3)', `An added right to end the contract: by Day 17, if the lender’s appraisal is under ${usd(n.offer)}, give the seller your notice of termination and a copy of the appraisal. The earnest money comes back to you.`],
    ['Financing: Buyer Approval (addendum 40-11, paragraph 2A)', 'If the lender won’t approve you (your income, assets or credit), you can end the contract by Day 21: give the seller notice of termination and a copy of the lender’s written statement of its reasons. The earnest money comes back to you. After Day 21, the contract no longer depends on Buyer Approval.'],
    ['Financing: Property Approval (addendum 40-11, paragraph 2B)', 'If the lender decides the house doesn’t meet its requirements (the appraisal, insurability, or repairs it requires), you can end the contract on or before the 3rd day before closing, Day 27 here: notice of termination plus the lender’s written statement of its reasons. The earnest money comes back to you. If you don’t, Property Approval counts as obtained. (Options 1 and 2 of the appraisal addendum would waive this right for a low appraisal; this contract uses option 3, which adds the Day 17 right instead.)'],
    ['HOA (addendum 36-11)', 'You can end the contract within 3 days after you receive the subdivision information (the HOA’s rules and resale certificate), if that’s before closing.'],
    ['Seller’s Water Disclosure (paragraph 7I)', 'Box 3 is checked: the seller doesn’t have to deliver it, because every statement in 7I(3) is true (no well, pond, lake or water tank the seller knows of, no surface water rights or severed groundwater rights, and water only from the city’s utility, named in 7I(3)(e)). If box 2 had been checked, you could end the contract within 7 days after receiving it, or before closing if sooner.'],
    ['Closing', 'Day 30, at the title company'],
    ['Counting days', 'Calendar days. Only the payment deadlines move past a weekend or legal holiday; the option period ends at 5 p.m. on its last day either way. Ask your agent how your contract treats any other deadline that lands on a weekend.'],
  ],
  dates: (n) => [
    { when: 'Day 0', what: 'The Effective Date. Every deadline below counts from here.' },
    { when: 'Within 3 days after Day 0', what: 'Earnest money and option fee to the title company (confirm the instructions by phone first). You: the buyer. If the 3rd day is a Saturday, Sunday or legal holiday, the deadline moves to the end of the next day that isn’t one. A late option fee means no option period (20-19, 5D); late earnest money lets the seller end the contract by notice before you deliver it (5C).' },
    { when: '5 p.m., Day 10', what: 'Option period ends: end the contract, ask for changes, or go ahead, in writing. You, with your agent. It doesn’t move for a weekend or holiday.' },
    { when: '3 days after you receive the subdivision information', what: 'HOA addendum: end the contract in writing if the rules block your plan. Write down the day it arrives.' },
    { when: 'Day 17', what: `Appraisal addendum (49-1, option 3): if the lender’s appraisal is under ${usd(n.offer)} and you want out, deliver your notice of termination and a copy of the appraisal to the seller. You, with your agent.` },
    { when: 'Day 21', what: 'Financing addendum, Buyer Approval (40-11, 2A): if the lender won’t approve you (income, assets or credit), deliver notice of termination and a copy of the lender’s written statement of its reasons to the seller. After this day, the contract no longer depends on Buyer Approval.' },
    { when: 'Day 27 (the 3rd day before closing)', what: 'Financing addendum, Property Approval (40-11, 2B): if the lender rejects the house (appraisal, insurability or required repairs), deliver notice of termination and the lender’s written statement to the seller by this day. After it, Property Approval counts as obtained.' },
    { when: 'Day 30', what: 'Closing at the title company.' },
  ],
  depositLog: (n) => `Earnest money and option fee ${usd(n.earnest)}`,
  walkKept: (n) => `so your ${usd(n.earnest - 200)} earnest money comes back; the seller keeps the $200 option fee`,
  roofFinding: 'Composition shingles with about 4–6 years left.',
  roofPart: 'composition shingle roof',
  cancelInspection: 'End the contract before 5 p.m. on Day 10, in the option period, and get the earnest money back.',
  leaveInspection: 'Your option period lets you leave for any reason: you get the earnest money back, and the seller keeps the $200 option fee.',
  lateInspection: 'After 5 p.m. on Day 10 the option period is over. You’d lose the right to end the contract over the inspection, and maybe your earnest money.',
  cancelShort: 'End it before 5 p.m. on Day 10.',
  periodName: 'end of the option period',
  protections: 'an option period and the financing and appraisal addenda',
  licenseQuestion: '“Are you a licensed plumber (the Texas State Board of Plumbing Examiners licenses plumbers), and can I see your license number?”',
  appraisalName: 'appraisal addendum',
  cancelAppraisal: 'By Day 17, give the seller your notice of termination and a copy of the lender’s appraisal (appraisal addendum, option 3), and get the earnest money back.',
  leaveAppraisal: 'Option 3 of your appraisal addendum (TREC 49-1) lets you end the contract when the lender’s appraisal is under $289,000, if the seller gets your notice of termination and a copy of the appraisal by Day 17.',
  appraisalAskNote: 'Get the new price in a signed amendment before Day 17; after that, the addendum’s right to end the contract is gone.',
  appraisalLog: (finalPrice) => `Price lowered to ${finalPrice} by a signed amendment, after you used the appraisal addendum’s right to end the contract as leverage.`,
  roofer: 'Example Roofing of Texas',
  lienWhy: 'It’s a recorded claim against the house. In Texas, a contractor on a home job must file the lien by the 15th day of the third month after the work ends, and sue to enforce it within a year after that filing deadline, unless a recorded written agreement with the owner extended that to 2 years after filing (Property Code 53.052, 53.158). Either way, the title company wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'to the title company within 3 days after the Effective Date',
  earnestCredit: (n) => `${usd(n.earnest)} in earnest money and option fee`,
  earnestShort: 'earnest money and option fee',
  rentRulesNote: 'Rules on deposits, locks and applications are state law. The ones below are Texas’s, because this practice house is in Texas.',
  rekeyWhy: 'You don’t know who else has keys. Texas also requires rekeying no later than 7 days after each new tenant moves in (Property Code 92.151(15), 92.156).',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'tx-deposit',
      prompt: `In Texas, what is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: 'Texas law sets no limit. Pick an amount the market accepts, and return it with an itemized list of deductions within 30 days after the tenant moves out.', verdict: 'best', why: 'Texas doesn’t cap deposits, but you must refund them, less itemized deductions for damage beyond normal wear and tear, within 30 days after the tenant leaves (Property Code 92.103, 92.104). The clock waits until the tenant gives you a written forwarding address (Property Code 92.107).' },
        { label: `${usd(n.rent * 3)}, the legal maximum`, verdict: 'poor', why: 'Texas has no legal maximum; 3 months’ rent is Nevada’s cap. And a very high deposit can cost you good tenants.' },
        { label: `${usd(n.rent)}: 1 month’s rent`, verdict: 'ok', why: 'A common choice, and lawful. But it’s your choice, not a limit.' },
      ],
    },
    {
      kind: 'choice',
      id: 'tx-criteria',
      prompt: 'In Texas, you hand someone your rental application. What has to go with it?',
      choices: [
        { label: 'A printed notice of your selection criteria (criminal, rental and credit history, income, and incomplete information), with an acknowledgment the applicant signs.', verdict: 'best', why: 'Texas requires it (Property Code 92.3515). If you reject an applicant without having given it, you must refund the application fee and deposit.' },
        { label: 'Nothing. You can explain your reasons if you turn them down.', verdict: 'poor', why: 'In Texas the criteria have to come with the application, and the signed acknowledgment proves they did.' },
      ],
    },
  ],
  rentLog: () => 'Selection criteria given with a signed acknowledgment. Deposit returned within 30 days with an itemized list (Texas; the clock waits until the tenant gives you a written forwarding address, Property Code 92.107).',
  offerTasks: () => [
    {
      kind: 'choice',
      id: 'tx-late-fee',
      prompt: 'Day 0 was a Thursday, so the 3rd day after it is a Sunday. Your option fee reaches the title company on Monday, and Monday isn’t a legal holiday. Is it on time, and does your option period still end on Day 10?',
      choices: [
        { label: 'Yes, it’s on time, and the option period still ends at 5 p.m. on Day 10.', verdict: 'best', why: 'Under the TREC resale contract, when the last day to deliver the earnest money or option fee is a Saturday, Sunday or legal holiday, you have until the end of the next day that isn’t one (20-19, paragraph 5A(2)). That extension is for the payments only: the option period still ends at 5 p.m. on its last day (5B).' },
        { label: 'No: it was due Sunday, so you’ve lost the option period.', verdict: 'poor', why: 'The contract moves a payment deadline that lands on a weekend or legal holiday to the end of the next day that isn’t one (20-19, paragraph 5A(2)). Monday counts. Had the fee come late, you’d have no option period (5D).' },
        { label: 'Yes, and the option period moves a day later too.', verdict: 'poor', why: 'The weekend extension in paragraph 5A(2) covers delivering the earnest money and option fee, not the end of the option period. That stays at 5 p.m. on Day 10.' },
      ],
      ifDifferent: 'If the option fee came late, you’d have no option period at all (20-19, 5D). If the earnest money came late, the consequence is different: the seller could end the contract, or use its other remedies, by notice before you delivered it (5C).',
    },
    {
      kind: 'choice',
      id: 'tx-approval',
      prompt: 'Suppose it’s Day 25, after the Buyer Approval deadline (Day 21). The lender says the insurer won’t cover the house until the roof is replaced, so it won’t fund the loan. Can you still end the contract and get your earnest money back?',
      choices: [
        { label: 'Yes: that’s a Property Approval problem. By Day 27 (the 3rd day before closing), give the seller notice of termination and a copy of the lender’s written statement of its reasons.', verdict: 'best', why: 'The Third Party Financing Addendum keeps two rights apart (TREC 40-11, paragraph 2). Buyer Approval (2A) is about you: your income, assets and credit, with the deadline you negotiated. Property Approval (2B) is about the house: the appraisal, insurability and repairs the lender requires, up to the 3rd day before closing. Either way, you need the notice and the lender’s written statement.' },
        { label: 'No: the financing deadline was Day 21, so the earnest money is at risk.', verdict: 'poor', why: 'Day 21 is the Buyer Approval deadline (40-11, 2A), about your income, assets and credit. A problem with the house itself falls under Property Approval (2B), which runs to the 3rd day before closing.' },
        { label: 'Yes, any time before closing, by telling the seller.', verdict: 'poor', why: 'The deadline is the 3rd day before closing, Day 27 here, and the notice needs a copy of the lender’s written statement of its reasons (40-11, 2B). Time is of the essence in that paragraph.' },
      ],
      ifDifferent: 'If instead the lender had turned you down on Day 20 over your income or credit, that’s Buyer Approval (2A): deliver the notice and the lender’s statement by Day 21. After Day 21, the contract no longer depends on Buyer Approval: a later turn-down over your own finances doesn’t let you end it under 2A, and your earnest money can be at risk.',
    },
  ],
  appraisalTasks: (n) => [
    {
      kind: 'multi',
      id: 'tx-appraisal-notice',
      prompt: `To end the contract under option 3 of your appraisal addendum (TREC 49-1) because the appraisal is under ${usd(n.offer)}, what must the seller get from you by Day 17? Choose all that apply.`,
      options: [
        { label: 'Your notice of termination, in writing', right: true, why: 'The contract’s notices must be in writing (20-19, paragraph 21), and option 3 gives you until Day 17 here.' },
        { label: 'A copy of the lender’s appraisal', right: true, why: 'Option 3 lets you end the contract only if you deliver a copy of the appraisal to the seller (49-1, option 3(ii)).' },
        { label: 'A written statement from the lender saying it won’t make the loan', right: false, why: 'That’s what the financing addendum asks for (40-11, paragraph 2). Option 3 of the appraisal addendum asks for the appraisal itself.' },
        { label: 'A second appraisal you ordered yourself', right: false, why: 'Option 3 runs on the appraisal your lender obtained, not one you order.' },
      ],
    },
  ],
};

// California: same house and price. Buying resets the property tax to about 1% of the price plus local charges
// (Proposition 13; this practice uses about 1.1%), so the seller's bill isn't yours. The contract is the C.A.R.
// Residential Purchase Agreement, where you remove contingencies in writing. Deposits: Civil Code 1950.5. Entry: 1954. Rent cap and
// just cause: Civil Code 1947.12 and 1946.2.
const CA: CaseConfig = {
  state: 'CA',
  stateName: 'California',
  abbr: 'CA',
  city: 'Bakersfield',
  savings: 143_000,
  taxYear: 3_220,
  listedTax: '$2,050 (the seller’s bill, on the value set when they bought in 2009)',
  insuranceYear: 1_440,
  deductible: '$2,500',
  notCovered: 'Flood. Earthquake.',
  exclusions: 'This one excludes flood and earthquake (earthquake cover is a separate policy), and drops vandalism after 60 empty days.',
  insuranceLog: 'No flood or earthquake. 60-day vacancy limit.',
  rents: [2_150, 2_250, 2_200, 2_850, 2_445],
  rent: 2_200,
  rentClaim: 2_450,
  loanTasks: (n) => [
    {
      kind: 'choice',
      id: 'ca-taxes',
      prompt: 'The listing shows $2,050 in property taxes last year. What do you budget?',
      choices: [
        { label: `About ${usd(3_220)} a year (${usd(n.tax)} a month): about 1.1% of what you pay.`, verdict: 'best', why: 'In California, a sale resets the taxable value to the price you pay (Proposition 13). The seller’s bill was based on the value set when they bought in 2009, raised only a little each year, and on the homeowners’ exemption, which goes only to an owner who lives there. The county also sends a separate “supplemental” bill for the rest of the tax year; it comes to you, not your lender, so set money aside for it. This practice uses about 1.1%: in Kern County, voter-approved bonds put the rate at about 1.1% to 1.2%,* and fixed charges such as sewer and refuse are added on top. Check a recent bill for the parcel.' },
        { label: '$2,050: that’s what the listing says.', verdict: 'poor', why: 'That bill is on the seller’s old value. In California yours starts from your price, and the gap comes out of your cash flow every month.' },
        { label: 'Ask the county assessor’s and tax collector’s offices for the rate and any special assessments, and budget from those.', verdict: 'ok', why: 'The right check before you offer. Until you have the numbers, budget about 1% of your price plus local charges, not the seller’s bill.' },
      ],
    },
  ],
  contractNote: 'The contract is the California Association of REALTORS® Residential Purchase Agreement. Its inspection, appraisal and loan contingencies each last 17 days unless you write in other numbers; this practice contract uses the ones below. In California a contingency doesn’t end by itself: you remove it in writing, and once you do, that way out is gone. Missing a step can cost you your deposit.',
  contractRows: (n) => [
    ['Acceptance (Day 0)', 'The day the signed acceptance is delivered to you. The other deadlines count from it.'],
    ['Initial deposit', `${usd(n.earnest)}, to escrow within 3 business days after acceptance`],
    ['Investigation contingency', 'Day 10 (the form’s default is 17). Inspect, then cancel or remove it in writing.'],
    ['Appraisal contingency', 'Day 17'],
    ['Loan contingency', 'Day 21'],
    ['Removing contingencies', 'In writing, on a contingency removal form. If you haven’t removed or cancelled by a deadline, the seller can give you a Notice to Buyer to Perform, and cancel if you don’t act within the time it gives you, at least 2 days.'],
    ['HOA documents', 'The seller orders them. Review them in your investigation period, and ask your agent how much time you get if they arrive late.'],
    ['Close of escrow', 'Day 30'],
    ['Counting days', 'Calendar days unless it says business days. Ask your agent how the contract treats a deadline on a weekend or holiday.'],
  ],
  dates: [
    { when: 'Day 0', what: 'Acceptance is delivered to you. Every deadline below counts from here.' },
    { when: 'Within 3 business days after Day 0', what: 'Initial deposit to escrow (confirm the instructions by phone first). You: the buyer.' },
    { when: 'Day 10', what: 'Investigation contingency: cancel, ask for repairs, or remove it in writing. You, with your agent.' },
    { when: 'When the HOA documents arrive', what: 'Read the rental rules and the budget. Write down the day they arrive.' },
    { when: 'Day 17', what: 'Appraisal contingency: remove it in writing, or cancel. You, with your lender’s appraisal.' },
    { when: 'Day 21', what: 'Loan contingency: remove it in writing once your lender confirms the loan.' },
    { when: 'Day 30', what: 'Close of escrow.' },
  ],
  depositLog: (n) => `Initial deposit ${usd(n.earnest)}`,
  roofFinding: 'Concrete tile is fine. The underlayment beneath it has about 4–6 years left.',
  roofPart: 'roof underlayment',
  cancelInspection: 'Cancel in writing before you remove the investigation contingency (Day 10), and get the deposit back.',
  leaveInspection: 'Until you remove your investigation contingency in writing, you can cancel and get your deposit back.',
  lateInspection: 'Your contract’s 10 days are up. The seller can give you a Notice to Buyer to Perform and cancel if you don’t act within the time it gives (at least 2 days). If you then remove the contingency late, you’ve lost your way out over the inspection.',
  cancelShort: 'Cancel in writing before Day 10.',
  periodName: 'investigation contingency deadline',
  protections: 'investigation, appraisal and loan contingencies',
  licenseQuestion: '“Are you licensed by California’s Contractors State License Board for this work, and can I see your license number?”',
  appraisalName: 'appraisal contingency',
  cancelAppraisal: 'Cancel in writing before you remove the appraisal contingency (Day 17), and get the deposit back.',
  leaveAppraisal: 'Until you remove your appraisal contingency in writing, it lets you cancel and get your deposit back.',
  roofer: 'Valley Example Roofing',
  lienWhy: 'It’s a recorded claim against the house. In California, a contractor must record the lien within 90 days after the work is finished (60 days if the owner records a notice of completion), and sue to enforce it within 90 days after recording it, or the lien expires and can’t be enforced (Civil Code 8412 and 8460). Even an expired lien stays on the record until it’s released or a court clears it, so the title company wants that before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'into escrow within 3 business days after acceptance',
  earnestCredit: (n) => `${usd(n.earnest)} initial deposit`,
  earnestShort: 'deposit',
  walkKept: () => 'so you keep your deposit',
  rentRulesNote: 'Rules on deposits, entry and rent increases are state law. The ones below are California’s, because this practice house is in California. Some cities add their own.',
  rekeyWhy: 'You don’t know who else has keys.',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'ca-deposit',
      prompt: `In California, you own this one rental in your own name. What is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: `${usd(n.rent * 2)}: 2 months’ rent, because you’re a small landlord (unless the tenant is a service member)`, verdict: 'best', why: 'Since July 1, 2024, most California landlords may take only 1 month’s rent. A landlord who is a person, or an LLC of people, with no more than two rental properties and four units in all may take up to 2 months, but not from a service member (Civil Code 1950.5). Return it, with an itemized statement, within 21 days after the tenant moves out.' },
        { label: `${usd(n.rent * 3)}: 3 months’ rent`, verdict: 'poor', why: 'That’s over California’s limit. 3 months is Nevada’s cap, not California’s (Civil Code 1950.5).' },
        { label: `${usd(n.rent)}: 1 month’s rent`, verdict: 'ok', why: 'Lawful, and the limit for most California landlords. As a small landlord you could take more, but you don’t have to.' },
      ],
    },
    {
      kind: 'choice',
      id: 'ca-entry',
      prompt: 'In California, your tenant’s faucet leaks and you want to fix it. What notice do you give before going in?',
      choices: [
        { label: 'Reasonable written notice with the date, approximate time and purpose (24 hours is presumed reasonable), and enter only during normal business hours, unless it’s an emergency or the tenant is there and agrees.', verdict: 'best', why: 'That’s California’s rule (Civil Code 1954(d)(1) and (e)). Mailed notice is presumed reasonable at 6 days before entry.' },
        { label: 'None. You own the house.', verdict: 'poor', why: 'Once it’s rented, the tenant has the right to possession. In California, give reasonable written notice (24 hours is presumed reasonable) except in an emergency (Civil Code 1954).' },
      ],
    },
    {
      kind: 'choice',
      id: 'ca-rent-cap',
      prompt: 'In California, this single-family home is more than 15 years old. Do the statewide rent cap and just-cause rules (the Tenant Protection Act) apply to your lease?',
      choices: [
        { label: 'They don’t have to: a single-family home owned by a person, not a corporation or REIT, can be exempt, but only if the lease gives the tenant the written exemption notice the law requires. Without the notice, they apply.', verdict: 'best', why: 'That’s California’s rule (Civil Code 1947.12 and 1946.2). The cap limits most increases in 12 months to 5% plus inflation, never more than 10%. Some cities add their own rules; check yours.' },
        { label: 'No. Single-family homes are always exempt.', verdict: 'poor', why: 'Only with the right notice in the lease, and only when no corporation or REIT owns it. Miss the notice and the cap and just-cause rules apply.' },
        { label: 'Yes, every rental in California is covered.', verdict: 'ok', why: 'Safe to assume if you’re unsure, but not accurate: some homes are exempt, and this one can be, with the notice.' },
      ],
    },
  ],
  rentLog: (n) => `Deposit at or under ${usd(n.rent * 2)} (small-landlord limit), returned within 21 days with an itemized statement. Tenant Protection Act exemption notice in the lease (California).`,
};

// Arizona: same house and price. Owner-occupied homes get a rebate on part of the school tax (A.R.S. 15-972), a rental
// doesn't, and rentals must be registered with the county assessor (A.R.S. 33-1902). The contract is the Arizona
// REALTORS® resale contract, with a 10-day inspection period. Deposits: A.R.S. 33-1321.
const AZ: CaseConfig = {
  state: 'AZ',
  stateName: 'Arizona',
  abbr: 'AZ',
  city: 'Tucson',
  savings: 142_000,
  taxYear: 1_860,
  listedTax: '$1,380 (the seller’s bill, with the owner-occupant rebate)',
  insuranceYear: 1_320,
  deductible: '$2,500',
  notCovered: 'Flood. Earthquake.',
  exclusions: 'This one already excludes flood, earthquake, and vandalism after 60 empty days.',
  insuranceLog: 'No flood or earthquake. 60-day vacancy limit.',
  rents: [2_000, 2_100, 2_050, 2_650, 2_295],
  rent: 2_050,
  rentClaim: 2_300,
  loanTasks: (n) => [
    {
      kind: 'choice',
      id: 'az-taxes',
      prompt: 'The listing shows $1,380 in property taxes last year. What do you budget, as an owner who won’t live there?',
      choices: [
        { label: `About ${usd(1_860)} a year (${usd(n.tax)} a month): the bill without the owner-occupant rebate.`, verdict: 'best', why: 'In Arizona, a home its owner lives in gets a rebate on part of the school tax, up to $600 a year (A.R.S. 15-972). A rental doesn’t, so your bill will be higher than the seller’s. This practice adds about $480.' },
        { label: '$1,380: that’s what the listing says.', verdict: 'poor', why: 'That bill had the seller’s rebate. Your bill as a landlord will be higher, and the gap comes out of your cash flow every month.' },
        { label: 'Ask the county assessor and treasurer how the bill changes for a rental, and budget from that.', verdict: 'ok', why: 'The right check before you offer. Until you have the numbers, budget the bill without the rebate.' },
      ],
    },
  ],
  contractNote: 'The contract is the Arizona REALTORS® Residential Resale Real Estate Purchase Contract. The inspection period is 10 days unless you write in another number. The other numbers below are this practice contract’s; real contracts differ, and missing a deadline can cost you your earnest money.',
  contractRows: (n) => [
    ['Acceptance (Day 0)', 'The day the signed acceptance is delivered to you. The other deadlines count from it.'],
    ['Earnest money', `${usd(n.earnest)}, deposited on acceptance with the escrow company (the contract also allows a broker’s trust account)`],
    ['Inspection period', 'Ends Day 10. You can cancel for any reason before then, in writing on the Buyer’s Inspection Notice and Seller’s Response (BINSR), listing the items you disapprove.'],
    ['Repair requests', 'If you ask for repairs instead, the seller has 5 days to answer (no answer counts as a no), and then you have 5 days to cancel or go ahead without the repairs the seller refused.'],
    ['Appraisal', 'If the appraisal comes in under the price, you can cancel within 5 days after you’re told the value, and get the earnest money back.'],
    ['Loan', 'If the loan falls through, tell the seller in writing no later than 3 days before close of escrow to keep your earnest money.'],
    ['HOA documents', 'The seller orders them. Review them in your inspection period, and ask your agent how much time you get if they arrive late.'],
    ['Close of escrow', 'Day 30'],
    ['Counting days', 'Calendar days, each ending at 11:59 p.m. Ask your agent how the contract treats a deadline on a weekend or holiday.'],
  ],
  dates: [
    { when: 'Day 0', what: 'Acceptance is delivered to you. Every deadline below counts from here.' },
    { when: 'On acceptance (Day 0)', what: 'Earnest money to the escrow company, by the time your contract sets (confirm the instructions by phone first). You: the buyer.' },
    { when: 'Day 10', what: 'Inspection period ends: cancel, ask for repairs on the BINSR, or go ahead, in writing. You, with your agent.' },
    { when: '5 days after the seller answers your BINSR', what: 'Cancel, or go ahead without the repairs the seller refused, in writing.' },
    { when: 'When the HOA documents arrive', what: 'Read the rental rules and the budget. Write down the day they arrive.' },
    { when: 'Within 5 days after you learn the appraised value', what: 'Cancel in writing if it’s under the price and you won’t go ahead. You, with your lender’s appraisal.' },
    { when: 'Day 27 (3 days before close of escrow)', what: 'Last day to tell the seller in writing that you can’t get the loan, and keep your earnest money.' },
    { when: 'Day 30', what: 'Close of escrow.' },
  ],
  depositLog: (n) => `Earnest money ${usd(n.earnest)}`,
  roofFinding: 'Tile is fine. The underlayment beneath it has about 4–6 years left.',
  roofPart: 'roof underlayment',
  cancelInspection: 'Cancel in writing before the inspection period ends (Day 10), and get the earnest money back.',
  leaveInspection: 'During your inspection period you can cancel for any reason, in writing on the BINSR, listing the items you disapprove, and get the earnest money back.',
  lateInspection: 'After Day 10 the inspection period is over. You’d lose the right to cancel over the inspection, and maybe your earnest money.',
  counterDue: {
    ask: 'The seller answered on Day 8. Do you accept or cancel by Day 13 (5 days after the seller’s answer)?',
    accept: 'Accept in writing by Day 13.',
    cancel: 'Cancel in writing by Day 13.',
    late: 'Wait until Day 14 to decide.',
    why: 'Under this contract you had 5 days after the seller’s answer (Day 13) to cancel or accept. If you don’t cancel in time, you go ahead on the seller’s answer, without anything the seller didn’t agree to in writing, and you can no longer cancel over the inspection.',
    by: 'by the repair-reply deadline (5 days after the seller’s answer)',
  },
  cancelShort: 'Cancel in writing before Day 10.',
  periodName: 'end of the inspection period',
  protections: 'an inspection period and the appraisal and loan contingencies',
  licenseQuestion: '“Are you licensed by the Arizona Registrar of Contractors for this work, and can I see your license number?”',
  appraisalName: 'appraisal contingency',
  cancelAppraisal: 'Cancel in writing within 5 days after you learn the appraised value, and get the earnest money back.',
  leaveAppraisal: 'Your appraisal contingency lets you cancel within 5 days after you learn the value, when it’s under the price.',
  roofer: 'Desert Example Roofing',
  lienWhy: 'It’s a recorded claim against the house. In Arizona, a contractor must record the lien within 120 days after the work is finished (60 days after a notice of completion is recorded), and it lapses 6 months after recording unless the contractor sues to enforce it (A.R.S. 33-993 and 33-998). Either way, the title company wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'to the escrow company when the contract was accepted',
  earnestCredit: (n) => `${usd(n.earnest)} earnest money`,
  earnestShort: 'earnest money',
  rentRulesNote: 'Rules on deposits, entry and rental registration are state law. The ones below are Arizona’s, because this practice house is in Arizona.',
  rekeyWhy: 'You don’t know who else has keys.',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'az-deposit',
      prompt: `In Arizona, what is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: `${usd(n.rent * 1.5)}: 1½ months’ rent`, verdict: 'best', why: 'Arizona caps it at 1½ months’ rent, unless the tenant chooses to pay more rent in advance (A.R.S. 33-1321). Return it, with an itemized list of deductions, within 14 days, not counting weekends and holidays, after the tenancy ends, the tenant moves out and asks for it.' },
        { label: `${usd(n.rent * 3)}: 3 months’ rent`, verdict: 'poor', why: 'That’s over Arizona’s limit. 3 months is Nevada’s cap, not Arizona’s (A.R.S. 33-1321).' },
        { label: `${usd(n.rent)}: 1 month’s rent`, verdict: 'ok', why: 'A common choice, and lawful. But it’s your choice, not the limit.' },
      ],
    },
    {
      kind: 'choice',
      id: 'az-entry',
      prompt: 'In Arizona, your tenant’s faucet leaks and you want to fix it. What notice do you give before going in?',
      choices: [
        { label: 'At least 2 days’ notice, and enter only at reasonable times, unless it’s an emergency. If the tenant asked you for the repair, that request counts as permission to enter for it.', verdict: 'best', why: 'That’s Arizona’s rule (A.R.S. 33-1343(B) and (D)).' },
        { label: 'None. You own the house.', verdict: 'poor', why: 'Once it’s rented, enter only with at least 2 days’ notice, except in an emergency or for a repair the tenant asked for (A.R.S. 33-1343).' },
      ],
    },
    {
      kind: 'choice',
      id: 'az-register',
      prompt: 'In Arizona, what must you file with the county assessor once you rent it out?',
      choices: [
        { label: 'Register it as a residential rental, with the owner’s name and address and a contact for the property.', verdict: 'best', why: 'Arizona requires it (A.R.S. 33-1902). If a newly bought rental isn’t registered, your city or town can seek a $1,000 fine plus $100 a month; registering within 10 days after the complaint avoids it.' },
        { label: 'Nothing. The deed is already recorded in your name.', verdict: 'poor', why: 'Recording the deed doesn’t register the rental. In Arizona that’s a separate filing with the county assessor.' },
      ],
    },
  ],
  rentLog: (n) => `Deposit at or under ${usd(n.rent * 1.5)}, returned within 14 days (not counting weekends and holidays) with an itemized list. 2 days’ notice before entry (A.R.S. 33-1343). Registered with the county assessor as a rental (Arizona).`,
};

// Utah: same house and price. A long-term rental that is the tenant's main home keeps the 45% residential exemption; a
// short-term rental loses it, and the owner files a declaration with the county assessor (Utah Code 59-2-102, 59-2-103, 59-2-103.5). The contract is the Utah REPC, where you and the seller
// write in the Due Diligence and Financing & Appraisal deadlines. Deposits: Utah Code 57-17-3.
const UT: CaseConfig = {
  state: 'UT',
  stateName: 'Utah',
  abbr: 'UT',
  city: 'Ogden',
  savings: 142_000,
  taxYear: 1_560,
  listedTax: '$1,560 (with the 45% residential exemption)',
  insuranceYear: 960,
  deductible: '$2,500',
  notCovered: 'Flood. Earthquake.',
  exclusions: 'This one already excludes flood, earthquake, and vandalism after 60 empty days.',
  insuranceLog: 'No flood or earthquake. 60-day vacancy limit.',
  rents: [1_950, 2_050, 2_000, 2_600, 2_245],
  rent: 2_000,
  rentClaim: 2_250,
  loanTasks: (n) => [
    {
      kind: 'choice',
      id: 'ut-taxes',
      prompt: 'The listing shows $1,560 in property taxes last year, with Utah’s 45% residential exemption. You plan a long-term rental. What do you budget?',
      choices: [
        { label: `About ${usd(1_560)} a year (${usd(n.tax)} a month): a long-term rental keeps the exemption when it’s the tenant’s main home. File the county’s declaration that it’s a tenant’s main home.`, verdict: 'best', why: 'In Utah, a home that is someone’s main home is taxed on 55% of its value, and a long-term rental counts when it’s the tenant’s (Utah Code 59-2-103). Before the county gives the exemption to a rental, each owner must file a written declaration with the county assessor that it will be a tenant’s main home (Utah Code 59-2-103.5). Skip it and you can be taxed on the full value.' },
        { label: `About ${usd(1_560)}, and you can switch to nightly rentals later with no change.`, verdict: 'poor', why: 'A short-term rental (under 30 days) loses the exemption and is taxed on its full value, so the bill would be about 80% higher, around $2,840 (Utah Code 59-2-102 and 59-2-103).' },
        { label: 'Budget the full-value bill, about $2,840, to be safe.', verdict: 'ok', why: 'Safe, but for a long-term rental in Utah it overstates the tax and could make you pass on a deal that works.' },
      ],
    },
  ],
  contractNote: 'The contract is the Utah Real Estate Purchase Contract (REPC). You and the seller write in the deadlines; the ones below are this practice contract’s. Missing one can cost you your earnest money.',
  contractRows: (n) => [
    ['Acceptance (Day 0)', 'The day the signed acceptance is delivered to you. The other deadlines count from it.'],
    ['Earnest money', `${usd(n.earnest)}, to your agent’s brokerage within 4 calendar days after Acceptance (the brokerage deposits it in its trust account), unless the contract names a title company`],
    ['Due Diligence Deadline', 'Day 10. You can cancel for any reason, in writing, before then. If you don’t, the due diligence condition is waived.'],
    ['Financing & Appraisal Deadline', 'Day 21. By then you can cancel if the appraisal comes in under the price, by written notice with a copy of the lender’s or appraiser’s notice of the appraised value, and get the earnest money back. If you cancel because you’re not satisfied with the loan terms, the seller can keep the amount written in section 8.3(b)(i). If your loan fails after this deadline, the seller keeps all the earnest money (REPC 8.3(b)(iii)).'],
    ['Seller Disclosure Deadline', 'Day 3: the seller’s disclosures, including the title commitment and the HOA’s CC&Rs and rules'],
    ['Settlement Deadline', 'Day 30'],
    ['Counting days', 'Calendar days, starting the day after Acceptance. Each deadline ends at 5:00 p.m. Mountain Time on its date (REPC §21).'],
  ],
  dates: [
    { when: 'Day 0', what: 'Acceptance is delivered to you. Every deadline below counts from here.' },
    { when: 'Day 3', what: 'Seller Disclosure Deadline: the seller’s disclosures, the title commitment and the HOA documents. Review them before Day 10.' },
    { when: 'Within 4 calendar days after Day 0', what: 'Earnest money to your agent’s brokerage, which deposits it in its trust account (or to the title company, if the contract names one; confirm wire instructions by phone first). You: the buyer.' },
    { when: 'Day 10', what: 'Due Diligence Deadline: cancel, ask for changes, or go ahead, in writing. You, with your agent.' },
    { when: 'Day 21', what: 'Financing & Appraisal Deadline. You, with your lender and the appraisal.' },
    { when: 'Day 30', what: 'Settlement at the title company.' },
  ],
  depositLog: (n) => `Earnest money ${usd(n.earnest)}`,
  roofFinding: 'Composition shingles with about 4–6 years left.',
  roofPart: 'composition shingle roof',
  cancelInspection: 'Cancel in writing before the Due Diligence Deadline (Day 10), and get the earnest money back.',
  leaveInspection: 'Until the Due Diligence Deadline you can cancel for any reason, in writing, and get the earnest money back.',
  lateInspection: 'After the Due Diligence Deadline (Day 10), the due diligence condition is waived. You’d lose the right to cancel over the inspection, and maybe your earnest money.',
  inspectionBrief: 'Before Day 10, also read the title commitment and the HOA’s CC&Rs and rules that came on Day 3: after the Due Diligence Deadline you can’t cancel over them.',
  titleBrief: 'You also go back over two documents that came with the seller’s disclosures on Day 3 and that you approved before the Due Diligence Deadline: the title commitment and the HOA’s leasing rules. The title company sends its updated commitment before closing.',
  hoaPrompt: 'You read the HOA’s leasing rules before Day 10. Do they fit your plan?',
  hoaRulesWhy: 'Many HOAs can and do limit rentals. In Utah the CC&Rs and rules come with the seller’s disclosures (REPC 7(d)), so read them before the Due Diligence Deadline: that’s your last chance to cancel over them.',
  cancelShort: 'Cancel in writing before Day 10.',
  periodName: 'Due Diligence Deadline',
  protections: 'due diligence, appraisal and financing conditions',
  licenseQuestion: '“Are you licensed by Utah’s Division of Professional Licensing (DOPL) for this work, and can I see your license number?”',
  appraisalName: 'appraisal condition',
  cancelAppraisal: 'Cancel in writing, with a copy of the notice of appraised value, by the Financing & Appraisal Deadline (Day 21), and get the earnest money back.',
  leaveAppraisal: 'Your appraisal condition lets you cancel by the Financing & Appraisal Deadline when the appraisal is under the price, if your written notice includes a copy of the notice of appraised value (REPC 8.2(a)).',
  roofer: 'Wasatch Example Roofing',
  lienWhy: 'It’s a recorded claim against the house. In Utah, a contractor must record the lien within 180 days after the work is finished (90 days after a notice of completion, if one was filed), and sue to enforce it within 180 days after recording it (Utah Code 38-1a-502 and 38-1a-701). Either way, the title company wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'to your agent’s brokerage within 4 calendar days after Acceptance (the brokerage deposits it in its trust account), unless the contract names a title company',
  earnestCredit: (n) => `${usd(n.earnest)} earnest money`,
  earnestShort: 'earnest money',
  wireFrom: 'your agent’s brokerage or the title company',
  wireCall: 'Call your agent’s brokerage or the title company at a phone number you already trust (from your agent or the company’s own website) to confirm the instructions before sending anything.',
  rentRulesNote: 'Rules on deposits and entry are state law. The ones below are Utah’s, because this practice house is in Utah.',
  rekeyWhy: 'You don’t know who else has keys.',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'ut-deposit',
      prompt: `In Utah, what is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: 'Utah law sets no limit. Pick an amount the market accepts, and return what’s left with a written list of deductions within 30 days after the tenant moves out.', verdict: 'best', why: 'Utah doesn’t cap deposits. Within 30 days after the tenant moves out and returns possession, send what’s left of it with a written list of deductions (Utah Code 57-17-3).' },
        { label: `${usd(n.rent * 3)}, the legal maximum`, verdict: 'poor', why: 'Utah has no legal maximum; 3 months’ rent is Nevada’s cap. And a very high deposit can cost you good tenants.' },
        { label: `${usd(n.rent)}: 1 month’s rent`, verdict: 'ok', why: 'A common choice, and lawful. But it’s your choice, not a limit.' },
      ],
    },
    {
      kind: 'choice',
      id: 'ut-entry',
      prompt: 'In Utah, your tenant’s faucet leaks and you want to fix it. What notice do you give before going in?',
      choices: [
        { label: 'At least 24 hours’ notice, unless the lease says otherwise.', verdict: 'best', why: 'That’s Utah’s rule (Utah Code 57-22-4(2)). Put entry terms, including emergencies, in the lease.' },
        { label: 'None. You own the house.', verdict: 'poor', why: 'Once it’s rented, the tenant has the right to possession. In Utah, give at least 24 hours’ notice unless the lease says otherwise (Utah Code 57-22-4(2)).' },
      ],
    },
  ],
  rentLog: () => 'Deposit balance returned with a written list of deductions within 30 days after move-out. 24 hours’ notice before entry, unless the lease says otherwise. Exemption declaration filed with the county assessor (Utah).',
};

/** One state's version of the purchase: its numbers and its steps. */
function buildCase(c: CaseConfig) {
  const savings = c.savings;
  const spending = 5_200;
  const cushionMonths = 6;
  const otherGoals = 8_000;
  const offer = 289_000;
  const renegotiated = 282_000;
  const appraised = 280_000;
  const finalPrice = 280_000;
  const closingCosts = 8_400;
  const tax = Math.round(c.taxYear / 12);
  const insurance = Math.round(c.insuranceYear / 12);
  const hoa = 45;
  const rent = c.rent;
  const reserveMonths = 6;
  const sewer = 7_500;
  const panel = 3_200;
  const earnest = 3_000;

  const loanAt = (price: number, value = price) => Math.round(Math.min(price, value) * 0.75);
  const pitia = (loan: number) => payment(loan) + tax + insurance + hoa;
  const cashNeeded = (price: number, value = price, repairs = 0) => price - loanAt(price, value) + closingCosts + repairs + reserveMonths * pitia(loanAt(price, value));

  /** Every number the case uses, worked out once. */
  const N = {
    rate: N0.rate,
    savings,
    spending,
    cushionMonths,
    cushion: spending * cushionMonths,
    otherGoals,
    investable: savings - spending * cushionMonths - otherGoals,
    list: 299_900,
    offer,
    renegotiated,
    appraised,
    finalPrice,
    closingCosts,
    tax,
    insurance,
    hoa,
    rent,
    reserveMonths,
    sewer,
    panel,
    urgent: sewer + panel,
    earnest,
    loanOffer: loanAt(offer),
    piOffer: payment(loanAt(offer)),
    pitiaOffer: pitia(loanAt(offer)),
    cashOffer: cashNeeded(offer),
    cashRenegotiated: cashNeeded(renegotiated, renegotiated, sewer + panel),
    loanFinal: loanAt(finalPrice, appraised),
    piFinal: payment(loanAt(finalPrice, appraised)),
    pitiaFinal: pitia(loanAt(finalPrice, appraised)),
    cashFinal: cashNeeded(finalPrice, appraised, sewer + panel),
    downIfGapPaid: renegotiated - loanAt(renegotiated, appraised),
    cashToClose: finalPrice - loanAt(finalPrice, appraised) + closingCosts - earnest,
    wrongCashToClose: finalPrice - loanAt(finalPrice, appraised) + closingCosts,
    setAside: Math.round(rent * 0.05),
    cashFlow: rent - 3 * Math.round(rent * 0.05) - tax - insurance - hoa - payment(loanAt(finalPrice, appraised)),
    maxDeposit: rent * 3,
    /** Saving for the known roof ($14,000) and water heater ($1,600) over 4 years, the short end of the roof's estimate. */
    replaceMonthly: Math.round((14_000 + 1_600) / 48),
    /** At the offer price, before any renegotiation: what the inspection decision is made on. */
    cashFlowAtOffer: rent - 3 * Math.round(rent * 0.05) - tax - insurance - hoa - payment(loanAt(offer)),
    cashFlowAtOfferWithReplacements: rent - 3 * Math.round(rent * 0.05) - tax - insurance - hoa - payment(loanAt(offer)) - (Math.round((14_000 + 1_600) / 48) - Math.round(rent * 0.05)),
    cashFlowWithReplacements: rent - 3 * Math.round(rent * 0.05) - tax - insurance - hoa - payment(loanAt(finalPrice, appraised)) - (Math.round((14_000 + 1_600) / 48) - Math.round(rent * 0.05)),
  };

  const $ = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;


  const stages: CaseStage[] = [
    {
      key: 'cash',
      title: 'Your goal and your cash',
      outcome: 'Your goal in one sentence, and the most cash you can put into a deal without touching your safety net.',
      brief: [
        'Before you look at a single house, work out how much you can safely invest. In this practice case, you want a rental you’ll hold for at least 10 years. You’re fine with little or no monthly profit at first, as long as the rent covers the costs.',
        `Your emergency fund stays out of the deal. Here you keep ${cushionMonths} months of household spending. That’s a planning choice, not a rule: some people keep more.`,
      ],
      docs: [
        {
          kind: 'Your money snapshot',
          title: 'What you have and what you need',
          from: 'You (practice numbers)',
          rows: [
            ['Savings and investments you could sell', $(savings)],
            ['Household spending each month', $(spending)],
            ['Emergency fund you’ll keep', `${cushionMonths} months of spending`],
            ['Money already promised to other goals in the next 12 months', $(otherGoals)],
            ['High-interest debt', 'None'],
          ],
        },
      ],
      tasks: [
        {
          kind: 'number',
          id: 'investable',
          prompt: 'How much cash can you put into a deal, all in, without touching your emergency fund or your other goals?',
          answer: N.investable,
          tolerance: 100,
          worked: [`Emergency fund: ${cushionMonths} × ${$(spending)} = ${$(N.cushion)}`, `${$(savings)} − ${$(N.cushion)} − ${$(otherGoals)} = ${$(N.investable)}`],
          hint: 'Start with your savings, then take out the emergency fund and the money already promised elsewhere.',
        },
        {
          kind: 'choice',
          id: 'stretch',
          prompt: 'A friend says, “Use your emergency fund for the down payment. You can rebuild it from the rent.” What do you do?',
          choices: [
            { label: 'Keep the emergency fund separate. The deal has to fit inside your investable cash.', verdict: 'best', why: 'A rental adds risk: a vacancy, a repair or a job loss can all hit at once. Your emergency fund is what keeps a bad month from forcing a sale.' },
            { label: 'Use half of it. Rentals usually work out.', verdict: 'poor', why: 'Most of what goes wrong with a rental costs money right away. Plan for the bad month, not the usual one.' },
            { label: 'Use all of it, then rebuild it from the rent.', verdict: 'poor', why: 'Many rentals bring in little cash in the first years, so it could take a very long time to rebuild. Keep the safety net.' },
          ],
          ifDifferent: 'If you had high-interest debt, paying it off would usually come before investing. That’s why Decide puts Practice first for people with no emergency fund or high-interest debt.',
        },
      ],
      log: [{ area: 'Your plan', finding: `Goal: a long-term rental with rent that covers costs. Most you can put in: ${$(N.investable)}.` }],
      learnMore: [{ label: 'Choose a strategy', href: '#/decide' }],
    },
    {
      key: 'listing',
      title: 'The listing',
      outcome: 'A quick yes-or-no screen against your buy box, and a list of facts you still need.',
      brief: [
        `Your agent sends a listing that fits your buy box: a single-family home in ${c.city}, priced under $300,000, that needs no major work you can see from the photos.`,
        'A listing is the seller’s marketing. Treat every number in it as a claim to check, not a fact.',
      ],
      docs: [
        {
          kind: 'Listing sheet',
          title: `1418 Example Ridge Court, ${c.city}, ${c.abbr}`,
          from: 'Seller’s listing agent (fictional)',
          rows: [
            ['List price', $(N.list)],
            ['Beds / baths / size', '3 bed · 2 bath · 1,460 sq ft'],
            ['Built', '1972'],
            ['Lot', '0.15 acre'],
            ['HOA', `Example Ridge HOA, ${$(hoa)} a month`],
            ['Property taxes last year', c.listedTax],
            ['Occupancy', 'Vacant'],
            ['Days on market', '41'],
            ['Remarks', `“Great rental! Could rent for ${$(c.rentClaim)}+. Roof and plumbing in good shape. Sold as-is, inspections welcome.”`],
          ],
        },
      ],
      tasks: [
        {
          kind: 'multi',
          id: 'missing',
          prompt: 'Which of these do you still need before you can decide on a price? Choose all that apply.',
          options: [
            { label: 'What similar homes actually rent for', right: true, why: `“Could rent for ${$(c.rentClaim)}+” is the seller’s guess. Leased comparables are evidence.` },
            { label: 'What similar homes actually sold for', right: true, why: 'Your price should come from recent sales, not the list price.' },
            { label: 'The HOA’s rules on renting', right: true, why: 'Some HOAs limit or ban rentals, or set a minimum lease length. That could end your plan.' },
            { label: 'An insurance quote for a rental', right: true, why: 'A landlord policy costs differently from a homeowner’s policy, and some homes are hard to insure.' },
            { label: 'The home’s real condition', right: true, why: '“In good shape” is a claim. A 1972 home can have old sewer lines, wiring and roofs. The inspection will tell you.' },
            { label: 'Why the seller is moving', right: false, why: 'Nice to know, and your agent may learn it, but it doesn’t change what the house is worth or costs to own.' },
          ],
        },
        {
          kind: 'choice',
          id: 'screen',
          prompt: 'Does it pass your first screen?',
          choices: [
            { label: 'Yes, worth a closer look: it fits the buy box on paper. Gather the missing facts next.', verdict: 'best', why: 'A first screen only decides whether it deserves your time. The real decision comes after the evidence.' },
            { label: 'Yes, make a full-price offer today before someone else does.', verdict: 'poor', why: 'After 41 days on the market, there’s no rush. And you don’t yet know the rent, the value or the condition.' },
            { label: 'No, a 1972 home is too old for a rental.', verdict: 'ok', why: 'Older homes need more checking, but age alone isn’t a reason to pass. If your buy box excludes older homes, though, passing is fine.' },
          ],
        },
      ],
      log: [{ area: 'The listing', finding: 'Fits the buy box on paper. The rent claim and the condition claim are unverified.', open: 'Rent, value, HOA rental rules, insurance, condition' }],
    },
    {
      key: 'evidence',
      title: 'Rent and value',
      outcome: 'A rent estimate and an as-is value, each backed by comparables you chose and can explain.',
      brief: [
        'Your agent pulls homes that leased and sold nearby in the last 6 months. Your job is to pick the ones that are really like this house, and leave out the rest.',
        'Good comparables match on size, age, condition and features, and are actual leases or closed sales, not asking prices.',
      ],
      docs: [
        {
          kind: 'Comparable rents',
          title: 'Homes leased within 1 mile, last 6 months',
          from: 'Your agent (fictional data)',
          table: {
            head: ['Home', 'Size', 'Built', 'Notes', 'Rent'],
            rows: [
              ['A', '3/2 · 1,410 sq ft', '1975', 'Leased', $(c.rents[0])],
              ['B', '3/2 · 1,520 sq ft', '1979', 'Leased', $(c.rents[1])],
              ['C', '3/2 · 1,480 sq ft', '1971', 'Leased', $(c.rents[2])],
              ['D', '4/3 · 2,050 sq ft', '2004', 'Leased, has a pool', $(c.rents[3])],
              ['E', '3/2 · 1,440 sq ft', '1974', 'Still for rent after 58 days', `${$(c.rents[4])} asking`],
            ],
          },
        },
        {
          kind: 'Comparable sales',
          title: 'Homes sold within 1 mile, last 6 months',
          from: 'Your agent (fictional data)',
          table: {
            head: ['Home', 'Size', 'Built', 'Condition', 'Price'],
            rows: [
              ['F', '3/2 · 1,450 sq ft', '1973', 'Dated, like this one', '$286,000 sold'],
              ['G', '3/2 · 1,500 sq ft', '1978', 'Dated, like this one', '$293,000 sold'],
              ['H', '3/2 · 1,430 sq ft', '1970', 'Dated, like this one', '$288,000 sold'],
              ['J', '3/2 · 1,470 sq ft', '1974', 'Fully remodeled', '$334,000 sold'],
              ['K', '3/2 · 1,460 sq ft', '1972', 'Pending sale', '$309,000 list price'],
            ],
          },
        },
      ],
      tasks: [
        {
          kind: 'multi',
          id: 'rent-comps',
          prompt: 'Which rentals are good comparables for this house? Choose all that apply.',
          options: [
            { label: 'A', right: true, why: 'Same size, age and layout, and actually leased.' },
            { label: 'B', right: true, why: 'A little bigger, but close, and actually leased.' },
            { label: 'C', right: true, why: 'The closest match, and actually leased.' },
            { label: 'D', right: false, why: 'Much bigger, much newer, with a pool. It rents to a different tenant.' },
            { label: 'E', right: false, why: 'An asking price that hasn’t rented in 58 days is evidence the rent is too high, not what the market pays.' },
          ],
        },
        {
          kind: 'number',
          id: 'rent',
          prompt: 'Using your comparables, what monthly rent will you plan on?',
          answer: rent,
          tolerance: 50,
          worked: [`Average of A, B and C: (${$(c.rents[0])} + ${$(c.rents[1])} + ${$(c.rents[2])}) ÷ 3 = ${$(rent)}`, `The listing’s “${$(c.rentClaim)}+” is about ${$(c.rentClaim - rent)} a month too high: ${$((c.rentClaim - rent) * 12)} a year of income that probably isn’t there.`],
        },
        {
          kind: 'number',
          id: 'value',
          prompt: 'What is the house worth as it is today, based on the sales?',
          answer: 289_000,
          tolerance: 3_000,
          worked: ['Use F, G and H: dated homes like this one that actually sold.', '($286,000 + $293,000 + $288,000) ÷ 3 ≈ $289,000', 'Leave out J (remodeled) and K (not sold yet).'],
        },
        {
          kind: 'choice',
          id: 'love-it',
          prompt: 'Suppose another house nearby has the remodeled kitchen and big backyard you’ve always wanted. It’s listed at $305,000, about $16,000 more than its comparables support. Do you offer?',
          choices: [
            { label: 'Stick to the numbers: offer what the comparables support, and be ready to walk away.', verdict: 'best', why: 'An investment is bought on the numbers. Paying $16,000 over value costs you that money the day you buy, and the rent doesn’t go up because you like the kitchen.' },
            { label: 'Pay it. A house this nice will be easy to rent.', verdict: 'poor', why: `Tenants pay what similar homes rent for: your comparables say about ${$(rent)}. The extra $16,000 is money you may never get back.` },
            { label: 'Pay it, because you might want to live there someday.', verdict: 'poor', why: 'Then it’s a home decision, not an investment one. Judge it as a home you’d live in, against your household budget, not as this rental.' },
          ],
          ifDifferent: 'If the remodel let you charge more rent, and leased comparables proved it, part of the extra price could be worth paying. The evidence decides, not the feeling.',
        },
      ],
      log: [
        { area: 'Rent', finding: `Plan on ${$(rent)} a month (leased comparables A, B and C).` },
        { area: 'Value', finding: 'About $289,000 as-is (closed sales F, G and H). The list price is about $11,000 above it.' },
      ],
      learnMore: [{ label: 'Lesson: analyzing a deal', href: '#/learn/analyze' }],
    },
    {
      key: 'loan',
      title: 'Loan and insurance',
      outcome: 'Your monthly payment, the cash you need at your target price, and the conditions that could stop the loan.',
      brief: [
        'You ask a lender for a written quote for an investment property, and an insurance agent for a landlord policy quote. Read the conditions, not just the rate.',
        `The rate here is a practice number (${(N.rate * 100).toFixed(2)}%), not a current quote.`,
      ],
      docs: [
        {
          kind: 'Loan term sheet',
          guide: 'loan-estimate',
          title: 'Investment property loan: 1-unit home',
          from: 'Example Mortgage Co. (fictional)',
          rows: [
            ['Loan type', '30-year fixed, investment property (you won’t live there)'],
            ['Practice rate', `${(N.rate * 100).toFixed(2)}%`],
            ['Maximum loan', '75% of the purchase price or the appraised value, whichever is lower'],
            ['Your share of the price', 'The price minus the loan. If the appraisal comes in below the price, you pay that gap too.'],
            ['Payment at a $289,000 price', `${$(N.piOffer)} a month principal and interest, on a ${$(N.loanOffer)} loan`],
            ['Estimated closing costs', `${$(closingCosts)} (lender, title, escrow and prepaid items)`],
            ['Reserves after closing', '6 months of the full monthly payment (principal, interest, taxes, insurance and HOA) still in your account'],
            ['Seller credits', 'Up to 2% of the price or appraised value, whichever is lower, and only toward closing costs'],
            ['Rate lock', '45 days'],
          ],
          notes: [
            'On top of the price, you pay closing costs and must still have the reserves after closing.',
            'For a Fannie Mae investment-property loan like this one, seller credits (the guide calls them financing concessions) are capped at 2% of the lower of the price or the appraised value, and can only pay closing costs, never your down payment. The lender treats any excess as a price reduction when it works out the loan, which can raise the cash you need (Fannie Mae Selling Guide B3-4.1-02). Changing the price itself is a separate change to the contract that you and the seller sign.',
          ],
        },
        {
          kind: 'Insurance quote',
          title: 'Landlord (dwelling) policy',
          from: 'Example Insurance Agency (fictional)',
          rows: [
            ['Yearly premium', `${$(c.insuranceYear)} (${$(insurance)} a month)`],
            ['Deductible', c.deductible],
            ['Dwelling coverage', '$260,000'],
            ['Liability', '$300,000'],
            ['Not covered', c.notCovered],
            ['Vacancy limit', 'Vandalism and glass breakage aren’t covered if the home is empty more than 60 days in a row'],
          ],
        },
      ],
      tasks: [
        ...c.loanTasks(N),
        {
          kind: 'number',
          id: 'pitia',
          prompt: 'What is the full monthly payment at a $289,000 price: principal and interest, taxes, insurance and HOA?',
          answer: N.pitiaOffer,
          tolerance: 5,
          worked: [`${$(N.piOffer)} + ${$(tax)} taxes (${$(c.taxYear)} ÷ 12) + ${$(insurance)} insurance + ${$(hoa)} HOA = ${$(N.pitiaOffer)}`],
        },
        {
          kind: 'number',
          id: 'cash-offer',
          prompt: 'How much cash do you need at a $289,000 price: down payment, closing costs and the 6 months of reserves the lender wants?',
          answer: N.cashOffer,
          tolerance: 50,
          worked: [
            `Loan: 75% of $289,000 = ${$(N.loanOffer)}`,
            `Your share of the price: $289,000 − ${$(N.loanOffer)} = ${$(offer - N.loanOffer)}`,
            `Closing costs: ${$(closingCosts)}`,
            `Reserves: 6 × ${$(N.pitiaOffer)} = ${$(6 * N.pitiaOffer)}`,
            `Total: ${$(N.cashOffer)}. That leaves ${$(N.investable - N.cashOffer)} of your ${$(N.investable)} for repairs and surprises.`,
          ],
        },
        {
          kind: 'choice',
          id: 'vacancy',
          prompt: 'What does the insurance policy’s 60-day vacancy limit mean for you?',
          choices: [
            { label: 'Plan to rent it within 60 days of closing, or ask the agent about vacancy coverage while repairs run long.', verdict: 'best', why: 'Repairs plus finding a tenant can easily take 2 months. Know what’s covered before the home sits empty.' },
            { label: 'Nothing. Insurance covers everything once you have a policy.', verdict: 'poor', why: `Policies have limits and exclusions. ${c.exclusions}` },
          ],
        },
        {
          kind: 'write',
          id: 'ask-lender',
          prompt: 'Write one question you’d ask the lender before you make an offer.',
          to: 'Lender',
          model: 'Examples: “If the appraisal comes in low, how does that change my down payment?” · “Which conditions could still stop the loan after I’m approved?” · “Will rent from this property count toward qualifying, and what documents do you need for that?”',
        },
      ],
      log: [
        { area: 'Loan', finding: `Payment ${$(N.pitiaOffer)} a month at $289,000. Cash needed ${$(N.cashOffer)}.`, open: 'Low appraisal raises the cash you need' },
        { area: 'Insurance', finding: `Landlord policy quoted at ${$(c.insuranceYear)} a year. ${c.insuranceLog}` },
      ],
      learnMore: [{ label: 'Your team: lender', href: '#/pros/lender' }, { label: 'Your team: insurance agent', href: '#/pros/insurance' }],
    },
    {
      key: 'offer',
      title: 'Your offer',
      outcome: 'A signed contract, its deadlines on your calendar, and your deposit sent safely.',
      brief: [
        'Your agent writes the offer. You choose the price and the conditions (contingencies) that let you cancel and get your deposit back if something goes wrong.',
        c.contractNote,
      ],
      docs: [
        {
          kind: 'Purchase contract (summary)',
          after: 'price',
          guide: 'contract',
          title: 'The contract, once both of you have signed',
          from: 'Signed by you and the seller (fictional)',
          rows: [['Price', $(offer)], ...c.contractRows(N)],
          notes: ['If you offered less, this is the contract you’d have after accepting the seller’s counteroffer.'],
        },
      ],
      tasks: [
        {
          kind: 'choice',
          id: 'price',
          prompt: `The list price is ${$(N.list)}. What do you offer?`,
          choices: [
            { label: `$289,000, with ${c.protections}`, verdict: 'best', why: 'It matches the value your sales comparables support, and fits your cash with room for repairs.' },
            { label: '$275,000, with the same contingencies', verdict: 'ok', why: 'A defensible opening offer after 41 days on the market. The seller may counter, or may say no.', log: `Opened at $275,000 with ${c.protections}.` },
            { label: `${$(N.list)} with no contingencies, to win it`, verdict: 'poor', why: 'You’d pay about $11,000 over the value, and give up your way out if the inspection or appraisal goes badly.' },
          ],
        },
        {
          kind: 'choice',
          id: 'signed',
          prompt: 'You’ve signed your offer. Do you have a contract?',
          choices: [
            { label: 'Not yet. It’s a contract once the seller accepts it in writing and you’re told.', verdict: 'best', why: 'Until then, the seller can accept another offer, and your deadlines haven’t started.' },
            { label: 'Yes. Signing it makes it binding.', verdict: 'poor', why: 'Your signature is an offer. The seller has to accept it before it binds anyone.' },
          ],
        },
        {
          kind: 'choice',
          id: 'countered',
          if: { task: 'price', is: [1] },
          prompt: `The seller counters in writing at ${$(offer)}, pointing to the same three closed sales you found, with the same contingencies. The counteroffer expires tomorrow at 5 p.m. What do you do?`,
          choices: [
            { label: `Accept the ${$(offer)} counter in writing before it expires.`, verdict: 'best', why: 'It’s the value the closed sales support, and your cash plan already works at this price. Opening lower cost you nothing.', log: `The seller countered at ${$(offer)}. You accepted in writing: it matches the value from the closed sales and fits your cash.` },
            { label: 'Counter back at $282,000.', verdict: 'ok', why: 'Fair to try, but the seller already moved to the value you calculated yourself. In this practice case they hold at their counter, so the contract below is at that price.', log: `The seller countered at ${$(offer)}. You countered at $282,000; the seller held, and you accepted ${$(offer)} in writing.` },
            { label: 'Walk away: you’d only pay $275,000.', verdict: 'ok', walk: true, why: `Allowed, and nothing is lost: no contract was signed. But ${$(offer)} matches the value and fits your plan, so here you’d be passing on a deal that works. Know why your limit is your limit.`, log: `The seller countered at ${$(offer)}. You declined: your limit was $275,000.` },
            { label: 'Let it expire and wait for the seller to come back lower.', verdict: 'poor', why: 'Once a counteroffer expires, there’s nothing to accept. The seller is free to sell to someone else.' },
          ],
        },
        {
          kind: 'choice',
          id: 'wire',
          prompt: `The seller accepts. An email that looks like it’s from ${c.wireFrom ?? 'escrow'} arrives with wiring instructions for your earnest money. What do you do?`,
          choices: [
            { label: c.wireCall ?? 'Call the escrow officer at a phone number you already trust (from your agent or the escrow company’s website) to confirm the instructions before sending anything.', verdict: 'best', why: 'Fake wiring emails are a common scam in real estate, and wired money is very hard to get back. Always confirm by phone with a number you found yourself.' },
            { label: 'Reply to the email to confirm it’s real.', verdict: 'poor', why: 'If the email is fake, the scammer answers. Use a number you found yourself.' },
            { label: 'Wire it right away so you don’t miss the deposit deadline.', verdict: 'poor', why: 'A quick call takes minutes. A wire sent to a scammer is usually gone for good.' },
          ],
        },
        ...(c.offerTasks?.(N) ?? []),
      ],
      log: [{ area: 'Contract', finding: `Signed at ${$(offer)}. ${c.depositLog(N)}, confirmed by phone before wiring.` }],
      dates: typeof c.dates === 'function' ? c.dates(N) : c.dates,
      learnMore: [{ label: 'Lesson: making an offer and closing', href: '#/learn/negotiate' }],
    },
    {
      key: 'inspection',
      title: 'The inspection',
      outcome: `The inspection report, the repairs sorted into “now” and “later”, and your answer to the seller ${c.counterDue?.by ?? 'before Day 10'}.`,
      brief: [
        'You hire a home inspector, and on their advice a plumber to run a camera through the sewer line. Both reports come back on Day 6.',
        'Sort each problem: fix now (safety, or anything that could stop the home from renting), or budget for later.',
        ...(c.inspectionBrief ? [c.inspectionBrief] : []),
      ],
      docs: [
        {
          kind: 'Inspection report (extract)',
          guide: 'repair-bid',
          title: 'Findings that need attention',
          from: 'Example Home Inspections and Example Plumbing (fictional)',
          table: {
            head: ['Item', 'Finding', 'Estimate'],
            rows: [
              ['Sewer line', 'Camera shows roots and a sagging section 30 ft from the house. Backups likely.', `${$(sewer)} to repair (plumber’s bid)`],
              ['Electrical panel', 'A panel brand electricians associate with breakers that may fail to trip. Recommend replacement.', `${$(panel)} (electrician’s bid)`],
              ['Roof', c.roofFinding, 'About $14,000 when it’s due'],
              ['Water heater', '14 years old, working', 'About $1,600 when it fails'],
              ['Kitchen outlets', 'Two outlets near the sink lack shock protection (GFCI)', 'Included in the electrician’s panel bid'],
            ],
          },
          notes: ['The listing said “roof and plumbing in good shape.” This is why you inspect.'],
        },
      ],
      tasks: [
        {
          kind: 'multi',
          id: 'now',
          prompt: 'Which items need fixing before a tenant moves in? Choose all that apply.',
          options: [
            { label: 'Sewer line', right: true, why: 'A backup makes the home unlivable and is expensive to clean up.' },
            { label: 'Electrical panel', right: true, why: 'A safety risk for your tenant, and some insurers ask about this kind of panel.' },
            { label: 'Kitchen outlets', right: true, why: 'Small and cheap, but a safety item. The electrician’s panel bid includes them.' },
            { label: c.roofPart[0].toUpperCase() + c.roofPart.slice(1), right: false, why: 'Budget for it now (a reserve each month), but it has years left.' },
            { label: 'Water heater', right: false, why: 'Budget for it. Replace it when it fails or before it leaks.' },
          ],
        },
        {
          kind: 'number',
          id: 'replace-now',
          prompt: `The ${c.roofPart} has 4–6 years left (about $14,000) and the water heater is 14 years old (about $1,600). To have both saved in 4 years, the short end of the estimate, how much do you set aside each month?`,
          answer: N.replaceMonthly,
          tolerance: 5,
          worked: [`$14,000 + $1,600 = $15,600`, `$15,600 ÷ 48 months = ${$(N.replaceMonthly)} a month`, `Your plan’s 5% set-aside for big replacements is ${$(N.setAside)}, about ${$(N.replaceMonthly - N.setAside)} a month short.`],
          hint: 'Add the two costs, then divide by the months until the sooner one is due.',
        },
        {
          kind: 'choice',
          id: 'replace-fit',
          prompt: `Your goal is a long-term rental where the rent covers the costs. At ${$(offer)}, the rent leaves about ${N.cashFlowAtOffer < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowAtOffer))} a month with the usual 5% set-aside, but about ${N.cashFlowAtOfferWithReplacements < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowAtOfferWithReplacements))} once the roof and water heater are budgeted. What does that mean for this offer?`,
          choices: [
            { label: 'The known replacements are part of the price: use the inspection report to ask for a lower price, and walk away if the numbers still don’t fit.', verdict: 'best', why: 'This is the moment you can still change the deal. After the inspection deadline, the roof is your problem at the price you agreed.', log: `Replacement budget at inspection: about ${$(N.replaceMonthly)} a month for the roof and water heater; cash flow at ${$(offer)} about ${N.cashFlowAtOfferWithReplacements < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowAtOfferWithReplacements))} a month.` },
            { label: 'Keep going, as a long-term hold: write down that the rent won’t fully cover the costs for a few years, and how much of your reserve covers the gap.', verdict: 'ok', why: 'Defensible for a long-term plan, if your reserves can carry the shortfall. It isn’t a monthly-income deal, and you should still ask for the repairs that make it rentable.' },
            { label: c.cancelInspection, verdict: 'ok', walk: true, why: `A good result when the deal doesn’t meet your goal. ${c.leaveInspection}` },
            { label: N.cashFlowAtOffer >= 0 ? `Go ahead: it makes about ${$(N.cashFlowAtOffer)} a month.` : `Go ahead: it only loses about ${$(-N.cashFlowAtOffer)} a month.`, verdict: 'poor', why: `That number assumes the ${c.roofPart} and water heater are covered by a 5% set-aside. They aren’t: in 4 years 5% saves about ${$(N.setAside * 48)}, against $15,600.` },
          ],
          ifDifferent: 'If your goal were monthly income, this house wouldn’t fit at any price the seller is likely to take. Walking away would be the answer, not a bigger rent guess.',
        },
        {
          kind: 'number',
          id: 'left',
          prompt: `At $289,000, you needed ${$(N.cashOffer)} and had ${$(N.investable)}. If you pay for the sewer and the panel yourself, how much is left for everything else?`,
          answer: N.investable - N.cashOffer - N.urgent,
          tolerance: 50,
          worked: [`${$(N.investable)} − ${$(N.cashOffer)} = ${$(N.investable - N.cashOffer)}`, `${$(N.investable - N.cashOffer)} − ${$(N.urgent)} (sewer + panel) = ${$(N.investable - N.cashOffer - N.urgent)}`, N.investable - N.cashOffer - N.urgent < 1_600 ? 'That isn’t enough for a water heater, let alone a vacancy. Something has to change.' : 'That covers a water heater, but not much more: one vacancy or a second repair would use it up. Something has to change.'],
        },
        {
          kind: 'choice',
          id: 'respond',
          prompt: 'It’s Day 7. What do you ask the seller for?',
          choices: [
            { label: `Lower the price by ${$(N.urgent)} to cover the sewer and the panel.`, verdict: 'best', why: 'The findings are documented, with bids. A price cut also lowers your down payment and loan.' },
            { label: `A ${$(N.urgent)} seller credit at closing.`, verdict: 'poor', why: `This lender caps seller credits at 2% (${$(offer * 0.02)}), and they can only pay closing costs. Your closing costs are ${$(closingCosts)}, so about ${$(N.urgent - offer * 0.02)} of a ${$(N.urgent)} credit, nearly half, couldn’t be used, and the lender would count it against the price. Ask for a lower price instead: you and the seller sign that change to the contract.` },
            { label: 'Ask the seller to make the repairs before closing.', verdict: 'ok', why: 'It can work, but you don’t control who does the work or how well. Ask for permits and receipts, and re-inspect.' },
            { label: c.cancelInspection, verdict: 'ok', walk: true, why: `A good result when a deal no longer fits. ${c.leaveInspection}` },
            { label: 'Say nothing and go ahead.', verdict: 'poor', why: `You’d have about ${$(N.investable - N.cashOffer - N.urgent)} left for everything that goes wrong. That’s too thin.` },
          ],
          ifDifferent: 'If you had $20,000 more in savings, going ahead and fixing it yourself could be reasonable. The right answer depends on your cash, not just the house.',
        },
        {
          kind: 'choice',
          id: 'counter',
          if: { task: 'respond', is: [0] },
          prompt: `The seller agrees to take ${$(offer - renegotiated)} off: a new price of ${$(renegotiated)}. With the repairs paid by you, you’d need ${$(N.cashRenegotiated)} of your ${$(N.investable)}. ${c.counterDue?.ask ?? 'Do you accept before Day 10?'}`,
          choices: [
            { label: c.counterDue?.accept ?? 'Accept in writing before Day 10.', verdict: 'ok', why: `You’d keep ${$(N.investable - N.cashRenegotiated)} beyond the lender’s reserves. Tight, but inside your plan, and the reserves are there for a bad month.` },
            { label: c.counterDue?.cancel ?? c.cancelShort, verdict: 'ok', walk: true, why: 'Also reasonable: the roof and water heater are coming, and your cushion is thin. Walking away with your deposit is a fine result.' },
            { label: c.counterDue?.late ?? 'Wait until Day 12 to decide.', verdict: 'poor', why: c.counterDue?.why ?? c.lateInspection },
          ],
          ifDifferent: 'Both accepting and walking away are defensible here. What matters is that you decide on the numbers, in writing, before the deadline.',
        },
        {
          kind: 'choice',
          id: 'repairs-reply',
          if: { task: 'respond', is: [2] },
          prompt: `The seller won’t manage contractors from out of state. Instead they offer ${$(offer - renegotiated)} off the price: a new price of ${$(renegotiated)}, and you handle the repairs. With the repairs paid by you, you’d need ${$(N.cashRenegotiated)} of your ${$(N.investable)}. ${c.counterDue?.ask ?? 'Do you accept before Day 10?'}`,
          choices: [
            { label: c.counterDue?.accept ?? 'Accept in writing before Day 10.', verdict: 'ok', why: `You’d keep ${$(N.investable - N.cashRenegotiated)} beyond the lender’s reserves, and you choose the contractors and check the permits yourself.`, log: `Asked the seller to make the repairs. They offered ${$(offer - renegotiated)} off instead, and you accepted in writing.` },
            { label: c.counterDue?.cancel ?? c.cancelShort, verdict: 'ok', walk: true, why: 'Also reasonable: the roof and water heater are coming, and your cushion is thin. Walking away with your deposit is a fine result.' },
            { label: c.counterDue?.late ?? 'Wait until Day 12 to decide.', verdict: 'poor', why: c.counterDue?.why ?? c.lateInspection },
          ],
        },
        {
          kind: 'write',
          id: 'ask-contractor',
          prompt: 'Write one question you’d ask the plumber before you rely on the bid.',
          to: 'Plumber',
          model: `Examples: “Does the bid include the permit, digging, and repairing the yard?” · ${c.licenseQuestion} · “What could make the price go up once you open the line?”`,
        },
      ],
      log: [
        { area: 'Condition', finding: `Sewer (${$(sewer)}) and panel (${$(panel)}) to fix now. Roof (4–6 years) and water heater to budget: about ${$(N.replaceMonthly)} a month, decided before the inspection deadline.`, open: 'Licensed contractors and permits for the repairs' },
        { area: 'Price', finding: `Renegotiated to ${$(renegotiated)} ${c.counterDue?.by ?? `before the ${c.periodName}`}.` },
      ],
      learnMore: [{ label: 'Your team: inspector', href: '#/pros/inspector' }, { label: 'Your team: contractor', href: '#/pros/contractor' }],
    },
    {
      key: 'appraisal',
      title: 'Appraisal and title',
      outcome: 'Your answer to a low appraisal, and a title commitment with every item that could stop closing marked.',
      brief: [
        `The lender’s appraisal comes back at ${$(appraised)}, below your ${$(renegotiated)} price. ${c.titleBrief ?? 'The title company also sends its title commitment: what it needs before closing, and what its policy won’t cover.'}`,
      ],
      docs: [
        {
          kind: 'Appraisal (summary)',
          title: `Appraised value: ${$(appraised)}`,
          from: 'Licensed appraiser, ordered by the lender (fictional)',
          notes: ['The appraiser weighed the dated sales most and adjusted for the sewer and panel findings.'],
        },
        {
          kind: 'Title commitment (extract)',
          guide: 'title',
          title: 'Requirements and exceptions',
          from: 'Example Title Co. (fictional)',
          table: {
            head: ['#', 'Item', 'Type'],
            rows: [
              ['1', 'Pay off and record a release of the 2016 deed of trust to First Example Bank', 'Requirement'],
              ['2', `Release of a mechanic’s lien recorded in 2023 by ${c.roofer} for $4,800`, 'Requirement'],
              ['3', 'HOA statement showing dues paid to date', 'Requirement'],
              ['4', 'Example Ridge CC&Rs, recorded 1971, including leasing rules', 'Exception'],
              ['5', 'Public utility easement, 5 ft along the rear lot line', 'Exception'],
              ['6', 'Property taxes for the current year, not yet due', 'Exception'],
            ],
          },
          notes: ['Requirements must be met before the title company will close. Exceptions are things the title policy won’t cover.'],
        },
        {
          kind: 'HOA rules (extract)',
          title: 'Leasing',
          from: 'Example Ridge HOA (fictional)',
          rows: [
            ['Minimum lease', '12 months'],
            ['Short-term rentals', 'Not allowed (under 30 days)'],
            ['Owner must give the HOA', 'A copy of each lease and the tenant’s contact information'],
          ],
        },
      ],
      tasks: [
        {
          kind: 'number',
          id: 'gap',
          prompt: `The lender lends 75% of the lower of the price and the appraisal. At ${$(renegotiated)} with a ${$(appraised)} appraisal, what is your new down payment?`,
          answer: N.downIfGapPaid,
          tolerance: 50,
          worked: [`Loan: 75% × ${$(appraised)} = ${$(N.loanFinal)}`, `Down payment: ${$(renegotiated)} − ${$(N.loanFinal)} = ${$(N.downIfGapPaid)}`, `That’s ${$(N.downIfGapPaid - (renegotiated - Math.round(renegotiated * 0.75)))} more than you planned.`],
        },
        ...(c.appraisalTasks?.(N) ?? []),
        {
          kind: 'choice',
          id: 'low-appraisal',
          prompt: 'It’s Day 15. What do you do about the low appraisal?',
          choices: [
            { label: `Ask the seller to lower the price to ${$(appraised)}, using your ${c.appraisalName}.`, verdict: 'best', why: `The appraisal is independent evidence. Most sellers know another buyer’s lender would see the same value. Here the seller agrees: the new price is ${$(finalPrice)}.${c.appraisalAskNote ? ` ${c.appraisalAskNote}` : ''}` },
            { label: 'Pay the difference from your cushion.', verdict: 'ok', why: `It works, but it shrinks a thin cushion further. Ask first; paying is your fallback. In this case your agent asks anyway and the seller agrees to ${$(finalPrice)}, so the rest of the purchase uses that price.` },
            { label: c.cancelAppraisal, verdict: 'ok', walk: true, why: `It makes sense if your cushion can’t take it. ${c.leaveAppraisal}` },
          ],
        },
        {
          kind: 'choice',
          id: 'title-stop',
          prompt: `The price is now ${$(finalPrice)}. In the title commitment, which requirement is unusual and needs your follow-up before closing?`,
          choices: [
            { label: '#2: the roofer’s mechanic’s lien', verdict: 'best', why: c.lienWhy },
            { label: '#1: the old deed of trust', verdict: 'ok', why: 'It must be cleared too, but paying off the seller’s loan at closing is routine. The roofer’s lien is the unusual one.' },
            { label: '#5: the utility easement', verdict: 'poor', why: 'A rear utility easement is common and usually harmless. It stays, but it rarely affects a rental.' },
          ],
        },
        {
          kind: 'choice',
          id: 'hoa-fit',
          prompt: c.hoaPrompt ?? 'Do the HOA’s leasing rules fit your plan?',
          choices: [
            { label: 'Yes: a 12-month lease fits. Send the HOA each lease and the tenant’s contact information.', verdict: 'best', why: 'Your plan was a long-term rental. A short-term rental plan would have died here.' },
            { label: 'No: HOAs can’t limit rentals, so ignore them.', verdict: 'poor', why: c.hoaRulesWhy ?? 'Many HOAs can and do limit rentals. Read the rules before your HOA review period ends.' },
          ],
        },
        {
          kind: 'write',
          id: 'ask-title',
          prompt: 'Write the question you’d send the title officer about item #2.',
          to: 'Title officer',
          model: 'Example: “How will the 2023 mechanic’s lien be cleared before closing, and will I get a recorded release? If it can’t be cleared in time, what are my options?”',
        },
      ],
      log: [
        { area: 'Value', finding: `Appraised at ${$(appraised)}. ${c.appraisalLog ? c.appraisalLog($(finalPrice)) : `Price lowered to ${$(finalPrice)} under the ${c.appraisalName}.`}` },
        { area: 'Title', finding: 'Old deed of trust and a $4,800 mechanic’s lien to be cleared before closing. Utility easement stays.', open: 'Recorded release of the mechanic’s lien' },
        { area: 'HOA', finding: '12-month minimum lease; no short-term rentals; send the HOA each lease.' },
      ],
      learnMore: [{ label: 'Your team: title company', href: '#/pros/title' }, { label: 'Your team: appraiser', href: '#/pros/appraiser' }],
    },
    {
      key: 'closing',
      title: 'Closing',
      outcome: 'A checked closing statement, your money sent safely, insurance in force, and the deed recorded in your name.',
      brief: [
        'In this practice, escrow sends the closing statement three days before closing. For a real investment-purpose loan, confirm the delivery timetable with your closing team; do not assume consumer mortgage disclosure rules apply. Check every line against your contract and loan.',
        'Inspection, appraisal, underwriting, title review and insurance arrangements overlap. Start them promptly and track each contract deadline and the person responsible.',
      ],
      docs: [
        {
          kind: 'Closing statement (extract)',
          guide: 'settlement',
          title: 'Buyer’s side',
          from: 'Example Title Co. (fictional)',
          table: {
            head: ['Line', 'Amount'],
            rows: [
              ['Purchase price', $(finalPrice)],
              ['New loan', `−${$(N.loanFinal)}`],
              ['Closing costs (lender, title, escrow, prepaid)', $(closingCosts)],
              ['Cash due from you at closing', $(N.wrongCashToClose)],
            ],
          },
        },
      ],
      tasks: [
        {
          kind: 'choice',
          id: 'error',
          prompt: 'Something is missing. What is it?',
          choices: [
            { label: `Your ${c.earnestCredit(N)} isn’t credited.`, verdict: 'best', why: `You already paid it ${c.earnestPaid}. It should reduce the cash you bring.` },
            { label: 'The seller’s credit for repairs.', verdict: 'poor', why: 'There isn’t one: you negotiated a lower price instead.' },
            { label: 'Nothing. It looks right.', verdict: 'poor', why: 'Check each payment you’ve already made. Your earnest money is missing.' },
          ],
        },
        {
          kind: 'number',
          id: 'cash-to-close',
          prompt: 'What should the cash due from you at closing be?',
          answer: N.cashToClose,
          tolerance: 10,
          worked: [`${$(finalPrice)} − ${$(N.loanFinal)} + ${$(closingCosts)} − ${$(earnest)} ${c.earnestShort} = ${$(N.cashToClose)}`],
        },
        {
          kind: 'choice', id: 'final-check',
          prompt: 'Before signing, the lender still needs a document and the agreed repairs have not been checked. What should you do?',
          choices: [
            { label: 'Resolve the lender’s conditions and do a permitted final walkthrough with your agent before closing.', verdict: 'best', why: 'Pre-approval is not final approval. Check agreed repairs, included items and possession, and resolve any issue with your team before signing.' },
            { label: 'Sign now; the pre-approval and earlier inspection are enough.', verdict: 'poor', why: 'The loan may still fail, and conditions may have changed. Confirm final approval and the property’s agreed condition.' },
          ],
        },
        {
          kind: 'choice',
          id: 'insure',
          prompt: 'When should your landlord policy start?',
          choices: [
            { label: 'On the day you close, when the house becomes yours. The lender will usually want proof first.', verdict: 'best', why: 'From closing, a fire or a burst pipe is your loss. Don’t leave a gap.' },
            { label: 'When the tenant moves in.', verdict: 'poor', why: 'The house is yours, and at risk, from closing on.' },
          ],
        },
      ],
      log: [
        { area: 'Closing', finding: `Earnest money credit added. Cash to close ${$(N.cashToClose)}. Wire confirmed by phone. Landlord policy starts at closing.`, open: 'Copy of the recorded deed and the lien release' },
      ],
    },
    {
      key: 'after',
      title: 'Your first weeks',
      outcome: 'A first-week checklist done, repairs started the right way, and a lawful screening and lease plan.',
      brief: [
        'The deed is recorded in your name. The house is vacant, so you can go in. Now get it safe, fixed and rented.',
        c.rentRulesNote,
      ],
      docs: [],
      tasks: [
        {
          kind: 'multi',
          id: 'first-week',
          prompt: 'What belongs on your first-week list? Choose all that apply.',
          options: [
            { label: 'Change or rekey the locks', right: true, why: c.rekeyWhy },
            { label: 'Put the utilities in your name', right: true, why: 'Avoid a shutoff, and keep the home heated or cooled so pipes and finishes stay safe.' },
            { label: 'Take dated photos and video of every room', right: true, why: 'Your record of condition before repairs and before a tenant.' },
            { label: 'Give the HOA your mailing address and how to reach you', right: true, why: 'So notices and dues statements reach you.' },
            { label: 'Open a separate bank account for the rental', right: true, why: 'Clean records make taxes and decisions much easier.' },
            { label: 'Hire licensed contractors, with permits, for the sewer and panel work', right: true, why: 'Permits and licenses protect you, your tenant and your insurance coverage.' },
            { label: 'List it for rent before the sewer is fixed', right: false, why: 'Fix safety and habitability items first. A backup with a tenant in the home is worse.' },
          ],
        },
        {
          kind: 'multi',
          id: 'lead',
          prompt: 'The house was built in 1972. Under federal law, what must you do before a tenant signs? Choose all that apply.',
          options: [
            { label: 'Give the EPA pamphlet “Protect Your Family From Lead in Your Home”', right: true, why: 'Required for most housing built before 1978.' },
            { label: 'Tell the tenant about any lead paint or hazards you know of, and share any reports', right: true, why: 'Required, even if you know of none (then you say so).' },
            { label: 'Include the lead warning statement in the lease, signed', right: true, why: 'Required, and keep a copy for at least 3 years from the start of the lease.' },
            { label: 'Test the home for lead before you can rent it', right: false, why: 'Federal disclosure rules don’t require a test. Some local rules or programs might, so check yours.' },
          ],
        },
        {
          kind: 'choice',
          id: 'adverse',
          prompt: 'An applicant’s credit report shows unpaid collections, so you decide to deny them. What must you do?',
          choices: [
            { label: 'Give an adverse action notice: the credit bureau’s name, address and phone, that the bureau didn’t make the decision, and their right to a free report within 60 days and to dispute it.', verdict: 'best', why: 'Federal law (the Fair Credit Reporting Act) requires this whenever a report leads to a denial, a cosigner, a bigger deposit or higher rent. If you used a credit score, more is required. Written is best for your records.' },
            { label: 'Nothing. Landlords don’t have to explain denials.', verdict: 'poor', why: 'When a consumer report played a part, the notice is required.' },
            { label: 'Approve them, but quietly charge a bigger deposit.', verdict: 'poor', why: 'A bigger deposit because of the report also requires the notice. And apply the same written criteria to every applicant.' },
          ],
        },
        ...c.rentTasks(N),
      ],
      log: [
        { area: 'First week', finding: 'Locks changed, utilities moved, condition photos taken, HOA told, rental bank account open.' },
        { area: 'Renting', finding: `Lead pamphlet and disclosure ready. Written screening criteria with adverse action notices. ${c.rentLog(N)}` },
      ],
      learnMore: [{ label: 'Lesson: after you close', href: '#/learn/after-closing' }],
    },
    {
      key: 'run',
      title: 'Run it and review',
      outcome: 'Your real monthly cash flow, a reserve plan, and what you’ll review in 6 months.',
      brief: [
        `A tenant signs a 12-month lease at ${$(rent)}. Each month you set money aside for the slow months, the repairs and the big replacements (the roof, the water heater), even when nothing breaks.`,
      ],
      docs: [
        {
          kind: 'Your monthly numbers',
          title: 'Self-managed',
          from: 'You (practice numbers)',
          table: {
            head: ['Item', 'Monthly'],
            rows: [
              ['Rent', $(rent)],
              ['Set aside for vacancy (5%)', $(N.setAside)],
              ['Set aside for repairs (5%)', $(N.setAside)],
              ['Set aside for big replacements (5%)', $(N.setAside)],
              ['Property taxes', $(tax)],
              ['Insurance', $(insurance)],
              ['HOA', $(hoa)],
              ['Loan payment (principal and interest)', $(N.piFinal)],
            ],
          },
          notes: ['The 5% set-asides are a planning choice for this practice house, not a rule. Older homes often need more.'],
        },
      ],
      tasks: [
        {
          kind: 'number',
          id: 'cash-flow',
          prompt: 'What is your monthly cash flow after the set-asides?',
          answer: N.cashFlow,
          tolerance: 5,
          worked: [`${$(rent)} − 3 × ${$(N.setAside)} − ${$(tax)} − ${$(insurance)} − ${$(hoa)} − ${$(N.piFinal)} = ${$(N.cashFlow)}`, 'That uses the 5% set-asides. The next question checks whether 5% is enough for this house.'],
        },
        {
          kind: 'number',
          id: 'replacements',
          prompt: `You first budgeted this at the inspection: the ${c.roofPart} has 4–6 years left (about $14,000) and the water heater is 14 years old (about $1,600). Now that you own it, how much goes into the replacement account each month?`,
          answer: N.replaceMonthly,
          tolerance: 5,
          worked: [`$14,000 + $1,600 = $15,600`, `$15,600 ÷ 48 months = ${$(N.replaceMonthly)} a month`, `Your 5% set-aside is ${$(N.setAside)}: about ${$(N.replaceMonthly - N.setAside)} a month short, before any other big replacement.`],
        },
        {
          kind: 'choice',
          id: 'replacement-plan',
          prompt: `Your plan sets aside ${$(N.setAside)} a month for big replacements; the roof and water heater alone need about ${$(N.replaceMonthly)}. What do you do?`,
          choices: [
            { label: `Budget the real number: set aside about ${$(N.replaceMonthly)} a month. Cash flow drops to about ${N.cashFlowWithReplacements < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowWithReplacements))} a month, and you write down how you’ll cover it.`, verdict: 'best', why: 'The roof is coming whether you budget for it or not. Known replacements belong in the numbers before you decide whether the deal fits.', log: `Replacement plan: about ${$(N.replaceMonthly)} a month for the roof and water heater; cash flow about ${N.cashFlowWithReplacements < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowWithReplacements))} a month self-managed.` },
            { label: 'Keep the 5% and deal with the roof when it happens.', verdict: 'poor', why: `In 4 years, ${$(N.setAside)} a month saves about ${$(N.setAside * 48)}, against a $14,000 roof. The gap would come from your emergency fund or a loan.` },
            { label: 'Raise the rent enough to cover it.', verdict: 'poor', why: `Leased comparables A, B and C support about ${$(rent)}. A rent the market won’t pay means a longer vacancy, not more money.` },
          ],
        },
        {
          kind: 'choice',
          id: 'good-deal',
          prompt: 'Was this a good purchase?',
          choices: [
            { label: `It fits a long-term plan only if you can add about ${$(-N.cashFlowWithReplacements)} a month: with the roof and water heater budgeted, the rent falls short even self-managed. It doesn’t meet a monthly-income goal.`, verdict: 'best', why: 'An honest answer. Appreciation and rent increases might help later, but they aren’t guaranteed, so they can’t close today’s budget gap.' },
            { label: `Yes, it makes ${$(N.cashFlow)} a month, so it’s a great investment.`, verdict: 'poor', why: `That’s before any big repair or a vacant month. One $1,600 water heater takes ${N.cashFlow * 12 < 1_600 ? 'more than' : 'most of'} a year’s profit.` },
            { label: 'No. Any rental that doesn’t make $500 a month is a bad deal.', verdict: 'ok', why: 'A fine rule if your goal is income. This plan’s goal was long-term growth with rent covering costs.' },
          ],
        },
        {
          kind: 'write',
          id: 'review',
          prompt: 'What will you check when you review this rental in 6 months?',
          to: 'You',
          model: 'Examples: actual costs against these numbers · whether the set-asides covered what broke · the rent compared with new leases nearby · the roof and water heater · whether to keep self-managing · what you’d change in your buy box before the next one.',
        },
      ],
      log: [{ area: 'Operating', finding: `With the roof and water heater budgeted (about ${$(N.replaceMonthly)} a month), cash flow is about ${N.cashFlowWithReplacements < 0 ? '−\u2060' : ''}${$(Math.abs(N.cashFlowWithReplacements))} a month self-managed${N.cashFlowWithReplacements < 0 ? ': the rent doesn’t cover the costs, so you fund the shortfall yourself' : ''}. The earlier generic assumption (5% set-asides) showed about ${$(N.cashFlow)}. Review in 6 months.` }],
      learnMore: [{ label: 'Lesson: after you close', href: '#/learn/after-closing' }, { label: 'My plan', href: '#/toolkit' }],
    },
  ];

  return { state: c.state, stateName: c.stateName, property: `1418 Example Ridge Court, ${c.city}, ${c.stateName} (fictional)`, N, stages, walkKept: c.walkKept?.(N) ?? 'so you keep your earnest money' };
}

export type PracticeCase = ReturnType<typeof buildCase>;
export const NV_CASE = buildCase(NV);
export const TX_CASE = buildCase(TX);
export const CA_CASE = buildCase(CA);
export const AZ_CASE = buildCase(AZ);
export const UT_CASE = buildCase(UT);
const CASES: Record<string, PracticeCase> = { NV: NV_CASE, TX: TX_CASE, CA: CA_CASE, AZ: AZ_CASE, UT: UT_CASE };
/** The practice purchase for a state: each covered state has its own house; with no state chosen, Nevada's. */
/** Before the offer is signed there's no contract, so nothing is at stake; after, a contract deadline protects the deposit. */
export function walkNote(stageKey: string, c: PracticeCase): string {
  const i = c.stages.findIndex((s) => s.key === stageKey);
  const offer = c.stages.findIndex((s) => s.key === 'offer');
  return i <= offer ? 'No contract was signed, so nothing was at risk.' : `You left inside a contract deadline, ${c.walkKept}.`;
}

export const caseFor = (state: string | null | undefined): PracticeCase => CASES[state ?? ''] ?? NV_CASE;

/** The Nevada version's numbers and steps (the default). */
export const N = NV_CASE.N;
export const RENTAL_CASE = NV_CASE.stages;
export const CASE_PROPERTY = NV_CASE.property;

export const caseStageByKey = (k: string, stages: CaseStage[] = RENTAL_CASE) => stages.find((s) => s.key === k);
