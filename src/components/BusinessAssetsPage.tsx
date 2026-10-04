import { CHECKLISTS } from '../lib/buyerChecklists';
import { BUSINESS_SOURCES, SALE_CHANNELS } from '../lib/businessAssets';
import BuyerChecklistBox from './BuyerChecklistBox';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconCheckList, IconLayers, IconSearch, IconStop, IconTools } from './Icons';
import ScriptBox from './ScriptBox';

export const SECTIONS: DrillSection[] = [
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
        <li><strong>Nevada tax clearance.</strong> If you buy all or part of a business or its stock of goods, other than in the seller’s normal sales, hold back enough of the price until the seller gives you a receipt or certificate from the Department of Taxation. If you don’t, you can owe their unpaid state taxes, up to what you paid (NRS 360.525).</li>
        <li><strong>Liens on equipment.</strong> Lenders file UCC financing statements in the state where the business is organized: for a Nevada LLC or corporation, with the Nevada Secretary of State; for an out-of-state company, in that state (NRS 104.9307). For vehicles, the lien shows on the title. A bankruptcy sale order can clear these liens; a sheriff or tax sale may not.</li>
        <li><strong>Licenses and permits.</strong> Many business, liquor, health and contractor licenses are issued to the owner and don’t simply pass to you. You may need a new license, a transfer approval or a change-of-ownership filing. Confirm with each agency that issued one before you reopen.</li>
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
    content: () => (
      <>
        <BuyerChecklistBox list={CHECKLISTS.business} />
        <div className="roadmap-cols">
          <div>
            <h3>The papers you’ll sign or get</h3>
            <ul className="sale-doc-list">
              <li><strong>Bill of sale</strong> <span>For equipment, inventory or other assets. Check it lists exactly what you’re buying, says whether it’s sold free of liens or “as-is”, and is signed by the official seller.</span></li>
              <li><strong>Asset purchase agreement</strong> <span>For a whole business or a large group of assets. Check what’s included and excluded, which debts or contracts come with it, and any court approval it needs. Have an attorney review it.</span></li>
              <li><strong>The court order or sale notice</strong> <span>Shows who has the authority to sell, and on what terms.</span></li>
              <li><strong>A lien search</strong> <span>A UCC search in the state where the seller is organized shows loans secured by the assets. Ask whether the sale clears them.</span></li>
            </ul>
          </div>
          <ScriptBox to="The trustee, receiver or agency named on the notice" script="“I’m interested in [the assets] in [case or sale]. Are they sold free and clear of liens, or as-is? Does the sale need court approval? What deposit do you need, how do I submit a bid, and what’s the deadline to remove the assets?”" note="Ask only the official seller. Never approach the owners, employees or customers." />
        </div>
      </>
    ),
  },
  {
    key: 'respect',
    title: 'Deal with the official seller',
    icon: <IconStop />,
    tone: 'stop',
    summary: 'Why you go through the trustee, receiver or agency, not the owner or employees',
    content: () => (
      <p>
        When a business is in receivership, under a tax seizure or in Chapter 7 bankruptcy, a receiver, agency or trustee controls its property. In
        Chapter 11, the business itself often stays in charge, but selling anything outside its ordinary business generally needs the bankruptcy
        court’s approval (11 U.S.C. 1107, 363). So confirm the seller’s authority and the court order for the sale you’re considering. Either way, the
        official notice or court papers name the seller and who to contact. Our rule: deal only with that seller and contact. Don’t approach
        owners, employees or customers of a struggling business with offers. It adds pressure to people already having a hard time.
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
              Equipment, inventory and whole businesses, sold by trustees, receivers, the Sheriff and tax agencies.
            </>
          )
        }
      />
      {!open && (
        <div className="notice" role="note">
          <strong>Official sellers only.</strong> Every source here is a court, a court-appointed trustee or receiver, or a government agency. No
          private liquidators or business-for-sale marketplaces. Looking for the building instead? See{' '}
          <a href="#/search?class=commercial">commercial property</a> and the <a href="#/playbooks/commercial">commercial property guide</a>.
        </div>
      )}
      <DrillDown sections={SECTIONS} active={section} baseHref="#/business-assets" label="Business assets guide" />
      <Disclaimer kind="sales" compact />
    </main>
  );
}
