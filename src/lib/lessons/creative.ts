import type { Lesson } from './types';

export const creative: Lesson = {
  key: 'creative',
  minutes: 9,
  intro: 'Creative financing means buying without a standard bank loan: the seller finances the sale, you take over an existing loan, or partners put in money. These deals can work, but each one comes with legal rules and real risks for both sides. Learn them before you try one.',
  takeaways: [
    'How seller financing works, and the federal and state rules sellers must follow.',
    'Why “subject-to” deals and wraparound loans run into the due-on-sale clause.',
    'What to watch for in rent-to-own deals and home equity contracts.',
    'When raising money from other people becomes selling securities.',
    'The warning signs of “no money down” seminars and foreclosure-rescue scams.',
  ],
  sections: [
    {
      heading: 'Seller financing',
      blocks: [
        'The seller acts as the lender: you pay the seller over time instead of a bank. It can help when a bank won’t lend on the property, or when the seller wants steady income instead of a lump sum.',
        'Federal rules limit who can offer it without being treated as a loan originator. A seller who finances one property in 12 months (a person, estate or trust) must use a fixed rate, or one that adjusts only after five or more years with reasonable limits, and the loan can’t grow over time. A seller who finances up to three properties in 12 months must also make the loan fully pay off over its term and determine in good faith that the buyer can repay. Neither exemption covers sellers who built the home.',
        {
          table: {
            head: ['State', 'What to know'],
            rows: [
              ['Nevada', 'A seller who offers credit secured by the property they sold is exempt from Nevada’s mortgage company licensing (NRS 645B.015).'],
              ['California', 'On homes of up to four units where someone arranges the credit, such as an agent, the buyer and seller get a seller financing disclosure covering the note, other liens, balloon payments and the buyer’s credit (Civil Code 2956–2963). The holder must send a notice 90 to 150 days before a balloon payment is due (Civil Code 2966).'],
              ['Arizona', 'Sales where the seller keeps title until paid are “agreements for sale.” If the buyer misses a payment, the seller can end the contract only after a grace period set by how much has been paid: 30 days if under 20%, up to nine months if 50% or more (A.R.S. 33-742).'],
              ['Utah', 'Seller financing is used, but we haven’t reviewed Utah’s rules yet; ask a Utah real estate attorney.'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Taking over a loan: “subject-to” and wraparounds',
      blocks: [
        'In a “subject-to” deal, the buyer takes title while the seller’s loan stays in place. In a wraparound, the seller keeps their loan and gives the buyer a larger loan that “wraps” it. Federal rules treat both as transfers of the property.',
        'Most mortgages have a due-on-sale clause, and federal law lets the lender enforce it: when the property is sold or transferred, the lender can demand the whole balance. The law protects some transfers of homes with fewer than five units, such as to a spouse or child, after a death, in a divorce, or into the owner’s living trust. A sale to an investor isn’t one of them.',
        'The seller stays responsible for a loan they no longer control, and the buyer can lose the property if the lender calls the loan or payments aren’t made. Use a real estate attorney and a title company for any deal like this.',
      ],
    },
    {
      heading: 'Rent-to-own and lease options',
      blocks: [
        'The buyer rents with an option to buy later, often paying an upfront fee. The FTC warns of red flags: the “seller” doesn’t really own the property, the house is being foreclosed on, one missed payment ends the deal, or the buyer can’t qualify for a mortgage to finish buying it. Check the owner in county records and get a title search first.',
      ],
    },
    {
      heading: 'Home equity contracts',
      blocks: [
        'Some companies pay homeowners cash now in exchange for a single payment later based partly on the home’s future value. The CFPB has warned that owners who can’t pay at the end can face a forced sale or foreclosure. Read every term and compare it with a regular loan.',
      ],
    },
    {
      heading: 'Partners and investors',
      blocks: [
        'Pooling money with partners is common. But when people invest in a common venture and expect profits from someone else’s efforts, the investment can be a security; the Supreme Court set this test in a case about citrus-grove land. Selling securities requires registration or an exemption.',
        { list: [
          'Rule 506(b): unlimited money from accredited investors and up to 35 non-accredited but sophisticated investors in any 90 days, with no public advertising.',
          'Rule 506(c): advertising is allowed, but every buyer must be accredited, and the sponsor must take reasonable steps to verify it.',
          'Both require a Form D filed with the SEC within 15 days of the first sale, and states may require notice filings.',
        ] },
        'If you’re raising money or investing in someone else’s deal, talk with a securities attorney.',
      ],
    },
    {
      heading: 'Warning signs',
      blocks: [
        'Be wary of seminars that promise big profits with “no money down.” In a case the FTC brought with the Utah Division of Consumer Protection, more than 95% of surveyed seminar customers paid the company more than they made from real estate. If someone says you can earn a lot with little or no risk, that’s probably a scam. Never borrow on credit cards, home equity or retirement savings to pay for training.',
        { links: [{ label: 'Seminar red flags', url: '#/learn/red-flags', what: 'How seminar and coaching schemes work, and the warning signs.' }] },
        'Never pressure a homeowner facing foreclosure into signing over their deed. The FTC warns that in foreclosure-rescue scams the owner loses the home and still owes the mortgage. DeedOwl doesn’t help anyone approach homeowners in foreclosure; buy from the official seller.',
      ],
    },
  ],
  terms: [
    { term: 'Seller financing', meaning: 'The seller lends the buyer part or all of the price, secured by the property.' },
    { term: 'Due-on-sale clause', meaning: 'A loan term that lets the lender demand full payment when the property is sold or transferred.' },
    { term: '“Subject-to”', meaning: 'Buying a property while the seller’s existing loan stays in place.' },
    { term: 'Wraparound loan', meaning: 'A seller-financed loan that includes, and pays, the seller’s existing loan.' },
    { term: 'Agreement for sale', meaning: 'Arizona’s term for a sale where the seller keeps title until the buyer finishes paying.' },
    { term: 'Security', meaning: 'An investment regulated by securities law, such as a share in a deal others manage for you.' },
  ],
  tryIt: { label: 'Read: the books we recommend on financing', href: '#/learn/reading' },
  sources: [
    { label: 'Loan originator rules and seller-financing exclusions (12 CFR 1026.36)', url: 'https://www.law.cornell.edu/cfr/text/12/1026.36' },
    { label: 'NRS 645B: mortgage companies (seller exemption, 645B.015)', url: 'https://www.leg.state.nv.us/NRS/NRS-645B.html' },
    { label: 'California Civil Code 2956: seller financing disclosure', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2956' },
    { label: 'California Civil Code 2963: what the disclosure must include', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2963' },
    { label: 'California Civil Code 2966: balloon payment notice', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2966' },
    { label: 'Arizona Revised Statutes 33-741: agreements for sale', url: 'https://www.azleg.gov/ars/33/00741.htm' },
    { label: 'Arizona Revised Statutes 33-742: forfeiture after a missed payment', url: 'https://www.azleg.gov/ars/33/00742.htm' },
    { label: 'Garn–St Germain Act: due-on-sale clauses (12 U.S.C. 1701j-3)', url: 'https://www.law.cornell.edu/uscode/text/12/1701j-3' },
    { label: 'Due-on-sale definitions: wraparound loans and transfers (12 CFR 191.2)', url: 'https://www.law.cornell.edu/cfr/text/12/191.2' },
    { label: 'FTC: what you need to know about rent-to-own home deals', url: 'https://consumer.ftc.gov/consumer-alerts/2016/11/what-you-need-know-about-rent-own-home-deals' },
    { label: 'CFPB: home equity contracts, market overview', url: 'https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-home-equity-contracts-market-overview/' },
    { label: 'SEC v. W.J. Howey Co., 328 U.S. 293 (1946)', url: 'https://www.law.cornell.edu/supremecourt/text/328/293' },
    { label: 'SEC: private placements under Rule 506(b)', url: 'https://www.sec.gov/resources-small-businesses/exempt-offerings/private-placements-rule-506b' },
    { label: 'SEC: general solicitation under Rule 506(c)', url: 'https://www.sec.gov/resources-small-businesses/exempt-offerings/general-solicitation-rule-506c' },
    { label: 'FTC: yet another real estate seminar scam', url: 'https://consumer.ftc.gov/consumer-alerts/2019/11/yet-another-real-estate-seminar-scam' },
    { label: 'FTC: mortgage relief scams', url: 'https://consumer.ftc.gov/articles/mortgage-relief-scams' },
  ],
  practice: 'For any seller-financed or “subject-to” idea, write what happens if the loan is called or the balloon comes due, and who will review the papers.',
  reviewed: '2026-09-29',
};
