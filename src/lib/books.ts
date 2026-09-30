// Recommended reading (Learn, lesson 10). Links go to Amazon; when AMAZON_TAG is set they are Amazon Associates
// links, and the page shows the required disclosure in fine print (CLAUDE.md).

/** The owner's Amazon Associates tracking ID (ends in "-20"). Empty: plain links, no disclosure. */
export const AMAZON_TAG = 'mcmbe-20';

export interface Book {
  title: string;
  author: string;
  edition: string;
  /** ISBN-10, used as the Amazon product id. */
  isbn10: string;
  /** The owner’s own Amazon Associates link for this book (SiteStripe), used instead of the built one. */
  link?: string;
  /** The owner’s Amazon Associates link to the Audible audiobook, listed under Audiobooks. */
  audio?: string;
  about: string;
  /** Shown when readers should know something first: dated, advanced, state-general. */
  note?: string;
}

export const BOOK_GROUPS: { topic: string; books: Book[] }[] = [
  {
    topic: 'Getting started',
    books: [
      { title: 'Real Estate Investing For Dummies', author: 'Eric Tyson and Robert S. Griswold', edition: '5th edition', isbn10: '1394289707', link: 'https://amzn.to/4dNvmWh', about: 'A broad, balanced introduction: property types, financing, due diligence, closing and managing rentals.' },
      { title: 'The Book on Rental Property Investing', author: 'Brandon Turner', edition: '2015', isbn10: '099071179X', audio: 'https://amzn.to/4dNvuoJ', about: 'The buy-and-hold process: finding and analyzing rentals, financing them, building a team and managing them.' },
      { title: 'The Millionaire Real Estate Investor', author: 'Gary Keller, with Dave Jenks and Jay Papasan', edition: '2005', isbn10: '0071446370', audio: 'https://amzn.to/4rLUCSQ', about: 'Investor habits and a step-by-step way to build a portfolio over time.', note: 'The title is aspirational; the method is what’s useful.' },
    ],
  },
  {
    topic: 'Analyzing deals',
    books: [
      { title: 'What Every Real Estate Investor Needs to Know About Cash Flow… And 36 Other Key Financial Measures', author: 'Frank Gallinelli', edition: 'Updated edition, 2015', isbn10: '1259586189', link: 'https://amzn.to/4AF3NrY', about: 'How to calculate and read NOI, cap rate, cash-on-cash return, debt coverage and other measures.' },
      { title: 'The Book on Estimating Rehab Costs', author: 'J Scott', edition: '2nd edition, 2019', isbn10: '1947200127', link: 'https://amzn.to/4xSpgLu', about: 'Planning a renovation and building a line-item budget for it.' },
    ],
  },
  {
    topic: 'Flipping',
    books: [
      { title: 'The Book on Flipping Houses', author: 'J Scott', edition: '2nd edition, 2019', isbn10: '1947200100', audio: 'https://amzn.to/3TVXCzn', about: 'Buying, financing, renovating and reselling homes.' },
    ],
  },
  {
    topic: 'Financing',
    books: [
      { title: 'The Book on Investing in Real Estate with No (and Low) Money Down', author: 'Brandon Turner', edition: '2nd edition, 2020', isbn10: '1947200976', about: 'Private lenders, partners, seller financing and other creative ways to fund a purchase.', note: 'Creative financing carries more risk and legal rules; read our creative financing lesson first.' },
    ],
  },
  {
    topic: 'Negotiating',
    books: [
      { title: 'Getting to Yes: Negotiating Agreement Without Giving In', author: 'Roger Fisher, William Ury and Bruce Patton', edition: '3rd edition, 2011', isbn10: '0143118757', about: 'The classic on negotiating by interests, not positions, using fair, objective standards.' },
      { title: 'Never Split the Difference', author: 'Chris Voss with Tahl Raz', edition: '2016', isbn10: '0062407805', about: 'Practical negotiating techniques from a former FBI hostage negotiator.' },
    ],
  },
  {
    topic: 'Apartments and commercial',
    books: [
      { title: 'The Complete Guide to Buying and Selling Apartment Buildings', author: 'Steve Berges', edition: '2nd edition, 2004', isbn10: '0471684058', about: 'Valuing, financing, buying, improving and selling apartment buildings, with case studies.', note: 'Dated: market figures and tax details have changed.' },
      { title: 'Commercial Real Estate Analysis for Investment, Finance, and Development', author: 'David M. Geltner and others', edition: '4th edition, 2025', isbn10: '1041076398', about: 'A university textbook on commercial property valuation, loans, leverage, risk and development.', note: 'Advanced and expensive; for readers who want depth.' },
    ],
  },
  {
    topic: 'Being a landlord',
    books: [
      { title: 'The Book on Managing Rental Properties', author: 'Brandon and Heather Turner', edition: '2015', isbn10: '0990711757', about: 'Screening tenants, leases, collecting rent and running rentals as a business.' },
      { title: 'Every Landlord’s Legal Guide', author: 'Ann O’Connell and Janet Portman (Nolo)', edition: '18th edition, 2026', isbn10: '1413333583', about: 'Landlord-tenant law: screening, leases, deposits, repairs, fair housing and ending a tenancy.', note: 'Covers every state; check Nevada, California, Arizona or Utah law and local rules for your property.' },
    ],
  },
  {
    topic: 'Taxes',
    books: [
      { title: 'Every Landlord’s Tax Deduction Guide', author: 'Stephen Fishman (Nolo)', edition: '2026 edition', isbn10: '1413333117', about: 'Federal tax deductions, depreciation and record-keeping for landlords.', note: 'Federal taxes only; ask a tax advisor about your state.' },
    ],
  },
];

/**
 * The book's cover, through Amazon's own Associates image link (the format SiteStripe's "Image" option makes);
 * `coverFallback` is Amazon's image server, used if that link doesn't load. Covers aren't copied to our site.
 */
export const coverUrl = (b: Book) =>
  `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${b.isbn10}&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1${AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : ''}`;
export const coverFallback = (b: Book) => `https://m.media-amazon.com/images/P/${b.isbn10}.01._SCLZZZZZZZ_SX250_.jpg`;

export const amazonUrl = (b: Book) => b.link ?? `https://www.amazon.com/dp/${b.isbn10}${AMAZON_TAG ? `?tag=${encodeURIComponent(AMAZON_TAG)}` : ''}`;

/** Books the owner has an audiobook link for, in reading-list order. */
export const AUDIOBOOKS: Book[] = BOOK_GROUPS.flatMap((g) => g.books).filter((b) => b.audio);
