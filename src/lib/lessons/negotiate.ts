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
              ['California', 'The C.A.R. Residential Purchase Agreement. Investigation, loan, appraisal and document-review contingencies default to 17 days after acceptance; after that the seller can give you a notice to remove them within 2 days or risk cancellation. Use your signed agreement for the actual deadlines and have your agent confirm the dates; forms and negotiated terms can differ.', 'An escrow company (or a title company’s escrow), with the agent’s instructions.'],
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
      heading: 'Forced sales work differently',
      blocks: [
        {
          table: {
            head: ['', 'How it differs'],
            rows: [
              ['Auctions', 'Usually as-is, with no inspection or financing contingency. Expect a deposit, often by cashier’s check, and full payment in cash on a short deadline. Bidding sets the price, so decide your maximum bid before the sale. Each guide lists the rules for that kind of sale.'],
              ['Bank-owned (REO)', 'The bank’s own contract and addenda usually replace the standard forms. Fannie Mae’s contract, for example, sells the home as-is and sets a short inspection period; check the contract for the deadline. It doesn’t require the seller to make repairs. If you don’t like the inspection results, you can usually cancel and get your earnest money back only within that inspection period and by the notice the addendum requires.* Once the period ends, the seller refusing repairs doesn’t let you cancel.'],
              ['Short sales', 'The owner sells for less than the loan balance, and the lender has to agree. Expect a long wait for that approval, because the lender, not only the owner, must accept the price.'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Ways to hold title',
      blocks: [
        'How you take title decides who owns what and what happens when an owner dies. As tenants in common, each owner has a share they can leave to their heirs. Joint ownership with a valid right of survivorship works differently: when one owner dies, the others own the property. Whether you have that right depends on your state’s rules and on how the deed or agreement is written. Investors also buy through companies such as LLCs or partnerships. The right choice depends on liability, taxes, financing and estate plans, so ask a real estate attorney and a tax advisor.',
        'In California, Nevada, Arizona and Utah, a joint tenancy that the deed clearly creates generally carries the right of survivorship.*',
        'In Texas, owning property together doesn’t create a right of survivorship by itself: the owners must agree to it in writing, and it can’t be inferred just from joint ownership (Estates Code 111.001). Spouses can make their community property pass to the survivor only with a written agreement signed by both (Estates Code 112.052). Have your attorney or title company confirm the deed or agreement says what you want before closing.',
      ],
    },
    {
      heading: 'Owning through an LLC',
      blocks: [
        'A limited liability company (LLC) can keep claims against the property’s business separate from your personal savings. It doesn’t replace insurance, and it has limits:',
        { list: [
          'If you sign a personal guarantee on a loan, you owe that debt yourself, LLC or not. Many lenders ask investors for one.',
          'Keep the LLC’s money in its own bank account. Mixing personal and business money can weaken the protection.',
          'Moving a home that has a mortgage into an LLC can let the lender call the whole loan due. Federal law protects some transfers from that, like moving the home into a living trust where you stay a beneficiary, but it doesn’t list transfers to an LLC (12 U.S.C. 1701j-3). Fannie Mae’s servicers must allow the transfer if Fannie Mae bought or securitized the loan on or after June 1, 2016 and you control or own most of the LLC. To refinance later, the home must go back into your own name. For any loan, ask your loan servicer in writing before you sign a deed.',
        ] },
        {
          table: {
            head: ['State', 'Yearly state cost of an LLC'],
            rows: [
              ['Nevada', '$350 a year in Nevada: a $150 annual list plus a $200 state business license. Filing the articles costs $75 (NRS 86.561, 86.263 and 76.130).'],
              ['California', 'At least $800 a year in California tax, even if the LLC earns nothing or loses money, until you cancel it. The first payment is due by the 15th day of the 4th month after you form it. A fee is added once total income reaches $250,000 (Franchise Tax Board).'],
              ['Arizona', 'Arizona LLCs file no annual report. Filing the articles costs $50 (Arizona Corporation Commission). If your statutory agent is outside Maricopa and Pima counties, you must also pay to publish notice of the filing in a newspaper.'],
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
          '1031 exchange: sell a business or investment property and buy another, and defer tax on the gain. You have 45 days after selling to identify the replacement, and you must receive it within 180 days, or by your tax return’s due date including extensions, if that’s earlier. Only real estate qualifies. Cash or other property that isn’t like-kind (“boot”), including a drop in your debt that new borrowing or added cash doesn’t make up, is taxed, but only up to your gain; the rest of the gain can still be deferred (Form 8824 instructions). Property held mainly for resale, like a flip, doesn’t qualify. A qualified intermediary holds the money in between, and it can’t be your agent or a relative.',
          'Installment sale: the seller gets at least one payment after the year of the sale, as with seller financing. The seller may then spread the tax on the gain across the payments. Interest received is ordinary income.',
          'Seller credits: instead of a lower price, the seller pays part of your closing costs, within the lender’s limits above.',
        ] },
        { links: [{ label: 'Creative financing', url: '#/learn/creative', what: 'Explore seller financing, taking over loans and partnerships, with their risks and rules.' }] },
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
        'Criminals send fake emails with new wiring instructions that look like they come from your agent, title company or lender. Verify emailed payment instructions independently before acting on them. Call your title or escrow officer at a number you already know to confirm the account before you wire. If you think you’ve been scammed, call your bank right away to try to recall the wire, and report it at ic3.gov.',
        'If the seller is a foreign person, federal law makes you, the buyer, withhold 15% of the price and send it to the IRS within 20 days (Form 8288). If you don’t, you can end up owing the tax yourself. The rate is lower, or zero, if you’ll live in the home and the price is $1 million or less (10% up to $1 million, none at $300,000 or less), and withholding can also be reduced or excused by an IRS withholding certificate or a seller’s nonrecognition notice, such as in a 1031 exchange. An investor buying a rental can’t use the residence exception. Ask your title or escrow company to confirm early whether the seller is a foreign person.',
      ],
    },
  ],
  terms: [
    { term: 'Earnest money', meaning: 'A good-faith deposit due on the contract’s schedule, credited toward the price at closing.' },
    { term: 'Contingency', meaning: 'A contract condition, such as financing or inspection, that may give the buyer a right to cancel under its stated grounds, deadlines and notice steps.' },
    { term: 'Seller credit (concession)', meaning: 'Money the seller puts toward the buyer’s closing costs.' },
    { term: 'As-is', meaning: 'Sold in its current condition, with no repairs by the seller.' },
    { term: '1031 exchange', meaning: 'A swap of one investment property for another that defers tax on the gain.' },
    { term: 'Installment sale', meaning: 'A sale where the seller receives at least one payment after the year of the sale.' },
    { term: 'LLC (limited liability company)', meaning: 'A company that can own property and keep the business’s debts and claims separate from its owners’ personal assets, within limits.' },
    { term: 'Personal guarantee', meaning: 'A promise to repay a loan yourself if the borrower, such as your LLC, doesn’t.' },
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
    { state: 'TX', label: 'TREC form 20-19: One to Four Family Residential Contract (Resale)', url: 'https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale' },
    { state: 'TX', label: 'TREC: FAQs on the Seller’s Disclosure About Groundwater and Surface Water Rights', url: 'https://www.trec.texas.gov/article/faqs-sellers-disclosure-about-groundwater-and-surface-water-rights' },
    { label: 'Texas Estates Code 111.001: right of survivorship agreements', url: 'https://tcss.legis.texas.gov/resources/ES/htm/ES.111.htm#111.001' },
    { label: 'Texas Estates Code 112.052: community property survivorship agreements', url: 'https://tcss.legis.texas.gov/resources/ES/htm/ES.112.htm#112.052' },
    { label: 'Texas Tax Code 171.203: Public Information Report', url: 'https://tcss.legis.texas.gov/resources/TX/htm/TX.171.htm#171.203' },
    { label: 'Texas Business Organizations Code 4.152: filing fees', url: 'https://tcss.legis.texas.gov/resources/BO/htm/BO.4.htm#4.152' },
    { label: 'IRS: FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/firpta-withholding' },
    { label: 'IRS: exceptions from FIRPTA withholding', url: 'https://www.irs.gov/individuals/international-taxpayers/exceptions-from-firpta-withholding' },
    { label: 'IRS: instructions for Form 8288 (FIRPTA withholding)', url: 'https://www.irs.gov/instructions/i8288' },
  ],
  practice: 'Before your next offer, write your walk-away price and two terms you could trade instead of price.',
  reviewed: '2026-10-05',
};
