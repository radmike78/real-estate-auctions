import { HUD_CLARK_SEARCH } from '../lib/reoSources';
import { Tile } from './DrillDown';
import { IconBank, IconCalc, IconCheckList, IconPulse } from './Icons';

// Shown instead of property listings when a production build has no real listings connected yet
// (sample data is turned off; see src/data/index.ts). Points people to the official sources and the
// free tools, rather than showing an empty list with no explanation.

const OFFICIAL = [
  { label: 'Clark County Treasurer: tax-sale auction list', url: 'https://treasurer.clarkcountynv.gov/auction' },
  { label: 'Clark County Sheriff: sheriff’s sales', url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/sheriff_s_sales/' },
  { label: 'Clark County Recorder: notices of default and trustee sales', url: 'https://recorderecomm.clarkcountynv.gov/AcclaimWeb/' },
  { label: 'HUD Home Store: HUD-owned homes in Clark County', url: HUD_CLARK_SEARCH },
  { label: 'Fannie Mae HomePath: bank-owned homes', url: 'https://homepath.fanniemae.com/property-finder' },
  { label: 'Freddie Mac HomeSteps: bank-owned homes', url: 'https://www.homesteps.com/' },
  { label: 'IRS auctions', url: 'https://www.irsauctions.gov/' },
];

export default function NoListingsYet({ what = 'Property listings' }: { what?: string }) {
  return (
    <section className="no-listings" aria-labelledby="no-listings-head">
      <h2 id="no-listings-head">{what} are being connected</h2>
      <p>
        We're connecting official Clark County sources one at a time, and we only call a property for sale once a sale is on the official record.
        Pre-foreclosures and liens are shown as not for sale. Until then, here's where each kind of sale is listed, and free tools to get ready.
      </p>
      <div className="drill-tiles">
        <Tile href="#/live" icon={<IconPulse />} title="Live tax sales" tone="go" summary="Verified parcels from the County Treasurer, when an auction is scheduled" />
        <Tile href="#/bank-owned" icon={<IconBank />} title="Bank-owned homes" summary="Direct lists from HUD, Fannie Mae, Freddie Mac and banks" />
        <Tile href="#/playbooks" icon={<IconCheckList />} title="Nevada playbooks" summary="How each kind of forced sale works, step by step" />
        <Tile href="#/calculator" icon={<IconCalc />} title="Your maximum bid" summary="Know your number, and when to stop bidding" />
      </div>
      <h3>Official places to find sales now</h3>
      <ul className="source-links">
        {OFFICIAL.map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>
        ))}
      </ul>
    </section>
  );
}
