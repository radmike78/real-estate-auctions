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
//   118A.330). Texas: the TREC resale contract and its addenda (20-19, 36-11, 40-11, 49-1), mechanic's liens (Property
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

/** Steps before this one have no contract yet: walking away there costs nothing. */
export const CONTRACT_FROM = 'offer';

export const CASE_TITLE = 'Buy a rental, start to finish';


type Nums = Record<string, number>;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** What changes from one state's practice house to another's: place, costs, contract terms and landlord rules. */
interface CaseConfig {
  state: 'NV' | 'TX';
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
  dates: { when: string; what: string }[];
  depositLog: (n: Nums) => string;
  roofFinding: string;
  /** The part of the roof that's wearing out, as named in questions: the inspection's own words. */
  roofPart: string;
  cancelInspection: string;
  leaveInspection: string;
  lateInspection: string;
  cancelShort: string;
  periodName: string;
  /** The ways out the offer keeps, in this state's words. */
  protections: string;
  licenseQuestion: string;
  appraisalName: string;
  cancelAppraisal: string;
  leaveAppraisal: string;
  roofer: string;
  lienWhy: string;
  earnestPaid: string;
  earnestCredit: (n: Nums) => string;
  earnestShort: string;
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
  lienWhy: 'It’s a recorded claim against the house. In Nevada, a mechanic’s lien lapses after 6 months unless the contractor sues to enforce it, but the title company still wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
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
    ['Earnest money and option fee', `${usd(n.earnest - 200)} earnest money and a $200 option fee, to the title company (the escrow agent) within 3 days after the Effective Date. Both are credited to you at closing.`],
    ['Option period (20-19, paragraph 5)', 'Ends at 5 p.m. on Day 10. You can end the contract for any reason before then and get the earnest money back; the seller keeps the option fee. Miss the option fee deadline and you have no option period.'],
    ['Appraisal (addendum 49-1)', `You can end the contract by Day 17 if the lender’s appraisal is under ${usd(n.offer)}.`],
    ['Financing (addendum 40-11)', 'You can end the contract by Day 21 if the lender won’t approve the loan, with the lender’s written reason.'],
    ['HOA (addendum 36-11)', 'You can end the contract within 3 days after you receive the subdivision information (the HOA’s rules and resale certificate), if that’s before closing.'],
    ['Closing', 'Day 30, at the title company'],
    ['Counting days', 'Calendar days. Ask your agent how the contract treats a deadline on a weekend or holiday; the option period ends at 5 p.m. on its last day.'],
  ],
  dates: [
    { when: 'Day 0', what: 'The Effective Date. Every deadline below counts from here.' },
    { when: 'Within 3 days after Day 0', what: 'Earnest money and option fee to the title company (confirm the instructions by phone first). You: the buyer. Miss it and you lose the option period.' },
    { when: '5 p.m., Day 10', what: 'Option period ends: end the contract, ask for changes, or go ahead, in writing. You, with your agent.' },
    { when: '3 days after you receive the subdivision information', what: 'HOA addendum: end the contract in writing if the rules block your plan. Write down the day it arrives.' },
    { when: 'Day 17', what: 'Appraisal addendum deadline. You, with your lender’s appraisal.' },
    { when: 'Day 21', what: 'Financing addendum deadline for the loan approval. Your lender confirms the loan.' },
    { when: 'Day 30', what: 'Closing at the title company.' },
  ],
  depositLog: (n) => `Earnest money and option fee ${usd(n.earnest)}`,
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
  cancelAppraisal: 'End the contract by Day 17 under the appraisal addendum and get the earnest money back.',
  leaveAppraisal: 'Your appraisal addendum lets you end the contract by Day 17 when the appraisal comes in under the price.',
  roofer: 'Example Roofing of Texas',
  lienWhy: 'It’s a recorded claim against the house. In Texas, a contractor on a home job must file the lien by the 15th day of the third month after the work ends, and sue to enforce it within a year after that filing deadline (Property Code 53.052, 53.158). Either way, the title company wants it released or cleared on the record before closing. Ask the title officer how, and whether a lawsuit was filed.',
  earnestPaid: 'to the title company within 3 days after the Effective Date, along with the option fee',
  earnestCredit: (n) => `${usd(n.earnest)} in earnest money and option fee`,
  earnestShort: 'earnest money and option fee',
  rentRulesNote: 'Rules on deposits, locks and applications are state law. The ones below are Texas’s, because this practice house is in Texas.',
  rekeyWhy: 'You don’t know who else has keys. Texas also requires rekeying within 7 days after each tenant moves out (Property Code 92.156).',
  rentTasks: (n) => [
    {
      kind: 'choice',
      id: 'tx-deposit',
      prompt: `In Texas, what is the most you can take as a security deposit at ${usd(n.rent)} a month rent?`,
      choices: [
        { label: 'Texas law sets no limit. Pick an amount the market accepts, and return it with an itemized list of deductions within 30 days after the tenant moves out.', verdict: 'best', why: 'Texas doesn’t cap deposits, but you must refund them, less itemized deductions for damage beyond normal wear and tear, within 30 days after the tenant leaves (Property Code 92.103, 92.104).' },
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
  rentLog: () => 'Selection criteria given with a signed acknowledgment. Deposit returned within 30 days with an itemized list (Texas).',
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
          prompt: 'The seller accepts. An email that looks like it’s from escrow arrives with wiring instructions for your earnest money. What do you do?',
          choices: [
            { label: 'Call the escrow officer at a phone number you already trust (from your agent or the escrow company’s website) to confirm the instructions before sending anything.', verdict: 'best', why: 'Fake wiring emails are a common scam in real estate, and wired money is very hard to get back. Always confirm by phone with a number you found yourself.' },
            { label: 'Reply to the email to confirm it’s real.', verdict: 'poor', why: 'If the email is fake, the scammer answers. Use a number you found yourself.' },
            { label: 'Wire it right away so you don’t miss the 3-day deadline.', verdict: 'poor', why: 'A quick call takes minutes. A wire sent to a scammer is usually gone for good.' },
          ],
        },
      ],
      log: [{ area: 'Contract', finding: `Signed at ${$(offer)}. ${c.depositLog(N)}, confirmed by phone before wiring.` }],
      dates: c.dates,
      learnMore: [{ label: 'Lesson: negotiating', href: '#/learn/negotiate' }],
    },
    {
      key: 'inspection',
      title: 'The inspection',
      outcome: 'The inspection report, the repairs sorted into “now” and “later”, and your answer to the seller before Day 10.',
      brief: [
        'You hire a home inspector, and on their advice a plumber to run a camera through the sewer line. Both reports come back on Day 6.',
        'Sort each problem: fix now (safety, or anything that could stop the home from renting), or budget for later.',
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
          id: 'left',
          prompt: `At $289,000, you needed ${$(N.cashOffer)} and had ${$(N.investable)}. If you pay for the sewer and the panel yourself, how much is left for everything else?`,
          answer: N.investable - N.cashOffer - N.urgent,
          tolerance: 50,
          worked: [`${$(N.investable)} − ${$(N.cashOffer)} = ${$(N.investable - N.cashOffer)}`, `${$(N.investable - N.cashOffer)} − ${$(N.urgent)} (sewer + panel) = ${$(N.investable - N.cashOffer - N.urgent)}`, 'That isn’t enough for a water heater, let alone a vacancy. Something has to change.'],
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
          prompt: `The seller agrees to take ${$(offer - renegotiated)} off: a new price of ${$(renegotiated)}. With the repairs paid by you, you’d need ${$(N.cashRenegotiated)} of your ${$(N.investable)}. Do you accept before Day 10?`,
          choices: [
            { label: 'Accept in writing before Day 10.', verdict: 'ok', why: `You’d keep ${$(N.investable - N.cashRenegotiated)} beyond the lender’s reserves. Tight, but inside your plan, and the reserves are there for a bad month.` },
            { label: c.cancelShort, verdict: 'ok', walk: true, why: 'Also reasonable: the roof and water heater are coming, and your cushion is thin. Walking away with your deposit is a fine result.' },
            { label: 'Wait until Day 12 to decide.', verdict: 'poor', why: c.lateInspection },
          ],
          ifDifferent: 'Both accepting and walking away are defensible here. What matters is that you decide on the numbers, in writing, before the deadline.',
        },
        {
          kind: 'choice',
          id: 'repairs-reply',
          if: { task: 'respond', is: [2] },
          prompt: `The seller won’t manage contractors from out of state. Instead they offer ${$(offer - renegotiated)} off the price: a new price of ${$(renegotiated)}, and you handle the repairs. With the repairs paid by you, you’d need ${$(N.cashRenegotiated)} of your ${$(N.investable)}. Do you accept before Day 10?`,
          choices: [
            { label: 'Accept in writing before Day 10.', verdict: 'ok', why: `You’d keep ${$(N.investable - N.cashRenegotiated)} beyond the lender’s reserves, and you choose the contractors and check the permits yourself.`, log: `Asked the seller to make the repairs. They offered ${$(offer - renegotiated)} off instead, and you accepted in writing.` },
            { label: c.cancelShort, verdict: 'ok', walk: true, why: 'Also reasonable: the roof and water heater are coming, and your cushion is thin. Walking away with your deposit is a fine result.' },
            { label: 'Wait until Day 12 to decide.', verdict: 'poor', why: c.lateInspection },
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
        { area: 'Condition', finding: `Sewer (${$(sewer)}) and panel (${$(panel)}) to fix now. Roof (4–6 years) and water heater to budget.`, open: 'Licensed contractors and permits for the repairs' },
        { area: 'Price', finding: `Renegotiated to ${$(renegotiated)} before the ${c.periodName}.` },
      ],
      learnMore: [{ label: 'Your team: inspector', href: '#/pros/inspector' }, { label: 'Your team: contractor', href: '#/pros/contractor' }],
    },
    {
      key: 'appraisal',
      title: 'Appraisal and title',
      outcome: 'Your answer to a low appraisal, and a title commitment with every item that could stop closing marked.',
      brief: [
        `The lender’s appraisal comes back at ${$(appraised)}, below your ${$(renegotiated)} price. The title company also sends its title commitment: what it needs before closing, and what its policy won’t cover.`,
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
        {
          kind: 'choice',
          id: 'low-appraisal',
          prompt: 'It’s Day 15. What do you do about the low appraisal?',
          choices: [
            { label: `Ask the seller to lower the price to ${$(appraised)}, using your ${c.appraisalName}.`, verdict: 'best', why: `The appraisal is independent evidence. Most sellers know another buyer’s lender would see the same value. Here the seller agrees: the new price is ${$(finalPrice)}.` },
            { label: 'Pay the difference from your cushion.', verdict: 'ok', why: `It works, but it shrinks a thin cushion further. Ask first; paying is your fallback. In this case your agent asks anyway and the seller agrees to ${$(finalPrice)}, so the rest of the purchase uses that price.` },
            { label: c.cancelAppraisal, verdict: 'ok', walk: true, why: `Reasonable if your cushion can’t take it. ${c.leaveAppraisal}` },
          ],
        },
        {
          kind: 'choice',
          id: 'title-stop',
          prompt: `The price is now ${$(finalPrice)}. In the title commitment, which item could stop your closing if nobody deals with it?`,
          choices: [
            { label: '#2: the roofer’s mechanic’s lien', verdict: 'best', why: c.lienWhy },
            { label: '#1: the old deed of trust', verdict: 'ok', why: 'It must be cleared too, but paying off the seller’s loan at closing is routine. The roofer’s lien is the unusual one.' },
            { label: '#5: the utility easement', verdict: 'poor', why: 'A rear utility easement is common and usually harmless. It stays, but it rarely affects a rental.' },
          ],
        },
        {
          kind: 'choice',
          id: 'hoa-fit',
          prompt: 'Do the HOA’s leasing rules fit your plan?',
          choices: [
            { label: 'Yes: a 12-month lease fits. Send the HOA each lease and the tenant’s contact information.', verdict: 'best', why: 'Your plan was a long-term rental. A short-term rental plan would have died here.' },
            { label: 'No: HOAs can’t limit rentals, so ignore them.', verdict: 'poor', why: 'Many HOAs can and do limit rentals. Read the rules before your HOA review period ends.' },
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
        { area: 'Value', finding: `Appraised at ${$(appraised)}. Price lowered to ${$(finalPrice)} under the ${c.appraisalName}.` },
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
        'Three days before closing, escrow sends the closing statement. Check every line against your contract and your loan. Mistakes happen, and they’re easiest to fix before you sign.',
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
          prompt: `The inspection found the ${c.roofPart} has 4–6 years left (about $14,000) and the 14-year-old water heater (about $1,600). To have both saved in 4 years, how much do you set aside each month?`,
          answer: N.replaceMonthly,
          tolerance: 5,
          worked: [`$14,000 + $1,600 = $15,600`, `$15,600 ÷ 48 months = ${$(N.replaceMonthly)} a month`, `Your 5% set-aside is ${$(N.setAside)}: about ${$(N.replaceMonthly - N.setAside)} a month short, before any other big replacement.`],
        },
        {
          kind: 'choice',
          id: 'replacement-plan',
          prompt: `Your plan sets aside ${$(N.setAside)} a month for big replacements; the roof and water heater alone need about ${$(N.replaceMonthly)}. What do you do?`,
          choices: [
            { label: `Budget the real number: set aside about ${$(N.replaceMonthly)} a month. Cash flow drops to about ${N.cashFlowWithReplacements < 0 ? '−' : ''}${$(Math.abs(N.cashFlowWithReplacements))} a month, and you write down how you’ll cover it.`, verdict: 'best', why: 'The roof is coming whether you budget for it or not. Known replacements belong in the numbers before you decide whether the deal fits.', log: `Replacement plan: about ${$(N.replaceMonthly)} a month for the roof and water heater; cash flow about ${N.cashFlowWithReplacements < 0 ? '−' : ''}${$(Math.abs(N.cashFlowWithReplacements))} a month self-managed.` },
            { label: 'Keep the 5% and deal with the roof when it happens.', verdict: 'poor', why: `In 4 years, ${$(N.setAside)} a month saves about ${$(N.setAside * 48)}, against a $14,000 roof. The gap would come from your emergency fund or a loan.` },
            { label: 'Raise the rent enough to cover it.', verdict: 'poor', why: `Leased comparables A, B and C support about ${$(rent)}. A rent the market won’t pay means a longer vacancy, not more money.` },
          ],
        },
        {
          kind: 'choice',
          id: 'good-deal',
          prompt: 'Was this a good purchase?',
          choices: [
            { label: N.cashFlowWithReplacements > -75 ? 'It fits a long-term plan only: with the roof and water heater budgeted, the rent about covers the costs self-managed, and falls short with a manager. It doesn’t meet a monthly-income goal.' : `It fits a long-term plan only if you can add about ${$(-N.cashFlowWithReplacements)} a month: with the roof and water heater budgeted, the rent falls short even self-managed. It doesn’t meet a monthly-income goal.`, verdict: 'best', why: 'An honest answer. Appreciation and rent increases might help later, but they aren’t guaranteed, so they can’t close today’s budget gap.' },
            { label: `Yes, it makes ${$(N.cashFlow)} a month, so it’s a great investment.`, verdict: 'poor', why: 'That’s before any big repair or a vacant month. One water heater takes most of a year’s profit.' },
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
      log: [{ area: 'Operating', finding: `Cash flow about ${$(N.cashFlow)} a month self-managed with 5% set-asides; about ${N.cashFlowWithReplacements < 0 ? '−' : ''}${$(Math.abs(N.cashFlowWithReplacements))} with the roof and water heater budgeted. Review in 6 months.` }],
      learnMore: [{ label: 'Lesson: after you close', href: '#/learn/after-closing' }, { label: 'My plan', href: '#/toolkit' }],
    },
  ];

  return { state: c.state, stateName: c.stateName, property: `1418 Example Ridge Court, ${c.city}, ${c.stateName} (fictional)`, N, stages };
}

export type PracticeCase = ReturnType<typeof buildCase>;
export const NV_CASE = buildCase(NV);
export const TX_CASE = buildCase(TX);
/** The practice purchase for a state: Texas has its own house; every other state uses the Nevada one. */
export const caseFor = (state: string | null | undefined): PracticeCase => (state === 'TX' ? TX_CASE : NV_CASE);

/** The Nevada version's numbers and steps (the default). */
export const N = NV_CASE.N;
export const RENTAL_CASE = NV_CASE.stages;
export const CASE_PROPERTY = NV_CASE.property;

export const caseStageByKey = (k: string, stages: CaseStage[] = RENTAL_CASE) => stages.find((s) => s.key === k);
