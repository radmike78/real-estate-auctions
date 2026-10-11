import { useState, type ReactNode } from 'react';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { CHECKLISTS } from '../lib/buyerChecklists';
import { HUD_CLARK_SEARCH, REO_GROUPS, reoSourcesIn, reoWhatFor, type ReoGroup, type ReoSource } from '../lib/reoSources';
import BuyerChecklistBox from './BuyerChecklistBox';
import Disclaimer from './Disclaimer';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBank, IconCheckList, IconFile, IconHome, IconShield, IconSteps } from './Icons';
import SaleDocsPanel from './SaleDocsPanel';
import StatePicker from './StatePicker';
import ByState from './ByState';
import { getMyState, useMyState } from '../lib/myState';
import { STATES } from '../lib/regions';
import { BUYING, REO_GUIDE } from '../lib/states/bankOwned';
import AdSpot from './AdSpot';

function SourceCard({ s }: { s: ReoSource }) {
  // The ↗ stays on the same line as the name's last word.
  const cut = s.name.lastIndexOf(' ') + 1;
  const [mine] = useMyState();
  // HUD's link opens a Clark County search; elsewhere it opens HUD's own search to pick your area.
  const href = s.url === HUD_CLARK_SEARCH && mine && mine !== 'NV' ? 'https://www.hudhomestore.gov/' : s.url;
  // The Las Vegas search tips are for Nevada (or every state); elsewhere they name the visitor's own state.
  const stateName = mine && mine !== 'NV' ? STATES.find((x) => x.code === mine)?.name : undefined;
  const what = stateName ? reoWhatFor(s.what, stateName) : s.what;
  return (
    <li className="reo-card">
      <div className="reo-owner">{s.owner}</div>
      <h3><a href={href} target="_blank" rel="noopener noreferrer">{s.name.slice(0, cut)}<span className="nowrap">{s.name.slice(cut)}&nbsp;↗</span></a></h3>
      <p>{what}</p>
      <dl>
        <div className="reo-how"><dt>How to buy</dt><dd>{s.howToBuy}</dd></div>
        {s.firstLook && <div className="reo-first"><dt>Buyers first</dt><dd>{s.firstLook}</dd></div>}
        {/* A Clark County, Nevada note: shown with Nevada or every state, not to visitors from elsewhere. */}
        {(!mine || mine === 'NV') && <div className="reo-clark"><dt>In Clark County</dt><dd>{s.clarkCounty}</dd></div>}
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

/** State rules for buying a bank-owned home: the visitor's state only, once chosen. */
function BuyingInState() {
  const [mine] = useMyState();
  return (
    <>
      {!mine && (
        <p>
          The rules for what a bank must tell you, what “as-is” means and which deadlines matter are different in each state. Pick your state
          at the top of the page to see only its rules.
        </p>
      )}
      <ByState lines={BUYING} />
      <p>{mine ? 'The' : 'In every state, the'} seller’s addendum and your contract have the exact terms and deadlines. Talk only with the listing agent and your own team.</p>
    </>
  );
}

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
      want. <a href="#/pros/agent">How to find an agent&nbsp;→</a>
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
    key: 'by-state',
    title: 'Buying one in your state',
    icon: <IconFile />,
    summary: 'Disclosures, as-is terms and contract deadlines in Nevada, California, Arizona, Utah and Texas',
    content: () => <BuyingInState />,
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
        <SaleDocsPanel guideKey="reo" state={getMyState() ?? 'NV'} />
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
  const [state] = useMyState();
  const stateName = state ? STATES.find((x) => x.code === state)?.name : null;
  // Once a state is chosen, the state section names only that state.
  const SECTIONS = sectionsFor(cls).map((x) =>
    x.key === 'by-state' && stateName ? { ...x, title: `Buying one in ${stateName}`, summary: 'Disclosures, as-is terms and contract deadlines' } : x,
  );
  const open = SECTIONS.some((x) => x.key === section);
  return (
    <main className="page prose">
      <PageHero
        compact={open}
        eyebrow={<span className="eyebrow">Bank-owned · {stateName ?? 'NV, CA, AZ, UT, TX'}</span>}
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
      {!open && (
        <p className="page-starter">
          {!state || state === 'NV'
            ? <>Most sources below list homes nationwide (the HUD link opens a Clark County search; change the location on HUD’s site), and the notes on each card are for Clark County, Nevada. Local buying guidance is under “Buying one in your state.”</>
            : <>Most sources below list homes nationwide: search each one for {stateName}. The rules for buying in {stateName} are under “Buying one in {stateName}.”</>}
        </p>
      )}
      <StatePicker label="Where is the home?" />
      <div className="row bo-class" style={{ margin: '0 0 16px' }}>
        <span className="state-picker-label">Property type</span>
        <ClassSwitch value={cls} onChange={setCls} />
        {cls === 'commercial' && (
          <span className="small muted">HUD, VA, USDA, Fannie Mae and Freddie Mac sell mainly homes, not commercial property, so they aren’t listed here.</span>
        )}
      </div>

      <DrillDown sections={SECTIONS} active={section} baseHref="#/bank-owned" label="Bank-owned homes guide" />

      {!open && (
        <div className="bo-guides">
          <p className="bo-guides-label"><strong>How this sale works, step by step</strong></p>
          <div className="bo-guides-links">
            {STATES.filter((s) => !state || s.code === state).map((s) => (
              <a key={s.code} className="btn btn-secondary" href={REO_GUIDE[s.code]}>{s.name} bank-owned (REO) guide&nbsp;→</a>
            ))}
          </div>
        </div>
      )}
      <AdSpot spot="bankowned" />
      <Disclaimer kind="sales" compact />
    </main>
  );
}
