import { CHECKLISTS } from '../lib/buyerChecklists';
import { BUSINESS_SOURCES, SALE_CHANNELS } from '../lib/businessAssets';
import BuyerChecklistBox from './BuyerChecklistBox';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconCheckList, IconLayers, IconSearch, IconStop, IconTools } from './Icons';

const SECTIONS: DrillSection[] = [
  {
    key: 'where',
    title: 'Where official sales are posted',
    icon: <IconSearch />,
    summary: `${BUSINESS_SOURCES.length} official sources: courts, the Sheriff, the IRS, GSA and the State`,
    content: () => (
      <ul className="reo-grid">
        {BUSINESS_SOURCES.map((s) => (
          <li key={s.url} className="reo-card">
            <div className="reo-owner">{s.owner}</div>
            <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></h3>
            <p>{s.what}</p>
            <dl><div><dt>How to use it</dt><dd>{s.howToUse}</dd></div></dl>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: 'how-sales-work',
    title: 'How each kind of sale works',
    icon: <IconLayers />,
    summary: 'Bankruptcy, receivership, sheriff and tax sales: who sells, what you get, what to watch',
    content: () => (
      <ul className="reo-grid">
        {SALE_CHANNELS.map((c) => (
          <li key={c.name} className="reo-card">
            <div className="reo-owner">{c.seller}</div>
            <h3>{c.name}</h3>
            <p>{c.howItWorks}</p>
            <dl>
              <div><dt>What you get</dt><dd>{c.whatYouGet}</dd></div>
              <div><dt>Watch for</dt><dd>{c.watchFor}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: 'whole-business',
    title: 'Buying assets vs. a whole business',
    icon: <IconTools />,
    summary: 'Debts, taxes, licenses, leases and employees: what comes with it',
    content: () => (
      <ul className="risk-list">
        <li><strong>Assets are simpler.</strong> Buying equipment or inventory usually leaves the old company’s debts behind, as long as liens are cleared and state taxes are settled, unless the deal is really a merger or continuation of the old business. Ask an attorney.</li>
        <li><strong>Buying the company takes its history.</strong> Buying the shares or membership interests brings its debts, lawsuits and tax bills with it. Get an attorney and a CPA.</li>
        <li><strong>Nevada tax clearance.</strong> If you buy all or part of a business or its stock of goods outside normal sales, hold back enough of the price until the seller gives you a receipt or certificate from the Department of Taxation. If you don’t, you can owe their unpaid state taxes, up to what you paid (NRS 360.525).</li>
        <li><strong>Liens on equipment.</strong> Lenders record UCC financing statements with the Nevada Secretary of State. A bankruptcy sale order can clear them; a sheriff or tax sale may not.</li>
        <li><strong>Licenses don’t transfer.</strong> Business, liquor, health and contractor licenses are issued to the owner. Apply in your own name before you reopen.</li>
        <li><strong>The lease and the name.</strong> The building lease usually needs the landlord’s consent. Trade names, websites and phone numbers must be included in the sale to be yours.</li>
      </ul>
    ),
  },
  {
    key: 'checklist',
    title: 'What you’ll need',
    icon: <IconCheckList />,
    summary: `${CHECKLISTS.business.items.length} things to have ready before you bid or offer`,
    bare: true,
    content: () => <BuyerChecklistBox list={CHECKLISTS.business} />,
  },
  {
    key: 'respect',
    title: 'Deal with the official seller',
    icon: <IconStop />,
    tone: 'stop',
    summary: 'Why you go through the trustee, receiver or agency, not the owner or employees',
    content: () => (
      <p>
        When a business is in bankruptcy, receivership or a tax seizure, the owner usually can’t sell its property anymore: the trustee, receiver or
        agency controls it. Deal only with them, using the contact in the official notice. Don’t approach owners, employees or customers of a
        struggling business with offers. It won’t get you a valid sale, and it adds pressure to people already having a hard time.
      </p>
    ),
  },
];

export default function BusinessAssetsPage({ section }: { section?: string }) {
  const open = SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">Business assets &amp; closures · Nevada</span>}
        title={open ? <a className="title-link" href="#/business-assets">Business assets &amp; closures</a> : <>Business assets <span className="grad">&amp; closures</span></>}
        sub={
          open ? undefined : (
            <>
              Equipment, inventory, vehicles and whole businesses sold when a business closes or can’t pay its debts. Sold by bankruptcy trustees,
              court receivers, the Sheriff and tax agencies, not by the owner.
            </>
          )
        }
      />
      {!open && (
        <div className="notice" role="note">
          <strong>Official sellers only.</strong> Every source here is a court, a court-appointed trustee or receiver, or a government agency. No
          private liquidators or business-for-sale marketplaces. Looking for the building instead? See{' '}
          <a href="#/search?class=commercial">commercial property</a> and the <a href="#/playbooks/commercial">commercial playbook</a>.
        </div>
      )}
      <DrillDown sections={SECTIONS} active={section} baseHref="#/business-assets" label="Business assets guide" />
      <Disclaimer kind="sales" compact />
    </main>
  );
}
