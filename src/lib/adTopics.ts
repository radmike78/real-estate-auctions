// Learn and Practice topics that can carry one labeled advertiser box (the Premium Plus plan), next to a short
// editorial block of our own.
//
// Two voices, kept apart on the page:
//  - The editorial block is DeedOwl's own, unpaid text. It never names, recommends, ranks or points to a specific
//    advertiser: it gives neutral questions to ask that kind of professional, says to check the license (with the
//    official lookup), and links the category's directory page. It shows for every visitor.
//  - The advertiser box is the advertiser speaking, labeled "Advertisement" (components/TopicAd.tsx). It shows only
//    a licensed advertiser in the visitor's state when they've picked one (any state otherwise).
//
// Each lesson, drill and rental-case stage belongs to at most one topic (checked by adPlans.test.ts). Never mapped:
// the forced-sales lesson, any foreclosure, pre-foreclosure, tax-sale, lien, HOA, sheriff, IRS-sale, receiver or
// short-sale drill, homeowner help and surplus-money pages. Those involve owners in distress or forced sales, and an
// ad there could read as an invitation to approach them.

import type { Category } from './pros';
import type { ProKey } from './proGuide';

export interface AdTopic {
  key: string;
  label: string;
  /** Advertiser categories that may choose this topic for their Premium Plus ad. */
  categories: Category[];
  /** Lesson keys (src/lib/lessons), drill ids (src/practice/drills.ts) and rental-case stage keys (src/practice/rentalCase.ts). */
  lessons: string[];
  drills: string[];
  caseStages?: string[];
  editorial: {
    heading: string;
    body: string;
    /** Neutral questions to ask this kind of professional. */
    questions: string[];
    /** Whose license lookups to show (src/lib/licenseLookups.ts). */
    lookups: ProKey[];
    /** The category directory pages. */
    directories: { href: string; label: string }[];
  };
}

