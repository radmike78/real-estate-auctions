import type { Lesson } from './types';

export const redFlags: Lesson = {
  key: 'red-flags',
  minutes: 7,
  intro: 'Free real estate seminars are often the first step of a sales funnel. The funnel ends with coaching packages that cost tens of thousands of dollars. Federal and Utah regulators have shut several of them down. This lesson uses the court cases to show how those schemes worked. Then you can spot the pattern and keep your money for actual deals.',
  takeaways: [
    'How the free event, paid workshop and coaching upsell funnel works.',
    'The warning signs regulators found again and again.',
    'Why you should never borrow, open credit cards or tap retirement money to pay for training or to bid.',
    'Where to check a company and where to report one.',
  ],
  sections: [
    {
      heading: 'How the funnel works',
      blocks: [
        'The cases the FTC brought follow the same steps:',
        { list: [
          'A free event, often advertised with a TV personality from a house-flipping show.',
          'A three-day workshop for about $1,000 to $2,000, sold as a “beginner” course.',
          'At the workshop, a pitch for “advanced training,” coaching or a mentorship costing up to $30,000 to $41,000 more.',
          'Promises that you can do deals with “other people’s money” or through a private funding network. This makes the price of the coaching seem small.',
        ] },
        'Most of the time in these events was spent selling the next step, not teaching how to buy property.',
      ],
    },
    {
      heading: 'What happened to the people who paid',
      blocks: [
        { table: {
          head: ['Case', 'What regulators found', 'Outcome'],
          rows: [
            ['Nudge and Response Marketing (FTC and the Utah Division of Consumer Protection, filed 2019)', 'Free events led to workshops of about $1,000 and coaching of up to $30,000. More than 95% of surveyed seminar customers paid the company more than they made from real estate deals.', 'In 2023, the people who ran the companies agreed to pay $15 million. They were also banned from selling money-making opportunities. The celebrities who promoted it paid $1.7 million.'],
            ['Zurixx (FTC and the Utah Division of Consumer Protection, filed 2019)', 'Workshops cost $1,997 and add-ons up to $41,297. Presenters told people to open new credit cards or raise their limits, and to list a higher income than they earned. To get some refunds, people had to promise not to post bad reviews or contact regulators.', 'Settled in 2022. In 2024 the FTC mailed more than $12 million in refunds to 25,563 people.'],
          ],
        } },
        'In both cases the regulators found that most buyers never made back what they paid for the training.',
      ],
    },
    {
      heading: 'Warning signs',
      blocks: [
        { list: [
          'Promises of big, quick or “guaranteed” profits, or deals with little risk, time or effort.',
          'A “secret” or “proven” system you can only learn by paying for the next level.',
          'Pressure to buy today: a special price that ends when the event does.',
          'Being told to raise your credit card limits, open new cards, or take money from a home equity line or retirement account.',
          'Being asked to list a higher income than you earn on a credit application.',
          'Ads with famous people and photos of a rich lifestyle instead of details on how deals really work.',
          'A refund that comes with a promise not to post reviews or complain to regulators.',
        ] },
        'If someone says you can earn a lot with little or no risk, the FTC says that’s probably a scam.',
      ],
    },
    {
      heading: 'Don’t borrow to learn or to bid',
      blocks: [
        'Never use borrowed money for training, coaching or an auction deposit. That means no credit card, no home equity line of credit and no loan from your 401(k). Card interest has averaged over 20% a year (Federal Reserve). You owe it whether or not a deal ever happens. A home equity line puts the home you live in at risk. A 401(k) loan that isn’t repaid on schedule is treated as a withdrawal. Then you owe income tax on it. You may also owe a 10% early-withdrawal tax if you’re under 59½ (IRS).',
        'Most forced sales, including tax sales and trustee’s sales, require cash or certified funds soon after the auction. Most also don’t refund your money if the property has problems. Only bid money you can afford to lose.',
        'Everything you need to start is free: county sale rules, public records, the lessons on this site, and your library.',
      ],
    },
    {
      heading: 'Check a company and report it',
      blocks: [
        'Before you pay anyone, search the company’s name. Add the words “complaint,” “lawsuit” or “FTC” to the search. Ask for the refund policy in writing and read it before the event ends.',
        { links: [
          { label: 'FTC: report fraud', url: 'https://reportfraud.ftc.gov/', what: 'Report a seminar, coaching program or investment scam to the Federal Trade Commission.' },
          { label: 'Nevada Attorney General: file a consumer complaint', url: 'https://ag.nv.gov/Complaints/File_Complaint/', what: 'Nevada’s Bureau of Consumer Protection takes complaints about businesses.' },
          { label: 'California Attorney General: consumer complaint against a business', url: 'https://oag.ca.gov/contact/consumer-complaint-against-business-or-company', what: 'File a complaint about a business in California.' },
          { label: 'Arizona Attorney General: consumer complaint', url: 'https://www.azag.gov/complaints/consumer', what: 'File a consumer fraud complaint in Arizona.' },
          { label: 'Utah Division of Consumer Protection', url: 'https://commerce.utah.gov/dcp/', what: 'Utah’s agency that brought the seminar cases with the FTC. It takes complaints from Utah residents and about Utah businesses.' },
        ] },
      ],
    },
  ],
  terms: [
    { term: 'Upsell', meaning: 'A pitch to buy a more expensive product after you’ve bought a cheaper one.' },
    { term: 'Earnings claim', meaning: 'A statement about how much money you can make. The law requires it to be truthful and backed by evidence.' },
    { term: 'Gag clause', meaning: 'A contract term that stops you from posting reviews or complaining.' },
  ],
  tryIt: { label: 'Read: the books we recommend, all free of seminar sales pitches', href: '#/learn/reading' },
  sources: [
    { label: 'FTC: FTC acts to shut down companies operating a real estate seminar scheme (2019)', url: 'https://www.ftc.gov/news-events/news/press-releases/2019/11/ftc-acts-shut-down-companies-operating-real-estate-seminar-scheme' },
    { label: 'FTC: suit leads to $16.7 million judgment against principals and celebrity endorsers (2023)', url: 'https://www.ftc.gov/news-events/news/press-releases/2023/05/ftc-suit-leads-167-million-judgment-against-principals-celebrity-endorsers-real-estate-investment' },
    { label: 'FTC: action against a company using celebrity endorsements and bogus earnings claims (Zurixx, 2019)', url: 'https://www.ftc.gov/news-events/news/press-releases/2019/10/ftc-acts-against-company-using-celebrity-endorsements-bogus-earnings-claims-sell-real-estate' },
    { label: 'FTC: more than $12 million in refunds to people harmed by Zurixx (2024)', url: 'https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-sends-more-12-million-refunds-consumers-harmed-zurixx-real-estate-investment-coaching-scheme' },
    { label: 'FTC: yet another real estate seminar scam', url: 'https://consumer.ftc.gov/consumer-alerts/2019/11/yet-another-real-estate-seminar-scam' },
    { label: 'FTC: investment scams', url: 'https://consumer.ftc.gov/articles/investment-scams' },
    { label: 'Federal Reserve: consumer credit (G.19), credit card interest rates', url: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
    { label: 'IRS: retirement plan loans', url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans' },
  ],
  practice: 'Before you pay for any course, search the company’s name with “FTC” and “complaint”. Then read the refund policy in writing.',
  reviewed: '2026-10-03',
};
