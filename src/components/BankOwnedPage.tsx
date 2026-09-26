import type { ReactNode } from 'react';
import { CHECKLISTS } from '../lib/buyerChecklists';
import { REO_GROUPS, reoSourcesIn, type ReoGroup, type ReoSource } from '../lib/reoSources';
import BuyerChecklistBox from './BuyerChecklistBox';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBank, IconCheckList, IconHome, IconShield, IconSteps } from './Icons';

function SourceCard({ s }: { s: ReoSource }) {
  return (
    <li className="reo-card">
      <div className="reo-owner">{s.owner}</div>
      <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></h3>
      <p>{s.what}</p>
      <dl>
        <div><dt>How to buy</dt><dd>{s.howToBuy}</dd></div>
        {s.firstLook && <div><dt>Buyers first</dt><dd>{s.firstLook}</dd></div>}
        <div><dt>In Clark County</dt><dd>{s.clarkCounty}</dd></div>
      </dl>
    </li>
  );
}

const group = (g: ReoGroup, icon: ReactNode, note?: ReactNode): DrillSection => ({
  key: g === 'gse' ? 'fannie-freddie' : g === 'bank' ? 'banks' : 'government',
  title: REO_GROUPS[g].title,
  icon,
  summary: `${reoSourcesIn(g).length} direct sources · ${REO_GROUPS[g].summary}`,
  content: () => (
    <>
      {note}
      <ul className="reo-grid">{reoSourcesIn(g).map((s) => <SourceCard key={s.url} s={s} />)}</ul>
    </>
  ),
});

const STEPS: [string, string][] = [
  ['Get pre-approved or show proof of funds', 'Sellers of bank-owned homes want proof you can close. Cash buyers need a recent bank statement.'],
  ['Choose a buyer’s agent', 'Almost every bank-owned home is sold through a listing agent. HUD homes need a HUD-registered broker to bid for you.'],
  ['Check the first-look period', 'If you’ll live in the home, you may be able to buy before investors can. Investors must wait until it ends.'],
  ['Make an offer and read the addendum', 'The seller’s addendum overrides parts of the standard contract, including repairs, deadlines and per-day late fees.'],
  ['Inspect and appraise', 'Homes are sold as-is. Use your inspection period and get a title report.'],
  ['Close through escrow', 'Usually with a special warranty deed and title insurance, like a normal purchase.'],
];

const SECTIONS: DrillSection[] = [
  group('gse', <IconHome />),
  group('government', <IconShield />),
  group(
    'bank',
    <IconBank />,
    <p>
      Most banks don’t post their homes on their own sites. They hire a local agent who lists them on the MLS, the database agents use. Wells
      Fargo, for example, no longer runs a public list. A buyer’s agent can set up an MLS search for “bank-owned” or “REO” homes in the ZIP codes you
      want. <a href="#/agents">Find a licensed agent →</a>
    </p>,
  ),
  {
    key: 'how-to-buy',
    title: 'How to buy one',
    icon: <IconSteps />,
    summary: `${STEPS.length} steps, from pre-approval to closing`,
    content: () => (
      <ol className="steps-rich">
        {STEPS.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
      </ol>
    ),
  },
  {
    key: 'checklist',
    title: 'What you’ll need',
    icon: <IconCheckList />,
    summary: `${CHECKLISTS.reo.items.length} things to have ready before you make an offer`,
    bare: true,
    content: () => <BuyerChecklistBox list={CHECKLISTS.reo} />,
  },
];

export default function BankOwnedPage({ section }: { section?: string }) {
  const open = SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">Bank-owned (REO) · Clark County, NV</span>}
        title={open ? <a className="title-link" href="#/bank-owned">Bank-owned &amp; government homes</a> : <>Bank-owned &amp; <span className="grad">government homes</span></>}
        sub={
          open ? undefined : (
            <>
              Homes a lender or government agency already owns, usually after a foreclosure auction where no one outbid the lender. You buy them
              like a normal home: an offer through an agent, with inspections, financing and title insurance.
            </>
          )
        }
      />
      {!open && (
        <div className="notice" role="note">
          <strong>Direct sources only.</strong> Every link below goes to the government agency, Fannie Mae, Freddie Mac, or the bank
          that owns the homes. No third-party auction or listing sites.
        </div>
      )}

      <DrillDown sections={SECTIONS} active={section} baseHref="#/bank-owned" label="Bank-owned homes guide" />

      {!open && (
        <p className="small muted playbook-note">
          How this sale works in Nevada, step by step: <a href="#/playbooks/reo">bank-owned (REO) playbook →</a>
        </p>
      )}
      <Disclaimer kind="sales" compact />
    </main>
  );
}
