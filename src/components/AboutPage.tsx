import type { AcquisitionStatus } from '../types';
import { SHOW_SAMPLE_DATA } from '../data';
import { STATUS } from '../lib/status';
import StatusBadge from './StatusBadge';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconDatabase, IconFlag, IconGavel, IconHelp, IconShield, IconStop } from './Icons';
import { SECTIONS as HELP } from './DisclaimerPage';
import { ROLE_SHORT } from '../lib/disclaimers';
import { forStateText, useMyState } from '../lib/myState';

const SALE_TYPES: [string, string, string][] = [
  ['Tax-deed sale', 'The property (quitclaim deed); anyone claiming the land can sue to recover it for 2 years after the deed (NRS 361.600)', 'In-person county treasurer auction, certified funds the same day'],
  ['Special assessment lien certificate', 'The right to be repaid the assessment plus 1% a month, not ownership. A deed only if not redeemed in 120 days (2 years if the land has a building), and only after formal notice to the owner and 60 more days; the certificate expires 3 years after redemption ends', 'Clark County Treasurer (SID) sale; winners picked by random drawing'],
  ['Mortgage foreclosure', 'The property, after the lender forecloses', 'Trustee, sheriff or judicial auction'],
  ['HOA foreclosure', 'The owner’s title after a 60-day redemption period; the first mortgage may survive', 'HOA agent / trustee auction'],
  ['Sale to pay a court judgment', "Whatever the debtor owned in the property", 'Sheriff sale, with a period when it can be bought back (redemption)'],
  ['Federal tax seizure', "The taxpayer's interest", 'IRS public auction or sealed bid'],
  ['REO / bank-owned', 'The property from the lender', 'Offer through the lender’s broker or its auction'],
];

/** Each status badge and what it means; Nevada-only detail shows only with Nevada (or no state) chosen. */
function StatusList() {
  const [state] = useMyState();
  return (
    <ul className="status-list">
      {(Object.keys(STATUS) as AcquisitionStatus[]).map((s) => (
        <li key={s}>
          <StatusBadge status={s} /> <span>{forStateText(state, STATUS[s].explanation)}</span>
        </li>
      ))}
    </ul>
  );
}

