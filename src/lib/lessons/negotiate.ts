import type { Lesson } from './types';

export const negotiate: Lesson = {
  key: 'negotiate',
  minutes: 9,
  intro: 'Price is only one part of a deal. Deposits, deadlines, conditions, who pays what and how you hold title can matter as much. Here’s how offers work, how forced sales differ, and a few ways to structure a purchase.',
  takeaways: [
    'What goes into an offer: earnest money, contingencies and deadlines.',
    'How to negotiate after an inspection: repairs or a credit.',
    'Why auctions, bank-owned homes and short sales work differently.',
    'Structuring tools: seller credits, ways to hold title, 1031 exchanges and installment sales.',
    'How to protect your money at closing.',
  ],
  sections: [
    {
      heading: 'What an offer includes',
      blocks: [
        'A written offer becomes a purchase contract when the seller accepts it. Besides the price, it sets:',
        { list: [
          'Earnest money: a good-faith deposit, usually held by the title or escrow company. If you cancel for a reason the contract allows, you get it back. If you back out otherwise, you can lose it.',
          'Contingencies: conditions that let you cancel. It’s a good idea to make an offer contingent on getting financing and on a satisfactory inspection. Offers can also depend on the appraisal and a clear title.',
          'Deadlines: how many days you have for inspections, loan approval and closing. Missing one can waive your right to cancel.',
          'Who pays which costs, and what stays with the property.',
        ] },
        'The seller can accept, reject or counter. Each counteroffer replaces the last one. So read every change before you sign.',
      ],
    },
    {
      heading: 'Negotiating after the inspection',
      blocks: [
        'If your contract depends on a satisfactory inspection, you can cancel without penalty if you’re not satisfied with the results. If repairs are needed, you can negotiate who makes or pays for them. You can ask the seller to fix items, lower the price, or give a credit at closing.',
        'Lenders limit how much a seller can put toward a buyer’s costs. On Fannie Mae loans, the cap on an investment property is 2% of the price or appraised value, whichever is lower. For a home you’ll live in, it’s 3% to 9% depending on your down payment.',
      ],
    },
    {
      heading: 'Forced sales work differently',
      blocks: [
        {
          table: {
            head: ['', 'How it differs'],
            rows: [
              ['Auctions', 'Usually as-is, with no inspection or financing contingency. Expect a deposit, often by cashier’s check, and full payment in cash on a short deadline. Bidding sets the price, so decide your maximum bid before the sale. Each guide lists the rules for that kind of sale.'],
              ['Bank-owned (REO)', 'The bank’s own contract and addenda usually replace the standard forms. Fannie Mae’s contract, for example, sells the home as-is and gives you 10 days to inspect. It doesn’t require the seller to make repairs. If the seller won’t repair, you can cancel and get your earnest money back.'],
              ['Short sales', 'The owner sells for less than the loan balance, and the lender has to agree. Expect a long wait for that approval. The lender, not only the owner, must accept the price.'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Ways to hold title',
      blocks: [
        'How you take title decides who owns what and what happens when an owner dies. As tenants in common, each owner has a share they can leave to their heirs. As joint tenants, owners have a right of survivorship: when one dies, the others own it. Investors also buy through companies such as LLCs or partnerships. The right choice depends on liability, taxes, financing and estate plans. So ask a real estate attorney and a tax advisor.',
      ],
    },
    {
      heading: 'Structuring tools',
      blocks: [
        { list: [
          '1031 exchange: sell a business or investment property and buy another, and defer tax on the gain. You must identify the replacement within 45 days of selling. You must receive it within 180 days (or by your tax return due date, if earlier). Property held mainly for resale, like a flip, doesn’t qualify. A qualified intermediary holds the money. It can’t be your agent or a relative.',
          'Installment sale: a seller receives at least one payment after the year of the sale, as with seller financing. The seller may spread the tax on the gain over the payments. Interest received is ordinary income.',
          'Seller credits: instead of a lower price, the seller pays part of your closing costs, within the lender’s limits above.',
        ] },
        'Creative financing gets its own lesson later.',
      ],
    },
    {
      heading: 'Agents: who they work for',
      blocks: [
        'In Nevada, a licensee must disclose certain things to every party (NRS 645.252). These include what they know about the property’s condition, where their pay comes from, and any interest they have in the deal. A Nevada licensee must also say whether they’re acting for more than one party. That needs everyone’s written consent. Unless agreed in writing, the agent doesn’t have to inspect the property for you.',
        'In California, agents give a written agency disclosure before a listing or buyer agreement is signed and before your offer (Civil Code 2079.14). A seller’s agent works for the seller only. One agent can act for both sides only if both agree (Civil Code 2079.16).',
        'In Arizona, an agent owes a fiduciary duty to their client. The agent must also tell all parties in writing about anything they know that materially affects the price, like defects or liens. An agent buying or selling for themselves must say in writing that they’re licensed. An agent can represent both sides only with everyone’s prior written consent (A.A.C. R4-28-1101).',
        'In Utah, an agent can act as a limited agent for both sides only after two steps. First, the agent must explain in writing what will be kept confidential. Second, the agent must get both parties’ written consent. An agent buying or selling for themselves must say they’re licensed at the first contact. The purchase contract confirms who represents whom (Utah Admin. Code R162-2f-401a).',
        'Wherever you buy, ask any agent which side they represent, and get it in writing.',
      ],
    },
    {
      heading: 'Protect your money at closing',
      blocks: [
        'Criminals send fake emails with new wiring instructions. The emails look like they come from your agent, title company or lender. Never follow payment instructions sent by email. Call your title or escrow officer at a number you already know to confirm the account before you wire. If you think you’ve been scammed, call your bank right away to try to recall the wire. Also report it at ic3.gov.',
      ],
    },
  ],
  terms: [
    { term: 'Earnest money', meaning: 'A good-faith deposit made when an offer is accepted, credited toward the price at closing.' },
    { term: 'Contingency', meaning: 'A condition in the contract that lets the buyer cancel, such as financing or inspection.' },
    { term: 'Seller credit (concession)', meaning: 'Money the seller puts toward the buyer’s closing costs.' },
    { term: 'As-is', meaning: 'Sold in its current condition, with no repairs by the seller.' },
    { term: '1031 exchange', meaning: 'A swap of one investment property for another that defers tax on the gain.' },
    { term: 'Installment sale', meaning: 'A sale where the seller receives at least one payment after the year of the sale.' },
  ],
  tryIt: { label: 'Practice making an offer and closing a purchase', href: '#/practice' },
  sources: [
    { label: 'CFPB: find the right home (contingencies)', url: 'https://www.consumerfinance.gov/owning-a-home/explore/find-the-right-home/' },
    { label: 'CFPB: schedule a home inspection', url: 'https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/' },
    { label: 'Fannie Mae Selling Guide: interested party contributions (B3-4.1-02)', url: 'https://selling-guide.fanniemae.com/sel/b3-4.1-02/interested-party-contributions-ipcs' },
    { label: 'Fannie Mae HomePath: residential purchase and sale contract', url: 'https://homepath.fanniemae.com/images/documents/Residential_Real_Estate_Contract.pdf' },
    { label: 'HUD: prospective buyer FAQs (foreclosure sales)', url: 'https://www.hud.gov/sites/dfiles/Housing/images/BuyerFAQs.pdf' },
    { label: 'CFPB: what is a short sale?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-short-sale-en-290/' },
    { label: 'California Board of Equalization: property ownership and deed recording', url: 'https://www.boe.ca.gov/proptaxes/pdf/Ownership_DeedRecording.pdf' },
    { label: 'IRS: like-kind exchanges, real estate tax tips', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/like-kind-exchanges-real-estate-tax-tips' },
    { label: 'IRS: instructions for Form 8824 (like-kind exchanges)', url: 'https://www.irs.gov/instructions/i8824' },
    { label: 'IRS Publication 537: installment sales', url: 'https://www.irs.gov/publications/p537' },
    { label: 'NRS 645: real estate licensees (duties, 645.252)', url: 'https://www.leg.state.nv.us/NRS/NRS-645.html' },
    { label: 'California Civil Code 2079.14: agency disclosure', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2079.14' },
    { label: 'California Civil Code 2079.16: the agency disclosure form', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2079.16' },
    { label: 'Arizona Administrative Code R4-28-1101: duties to clients and others', url: 'https://www.law.cornell.edu/regulations/arizona/Ariz-Admin-Code-SS-R4-28-1101' },
    { label: 'Utah Administrative Code R162-2f-401a: agency and limited agency', url: 'https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R162-2f-401a' },
    { label: 'CFPB: mortgage closing scams', url: 'https://www.consumerfinance.gov/archive/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/' },
    { label: 'FBI Internet Crime Complaint Center: real estate wire fraud warning', url: 'https://www.ic3.gov/PSA/2018/PSA180712' },
  ],
  practice: 'Before your next offer, write your walk-away price and two terms you could trade instead of price.',
  reviewed: '2026-09-29',
};
