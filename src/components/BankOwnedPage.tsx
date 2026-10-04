import { useState, type ReactNode } from 'react';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { CHECKLISTS } from '../lib/buyerChecklists';
import { REO_GROUPS, reoSourcesIn, type ReoGroup, type ReoSource } from '../lib/reoSources';
import BuyerChecklistBox from './BuyerChecklistBox';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBank, IconCheckList, IconHome, IconShield, IconSteps } from './Icons';
import SaleDocsPanel from './SaleDocsPanel';

function SourceCard({ s }: { s: ReoSource }) {
  // The ↗ stays on the same line as the name's last word.
  const cut = s.name.lastIndexOf(' ') + 1;
  return (
    <li className="reo-card">
      <div className="reo-owner">{s.owner}</div>
      <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name.slice(0, cut)}<span className="nowrap">{s.name.slice(cut)} ↗</span></a></h3>
      <p>{s.what}</p>
      <dl>
        <div className="reo-how"><dt>How to buy</dt><dd>{s.howToBuy}</dd></div>
        {s.firstLook && <div className="reo-first"><dt>Buyers first</dt><dd>{s.firstLook}</dd></div>}
        <div className="reo-clark"><dt>In Clark County</dt><dd>{s.clarkCounty}</dd></div>
      </dl>
    </li>
  );
}

const group = (g: ReoGroup, cls: ClassFilter, icon: ReactNode, note?: ReactNode): DrillSection[] => {
  const list = reoSourcesIn(g, cls);
  if (!list.length) return [];
  return [
    {
      key: g === 'gse' ? 'fannie-freddie' : g === 'bank' ? 'banks' : 'government',
      title: REO_GROUPS[g].title,
      icon,
      summary: `${list.length} direct source${list.length === 1 ? '' : 's'} · ${(cls === 'commercial' && REO_GROUPS[g].commercialSummary) || REO_GROUPS[g].summary}`,
      content: () => (
        <>
          {note}
          <ul className="reo-grid">{list.map((s) => <SourceCard key={s.url} s={s} />)}</ul>
        </>
      ),
    },
  ];
};

const STEPS: [string, string][] = [
  ['Get pre-approved or show proof of funds', 'Banks and agencies selling these homes want proof you can close. If you’re paying cash, you’ll need a recent bank statement.'],
  ['Choose a buyer’s agent', 'Almost every bank-owned home is sold through a listing agent. HUD homes need a HUD-registered broker to bid for you.'],
  ['Check the first-look period', 'If you’ll live in the home, you may be able to buy before investors can. Investors must wait until it ends.'],
  ['Make an offer and read the addendum', 'The seller’s addendum overrides parts of the standard contract, including repairs, deadlines and per-day late fees.'],
  ['Inspect and appraise', 'Homes are sold as-is. Use your inspection period and get a title report.'],
  ['Close through escrow', 'Just like a normal purchase, with title insurance. The deed usually carries limited promises from the lender.'],
];

// The last choice is remembered while the visitor moves between sections of this page.
let lastClass: ClassFilter = 'all';

export const sectionsFor = (cls: ClassFilter): DrillSection[] => [
  ...group('gse', cls, <IconHome />),
  ...group('government', cls, <IconShield />),
  ...group(
    'bank',
    cls,
    <IconBank />,
    <p>
      Most banks don’t post their homes on their own sites. They hire a local agent who lists them on the MLS, the database agents use. Wells
      Fargo, for example, no longer runs a public list. A buyer’s agent can set up an MLS search for “bank-owned” or “REO” homes in the ZIP codes you
      want. <a href="#/pros/agent">How to find an agent →</a>
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
    content: () => (
      <>
        <BuyerChecklistBox list={CHECKLISTS.reo} />
        <h3 className="section-title">Documents and what to say</h3>
        <SaleDocsPanel guideKey="reo" state="NV" />
      </>
    ),
  },
];

export default function BankOwnedPage({ section }: { section?: string }) {
  const [cls, setClsState] = useState<ClassFilter>(lastClass);
  const setCls = (c: ClassFilter) => {
    lastClass = c;
    setClsState(c);
  };
  const SECTIONS = sectionsFor(cls);
  const open = SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">Bank-owned (REO) · Clark County, NV</span>}
        title={
          open ? (
            <a className="title-link" href="#/bank-owned">Bank-owned &amp; government {cls === 'commercial' ? 'properties' : 'homes'}</a>
          ) : (
            <>Bank-owned &amp; <span className="grad">government {cls === 'commercial' ? 'properties' : 'homes'}</span></>
          )
        }
        sub={
          open ? undefined : (
            <>
              {cls === 'commercial'
                ? 'Commercial property a lender or agency already owns. Buy by offer through the listing broker, or by bid for government sales.'
                : 'Homes a lender or agency already owns. You buy them like a normal home, with an offer through an agent.'}
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
      <div className="row" style={{ margin: '0 0 16px' }}>
        <ClassSwitch value={cls} onChange={setCls} />
        {cls === 'commercial' && (
          <span className="small muted">HUD, VA, USDA, Fannie Mae and Freddie Mac sell mainly homes, not commercial property, so they aren’t listed here.</span>
        )}
      </div>

      <DrillDown sections={SECTIONS} active={section} baseHref="#/bank-owned" label="Bank-owned homes guide" />

      {!open && (
        <p className="small muted playbook-note">
          How this sale works in Nevada, step by step: <a href="#/playbooks/reo">bank-owned (REO) guide →</a>
        </p>
      )}
      <Disclaimer kind="sales" compact />
    </main>
  );
}
