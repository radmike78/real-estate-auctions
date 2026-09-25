import type { ReactNode } from 'react';
import { DISCLAIMERS, ROLE_SHORT, type DisclaimerKind } from '../lib/disclaimers';
import DrillDown, { type DrillSection } from './DrillDown';
import { IconBadge, IconBank, IconCheckList, IconFile, IconHome, IconShield, IconStop, IconTools } from './Icons';

const KIND_ICON: Record<DisclaimerKind, ReactNode> = { sales: <IconHome />, professionals: <IconBadge />, financing: <IconBank />, services: <IconTools /> };
const KIND_SUMMARY: Record<DisclaimerKind, string> = {
  sales: "We're not the seller or auctioneer. Confirm every sale yourself",
  professionals: 'Listed professionals are paid advertisers, not recommendations',
  financing: "We don't make, arrange or broker loans",
  services: 'Check licenses and get every agreement in writing',
};

const SECTIONS: DrillSection[] = [
  {
    key: 'what-we-do',
    title: 'What we do',
    icon: <IconShield />,
    tone: 'go',
    summary: 'An information and advertising service, nothing more',
    content: () => (
      <p>
        We gather public information about properties heading to forced sale, explain how those sales work, and list professionals who
        advertise here: agents, lenders, title and insurance companies, and contractors. That's all. We are an information and advertising
        service.
      </p>
    ),
  },
  {
    key: 'what-we-dont-do',
    title: "What we don't do",
    icon: <IconStop />,
    tone: 'stop',
    summary: "We don't sell property, take money, offer loans or give advice",
    content: () => (
      <ul>
        <li>We don't sell property, run auctions, take bids, or hold or move money.</li>
        <li>We don't offer, make, arrange, broker or negotiate financing, and we don't guarantee credit.</li>
        <li>We don't represent buyers, sellers, borrowers or lenders, and we aren't a real estate broker, mortgage broker or insurance agent.</li>
        <li>We aren't a party to any agreement you make with a seller, lender, agent, contractor or anyone else you find through this site.</li>
        <li>We don't give legal, tax, financial or investment advice, and nothing here is a title search or a guarantee of title.</li>
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
    key: 'checklist',
    title: 'Your due-diligence checklist',
    icon: <IconCheckList />,
    summary: '7 things to do before you bid, borrow or hire',
    content: () => (
      <ol>
        <li>Confirm every sale detail (date, status, minimum bid, terms) with the official agency or trustee on the day.</li>
        <li>Order a title search, and get advice on which liens survive the sale.</li>
        <li>Inspect the property, or budget for unknown repairs if you can't.</li>
        <li>Check every professional's license yourself, using the regulator link on their profile.</li>
        <li>Compare several lenders and read every disclosure before you apply or pay any fee.</li>
        <li>Get all agreements in writing, and consider independent legal advice.</li>
        <li>Never wire money based on an email, text or phone call alone. Confirm wiring instructions by calling a number you already know is real.</li>
      </ol>
    ),
  },
  {
    key: 'accuracy',
    title: 'Accuracy',
    icon: <IconFile />,
    summary: 'Information is provided "as is." Always rely on the official source',
    content: () => (
      <p>
        We work hard to show only current, verified information, but sources change and errors happen. Information is provided "as is,"
        without warranties. Always rely on the official source. If you find something wrong, tell us so we can fix it.
      </p>
    ),
  },
];

export default function DisclaimerPage({ section }: { section?: string }) {
  const open = section === 'all' || SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <h1>{open ? <a className="title-link" href="#/disclaimer">Our role &amp; your responsibility</a> : <>Our role &amp; your responsibility</>}</h1>
      <p className="lede">{ROLE_SHORT}</p>
      <DrillDown sections={SECTIONS} active={section} baseHref="#/disclaimer" label="Our role and your responsibility" showAll />
    </main>
  );
}
