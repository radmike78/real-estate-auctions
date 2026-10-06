import { HUD_CLARK_SEARCH } from '../lib/reoSources';
import { useMyState } from '../lib/myState';
import { stateByCode } from '../lib/regions';
import { Tile } from './DrillDown';
import EmptyState from './EmptyState';
import { IconBank, IconBadge, IconCalendar, IconClock, IconFile, IconFlag, IconHome, IconLayers, IconShield, IconSteps, IconTools } from './Icons';

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

// Official sellers for any state: the visitor's county offices (Find deals) and the national sellers.
const OFFICIAL_ANY_STATE = [
  { label: 'Find deals: your county’s official offices and sales', url: '#/find-deals' },
  { label: 'HUD Home Store: HUD-owned homes', url: 'https://www.hudhomestore.gov/' },
  { label: 'Fannie Mae HomePath: bank-owned homes', url: 'https://homepath.fanniemae.com/property-finder' },
  { label: 'Freddie Mac HomeSteps: bank-owned homes', url: 'https://www.homesteps.com/' },
  { label: 'IRS auctions', url: 'https://www.irsauctions.gov/' },
];

// Every kind of sale, and where to follow it while listings are being connected.
const TYPES = [
  { href: '#/live', icon: <IconFile />, title: 'Tax sales', summary: 'Upcoming county tax sales, and Clark County, Nevada parcels when an auction is scheduled' },
  { href: '#/playbooks/sid', icon: <IconShield />, title: 'Lien certificates (SID)', summary: 'Special assessment liens sold by the Clark County Treasurer (Nevada)', nvOnly: true },
  { href: '#/playbooks/foreclosure', icon: <IconCalendar />, title: 'Foreclosure auctions', summary: 'Trustee and court-ordered sales after a mortgage default' },
  { href: '#/playbooks/hoa', icon: <IconLayers />, title: 'HOA foreclosures', summary: 'Sales to collect unpaid HOA dues' },
  { href: '#/playbooks/sheriff', icon: <IconFlag />, title: 'Sheriff sales', summary: 'Sales to pay a court judgment, run by the sheriff' },
  { href: '#/playbooks/irs', icon: <IconBadge />, title: 'IRS sales', summary: 'Property seized for unpaid federal taxes' },
  { href: '#/bank-owned', icon: <IconBank />, title: 'Bank-owned & government homes', summary: 'Direct lists from HUD, Fannie Mae, Freddie Mac and banks' },
  { href: '#/short-sales', icon: <IconHome />, title: 'Short sales', summary: 'Sold below the loan balance with the lender’s approval, through an agent' },
  { href: '#/playbooks/commercial', icon: <IconSteps />, title: 'Commercial property', summary: 'Stores, offices, industrial buildings and apartments at forced sales' },
  { href: '#/business-assets', icon: <IconTools />, title: 'Business assets & closures', summary: 'Equipment and businesses sold by courts, trustees and receivers' },
  { href: '#/pre-foreclosures', icon: <IconClock />, title: 'Pre-foreclosures', summary: 'Not for sale yet. Follow the notices toward an auction', tone: 'stop' as const },
];

export default function NoListingsYet({ what = 'Property listings' }: { what?: string }) {
  const [mine] = useMyState();
  // Listings so far are Clark County, Nevada's: a visitor from another state is told so plainly and sent to their own sources.
  const elsewhere = !!mine && mine !== 'NV';
  const name = mine ? stateByCode(mine)?.name : null;
  const official = elsewhere ? OFFICIAL_ANY_STATE : OFFICIAL;
  return (
    <div className="no-listings">
      {elsewhere ? (
        <EmptyState title="Listings are connected for Clark County, Nevada so far">
          <p>
            We connect official sources one at a time, and we only call a property for sale once a sale is on the official record. For {name},
            start at Find deals: it lists your county’s official offices and upcoming sales.
          </p>
          <p><a className="btn" href="#/find-deals">Find deals in {name} →</a></p>
        </EmptyState>
      ) : (
        <EmptyState title={`${what} are being connected`}>
          <p>
            We’re connecting official Clark County, Nevada sources one at a time, and we only call a property for sale once a sale is on the official record.
            Until then, open a type of sale below to see where it’s listed and how it works.
          </p>
        </EmptyState>
      )}
      <h2 className="page-section-title no-listings-head">Every type of sale</h2>
      <div className="drill-tiles">
        {TYPES.filter((t) => !(elsewhere && t.nvOnly)).map((t) => <Tile key={t.href} href={t.href} icon={t.icon} title={t.title} summary={t.summary} tone={t.tone} />)}
      </div>
      <h2 className="page-section-title no-listings-head">Official places to find sales now</h2>
      <ul className="source-links">
        {official.map((s) => (
          <li key={s.url}>{s.url.startsWith('#/') ? <a href={s.url}>{s.label} →</a> : <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>}</li>
        ))}
      </ul>
    </div>
  );
}
