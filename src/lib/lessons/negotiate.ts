import type { Lesson } from './types';

export const negotiate: Lesson = {
  key: 'negotiate',
  minutes: 9,
  intro: 'Price is only one part of a deal. Deposits, deadlines and conditions can matter as much. Here’s who your agent works for, what goes into an offer, and the steps from an accepted offer to the keys.',
  takeaways: [
    'What goes into an offer: earnest money, contingencies and deadlines.',
    'How to negotiate after an inspection: repairs or a credit.',
    'The steps from an accepted offer to the keys: deposit, inspection, appraisal, title, loan approval and closing.',
    'Who an agent works for, in your state.',
    'How to protect your money at closing.',
  ],
  sections: [
    {
      heading: 'Agents: who they work for',
      blocks: [
        'In Nevada, an agent must tell every party certain things, including what they know about the property’s condition, where their pay comes from, and any interest they have in the deal (NRS 645.252). A Nevada agent must also say whether they’re acting for more than one party, which takes everyone’s written consent. Unless you agree otherwise in writing, the agent doesn’t have to inspect the property for you.',
        'In California, agents give a written agency disclosure before a listing or buyer agreement is signed and before your offer (Civil Code 2079.14). A seller’s agent works for the seller only. One agent can act for both sides only if both agree (Civil Code 2079.16).',
        'In Arizona, an agent owes a fiduciary duty to their client. The agent must also tell all parties in writing about anything they know that materially affects the price, like defects or liens. An agent buying or selling for themselves must say in writing that they’re licensed. An agent can represent both sides only with everyone’s prior written consent (A.A.C. R4-28-1101).',
        'In Utah, an agent can act as a limited agent for both sides only after explaining in writing what will be kept confidential and getting both parties’ written consent. An agent buying or selling for themselves must say they’re licensed at the first contact. The purchase contract confirms who represents whom (Utah Admin. Code R162-2f-401a).',
        'In Texas, an agent gives you the Information About Brokerage Services notice at your first real conversation about a specific property (Occupations Code 1101.558). Before showing you a home of one to four units or a condo (or before presenting your offer, if you see no home first), the agent must sign a written agreement with you. It states the services, the end date, the pay and whether it’s exclusive, and says the pay isn’t set by law and is fully negotiable (1101.563). A broker can work for both sides only as an intermediary, with each party’s written consent (1101.559).',
        'Wherever you buy, ask any agent which side they represent, and get it in writing.',
      ],
    },
    {
      heading: 'What an offer includes',
      blocks: [
        'An offer becomes binding when the required acceptance, signatures and delivery steps are complete under the agreement and applicable law. Ask your agent or attorney to confirm the effective date. Besides the price, it sets:',
        { list: [
          'Earnest money: a good-faith deposit, usually held by the title or escrow company. A valid cancellation may entitle you to a refund, but release procedures, disputes and nonrefundable fees can affect what you receive and when. If you back out without a contract right, you can lose it.',
          'Contingencies: conditions that let you cancel. It’s a good idea to make an offer contingent on getting financing and on a satisfactory inspection. Offers can also depend on the appraisal and a clear title.',
          'Deadlines: how many days you have for inspections, loan approval and closing. Missing one can waive your right to cancel.',
          'Who pays which costs, and what stays with the property.',
        ] },
        'The seller can accept, reject or counter. Read each counteroffer and confirm which written terms have been accepted before you sign.',
      ],
    },
    {
      heading: 'Buying a home listed for sale, state by state',
      blocks: [
        'Most first rentals are bought from a listing, through an agent, on your state’s standard contract. The steps are the same everywhere (offer, deposit, inspection, appraisal, title, closing); the form, the default deadlines and who runs the closing differ.',
        {
          table: {
            head: ['State', 'Contract and deadlines', 'Who closes'],
            rows: [
              ['Nevada', 'The Realtors’ residential purchase agreement. You set the due diligence period (your window to inspect and cancel) in the contract; write the end date on your calendar.', 'A title company acts as escrow.'],
              ['California', 'The C.A.R. Residential Purchase Agreement. Investigation, loan, appraisal and document-review contingencies default to 17 days after acceptance in the current California REALTORS® form;* after that the seller can give you a notice to remove them within 2 days or risk cancellation.* Use your signed agreement for the actual deadlines and have your agent confirm the dates; forms and negotiated terms can differ.', 'An escrow company (or a title company’s escrow), with the agent’s instructions.'],
              ['Arizona', 'The Arizona REALTORS® Residential Resale Purchase Contract, with a 10-day inspection period by default. Disapprove items or cancel in writing before it ends.', 'A title company acts as escrow.'],
              ['Utah', 'The state-approved Real Estate Purchase Contract (REPC). You and the seller set the due diligence, financing and appraisal, and settlement deadlines; missing the due diligence deadline can cost your earnest money.', 'A title company handles settlement.'],
              ['Texas', 'TREC’s One to Four Family Residential Contract (Resale). Option period: you pay an option fee for the right to end the contract for any reason, for the number of days you negotiate. The option period ends at 5 p.m. local time on its last day. You end the contract by written notice (TREC 20-19, paragraph 5). Deposits: deliver the option fee and earnest money to the escrow agent (usually the title company) within 3 days after the effective date. If that 3rd day is a Saturday, Sunday or legal holiday, you have until the end of the next day that isn’t one. That extension doesn’t move the end of the option period. Being late costs you different things. A late option fee means you have no option period. Late earnest money lets the seller end the contract (or use its other remedies) by notice before you deliver it. The escrow agent can release the option fee to the seller at any time. You don’t get it back if you end the contract, but it’s credited to the price if you close. Water disclosure: see paragraph 7I, below the table.', 'A title company closes and issues the title policy.'],
            ],
          },
        },
        { list: [
          'Texas water disclosure: paragraph 7I of the TREC resale contract covers the Seller’s Water Disclosure about groundwater and surface water rights. No law requires it; the contract does. A seller who doesn’t owe the Seller’s Disclosure Notice may still owe this one. TREC’s condominium resale contract doesn’t include it. Ask your agent which box is checked.',
          'Texas box 1 (already received): there’s no new window to end the contract.',
          'Texas box 2 (not received yet): calendar when the seller must deliver it. Once it comes, you can end the contract within 7 days, or before closing if that comes first, with your earnest money back. If it never comes, you can end it before closing. Record the delivery date and your deadline.',
          'Texas box 3 (not required): every statement in 7I(3) is true. The seller knows of no water well, pond, lake or water tank on the property, no surface water rights and no severed, sold or leased groundwater rights. The home gets water only from the supplier named there. There’s no new window; note the reason it isn’t required.',
        ] },
        'Whatever the state, ask your agent for the blank form before you make an offer, and read the deadlines and how notices must be delivered.',
        { links: [{ label: 'Purchase contract, annotated', url: '#/toolkit', what: 'Price, deposit, contingencies and notices, part by part.' }] },
      ],
    },
    {
      heading: 'Negotiating after the inspection',
      blocks: [
        'The key date is the end of your inspection (due diligence) period. Before it ends, you can usually cancel in writing, following your contract’s notice steps, and get your earnest money back.* Escrow release steps or a dispute can delay the refund. After the period ends, or if you skip the notice steps, your deposit can be at risk. Inspection fees and other separate nonrefundable payments generally aren’t refunded. A seller saying no to repairs doesn’t by itself let you cancel; your contract decides. Your agent or attorney can confirm which rights are still open. To renegotiate instead, ask the seller to fix items, lower the price or give you a credit at closing.',
        'Lenders limit how much a seller can put toward a buyer’s costs. On Fannie Mae loans, the cap on an investment property is 2% of the price or appraised value, whichever is lower. For a home you’ll live in, it’s 3% to 9% depending on your down payment.',
      ],
    },
    {
      heading: 'From accepted offer to keys',
      blocks: [
        'Once the contract takes effect (the signed acceptance is delivered; your contract calls this the effective date or acceptance), a set of deadlines starts. Your contract sets the dates; these are the usual steps, in order:',
        { list: [
          'Deposit: deliver your earnest money to the escrow or title company by the contract’s deadline. Confirm wiring instructions by phone first (see below).',
          'Inspection: schedule it right away, so you can decide before your inspection period ends.',
          'Appraisal: if you’re borrowing, the lender orders it. If it comes in low, you can renegotiate, bring more cash, or cancel if your contract allows it.',
          'Title and HOA: the title company searches the records and sends a title commitment (some states call it a preliminary report). Read what it lists as exceptions, and read any HOA documents within your review period.',
          'Final loan approval: the lender confirms your income, savings and the property. For most home loans, you get a Closing Disclosure at least three business days before closing. A loan made for a business purpose, as many investment-property loans are, may not come with one; ask your lender what you’ll receive and when.',
          'Insurance: have the policy in place from the day the property becomes yours.',
          'Final walkthrough: check that the property is in the condition the contract promises.',
          'Closing: you sign, the money moves, and the deed is recorded. Then you get the keys.',
        ] },
        { links: [{ label: 'Practice it', url: '#/practice', what: 'Work a fictional purchase through these steps, with the paperwork (“Buy a rental, start to finish”).' }] },
      ],
    },
    {
      heading: 'Protect your money at closing',
      blocks: [
        'Criminals send fake emails with new wiring instructions that look like they come from your agent, title company or lender. Verify emailed payment instructions independently before acting on them. Call your title or escrow officer at a number you already know to confirm the account before you wire. If you think you’ve been scammed, call your bank right away to try to recall the wire, and report it at ic3.gov.',
        'If the seller is a foreign person, federal law makes you, the buyer, withhold 15% of the price and send it to the IRS within 20 days (Form 8288). If you don’t, you can end up owing the tax yourself. If you’ll live in the home and the price is $1 million or less, the rate drops to 10%, or to zero at $300,000 or less. An IRS withholding certificate or a seller’s nonrecognition notice (such as in a 1031 exchange) can also lower or remove it. An investor buying a rental can’t use the residence exception. Ask your title or escrow company to confirm early whether the seller is a foreign person.',
      ],
    },
  ],
  terms: [
    { term: 'Earnest money', meaning: 'A good-faith deposit due on the contract’s schedule, credited toward the price at closing.' },
    { term: 'Contingency', meaning: 'A contract condition, such as financing or inspection, that may give the buyer a right to cancel under its stated grounds, deadlines and notice steps.' },
    { term: 'Seller credit (concession)', meaning: 'Money the seller puts toward the buyer’s closing costs.' },
    { term: 'As-is', meaning: 'Sold in its current condition, with no repairs by the seller.' },
    { term: 'Closing Disclosure', meaning: 'The lender’s final statement of your loan terms and closing costs.' },
    { term: 'FIRPTA', meaning: 'A federal law that makes a buyer withhold tax when buying U.S. real estate from a foreign seller.' },
  ],
  tryIt: { label: 'Practice making an offer and closing a purchase', href: '#/practice' },
  books: ['0143118757', '0062407805'],
  sources: [
    { label: 'California DRE: making an offer and contract contingencies', url: 'https://www.dre.ca.gov/Consumers/FirstHomeCalifornia.html#:~:text=Make%20an%20Offer' },
    { label: 'Arizona REALTORS®: residential resale purchase contract series', url: 'https://www.aaronline.com/?p=78755' },
    { label: 'CFPB: find the right home (contingencies)', url: 'https://www.consumerfinance.gov/owning-a-home/explore/find-the-right-home/' },
    { label: 'CFPB: schedule a home inspection', url: 'https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/' },
    { label: 'Fannie Mae Selling Guide: interested party contributions (B3-4.1-02)', url: 'https://selling-guide.fanniemae.com/sel/b3-4.1-02/interested-party-contributions-ipcs' },
    { label: 'NRS 645: real estate licensees (duties, 645.252)', url: 'https://www.leg.state.nv.us/NRS/NRS-645.html' },
    { label: 'California Civil Code 2079.14: agency disclosure', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2079.14' },
    { label: 'California Civil Code 2079.16: the agency disclosure form', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2079.16' },
    { label: 'Arizona Administrative Code R4-28-1101: duties to clients and others', url: 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-28-1101' },
    { label: 'Utah Administrative Code R162-2f-401a: agency and limited agency', url: 'https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R162-2f-401a' },
    { label: 'Texas Occupations Code chapter 1101: brokerage notice, intermediary and buyer agreements (1101.558, 1101.559, 1101.563)', url: 'https://tcss.legis.texas.gov/resources/OC/htm/OC.1101.htm#1101.558' },
    { label: 'CFPB: mortgage closing scams', url: 'https://www.consumerfinance.gov/archive/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/' },
    { label: 'FBI Internet Crime Complaint Center: real estate wire fraud warning', url: 'https://www.ic3.gov/PSA/2018/PSA180712' },
    { state: 'TX', label: 'TREC form 20-19: One to Four Family Residential Contract (Resale)', url: 'https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale' },
    { state: 'TX', label: 'TREC: FAQs on the Seller’s Disclosure About Groundwater and Surface Water Rights', url: 'https://www.trec.texas.gov/article/faqs-sellers-disclosure-about-groundwater-and-surface-water-rights' },
    { label: 'CFPB: what is a Closing Disclosure?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-closing-disclosure-en-1983/' },
    { label: 'CFPB: Regulation Z official interpretation, business-purpose credit (1026.3)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/interp-3/' },
    { label: 'IRS: FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/firpta-withholding' },
    { label: 'IRS: exceptions from FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/exceptions-from-firpta-withholding' },
    { label: 'IRS: instructions for Form 8288 (FIRPTA withholding)', url: 'https://www.irs.gov/instructions/i8288' },
  ],
  practice: 'Before your next offer, write your walk-away price and two terms you could trade instead of price.',
  reviewed: '2026-10-31',
};
