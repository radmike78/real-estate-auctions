import type { AcquisitionStatus } from '../types';
import { SHOW_SAMPLE_DATA } from '../data';
import { STATUS } from '../lib/status';
import StatusBadge from './StatusBadge';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconDatabase, IconFlag, IconHelp, IconLayers, IconStop } from './Icons';

const SALE_TYPES: [string, string, string][] = [
  ['Tax-deed sale', 'The property (quitclaim deed); anyone claiming the land can sue to recover it for 2 years after the deed (NRS 361.600)', 'In-person Treasurer auction, certified funds the same day'],
  ['Special assessment lien certificate', 'The right to be repaid the assessment plus 1% a month, not ownership. A deed only if not redeemed in 120 days (2 years if the land has a building)', 'Clark County Treasurer (SID) sale; winners picked by random drawing'],
  ['Mortgage foreclosure', 'The property after lender enforcement', 'Trustee, sheriff or judicial auction'],
  ['HOA foreclosure', 'The owner’s title after a 60-day redemption period; the first mortgage may survive', 'HOA agent / trustee auction'],
  ['Judgment execution', "The debtor's interest", 'Sheriff sale, with redemption rights'],
  ['Federal tax seizure', "The taxpayer's interest", 'IRS public auction or sealed bid'],
  ['REO / bank-owned', 'The property from the lender', 'Offer through the lender’s broker or its auction'],
];

const SECTIONS: DrillSection[] = [
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
      <ul className="status-list">
        {(Object.keys(STATUS) as AcquisitionStatus[]).map((s) => (
          <li key={s}>
            <StatusBadge status={s} /> <span>{STATUS[s].explanation}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: 'sale-types',
    title: 'Types of sale',
    icon: <IconLayers />,
    summary: `${SALE_TYPES.length} kinds of forced sale: what you receive and how each is sold`,
    content: () => (
      <div className="table-wrap">
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
    summary: 'County, court and Treasurer records, each with its source shown',
    content: () => (
      <>
        <p>
          There is no single nationwide database. The site combines county recorder filings (deeds of trust, notices of default
          and sale, liens, releases), assessor parcel data, Treasurer delinquency and tax-auction lists, court and sheriff records, and
          the official sellers’ own sale pages. Every fact shows its source agency, document number, recorded date, last-verified time and a
          confidence level. Hover a source tag to see them.
        </p>
        {SHOW_SAMPLE_DATA ? (
          <p>
            This version runs on <strong>fictional sample data for Clark County, Nevada</strong>. Before connecting real sources, each
            source's terms of use and public-records rules must be reviewed.
          </p>
        ) : (
          <p>
            Sources are connected one at a time, only after their terms of use and public-records rules have been reviewed. Pages without a
            connected source say so instead of showing listings.
          </p>
        )}
      </>
    ),
  },
  {
    key: 'limits',
    title: 'What this site will not do',
    icon: <IconStop />,
    tone: 'wait',
    summary: "No fees, no bids, no promises that title is clear",
    content: () => (
      <ul>
        <li>Take bids or hold money. It always links to the official sale instead.</li>
        <li>Say title is "clear." Only a title company or real-estate attorney can make that call.</li>
        <li>Guarantee a sale is still on. Always confirm with the trustee, Treasurer or sheriff before bidding.</li>
        <li>Charge you. The site is free for buyers and investors, with no sign-up.</li>
      </ul>
    ),
  },
];

export default function AboutPage({ section }: { section?: string }) {
  const open = section === 'all' || SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">The basics</span>}
        title={open ? <a className="title-link" href="#/about">How it works</a> : <>How it <span className="grad">works</span></>}
        sub={
          open ? undefined : (
            <>
              <strong>A lien does not mean a property is for sale.</strong> A property heads to a forced sale only when someone enforces a
              lien: a notice of trustee sale, a court order, a levy, or a tax-sale listing. We only call a property buyable when a sale is on
              record, or when a lender or agency is selling a home it already owns.
            </>
          )
        }
      />
      <DrillDown sections={SECTIONS} active={section} baseHref="#/about" label="How it works" showAll />
    </main>
  );
}
