import type { ReactNode } from 'react';
import { DISCLAIMERS, ROLE_SHORT, SOURCES_AND_ADVICE, type DisclaimerKind } from '../lib/disclaimers';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBadge, IconBank, IconCheckList, IconFile, IconHome, IconLayers, IconSearch, IconSteps, IconStop, IconTools } from './Icons';

const KIND_ICON: Record<DisclaimerKind, ReactNode> = { sales: <IconHome />, professionals: <IconBadge />, financing: <IconBank />, services: <IconTools /> };
const KIND_SUMMARY: Record<DisclaimerKind, string> = {
  sales: "We're not the seller or auctioneer. Confirm every sale yourself",
  professionals: 'Listed professionals are paid advertisers, not recommendations',
  financing: "We don't make, arrange or broker loans",
  services: 'Check licenses and get every agreement in writing',
};

const SECTIONS: DrillSection[] = [
  {
    key: 'what-we-offer',
    title: 'What we offer',
    icon: <IconSearch />,
    tone: 'go',
    summary: 'Properties from official sources, free research tools and a directory of license-checked professionals. All free',
    content: () => (
      <ul>
        <li><strong>Properties heading to a forced sale</strong>: Clark County tax sales, trustee and HOA foreclosures, sheriff sales, bank-owned and government homes, commercial property and business assets, gathered from government and other official sources.</li>
        <li><strong>Research tools</strong>: Street View and aerial views, county maps and records, lien summaries, and license lookups for anyone you hire.</li>
        <li><strong>Free calculators</strong>: a maximum bid calculator that counts every cost, and an income-value calculator for rental property.</li>
        <li><strong>My deals</strong>: save properties, track sale dates and deadlines, and keep your notes in one place.</li>
        <li><strong><a href="#/alerts">Email alerts</a></strong>: free updates in your inbox, with no account. Change or stop them from any email.</li>
        <li><strong>Professionals who work these sales</strong>: agents, lenders, title and insurance companies and contractors, each license-checked.</li>
      </ul>
    ),
  },
  {
    key: 'learn',
    title: 'Learn what’s involved',
    icon: <IconLayers />,
    summary: 'How each kind of sale works, what you get, what stays with the property, and what it costs',
    content: () => (
      <>
        <p>Every kind of forced sale has its own rules. Our <a href="#/playbooks">Nevada playbooks</a> explain, for each one:</p>
        <ul>
          <li>Who runs the sale, how often, and how bidding and payment work.</li>
          <li>What you actually receive: the type of deed, and any redemption period.</li>
          <li>Which liens and leases are wiped out and which stay with the property.</li>
          <li>The real costs beyond the bid, and the most common mistakes, with examples.</li>
          <li>The official laws and agency pages behind each point, so you can read them yourself.</li>
        </ul>
      </>
    ),
  },
  {
    key: 'steps',
    title: 'The steps to invest',
    icon: <IconSteps />,
    summary: 'From choosing a kind of sale to bidding, one step at a time',
    content: () => (
      <ol>
        <li>Choose the kind of sale that fits your money and timeline, and read its <a href="#/playbooks">playbook</a>.</li>
        <li>Find properties in <a href="#/search">search</a> or the official lists we link to.</li>
        <li>Research each one: records, liens, occupancy and condition from the outside.</li>
        <li>Set your limit with the <a href="#/calculator">maximum bid calculator</a>.</li>
        <li>Line up your money: certified funds for auctions, or a lender for after.</li>
        <li>Build your team: attorney, title company, tax advisor, agent and financial advisor.</li>
        <li>Confirm every detail with the official source, then bid or make your offer.</li>
      </ol>
    ),
  },
  {
    key: 'sources-and-advice',
    title: 'Official sources, your professionals',
    icon: <IconFile />,
    tone: 'info',
    summary: 'We pull from government and official sources. Your attorney, tax advisor, agent and financial advisor advise on your deal',
    content: () => (
      <>
        <p>{SOURCES_AND_ADVICE}</p>
        <p>
          Records change and mistakes happen, so checking the law, the title, the taxes and the numbers for your deal is part of your due diligence. Our playbooks and checklists
          explain how each kind of sale generally works so you know what to ask; they don't replace an attorney, tax advisor, agent or
          financial advisor who looks at your situation.
        </p>
      </>
    ),
  },
  {
    key: 'checklist',
    title: 'Your due-diligence checklist',
    icon: <IconCheckList />,
    summary: '8 things to do before you bid, borrow or hire',
    content: () => (
      <ol>
        <li>Confirm every sale detail (date, status, minimum bid, terms) with the official agency or trustee on the day.</li>
        <li>Order a title search, and get advice on which liens survive the sale.</li>
        <li>Inspect the property, or budget for unknown repairs if you can't.</li>
        <li>Check every professional's license yourself, using the regulator link on their profile.</li>
        <li>Compare several lenders and read every disclosure before you apply or pay any fee.</li>
        <li>Get all agreements in writing, and have your own attorney review them.</li>
        <li>Talk to a tax advisor and a financial advisor about how the purchase fits your finances.</li>
        <li>Never wire money based on an email, text or phone call alone. Confirm wiring instructions by calling a number you already know is real.</li>
      </ol>
    ),
  },
  {
    key: 'not-in-scope',
    title: 'The details: what’s not in scope',
    icon: <IconStop />,
    summary: 'We’re an information and advertising service: no selling, bids, loans or advice',
    content: () => (
      <ul>
        <li>We're an information and advertising service. Any sale, loan or service agreement is between you and the other party.</li>
        <li>We don't sell property, run auctions, take bids, or hold or move money.</li>
        <li>We don't offer, make, arrange, broker or negotiate financing, and we don't guarantee credit.</li>
        <li>We don't represent buyers, sellers, borrowers or lenders, and we aren't a real estate broker, mortgage broker or insurance agent.</li>
        <li>We aren't a party to any agreement you make with a seller, lender, agent, contractor or anyone else you find through this site.</li>
        <li>We don't give legal, tax, real estate, financial or investment advice, and nothing here is a title search or a guarantee of title.</li>
      </ul>
    ),
  },
  ...(['sales', 'professionals', 'financing', 'services'] as const).map((k) => ({
    key: k,
    title: DISCLAIMERS[k].title,
    icon: KIND_ICON[k],
    summary: KIND_SUMMARY[k],
    content: () => <p>{DISCLAIMERS[k].text}</p>,
  })),
  {
    key: 'accuracy',
    title: 'Accuracy',
    icon: <IconFile />,
    summary: 'Information is provided "as is." Always rely on the official source',
    content: () => (
      <p>
        We make every effort to show only current information from government and official sources, but sources change and errors happen. Information is provided "as is,"
        without warranties. Always rely on the official source. If you find something wrong, tell us so we can fix it.
      </p>
    ),
  },
];

export default function DisclaimerPage({ section }: { section?: string }) {
  const open = section === 'all' || SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">Find · Learn · Invest</span>}
        title={
          open ? (
            <a className="title-link" href="#/disclaimer">How we help you invest</a>
          ) : (
            <>How we help you <span className="grad">invest</span></>
          )
        }
        sub={ROLE_SHORT}
      />
      <DrillDown sections={SECTIONS} active={section} baseHref="#/disclaimer" label="How we help you invest" showAll />
    </main>
  );
}