export const SECTIONS: DrillSection[] = [
  {
    key: 'four-questions',
    title: 'The four questions',
    icon: <IconHelp />,
    summary: 'What every property page answers for you',
    content: () => (
      <ol>
        <li>Is it actually heading to sale?</li>
        <li>What exactly would I be buying?</li>
        <li>What liens and risks may remain after the sale?</li>
        <li>What must I do next to buy it, online or in person?</li>
      </ol>
    ),
  },
  {
    key: 'status',
    title: 'Sale status labels',
    icon: <IconFlag />,
    summary: `What each of the ${Object.keys(STATUS).length} status badges means`,
    content: () => (
      <StatusList />
    ),
  },
  {
    key: 'sale-types',
    title: 'Types of sale',
    icon: <IconGavel />,
    summary: `${SALE_TYPES.length} kinds of forced sale: what you receive and how each is sold`,
    content: () => (
      <div className="table-wrap">
        <p className="muted">These are Nevada’s rules (Clark County). California, Arizona, Utah and Texas differ: see the <a href="#/playbooks">sale guides</a> for your state.</p>
        <table>
          <thead><tr><th>Opportunity</th><th>What you receive</th><th>How it is sold</th></tr></thead>
          <tbody>{SALE_TYPES.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
    ),
  },
  {
    key: 'sources',
    title: 'Where the data comes from',
    icon: <IconDatabase />,
    summary: 'County, court and treasurer records, each with its source shown',
    content: () => (
      <>
        <p>
          There is no single nationwide database. Today the live listings come from the Clark County, Nevada Treasurer’s tax-sale list
          (checked against the County Assessor’s parcel records) and IRS sales in Nevada, California, Arizona, Utah and Texas. For
          every county in those five states, Find Deals links the county’s own offices, and some counties’ upcoming tax sales, so you
          can read the official list on the seller’s site. Learning pages say which state’s rules they cover and link the law or
          agency page they’re based on. How we check pages and fix errors, and how to tell us about one, is on <a href="#/disclaimer">How we help you invest</a>.
          County Recorder filings, court and sheriff records will be added one at a time, once each source’s terms allow it. Every fact
          shows its source agency, last-verified time and a confidence level. Tap or hover a source tag to see them.
        </p>
        {SHOW_SAMPLE_DATA ? (
          <p>
            This version runs on <strong>fictional sample data for Clark County, Nevada</strong>. Before we connect a real source, we
            review its terms of use and public-records rules.
          </p>
        ) : (
          <p>
            We connect sources one at a time, and only after reviewing their terms of use and public-records rules. A page without a
            connected source says so instead of showing listings.
          </p>
        )}
      </>
    ),
  },
  {
    key: 'limits',
    title: 'What this site will not do',
    icon: <IconStop />,
    tone: 'stop',
    summary: "Free for investors; no property bids or title guarantees",
    content: () => (
      <ul>
        <li>Handle property bids or purchase funds. Use the seller’s official sale process.</li>
        <li>Say title is "clear." Only a title company or real-estate attorney can make that call.</li>
        <li>Guarantee a sale is still on. Always confirm with the trustee, treasurer or sheriff before bidding.</li>
        <li>Charge you. The site is free for buyers and investors, with no sign-up.</li>
      </ul>
    ),
  },
];

/** "How DeedOwl works": what we offer and the steps to invest, how sales work and where our data comes from, then
 * the details. One page, so there's one place to look (it replaced "How it works" and "How we help"). */
export const ALL_SECTIONS: DrillSection[] = (() => {
  const help = (k: string) => HELP.find((x) => x.key === k)!;
  const scope = help('not-in-scope');
  const limits = SECTIONS.find((x) => x.key === 'limits')!;
  // "What this site will not do" and "The details: what's not in scope" said much the same: one section, at the
  // details' address (the disclaimers link to it), with the two points only the first had.
  const notDo: DrillSection = {
    ...scope,
    title: limits.title,
    icon: limits.icon,
    tone: 'stop',
    summary: 'No selling, bids, loans or advice, and no promise that title is clear',
    content: () => (
      <>
        {scope.content()}
        <ul>
          <li>We don’t guarantee a sale is still on. Always confirm with the trustee, treasurer or sheriff before bidding.</li>
          <li>We don’t charge you. The site is free for buyers and investors, with no sign-up.</li>
        </ul>
      </>
    ),
  };
  return [
    { ...help('what-we-offer'), summary: 'Properties from official sources, free research tools and a guide to the professionals you may need, all free' },
    help('steps'), help('learn'), help('sources-and-advice'), help('checklist'),
    ...SECTIONS.filter((x) => x.key !== 'limits'),
    notDo,
    { ...help('accuracy'), icon: <IconShield /> },
  ];
})();

export default function AboutPage({ section }: { section?: string }) {
  const open = section === 'all' || ALL_SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose about-page">
      <PageHero
        compact={open}
        title={open ? <a className="title-link" href="#/about">How DeedOwl works</a> : <>How DeedOwl <span className="grad">works</span></>}
        sub={open ? undefined : ROLE_SHORT}
      />
      {!open && (
        <p className="notice" role="note">
          <strong>A lien does not mean a property is for sale.</strong> A property heads to a forced sale only when someone enforces a lien: a
          notice of trustee sale, a court order, a levy, or a tax-sale listing. We only call a property buyable when a sale is on record, or when a
          lender or agency is selling a home it already owns.
        </p>
      )}
      <DrillDown sections={ALL_SECTIONS} active={section} baseHref="#/about" label="How DeedOwl works" showAll />
    </main>
  );
}
