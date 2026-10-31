import type { Lesson } from './types';

// Split from the offer lesson: how you hold title, owning through an LLC, and tools that shape a deal's taxes and terms.
export const structuring: Lesson = {
  key: 'structuring',
  minutes: 6,
  intro: 'Once you know how to buy, the next questions are whose name goes on the deed, whether to use an LLC, and how a sale can be shaped for taxes. Each person’s situation decides what fits, so these are questions to take to a real estate attorney and a tax advisor.',
  takeaways: [
    'How the ways of holding title differ, including survivorship, in your state.',
    'What an LLC does and doesn’t protect, and what it costs each year in your state.',
    'Structuring tools: 1031 exchanges, installment sales and seller credits.',
  ],
  sections: [
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
          'Moving a home that has a mortgage into an LLC can let the lender call the whole loan due. Federal law protects some transfers from that, like moving the home into a living trust where you stay a beneficiary, but it doesn’t list transfers to an LLC (12 U.S.C. 1701j-3). Fannie Mae’s servicers must allow the transfer when all of these are true: Fannie Mae bought or securitized the loan on or after June 1, 2016; you control or own most of the LLC; and, if you bought the home to live in, you’ve already met the loan’s promise to live there (usually 12 months). To refinance later with a Fannie Mae loan, the home must go back into a person’s name. For any loan, ask your loan servicer in writing before you sign a deed.',
        ] },
        {
          table: {
            head: ['State', 'Yearly state cost of an LLC'],
            rows: [
              ['Nevada', '$350 a year in Nevada: a $150 annual list plus a $200 state business license. Filing the articles costs $75 (NRS 86.561, 86.263 and 76.130).'],
              ['California', 'At least $800 a year in California tax, even if the LLC earns nothing or loses money, until you cancel it. The first payment is due by the 15th day of the 4th month after you form it. A fee is added once total income reaches $250,000 (Franchise Tax Board). Filing the Articles of Organization costs $70, and a $20 Statement of Information is due within 90 days and every 2 years after (Secretary of State).'],
              ['Arizona', 'Arizona LLCs file no annual report. Filing the articles costs $50 (Arizona Corporation Commission). If your statutory agent is outside Maricopa and Pima counties, you must also pay to publish notice of the filing in a newspaper.'],
              ['Utah', 'An $18 renewal each year in Utah. Filing the certificate of organization costs $59 (Utah Division of Corporations, 2026 fee schedule).'],
              ['Texas', 'No Texas franchise tax is due if total revenue is $2.65 million or less (2026 and 2027 reports), but every LLC still files a Public Information Report with the Comptroller each year (Tax Code 171.203). Filing the certificate of formation with the Texas Secretary of State costs $300 (Business Organizations Code 4.152 and 4.154).'],
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
          '1031 exchange: sell a business or investment property and buy another while putting off the tax on the gain. A qualified intermediary holds the money in between, and it can’t be your agent or a relative. You have 45 days after the sale to identify the replacement in writing, and 180 days to close on it, or until your tax return for the year of the sale is due, including extensions, if that’s sooner. Only real estate qualifies, and property held mainly for resale, like a flip, doesn’t. Cash you take out and other parts that aren’t like-kind (“boot”) are taxed; details and an example are in the Taxes lesson, “Trading up: the 1031 exchange.”',
          'Installment sale: the seller gets at least one payment after the year of the sale, as with seller financing. The seller may then spread the tax on the gain across the payments. Interest received is ordinary income.',
          'Seller credits: instead of a lower price, the seller pays part of your closing costs, within the lender’s limits (see Making an offer and closing).',
        ] },
        { links: [{ label: 'Creative financing', url: '#/learn/creative', what: 'Explore seller financing, taking over loans and partnerships, with their risks and rules.' }] },
      ],
    },
  ],
  terms: [
    { term: 'Tenants in common', meaning: 'Co-owners who each hold a share they can sell or leave to their heirs.' },
    { term: 'Right of survivorship', meaning: 'When one co-owner dies, their share passes to the other owners instead of to their heirs.' },
    { term: '1031 exchange', meaning: 'A swap of one investment property for another that defers tax on the gain.' },
    { term: 'Installment sale', meaning: 'A sale where the seller receives at least one payment after the year of the sale.' },
    { term: 'LLC (limited liability company)', meaning: 'A company that can own property and keep the business’s debts and claims separate from its owners’ personal assets, within limits.' },
    { term: 'Personal guarantee', meaning: 'A promise to repay a loan yourself if the borrower, such as your LLC, doesn’t.' },
  ],
  practice: 'Write down how you would hold title on your first purchase and why, then list the questions to ask an attorney and a tax advisor.',
  practiceLink: { label: 'Find a real estate attorney or tax advisor', href: '#/pros/attorney' },
  sources: [
    { label: 'California Board of Equalization: property ownership and deed recording', url: 'https://www.boe.ca.gov/proptaxes/pdf/Ownership_DeedRecording.pdf' },
    { label: 'IRS: like-kind exchanges, real estate tax tips', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/like-kind-exchanges-real-estate-tax-tips' },
    { label: 'IRS: instructions for Form 8824 (like-kind exchanges)', url: 'https://www.irs.gov/instructions/i8824' },
    { label: 'IRS Publication 537: installment sales', url: 'https://www.irs.gov/publications/p537' },
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
    { label: 'Texas Estates Code 111.001: right of survivorship agreements', url: 'https://tcss.legis.texas.gov/resources/ES/htm/ES.111.htm#111.001' },
    { label: 'Texas Estates Code 112.052: community property survivorship agreements', url: 'https://tcss.legis.texas.gov/resources/ES/htm/ES.112.htm#112.052' },
    { label: 'Texas Tax Code 171.203: Public Information Report', url: 'https://tcss.legis.texas.gov/resources/TX/htm/TX.171.htm#171.203' },
    { label: 'Texas Business Organizations Code 4.152: filing fees', url: 'https://tcss.legis.texas.gov/resources/BO/htm/BO.4.htm#4.152' },
  ],
  reviewed: '2026-10-31',
};
