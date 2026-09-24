import type { AcquisitionStatus } from '../types';
import { STATUS } from '../lib/status';
import StatusBadge from './StatusBadge';

const SALE_TYPES: [string, string, string][] = [
  ['Tax-deed sale', 'The property itself (tax deed)', 'Online or courthouse auction'],
  ['Tax-lien certificate', 'The tax debt only, not ownership', 'Auction. Foreclosure may come later. Nevada does not use these.'],
  ['Mortgage foreclosure', 'The property after lender enforcement', 'Trustee, sheriff or judicial auction'],
  ['HOA foreclosure', 'A property interest subject to state rules', 'HOA agent / trustee auction'],
  ['Judgment execution', "The debtor's interest", 'Sheriff sale, with redemption rights'],
  ['Federal tax seizure', "The taxpayer's interest", 'IRS public auction or sealed bid'],
  ['REO / bank-owned', 'The property from the lender', 'Offer through a broker or online auction'],
];

export default function AboutPage() {
  return (
    <main className="page prose">
      <h1>How it works</h1>
      <p>
        <strong>A lien does not mean a property is for sale.</strong> A lien only secures a debt. A property heads to a forced sale only when
        someone enforces that lien by recording a notice of trustee sale, getting a court order, issuing a levy, or listing it for a tax
        sale. This site tracks both the liens and the enforcement events, and only calls a property buyable when a sale is actually on
        record.
      </p>

      <h2>Every property answers four questions</h2>
      <ol>
        <li>Is it actually heading to sale?</li>
        <li>What exactly would I be buying?</li>
        <li>What liens and risks may remain after the sale?</li>
        <li>What must I do next to buy it, online or in person?</li>
      </ol>

      <h2>Acquisition status</h2>
      <ul className="status-list">
        {(Object.keys(STATUS) as AcquisitionStatus[]).map((s) => (
          <li key={s}>
            <StatusBadge status={s} /> <span>{STATUS[s].explanation}</span>
          </li>
        ))}
      </ul>

      <h2>Sale types</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Opportunity</th><th>What you receive</th><th>How it is sold</th></tr></thead>
          <tbody>{SALE_TYPES.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>Where the data comes from</h2>
      <p>
        There is no single nationwide database. A production version combines county recorder filings (deeds of trust, notices of default
        and sale, liens, releases), assessor parcel data, Treasurer delinquency and tax-auction lists, court and sheriff records, and
        official auction platforms. Every fact shows its source agency, document number, recorded date, last-verified time and a confidence
        level. Hover a source tag to see them.
      </p>
      <p>
        This prototype runs on <strong>fictional sample data for Clark County, Nevada</strong>. Before connecting real sources, each source's
        terms of use and public-records rules must be reviewed.
      </p>

      <h2>What this site will not do</h2>
      <ul>
        <li>Take bids or hold money. It always links to the official sale instead.</li>
        <li>Say title is "clear." Only a title company or real-estate attorney can make that call.</li>
        <li>Guarantee a sale is still on. Always confirm with the trustee, Treasurer or sheriff before bidding.</li>
      </ul>
    </main>
  );
}
