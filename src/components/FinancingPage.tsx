import type { ReactNode } from 'react';
import ProDirectory, { useDirectory } from './ProDirectory';
import Disclaimer from './Disclaimer';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import { FINANCING_CATEGORIES } from '../lib/pros';
import ScriptBox from './ScriptBox';
import { PRO_SCRIPTS } from '../lib/proScripts';
import AdSpot from './AdSpot';
import { useMyArea } from '../lib/myArea';
import { stateByCode } from '../lib/regions';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';
import { IconGavel, IconHome, IconHouses, IconPercent, IconTools } from './Icons';
import { FINANCING_ADVICE, FINANCING_FACTORS, FINANCING_POSITION } from '../lib/financingGuidance';

const OPTIONS: [string, string, ReactNode][] = [
  ['Buying a home to live in', 'Conventional, FHA, VA and USDA loans from loan officers, banks and credit unions. FHA 203k and HomeStyle loans cover repairs too.', <IconHome />],
  ['Buying at auction', 'Most auctions need cash or certified funds within hours or days. Depending on your situation, options may include savings, home equity, or a hard-money or bridge loan arranged before the sale. Compare the risks and confirm funds will be available by the seller’s deadline.', <IconGavel />],
  ['Fix and flip', 'Short-term fix-and-flip, bridge and hard-money loans lend against the property and the renovation plan. Costs are higher, and terms are short.', <IconTools />],
  ['Rental investors', 'DSCR loans qualify on the rent a property earns rather than personal income. Portfolio loans from banks are another option.', <IconHouses />],
  ['Credit challenges', 'FHA and non-QM loans can work with lower scores or recent credit problems. Some non-QM and private lenders work with ITIN borrowers, usually at higher rates. Compare several offers.', <IconPercent />],
];

export default function FinancingPage({ initialLocation = '' }: { initialLocation?: string }) {
  // Whether any lender advertises in the visitor's state: when none does, the owl says so near the top.
  const { pros, loading, error } = useDirectory();
  const [area] = useMyArea();
  const adsOpen = advertisingOpen(useSiteFeatures());
  const lenders = pros.filter((p) => FINANCING_CATEGORIES.includes(p.category) && (!area || p.state === area.state));
  const none = !loading && !error && lenders.length === 0;
  const stName = area ? stateByCode(area.state)?.name : null;
  return (
    <main className="page fin-page">
      <PageHero
        title={<>Find <span className="grad">financing</span></>}
        sub="Loan officers, mortgage companies, banks, credit unions, and hard-money and private lenders."
      />

      {none && (
        <div className="empty fin-empty">
          <OwlNote><strong>No lenders listed{stName ? ` in ${stName}` : ''} yet.</strong> We check identity and required credentials before every listing appears.</OwlNote>
          <p>
            Meanwhile, see which kind of loan fits below, and call two or three lenders with the script. <a href="#/pros">Your team</a> explains who you need and how to find them.{' '}
            {adsOpen ? <>Want to advertise your services? <a href="#/advertise">Apply to advertise</a>.</> : 'Advertising for professionals opens soon.'}
          </p>
        </div>
      )}

      <section aria-labelledby="fin-decision-head">
        <h2 id="fin-decision-head">Choose financing for your situation</h2>
        <p>{FINANCING_POSITION}</p>
        <ul>{FINANCING_FACTORS.map((factor) => <li key={factor}>{factor}</li>)}</ul>
        <p>{FINANCING_ADVICE}</p>
        <a href="#/learn/financing">Compare financing methods in the lesson&nbsp;→</a>
      </section>

      <h2 className="section-title">Which loan fits?</h2>
      <section className="options-grid fin-options" aria-label="Financing options">
        {OPTIONS.map(([t, d, icon], i) => (
          <div key={t} className={`option-card fin-tone-${i}`}>
            <span className="fin-icon" aria-hidden>{icon}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="fin-call-head">
        <h2 id="fin-call-head">Before you call a lender</h2>
        <div className="roadmap-cols">
          <div>
            <ScriptBox to="a loan officer" heading="What to say to a loan officer" script={PRO_SCRIPTS.lender.say} note="Ask two or three lenders the same question, so you can compare." />
            {PRO_SCRIPTS.lender.read && (
              <>
                <h3>{PRO_SCRIPTS.lender.read.title}</h3>
                <ul>{PRO_SCRIPTS.lender.read.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </>
            )}
          </div>
          <div>
            <h3>Have ready</h3>
            <ul className="fin-ready">
              <li><strong>Any loan: </strong>{PRO_SCRIPTS.lender.bring!.map((x, i) => (i && !/^[A-Z](?:[A-Z]|-)/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join('; ')}.</li>
              <li><strong>For a DSCR loan (approved on the rent): </strong>the lease or the appraiser’s rent estimate, your LLC papers if it borrows, and statements showing the down payment and reserves.</li>
              <li><strong>For a hard-money loan (a flip or a repair): </strong>the purchase contract, a scope of work with contractor bids, the after-repair value with comparable sales, your experience, and how you’ll repay it.</li>
            </ul>
            <p><a className="btn btn-secondary" href="#/learn/financing">Compare ways to pay&nbsp;→</a></p>
          </div>
        </div>
      </section>

      {!none && (
        <>
          <h2 className="section-title">Lenders</h2>
          <p className="small muted">
            Listings are paid advertisements, not endorsements. Credit situations are what each lender says it works with, not an offer or a
            guarantee of credit. Every lender’s license or registration is checked on NMLS Consumer Access, FDIC BankFind or the NCUA locator.
          </p>
          <ProDirectory initialLocation={initialLocation} categories={FINANCING_CATEGORIES} />
        </>
      )}
      <Disclaimer kind="financing" compact />
      <AdSpot spot="financing" />
    </main>
  );
}
