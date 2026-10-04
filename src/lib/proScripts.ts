// "What to say" for each professional on Your team: an opening you can use word for word, what to bring, and for
// some roles how to read the document they give you. Plain, general wording; nothing here is legal or tax advice.
import type { ProKey } from './proGuide';

export interface ProScript {
  /** An opening message or call, with blanks in [brackets]. */
  say: string;
  /** What to have ready. */
  bring?: string[];
  /** How to read the main document they give you. */
  read?: { title: string; items: string[] };
}

export const PRO_SCRIPTS: Record<ProKey, ProScript> = {
  agent: {
    say: '“I’m looking for a [kind of property] in [area] under [$price], to [live in / rent / fix and sell]. Have you helped buyers with this? Before I sign anything, could you walk me through your buyer agreement: what you’ll do, how you’re paid and by whom, how long it lasts, and how either of us can end it?”',
    bring: ['Your buy box', 'A pre-approval letter or proof of funds'],
  },
  lender: {
    say: '“I’m buying a [one-unit home] I [will / won’t] live in, around [$price], in [county]. What down payment, rate and reserves would you need? Could you give me a written quote and a pre-approval? What could still stop the loan after I’m approved?”',
    bring: ['Photo ID', 'Recent pay stubs (usually the last month)', 'W-2s or tax returns (often two years)', 'Bank statements (often the last two months)', 'For a rental you already own: leases and the property’s tax returns'],
    read: { title: 'How to compare quotes', items: ['Compare the same loan amount and type from each lender.', 'Look at the rate, the points and the lender fees together, not the rate alone.', 'On most home loans you’ll live in, you get a Loan Estimate: compare page 2 (closing costs) side by side.', 'Ask what conditions are still open on the pre-approval.'] },
  },
  private_lender: {
    say: '“I’m buying [property] for [$price] and plan to [fix and sell / refinance] within [months]. What are your rate, points and fees, the term, and what happens if I need more time? Which license do you hold, and with which regulator?”',
    bring: ['Purchase contract', 'Your repair budget and timeline', 'Your exit plan: who will refinance or buy it, and when'],
    read: { title: 'What to check in the term sheet', items: ['Rate, points and every fee', 'The term, and the cost and terms of any extension', 'What counts as a default, and the default rate', 'How repair money is paid out (draws), and how fast', 'Whether there’s a prepayment penalty'] },
  },
  title: {
    say: '“I’m buying [address] [through an agent / at a sale on date]. Could you send the title commitment as soon as it’s ready? For each requirement, how will it be cleared before closing, and will I get a recorded release? Which exceptions should I understand before I close?”',
    bring: ['Your purchase contract or the sale notice', 'The exact name you’ll take title in'],
    read: { title: 'How to read a title commitment (or preliminary report)', items: ['Schedule A: who owns it now, who will own it, and the amount of insurance.', 'Requirements: what must happen before closing, such as paying off loans and recording releases of liens.', 'Exceptions: what the title policy won’t cover, such as easements, HOA rules and taxes not yet due.', 'Ask how each requirement will be cleared, and read any exception you don’t understand before you’re committed.', 'See one worked out in the practice purchase’s “Appraisal and title” step.'] },
  },
  attorney: {
    say: '“I’m [buying / considering bidding on] [property] through [kind of sale] on [date]. I’d like you to review [the title, the contract, the sale, possession]. What would you look at, what will it cost, and how quickly can you do it?”',
    bring: ['The sale notice or contract', 'The title report', 'Your questions, written down'],
  },
  inspector: {
    say: '“I’m buying [address], built in [year], with an inspection deadline on [date]. Could you inspect by [date]? What does your inspection cover, what doesn’t it, and what license or certificate do you hold?”',
    bring: ['Your inspection deadline', 'Access details from your agent'],
    read: { title: 'How to use the report', items: ['Sort each finding: safety, fix now, budget for later.', 'Get written bids for anything big from licensed contractors.', 'Decide and answer the seller in writing before your inspection deadline.'] },
  },
  contractor: {
    say: '“Could you bid this scope in writing: [work]? Please include permits, timeline and a payment schedule tied to finished work. What’s your license number, and can I see proof of insurance?”',
    bring: ['A written scope of work', 'Photos', 'Your budget and deadline'],
    read: { title: 'What to check in a bid', items: ['The same scope from each contractor, so bids compare', 'Permits included, and who pulls them', 'Payment tied to finished work, not mostly up front', 'Lien releases as you pay'] },
  },
  insurance: {
    say: '“I’m buying [address] as a [rental / home / flip], closing on [date]. Could you quote a policy for that use? What’s not covered, what’s the deductible, and are there limits if it’s empty for a while? When can coverage start?”',
    bring: ['Address, year built, size and roof age', 'How you’ll use it, and whether it will sit empty'],
  },
  cpa: {
    say: '“I’m planning to buy [property] to [rent / flip]. Before I buy, how should I set up records, and does how I hold title matter for taxes? What will you need from me each year?”',
    bring: ['Your last tax return', 'The deal’s numbers', 'How you plan to hold title'],
  },
  property_manager: {
    say: '“I own [property] in [area]. What are all your fees, including leasing and renewal fees? How do you screen tenants, handle repairs and report to me each month? How can either of us end the agreement?”',
    bring: ['The property details and current rent', 'Any current lease'],
    read: { title: 'What to check in the management agreement', items: ['Every fee, including leasing, renewal and repair markups', 'The repair amount they can spend without asking you', 'Where rent and deposits are held, and when you’re paid', 'How to end it, and any fee to end it'] },
  },
  eviction: {
    say: '“I own [address], bought [how] on [date], and someone is living there. Are they a tenant or a former owner? What is the lawful process here, how long does it take, and what will it cost?”',
    bring: ['Your recorded deed', 'Any lease or rent records you have', 'Dates and copies of any notices'],
  },
  environmental: {
    say: '“I’m buying [property], used as [past use]. Could you quote a Phase I environmental site assessment by [date]? What would make you recommend more testing?”',
    bring: ['The address and parcel number', 'Any past reports', 'Your closing deadline'],
  },
  appraiser: {
    say: '“I’d like an appraisal of [address] [as it is today / after repairs]. [I can’t get inside.] What would you need from me, what will it cost, and how soon can you finish?”',
    bring: ['The address', 'Your repair scope if you want an after-repair value'],
  },
};
