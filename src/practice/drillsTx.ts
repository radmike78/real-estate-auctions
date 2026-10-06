// Texas "Would you buy it?" drills, in the same shape as the other states' drills in drills.ts.
// Every rule comes from the verified Texas guides (src/lib/stateGuidesTx1.ts, stateGuidesTx2.ts) and src/lib/states/texas.ts.
// The properties, counties and prices are made up for practice.
import type { Drill } from './drills';

export const TX_DRILLS: Drill[] = [
  {
    id: 'trustee-sale-tx',
    title: 'A Texas trustee’s sale: are the first 15 days safe?',
    teaser: 'You win a house at a first-Tuesday courthouse auction in Texas for $210,000. Know when to pay, and why to wait before you spend.',
    where: 'A fictional house at a trustee’s sale in fictional Bluebonnet County, Texas.',
    facts: [
      { label: 'Sale', value: 'Trustee’s sale on the first Tuesday, at the Bluebonnet County courthouse, Texas' },
      { label: 'Loan being foreclosed', value: 'The first deed of trust (not a home equity loan)' },
      { label: 'Title report', value: 'A federal tax lien recorded against the owner' },
      { label: 'Value as-is', value: 'About $300,000; someone appears to live there' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'pay',
        title: 'Mission 1: When do you pay?',
        question: 'The trustee accepts your $210,000 bid. When is the money due?',
        multi: false,
        options: [
          { label: 'Right away, unless the trustee agrees to a short delay, in the form the trustee announced before the day’s first sale', good: true, why: 'Right (Property Code 51.0075(a), (f)). Call the trustee on the notice before sale day to ask what funds it takes.' },
          { label: 'Within 30 days, once my loan closes', good: false, why: 'There’s no time for a loan. Payment is due when your bid is accepted.' },
          { label: 'After I inspect the inside and decide', good: false, why: 'You buy “as is,” with no warranties except of title, and at your own risk (51.009).' },
        ],
        lesson: 'Bring funds in the form the trustee requires. Each trustee sets its own reasonable terms.',
      },
      {
        kind: 'pick',
        id: 'after',
        title: 'Mission 2: You won. What’s true now?',
        question: 'Pick everything that applies to this sale.',
        multi: true,
        options: [
          { label: 'For 15 days, the trustee or lender can rescind the sale for reasons the law lists, and I’d get back only what I paid', good: true, why: 'Right (51.016). Examples: the owner caught up before the sale, or a bankruptcy stay was in effect. The money comes back within 5 days, with no interest.' },
          { label: 'Because of the federal tax lien, the United States may buy the house back within 120 days', good: true, why: 'Right (26 USC 7425(d)), if the IRS got written notice at least 25 days before the sale. Without that notice the lien isn’t cleared at all and stays on the title (26 USC 7425(b)), so ask the trustee for proof of the notice. Texas law itself gives the owner no buy-back after a trustee’s sale.' },
          { label: 'The owner has 180 days to buy it back', good: false, why: 'No. Texas trustee’s sales have no redemption period. The 180 days apply to HOA sales and some tax sales.' },
          { label: 'I can change the locks once my deed is recorded', good: false, why: 'Never. Give a written notice to vacate, then use an eviction (forcible detainer) case in court, with an attorney (Property Code 24.005).' },
        ],
        lesson: 'Record your deed right away, but hold off on repairs and new contracts until the 15 days pass, and plan for the 120-day federal window. Confirm the IRS got 25 days’ notice; if not, its lien stays on the title.',
      },
    ],
    verdict: {
      question: 'Was bidding $210,000 a good idea?',
      choices: [
        { label: 'Buy', feedback: 'Fine if your numbers worked, as long as you waited out the 15 days and planned for the federal 120-day window and the eviction case.' },
        { label: 'Investigate', feedback: 'Good: before the next sale, confirm the loan, the liens and the trustee’s payment terms, and price in the time to get possession.' },
        { label: 'Pass', feedback: 'Reasonable if you can’t have your cash tied up for up to 120 days on a house you might have to give back.' },
      ],
      expert: 'Bidding can make sense, but pay as the trustee directs, treat the first 15 days as a waiting period, and remember the United States can redeem within 120 days. Get possession only through the court.',
    },
  },
  {
    id: 'tax-deed-tx',
    title: 'A Texas tax sale: the house you might have to give back',
    teaser: 'A constable is selling a house for unpaid taxes after a court judgment. The minimum bid is low. The owner’s buy-back right is long.',
    where: 'A fictional house at a constable’s tax sale in fictional Cedar Bend County, Texas, a county of about 400,000 people.',
    facts: [
      { label: 'Sale', value: 'Constable’s tax sale on the first Tuesday, 10 a.m. to 4 p.m., after a court judgment' },
      { label: 'Judgment', value: '$14,500 of taxes, penalties, interest and costs' },
      { label: 'Value in the judgment', value: '$160,000; the house was the owner’s homestead' },
      { label: 'Taxes due after the judgment', value: '$3,800' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'minimum',
        title: 'Mission 1: The minimum bid and your paperwork',
        question: 'Pick everything that’s true before you bid.',
        multi: true,
        options: [
          { label: 'The minimum bid is $14,500: the lesser of the judgment or the value in it', good: true, why: 'Right (Tax Code 34.01(j)). If no one bids enough, the property goes to the taxing unit.' },
          { label: 'I need a county statement that I owe no back taxes, or a bidder registration, to get the deed', good: true, why: 'Right. Counties of 250,000 or more require one, and smaller counties can adopt the rule (34.015, 34.011). Statements expire after 90 days.' },
          { label: 'I’ll owe the $3,800 of taxes that came due after the judgment', good: true, why: 'Right (33.52(d)). Add them to your price.' },
          { label: 'I’m buying a tax lien certificate that earns interest', good: false, why: 'No. Texas sells the property, not the lien.' },
        ],
        lesson: 'Get the bidder paperwork early, ask the tax office for post-judgment taxes, and confirm how your county takes payment. There’s no financing.',
      },
      {
        kind: 'pick',
        id: 'buy-back',
        title: 'Mission 2: You won at $60,000. Now what?',
        question: 'The house was the owner’s homestead. What should you plan for?',
        multi: false,
        options: [
          { label: 'The owner can buy it back for 2 years after my deed is recorded, paying my price and allowed costs plus 25% in year one or 50% in year two', good: true, why: 'Right (34.21). For property that wasn’t a homestead, land designated for agricultural use or a mineral interest, it would be 180 days, with a premium of no more than 25%.' },
          { label: 'It’s mine outright the day I pay', good: false, why: 'Your deed is still subject to the owner’s buy-back right (34.01(n)).' },
          { label: 'Renovate now, so the owner pays back the work if they redeem', good: false, why: 'Only itemized costs like insurance, required repairs and HOA dues count (34.21(g), (i)). A remodel is a gamble on a house you may give back.' },
        ],
        lesson: 'Keep receipts for insurance, required repairs and HOA dues. If the owner asks in writing for a list of what you spent, you have 10 days to send it.',
      },
      {
        kind: 'pick',
        id: 'possession',
        title: 'Mission 3: Someone is living there',
        question: 'How do you get possession?',
        multi: false,
        options: [
          { label: 'Ask the court clerk for a writ of possession, 20 days or more after my deed is recorded', good: true, why: 'Right (33.51). The officer posts a warning at least 10 days before acting. A tenant who pays on time gets at least 30 days’ written notice (Property Code 24.005(b)).' },
          { label: 'Change the locks once the deed is recorded', good: false, why: 'Never. Possession comes only through the court.' },
        ],
        lesson: 'The former owner has no right to live in or rent out the property during the buy-back period (34.21(h)), but removing anyone is the court’s job, not yours.',
      },
    ],
    verdict: {
      question: 'Would you bid on this house?',
      choices: [
        { label: 'Buy', feedback: 'Only with two years of holding costs and the post-judgment taxes in your numbers, and no major work until the buy-back period ends.' },
        { label: 'Investigate', feedback: 'Good: read the judgment and the list of defendants, get a title report, and confirm your county’s paperwork and payment rules.' },
        { label: 'Pass', feedback: 'Reasonable if you need to use or sell the house soon. A homestead can tie up your money for two years.' },
      ],
      expert: 'Investigate. A low minimum bid isn’t the real price: add the post-judgment taxes, the costs of a court possession case and up to two years of waiting. If the owner redeems, you earn the premium, not the house.',
    },
  },
  {
    id: 'hoa-sale-tx',
    title: 'A Texas HOA sale: the mortgage and the 180 days',
    teaser: 'A Texas HOA is selling a house for $5,800 of unpaid dues. Check the court order, the mortgage and the buy-back period before the price.',
    where: 'A fictional house in a subdivision HOA in fictional Prairie Glen County, Texas. Condos follow different rules.',
    facts: [
      { label: 'Sale', value: 'HOA foreclosure by trustee’s sale, Texas' },
      { label: 'HOA debt', value: '$5,800 of unpaid assessments' },
      { label: 'First deed of trust', value: '$230,000; the declaration ranks it ahead of the HOA lien' },
      { label: 'Value as-is', value: 'About $320,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'valid',
        title: 'Mission 1: Is this sale set up properly?',
        question: 'Pick everything you’d confirm.',
        multi: true,
        options: [
          { label: 'The HOA got a court order (a Rule 736 order) or won a court foreclosure before the sale', good: true, why: 'Right (Property Code 209.0092). After a Rule 736 sale, the order must be attached to the trustee’s deed.' },
          { label: 'The debt isn’t only fines', good: true, why: 'Right. An HOA can’t foreclose for fines alone (209.009).' },
          { label: 'Lenders whose liens are inferior to the HOA’s lien got 60 days after the HOA’s notice to pay', good: true, why: 'Right (209.0091).' },
          { label: 'Nothing: if the notice was posted, the sale is fine', good: false, why: 'A sale without the court order, or one held during a Rule 736 stay, can be void. Have an attorney or title company review the file.' },
        ],
        lesson: 'If the owner files a separate lawsuit by 5 p.m. on the Monday before the sale, a Rule 736 case stops, and a sale held anyway is void (Rule 736.11).',
      },
      {
        kind: 'pick',
        id: 'what-you-get',
        title: 'Mission 2: What do you get if you win?',
        question: 'Pick the right answer.',
        multi: false,
        options: [
          { label: 'The owner’s interest, still subject to the $230,000 deed of trust, with a 180-day buy-back period after the HOA mails its notice', good: true, why: 'Right. The declaration ranks the mortgage ahead, and the owner or a lienholder can redeem within 180 days (209.011). During that time, you can’t sell to anyone but the redeeming owner (209.011(c)).' },
          { label: 'The house free of the mortgage, mine outright', good: false, why: 'The mortgage ranked ahead of the HOA lien stays. If it isn’t paid, its lender can still foreclose and wipe you out.' },
          { label: 'The house subject to the mortgage, with a 90-day buy-back period', good: false, why: '90 days is the condo rule (82.113). This is a subdivision HOA under chapter 209, so it’s 180 days.' },
        ],
        lesson: 'Your real price is the bid plus the $230,000 loan, plus taxes, dues and six months of holding costs.',
      },
      {
        kind: 'pick',
        id: 'redeemed',
        title: 'Mission 3: If the owner buys it back',
        question: 'What do you get back? Pick all that apply.',
        multi: true,
        options: [
          { label: 'My price and the recording fee', good: true, why: 'Right (209.011(e)(2)).' },
          { label: 'HOA dues and property taxes I paid after the sale', good: true, why: 'Right (209.011(e)(2)).' },
          { label: 'What I spent on a new kitchen', good: false, why: 'Repairs aren’t on the list. Spend only to protect the property.' },
          { label: 'All the rent I collected, on top of everything else', good: false, why: 'Rent you collected is subtracted from what you get back (209.011(i)).' },
        ],
        lesson: 'Any lease you sign during the buy-back period is subject to it (209.011(k)). Plan to hold, not flip.',
      },
    ],
    verdict: {
      question: 'Would you bid?',
      choices: [
        { label: 'Buy', feedback: 'Only after an attorney confirms the sale is valid, and only if the bid plus the $230,000 loan, taxes, dues and 180 days of holding still leaves a margin.' },
        { label: 'Investigate', feedback: 'Good: get the court order, a title report and the declaration, then run the numbers with the loan included.' },
        { label: 'Pass', feedback: 'Reasonable. With the loan, the real cost is close to the value, and the owner may buy it back.' },
      ],
      expert: 'Investigate, and most likely pass at any price that matters. The first mortgage survives, the owner has 180 days to redeem, and you can’t resell in that time. Price it as the bid plus the loan.',
    },
  },
  {
    id: 'sheriff-sale-tx',
    title: 'A Texas sheriff’s sale: what did the debtor own?',
    teaser: 'A Texas sheriff is selling a rental house to pay a court judgment. The opening bid is low. Find out what the sale actually passes.',
    where: 'A fictional rental house at a sheriff’s execution sale in fictional Mesquite Flats County, Texas, a county of about 300,000 people.',
    facts: [
      { label: 'Sale', value: 'Sheriff’s sale under a writ of execution on a money judgment, first Tuesday, Texas' },
      { label: 'Property', value: 'A rental house; the debtor doesn’t live there' },
      { label: 'Older first mortgage', value: '$120,000, recorded years before the judgment' },
      { label: 'Value as-is', value: 'About $230,000; a tenant lives there' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'before',
        title: 'Mission 1: Before you bid',
        question: 'Pick everything that’s true.',
        multi: true,
        options: [
          { label: 'A homestead is protected from forced sale for most debts, so I’d have an attorney confirm this isn’t the debtor’s homestead', good: true, why: 'Right (Tex. Const. art. XVI, sec. 50; Property Code 41.001).' },
          { label: 'The sale passes only what the debtor owned, so the $120,000 mortgage stays', good: true, why: 'Right (Civ. Prac. & Rem. Code 34.045). Add every older lien, plus property taxes and HOA liens, to your price.' },
          { label: 'In this county, I need a no-back-taxes statement or bidder registration to get the deed', good: true, why: 'Right. Counties of 250,000 or more require one, and smaller counties can adopt the rule (Civil Practice and Remedies Code 34.0445).' },
          { label: 'The debtor can buy it back for 180 days', good: false, why: 'No. Texas execution sales have no redemption period.' },
        ],
        lesson: 'Read the judgment and the writ, get a title report, and look at the property only from the street.',
      },
      {
        kind: 'pick',
        id: 'after',
        title: 'Mission 2: You win at $70,000',
        question: 'What happens next?',
        multi: false,
        options: [
          { label: 'I pay as the sheriff’s civil office directs and get a deed to the debtor’s interest. If I don’t pay, I can owe 20% of the value plus costs', good: true, why: 'Right (34.045, Rules 652, 653). Record your deed right away.' },
          { label: 'I get the deed now and can pay within a few months', good: false, why: 'Each office sets its terms, and a bidder who doesn’t pay can owe 20% of the property’s value.' },
        ],
        lesson: 'A sheriff’s execution sale isn’t a trustee’s or tax foreclosure sale, so the 30-day notice rule in Property Code 24.005(b) doesn’t apply to it. Whether the tenant’s lease survives depends on whether it was in place before the judgment lien attached. Have an attorney review the lease before you give any notice, and remember that only an eviction case in court can remove anyone.',
      },
    ],
    verdict: {
      question: 'Would you bid $70,000?',
      choices: [
        { label: 'Buy', feedback: 'Remember your price is the bid plus the $120,000 first mortgage on a $230,000 house, plus taxes and repairs.' },
        { label: 'Investigate', feedback: 'Good: confirm the homestead question, the liens and the payment terms, and set a maximum that includes the mortgage.' },
        { label: 'Pass', feedback: 'Reasonable if the bid plus the mortgage and the time to get possession leaves too little margin.' },
      ],
      expert: 'Investigate. A sheriff’s sale passes only the debtor’s interest, with older loans still on it and no buy-back period. A low opening bid isn’t the price of the house.',
    },
  },
];