export const AD_TOPICS: AdTopic[] = [
  {
    key: 'financing',
    label: 'Financing',
    categories: ['loan_officer', 'mortgage_company', 'bank', 'credit_union', 'private_lender'],
    lessons: ['financing', 'veterans'],
    drills: ['apartments-12', 'brrrr-appraisal', 'brrrr-rates'],
    caseStages: ['loan'],
    editorial: {
      heading: 'Talking to lenders',
      body: 'Get quotes from more than one lender before you choose. Questions to ask each one:',
      questions: [
        'Which loan types fit this property and my plan: living in it, renting it, or fixing and selling it?',
        'For a home loan, can I have a Loan Estimate, so I can compare the rate, points and fees line by line with other lenders?',
        'How long does approval usually take, and what could delay the closing?',
        'What happens if the appraisal comes in lower than the price?',
      ],
      lookups: ['lender'],
      directories: [{ href: '#/financing', label: 'Lenders listed on DeedOwl' }],
    },
  },
  {
    key: 'inspections',
    label: 'Inspections & repairs',
    categories: ['home_inspector', 'contractor'],
    lessons: ['analyze'],
    drills: ['rental-265', 'bank-owned', 'flip-delays', 'mobile-home-1974', 'land-build-lot'],
    caseStages: ['inspection'],
    editorial: {
      heading: 'Hiring an inspector or contractor',
      body: 'Repairs are where most first deals go over budget. Questions to ask before you hire:',
      questions: [
        'Inspector: what does your inspection cover, and what does it leave out (roof, sewer line, pool)?',
        'Inspector: when will I get the written report, and can I come along?',
        'Contractor: can you give me a written bid that lists each item, and who pulls the permits?',
        'Contractor: can I see your license and proof of insurance before we sign?',
      ],
      lookups: ['inspector', 'contractor'],
      directories: [
        { href: '#/pros/inspector', label: 'Home inspectors listed on DeedOwl' },
        { href: '#/pros/contractor', label: 'Contractors listed on DeedOwl' },
      ],
    },
  },
  {
    key: 'offer',
    label: 'Making an offer',
    categories: ['agent'],
    lessons: ['negotiate'],
    drills: [],
    caseStages: ['evidence', 'offer'],
    editorial: {
      heading: 'Buying through an agent',
      body: 'A buyer’s agent can pull sales and leases, write the offer and track the deadlines. Questions to ask an agent:',
      questions: [
        'Who do you represent in this sale, and how are you paid?',
        'Can you show me recent sales and leases of similar homes nearby?',
        'Which contingencies (inspection, appraisal, loan) would you keep in my offer, and what are the deadlines?',
        'How many purchases like this one have you handled?',
      ],
      lookups: ['agent'],
      directories: [{ href: '#/pros/agent', label: 'Agents listed on DeedOwl' }],
    },
  },
  {
    key: 'closing',
    label: 'Title & closing',
    categories: ['title_escrow', 'attorney'],
    lessons: [],
    drills: ['land-access', 'manufactured-own-land'],
    caseStages: ['appraisal', 'closing'],
    editorial: {
      heading: 'Title, escrow and legal help',
      body: 'The title company or a real estate attorney checks what you’re really buying. Questions to ask:',
      questions: [
        'Title: when will I get the preliminary title report, and what do its exceptions mean for me?',
        'Title: how do I confirm the wiring instructions? (Call a number you looked up yourself before you send money.)',
        'Attorney: do you handle real estate here, and is your fee flat or hourly?',
        'Attorney: what should you review before I sign or remove a contingency?',
      ],
      lookups: ['title', 'attorney'],
      directories: [
        { href: '#/pros/title', label: 'Title and escrow companies listed on DeedOwl' },
        { href: '#/pros/attorney', label: 'Real estate attorneys listed on DeedOwl' },
      ],
    },
  },
  {
    key: 'owning',
    label: 'Owning & renting',
    categories: ['property_manager', 'insurance'],
    lessons: ['after-closing'],
    drills: ['manufactured-park-nv'],
    caseStages: ['after', 'run'],
    editorial: {
      heading: 'Managing and insuring a rental',
      body: 'Compare more than one manager and more than one insurance quote. Questions to ask:',
      questions: [
        'Manager: what do you charge to manage the home and to find a tenant, and what other fees are there?',
        'Manager: how do you screen tenants while following fair housing laws?',
        'Manager: who approves repairs, and up to what amount?',
        'Insurance: does this policy cover a rental (a landlord or dwelling policy), and does it cover the home while it’s vacant?',
      ],
      lookups: ['property_manager', 'insurance'],
      directories: [
        { href: '#/pros/property_manager', label: 'Property managers listed on DeedOwl' },
        { href: '#/pros/insurance', label: 'Insurance agents listed on DeedOwl' },
      ],
    },
  },
  {
    key: 'taxes',
    label: 'Taxes & records',
    categories: ['cpa'],
    lessons: [],
    drills: ['flip-numbers'],
    caseStages: [],
    editorial: {
      heading: 'Taxes on a flip or a rental',
      body: 'Talk to a tax professional before you buy, not at tax time. Questions to ask a CPA:',
      questions: [
        'Would the IRS likely treat me as a dealer or an investor for this property, and how does that change the tax?',
        'What records should I keep from the day I buy?',
        'Do I need to send estimated taxes during the year?',
      ],
      lookups: ['cpa'],
      directories: [{ href: '#/pros/cpa', label: 'CPAs listed on DeedOwl' }],
    },
  },
];

export const adTopicByKey = (key: string | null | undefined): AdTopic | undefined => AD_TOPICS.find((t) => t.key === key);

/** The topic a page belongs to, if any. */
export function topicForPage(page: { lesson?: string; drill?: string; caseStage?: string }): AdTopic | undefined {
  return AD_TOPICS.find(
    (t) => (!!page.lesson && t.lessons.includes(page.lesson)) || (!!page.drill && t.drills.includes(page.drill)) || (!!page.caseStage && (t.caseStages ?? []).includes(page.caseStage)),
  );
}
