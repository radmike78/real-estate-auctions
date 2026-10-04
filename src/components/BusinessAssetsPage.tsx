import { CHECKLISTS } from '../lib/buyerChecklists';
import { BUSINESS_SOURCES, SALE_CHANNELS } from '../lib/businessAssets';
import BuyerChecklistBox from './BuyerChecklistBox';
import ByState from './ByState';
import StatePicker from './StatePicker';
import { useMyState } from '../lib/myState';
import { BUYING, NEVADA_ONLY_SOURCES, NOTICES, SELLERS } from '../lib/states/businessAssets';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconCheckList, IconLayers, IconSearch, IconStop, IconTools } from './Icons';
import ScriptBox from './ScriptBox';

/** The source cards: nationwide ones always, Nevada ones only when the visitor picked Nevada or no state. */
function SourceCards() {
  const [mine] = useMyState();
  const cards = BUSINESS_SOURCES.filter((s) => !NEVADA_ONLY_SOURCES.has(s.url) || !mine || mine === 'NV');
  return (
    <>
      <h3>{mine && mine !== 'NV' ? 'Nationwide sources' : 'Nevada and nationwide sources'}</h3>
      <ul className="reo-grid">
        {cards.map((s) => (
          <li key={s.url} className="reo-card">
            <div className="reo-owner">{s.owner}</div>
            <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></h3>
            <p>{s.what}</p>
            <dl><div><dt>How to use it</dt><dd>{s.howToUse}</dd></div></dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export const SECTIONS: DrillSection[] = [
  {
    key: 'where',
    title: 'Who sells, and where sales are posted',
    icon: <IconSearch />,
    summary: 'Official sellers in your state, where their sales are noticed, and nationwide sources like the IRS and GSA',
    content: () => (
      <>
        <h3 className="topic-head">Official sellers in your state</h3>
        <p>Court-appointed receivers, bankruptcy trustees and the sheriff, plus how assignments for the benefit of creditors work (a private process, not a court sale). Each line names its state.</p>
        <ByState lines={SELLERS} />
        <h3 className="topic-head">Where sales are noticed</h3>
        <ByState lines={NOTICES} />
        <SourceCards />
      </>
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
    summary: 'Debts, taxes, liens, bulk sale rules, licenses and leases: what comes with it, by state',
    content: () => (
      <>
      <ul className="risk-list">
        <li><strong>Assets are simpler.</strong> Buying equipment or inventory usually leaves the old company’s debts behind, as long as liens are cleared and state taxes are settled, unless the deal is really a merger or continuation of the old business. Ask an attorney.</li>
        <li><strong>Buying the company takes its history.</strong> Buying the shares or membership interests brings its debts, lawsuits and tax bills with it. Get an attorney and a CPA.</li>
        <li><strong>State taxes.</strong> In Nevada, California, Arizona and Utah, if you buy a business or its stock of goods, hold back part of the price until the seller shows a tax clearance from the state. Otherwise you can owe the seller’s unpaid taxes. See your state’s rules below.</li>
        <li><strong>Liens on equipment.</strong> Lenders file UCC financing statements, usually in the state where the business is organized. Search there before you buy. For vehicles, the lien shows on the title. A bankruptcy sale order can clear these liens; a sheriff or tax sale may not.</li>
        <li><strong>Licenses and permits.</strong> Many business, liquor, health and contractor licenses are issued to the owner and don’t simply pass to you. You may need a new license, a transfer approval or a change-of-ownership filing. Confirm with each agency that issued one before you reopen.</li>
        <li><strong>The lease and the name.</strong> The building lease usually needs the landlord’s consent. Trade names, websites and phone numbers must be included in the sale to be yours.</li>
      </ul>
      <h3 className="topic-head">Tax clearance, liens and bulk sales in your state</h3>
      <ByState lines={BUYING} />
      </>
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
        eyebrow={<span className="eyebrow">Business closures · NV, CA, AZ, UT</span>}
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
          <strong>Official sellers only.</strong> Every seller we link is a court, a court-appointed trustee or receiver, the sheriff, or a government agency. No
          private liquidators or business-for-sale marketplaces. Looking for the building instead? See{' '}
          <a href="#/search?class=commercial">commercial property</a> and the <a href="#/playbooks/commercial">commercial property guide</a>.
        </div>
      )}
      <StatePicker label="Where is the business?" />
      <DrillDown sections={SECTIONS} active={section} baseHref="#/business-assets" label="Business assets guide" />
      <Disclaimer kind="sales" compact />
    </main>
  );
}
