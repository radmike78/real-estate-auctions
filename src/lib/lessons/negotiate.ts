import type { Lesson } from './types';

export const negotiate: Lesson = {
  key: 'negotiate',
  minutes: 11,
  intro: 'Price is only one part of a deal. Deposits, deadlines, conditions, who pays what and how you hold title can matter as much. Here’s how offers work, how forced sales differ, and a few ways to structure a purchase.',
  takeaways: [
    'What goes into an offer: earnest money, contingencies and deadlines.',
    'How to negotiate after an inspection: repairs or a credit.',
    'Why auctions, bank-owned homes and short sales work differently.',
    'Structuring tools: seller credits, ways to hold title, 1031 exchanges and installment sales.',
    'What an LLC does and doesn’t protect, and what it costs each year in your state.',
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
        'The seller can accept, reject or counter. Each counteroffer replaces the last one, so read every change before you sign.',
      ],
    },
    {
      heading: 'Negotiating after the inspection',
      blocks: [
        'If your contract depends on a satisfactory inspection and you’re not happy with what it finds, you can cancel without penalty. If repairs are needed, you can negotiate who makes or pays for them: ask the seller to fix items, lower the price, or give you a credit at closing.',
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
              ['Bank-owned (REO)', 'The bank’s own contract and addenda usually replace the standard forms. Fannie Mae’s contract, for example, sells the home as-is and sets a short inspection period; check the contract for the deadline. It doesn’t require the seller to make repairs. If the seller won’t repair, you can cancel and get your earnest money back.'],
              ['Short sales', 'The owner sells for less than the loan balance, and the lender has to agree. Expect a long wait for that approval, because the lender, not only the owner, must accept the price.'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Ways to hold title',
      blocks: [
        'How you take title decides who owns what and what happens when an owner dies. As tenants in common, each owner has a share they can leave to their heirs. As joint tenants, owners have a right of survivorship: when one dies, the others own it. Investors also buy through companies such as LLCs or partnerships. The right choice depends on liability, taxes, financing and estate plans, so ask a real estate attorney and a tax advisor.',
      ],
    },
    {
      heading: 'Owning through an LLC',
      blocks: [
        'A limited liability company (LLC) can keep claims against the property’s business separate from your personal savings. It doesn’t replace insurance, and it has limits:',
        { list: [
          'If you sign a personal guarantee on a loan, you owe that debt yourself, LLC or not. Many lenders ask investors for one.',
          'Keep the LLC’s money in its own bank account. Mixing personal and business money can weaken the protection.',
          'Moving a home that has a mortgage into an LLC can let the lender call the whole loan due. Federal law protects some transfers from that, like moving the home into a living trust where you stay a beneficiary, but it doesn’t list transfers to an LLC (12 U.S.C. 1701j-3). Fannie Mae lets its servicers allow the transfer if Fannie Mae bought or securitized the loan on or after June 1, 2016 and you control or own most of the LLC. To refinance later, the home must go back into your own name. For any loan, ask your loan servicer in writing before you sign a deed.',
        ] },
        {
          table: {
            head: ['State', 'Yearly state cost of an LLC'],
            rows: [
              ['Nevada', '$350 a year in Nevada: a $150 annual list plus a $200 state business license. Filing the articles costs $75 (NRS 86.561, 86.263 and 76.130).'],
              ['California', 'At least $800 a year in California tax, even if the LLC earns nothing or loses money, until you cancel it. The first payment is due by the 15th day of the 4th month after you form it. A fee is added once total income reaches $250,000 (Franchise Tax Board).'],
              ['Arizona', 'Arizona LLCs file no annual report. Filing the articles costs $50 (Arizona Corporation Commission).'],
              ['Utah', 'An $18 renewal each year in Utah. Filing the certificate of organization costs $59 (Utah Division of Corporations, 2026 fee schedule).'],
              ['Texas', 'No Texas franchise tax is due if total revenue is $2.65 million or less (2026 and 2027 reports), but every LLC still files a Public Information Report with the Comptroller each year. Filing the certificate of formation costs $300 (Texas Comptroller; Tax Code 171.203; Business Organizations Code 4.152 and 4.154).'],
            ],
          },
        },
        'An LLC’s fees and taxes go in your numbers like any other cost. Ask a real estate attorney and a tax advisor before you form one, and before you move a financed home into it.',
        { links: [
          { label: 'Real estate attorneys', url: '#/pros/attorney', what: 'Forming an entity and deeding property into it.' },
          { label: 'CPAs and tax advisors', url: '#/pros/cpa', what: 'How an LLC is taxed and what it costs each year.' },
        ] },
      ],
    },
    {
      heading: 'Structuring tools',
      blocks: [
        { list: [
          '1031 exchange: sell a business or investment property and buy another, and defer tax on the gain. You have 45 days after selling to identify the replacement, and you must receive it within 180 days, or by your tax return’s due date including extensions, if that’s earlier. Only real estate qualifies, and any cash you take out is taxed. Property held mainly for resale, like a flip, doesn’t qualify. A qualified intermediary holds the money in between, and it can’t be your agent or a relative.',
          'Installment sale: the seller gets at least one payment after the year of the sale, as with seller financing. The seller may then spread the tax on the gain across the payments. Interest received is ordinary income.',
          'Seller credits: instead of a lower price, the seller pays part of your closing costs, within the lender’s limits above.',
        ] },
        'Creative financing gets its own lesson later.',
      ],
    },
    {
      heading: 'Agents: who they work for',
      blocks: [
        'In Nevada, an agent must tell every party certain things, including what they know about the property’s condition, where their pay comes from, and any interest they have in the deal (NRS 645.252). A Nevada agent must also say whether they’re acting for more than one party, which takes everyone’s written consent. Unless you agree otherwise in writing, the agent doesn’t have to inspect the property for you.',
        'In California, agents give a written agency disclosure before a listing or buyer agreement is signed and before your offer (Civil Code 2079.14). A seller’s agent works for the seller only. One agent can act for both sides only if both agree (Civil Code 2079.16).',
        'In Arizona, an agent owes a fiduciary duty to their client. The agent must also tell all parties in writing about anything they know that materially affects the price, like defects or liens. An agent buying or selling for themselves must say in writing that they’re licensed. An agent can represent both sides only with everyone’s prior written consent (A.A.C. R4-28-1101).',
        'In Utah, an agent can act as a limited agent for both sides only after explaining in writing what will be kept confidential and getting both parties’ written consent. An agent buying or selling for themselves must say they’re licensed at the first contact. The purchase contract confirms who represents whom (Utah Admin. Code R162-2f-401a).',
        'In Texas, an agent gives you the Information About Brokerage Services notice at your first real conversation about a specific property (Occupations Code 1101.558). Before showing you a home of one to four units, the agent must sign a written agreement with you that states the services, the end date and the pay, and says the pay is negotiable (1101.563). A broker can work for both sides only as an intermediary, with each party’s written consent (1101.559).',
        'Wherever you buy, ask any agent which side they represent, and get it in writing.',
      ],
    },
    {
      heading: 'Protect your money at closing',
      blocks: [
        'Criminals send fake emails with new wiring instructions that look like they come from your agent, title company or lender. Never follow payment instructions sent by email. Call your title or escrow officer at a number you already know to confirm the account before you wire. If you think you’ve been scammed, call your bank right away to try to recall the wire, and report it at ic3.gov.',
        'If the seller is a foreign person, federal law makes you, the buyer, withhold 15% of the price and send it to the IRS within 20 days (Form 8288). If you don’t, you can end up owing the tax yourself. You withhold less, or nothing, only if you’ll live in the home and the price is $1 million or less: 10% up to $1 million, and none at $300,000 or less. An investor buying a rental doesn’t qualify for that exception. Ask your title or escrow company to confirm early whether the seller is a foreign person.',
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
    { term: 'LLC (limited liability company)', meaning: 'A company that can own property and keep the business’s debts and claims separate from its owners’ personal assets, within limits.' },
    { term: 'Personal guarantee', meaning: 'A promise to repay a loan yourself if the borrower, such as your LLC, doesn’t.' },
    { term: 'FIRPTA', meaning: 'A federal law that makes a buyer withhold tax when buying U.S. real estate from a foreign seller.' },
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
    { label: 'Texas Occupations Code chapter 1101: brokerage notice, intermediary and buyer agreements (1101.558, 1101.559, 1101.563)', url: 'https://tcss.legis.texas.gov/resources/OC/htm/OC.1101.htm#1101.558' },
    { label: 'CFPB: mortgage closing scams', url: 'https://www.consumerfinance.gov/archive/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/' },
    { label: 'FBI Internet Crime Complaint Center: real estate wire fraud warning', url: 'https://www.ic3.gov/PSA/2018/PSA180712' },
    { label: 'Garn–St Germain Act: due-on-sale clauses (12 U.S.C. 1701j-3)', url: 'https://www.law.cornell.edu/uscode/text/12/1701j-3' },
    { label: 'Fannie Mae Servicing Guide D1-4.1-02: allowable exemptions due to the type of transfer', url: 'https://servicing-guide.fanniemae.com/svc/d1-4.1-02/allowable-exemptions-due-type-transfer' },
    { label: 'Nevada: NRS 86 (LLC filing and annual list fees)', url: 'https://www.leg.state.nv.us/nrs/nrs-086.html' },
    { label: 'Nevada: NRS 76 (state business license)', url: 'https://www.leg.state.nv.us/nrs/nrs-076.html' },
    { label: 'California FTB: limited liability company ($800 annual tax)', url: 'https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html' },
    { label: 'California FTB Publication 3556: LLC filing information', url: 'https://www.ftb.ca.gov/forms/misc/3556.html' },
    { label: 'Arizona Corporation Commission: business services FAQs (LLC annual reports)', url: 'https://www.azcc.gov/faqs/BusinessServicesFAQs' },
    { label: 'Arizona Corporation Commission: LLC fee schedule', url: 'https://azcc.gov/docs/default-source/corps-files/fee-schedules/fee-schedule-llcs.pdf' },
    { label: 'Utah Division of Corporations: fee schedule', url: 'https://commerce.utah.gov/wp-content/uploads/2023/04/currentfees.pdf' },
    { label: 'Texas Comptroller: franchise tax (no tax due threshold)', url: 'https://comptroller.texas.gov/taxes/franchise/' },
    { label: 'Texas Tax Code 171.203: Public Information Report', url: 'https://tcss.legis.texas.gov/resources/TX/htm/TX.171.htm#171.203' },
    { label: 'Texas Business Organizations Code 4.152: filing fees', url: 'https://tcss.legis.texas.gov/resources/BO/htm/BO.4.htm#4.152' },
    { label: 'IRS: FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/firpta-withholding' },
    { label: 'IRS: exceptions from FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/exceptions-from-firpta-withholding' },
    { label: 'IRS: instructions for Form 8288 (FIRPTA withholding)', url: 'https://www.irs.gov/instructions/i8288' },
  ],
  practice: 'Before your next offer, write your walk-away price and two terms you could trade instead of price.',
  reviewed: '2026-10-05',
};
