import type { Lesson } from './types';

export const creative: Lesson = {
  key: 'creative',
  minutes: 9,
  intro: 'Creative financing means buying without a standard bank loan. The seller may finance the sale, you may take over an existing loan, or partners may put in money. These deals can work, but each one comes with legal rules and real risks for both sides, so learn them before you try one.',
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
        'The seller acts as the lender: you pay the seller over time instead of a bank. It can help when a bank won’t lend on the property, or when the seller would rather have steady income than a lump sum.',
        'Federal rules limit who can offer it without being treated as a loan originator, on homes the buyer will live in. A seller who finances one property in 12 months (a person, estate or trust) must use a fixed rate, or one that adjusts only after five or more years with reasonable limits, and the loan can’t grow over time. A seller who finances up to three properties in 12 months has two more rules: the loan must fully pay off over its term, and the seller must decide in good faith that the buyer can repay. Neither exemption covers sellers who built the home. And meeting these rules only keeps a seller from being treated as a loan originator; other federal and state lending rules can still apply. A seller who makes more than five home loans in a year is treated as a lender under federal law, with its disclosure and ability-to-repay rules.',
        {
          table: {
            head: ['State', 'What to know'],
            rows: [
              ['Nevada', 'A seller who offers credit secured by the property they sold is exempt from Nevada’s mortgage company licensing (NRS 645B.015).'],
              ['California', 'When someone, such as an agent, arranges seller financing on a home of up to four units, the buyer and seller get a seller financing disclosure covering the note, other liens, balloon payments and the buyer’s credit (Civil Code 2956–2963). The holder of the note must send a notice 90 to 150 days before a balloon payment is due (Civil Code 2966).'],
              ['Arizona', 'An “agreement for sale” is a sale where the seller keeps title until the buyer finishes paying. If the buyer misses a payment, the seller can end the contract only after a grace period. Its length depends on how much has been paid: 30 days if under 20%, up to nine months if 50% or more (A.R.S. 33-742).'],
              ['Utah', 'Seller financing is used, but we haven’t confirmed Utah’s licensing rules for it.* Ask a Utah real estate attorney.'],
              ['Texas', 'An “executory contract” (contract for deed) is a sale where the seller keeps title and the deed comes more than 180 days later. On a home the buyer will live in, strict rules apply. The seller must own the home free of most liens, give a survey and a written disclosure before the buyer signs, and record the contract within 30 days. The buyer can cancel for any reason within 14 days. Before ending an unrecorded contract for a missed payment, the seller must give notice and 30 days to catch up. Once the contract is recorded, or the buyer has paid 40% or 48 monthly payments, the seller can’t simply end it: it takes at least 60 days’ notice and a sale through a trustee (Property Code 5.062, 5.064, 5.065, 5.066, 5.069, 5.074, 5.076 and 5.085).'],
            ],
          },
        },
        { links: [{ label: 'Seller financing calculator', url: '#/analyze', what: 'In Analyze, the Seller financing tab: the payment, the balloon you’ll owe, and the cash it saves against a bank loan.' }] },
      ],
    },
    {
      heading: 'Taking over a loan: “subject-to” and wraparounds',
      blocks: [
        'In a “subject-to” deal, the buyer takes title while the seller’s loan stays in place. In a wraparound, the seller keeps their loan and gives the buyer a larger loan that “wraps” it. Federal rules treat both as transfers of the property. This is different from a formal assumption, where the lender or servicer approves the buyer under the loan’s rules. Approval doesn’t by itself release the seller: confirm in writing whether the seller is released from liability. On a VA loan, releasing the seller’s liability and restoring their VA entitlement are separate questions.',
        'Most mortgages have a due-on-sale clause, and federal law lets the lender enforce it: when the property is sold or transferred, the lender can demand the whole balance. The law protects some transfers of homes with fewer than five units, such as transfers to a spouse or child, after a death, in a divorce, or into the owner’s living trust. A sale to an investor isn’t one of them. Keeping every payment current doesn’t take away the lender’s right to call the loan.',
        'In Texas, anyone selling a home that will still have a recorded lien on it must give the buyer and each lender a written disclosure at least 7 days before the contract is signed or the sale closes, whichever comes first. It lists each loan and warns that the lender could demand full payment. If it isn’t given, the buyer can end the contract. Some sales are exempt, such as when the buyer gets title insurance (Property Code 5.016).',
        'The seller stays responsible for a loan they no longer control. The buyer can lose the property if the lender calls the loan or payments aren’t made. Use a real estate attorney and a title company for any deal like this.',
      ],
    },
    {
      heading: 'Rent-to-own and lease options',
      blocks: [
        'The buyer rents with an option to buy later, often paying an upfront fee. The FTC’s red flags: the “seller” doesn’t really own the property, the house is being foreclosed on, one missed payment ends the deal, or the buyer can’t qualify for a mortgage to finish buying it. Check the owner in county records and get a title search first. If the owner still has a mortgage, a lease with an option to buy, or any lease over three years, can let their lender demand the whole loan.',
        'In Texas, a lease with an option to buy a home the tenant will live in counts as an executory contract. Even when it runs three years or less, the seller must own the home free of most liens, and must follow the same default rules: 30 days to catch up on an unrecorded contract, or 60 days’ notice and a trustee sale once it’s recorded or enough has been paid (Property Code 5.062, 5.064, 5.065, 5.066 and 5.085).',
      ],
    },
    {
      heading: 'Home equity contracts',
      blocks: [
        'Some companies pay homeowners cash now in exchange for a single payment later, based partly on the home’s future value. The CFPB has warned that owners who can’t pay at the end can face a forced sale or foreclosure. In one CFPB example, an owner who took $50,000 against a $500,000 home could owe about $94,000 to $216,000 after 10 years, depending on how much the home’s value rose. Read every term and compare it with a regular loan.',
      ],
    },
    {
      heading: 'Partners and investors',
      blocks: [
        'Pooling money with partners is common. But when people invest in a common venture and expect profits from someone else’s efforts, the investment can be a security. That’s the test the Supreme Court set in a case about citrus-grove land. Selling securities requires registration or an exemption.',
        { list: [
          'Rule 506(b): no public advertising. The offering can raise unlimited money from accredited investors, plus up to 35 non-accredited but sophisticated investors in any 90 days.',
          'Rule 506(c): advertising is allowed, but every buyer must be accredited, and the sponsor must take reasonable steps to verify it.',
          'Both require a Form D filed with the SEC within 15 days of the first sale. States may also require notice filings.',
        ] },
        'If you’re raising money or investing in someone else’s deal, talk with a securities attorney.',
      ],
    },
    {
      heading: 'Warning signs',
      blocks: [
        'Be wary of seminars that promise big profits with “no money down.” In the Nudge case, which the FTC brought with the Utah Division of Consumer Protection, more than 95% of surveyed seminar customers paid the company more than they made from real estate. If someone says you can earn a lot with little or no risk, that’s probably a scam. Never borrow on credit cards, home equity or retirement savings to pay for training.',
        { links: [{ label: 'Seminar red flags', url: '#/learn/red-flags', what: 'How seminar and coaching schemes work, and the warning signs.' }] },
        'Never pressure a homeowner facing foreclosure into signing over their deed. The FTC warns that in foreclosure-rescue scams the owner loses the home and still owes the mortgage. DeedOwl doesn’t help anyone approach homeowners in foreclosure. Buy from the official seller.',
      ],
    },
  ],
  terms: [
    { term: 'Seller financing', meaning: 'The seller lends the buyer part or all of the price, secured by the property.' },
    { term: 'Due-on-sale clause', meaning: 'A loan term that lets the lender demand full payment when the property is sold or transferred.' },
    { term: '“Subject-to”', meaning: 'Buying a property while the seller’s existing loan stays in place.' },
    { term: 'Wraparound loan', meaning: 'A seller-financed loan that includes, and pays, the seller’s existing loan.' },
    { term: 'Agreement for sale', meaning: 'Arizona’s term for a sale where the seller keeps title until the buyer finishes paying.' },
    { term: 'Executory contract', meaning: 'Texas’s term for a contract for deed: the seller keeps title until the buyer finishes paying, usually years later.' },
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
    { label: 'Texas Property Code chapter 5, subchapter D: executory contracts (5.061 to 5.085)', url: 'https://tcss.legis.texas.gov/resources/PR/htm/PR.5.htm#5.062' },
    { label: 'Texas Property Code 5.016: selling a home with a lien still on it', url: 'https://tcss.legis.texas.gov/resources/PR/htm/PR.5.htm#5.016' },
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
  practice: 'For any seller-financed or “subject-to” idea, write what happens if the loan is called or the balloon comes due. Also write who will review the papers.',
  reviewed: '2026-10-05',
};
