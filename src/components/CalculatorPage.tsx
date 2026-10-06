import { stateByCode, type StateCode } from '../lib/regions';
import { investorProfile, profileStart } from '../lib/myPlan';
import BidCalculator from './BidCalculator';
import { CommercialCalculator, LienCalculator, RentCalculator, SellerFinanceCalculator } from './HoldCalculators';
import PageHero from './PageHero';
import StrategyTabs from './StrategyTabs';

/** The four calculators, one per strategy (also used on Analyze a deal). */
/** The calculators. `initial` opens a tab; `state` hides tools that don’t apply there (liens: Nevada SID and Arizona tax liens). */
export function Calculators({ initial, onTab, state, offer = false, dealId, onAnalyze = false, lien = true, saleKind }: { /** The kind of sale chosen in Analyze. */ saleKind?: string; initial?: string; onTab?: (key: string) => void; state?: StateCode; offer?: boolean; /** Show the lien tab (Analyze shows it only for lien sales). */ lien?: boolean; /** A deal saved in Analyze: its numbers are kept with it. */ dealId?: string; /** On Analyze before the deal is saved: numbers are kept as a draft and move to the deal when it's saved. */ onAnalyze?: boolean } = {}) {
  const k = (kind: string) => (dealId ? `fsf.calc.${kind}.${dealId}${offer ? '-offer' : ''}.v1` : undefined);
  const bid = offer ? 'offer' : 'bid';
  return (
    <>
      <StrategyTabs
        initial={initial}
        onChange={onTab}
        hideTabs={onAnalyze}
        strategies={[
          { key: 'flip', label: 'Fix and sell', about: `The most you can ${bid} and still make your profit when you fix it up and sell it.`, render: () => <BidCalculator headingLevel={2} offer={offer} saleKind={saleKind} saveAs={dealId ? `analyzed-${dealId}` : onAnalyze ? 'analyze-draft' : undefined} /> },
          { key: 'rent', label: 'Keep and rent', about: `The most you can ${bid} and still get your return on the cash you leave in, with or without a loan afterward.`, render: () => <RentCalculator regional={!!state} offer={offer} storageKey={k('rent')} exactKey={!!dealId} start={onAnalyze ? profileStart(investorProfile(), offer) : undefined} /> },
          { key: 'commercial', label: 'Commercial income', about: `The most you can ${bid} for a building’s income, counting the months it takes to lease it up.`, render: () => <CommercialCalculator regional={!!state} offer={offer} storageKey={k('commercial')} exactKey={!!dealId} /> },
          { key: 'seller', label: 'Seller financing', about: 'When the seller is the lender: the payment, the balloon you’ll have to pay off, and the cash it saves against a bank loan.', render: () => <SellerFinanceCalculator /> },
          { key: 'lien', label: 'Lien certificate', about: 'What a special assessment (SID) lien certificate earns per year, counting the wait to be paid.', render: () => <LienCalculator /> },
        ].filter((s) => (s.key !== 'lien' || (lien && (!state || state === 'NV' || state === 'AZ'))) && (s.key !== 'seller' || offer || !state)).map((s) => (s.key === 'lien' && state === 'AZ' ? { ...s, label: 'Tax lien', about: 'What an Arizona tax lien certificate earns per year at the rate you win, counting the wait to be paid.' } : s))}
      />
      <p className="muted small">The results are only as good as the numbers you enter; they aren’t a guarantee of profit.</p>
      <BeforeYouCommit plan={initial} state={state} />
    </>
  );
}

/** The checks that most often change a beginner's numbers, shown where the decision is made. */
function BeforeYouCommit({ plan, state }: { plan?: string; state?: StateCode }) {
  const name = state ? stateByCode(state)?.name : undefined;
  // Renting rules matter only when you'd keep it and rent it out.
  const renting = plan !== 'flip' && plan !== 'lien';
  return (
    <section className="before-commit" aria-labelledby="before-commit-head">
      <h3 id="before-commit-head">Before you commit, check these</h3>
      <ul>
        <li><strong>Your tax bill, not the seller’s.</strong> It can change when you buy or rent it out. <a href="#/learn/analyze">{name ? `See ${name}` : 'See your state'}</a></li>
        <li><strong>A written insurance quote</strong> for how you’ll use it, including while it’s empty. <a href="#/learn/analyze">What to ask</a></li>
        <li><strong>At least 6 months of payments in savings</strong> after closing and repairs.</li>
        {renting && <li><strong>The rules for renting it:</strong> HOA limits, short-term rental rules and local rent rules.</li>}
        <li><strong>Wire instructions confirmed by phone</strong> with your title or escrow company, using a number you looked up yourself. <a href="#/learn/negotiate">Why</a></li>
      </ul>
      <p className="muted small">Can’t check one yet? Get the answer before you sign or bid.</p>
    </section>
  );
}

export default function CalculatorPage() {
  return (
    <main className="page">
      <PageHero
        title={<>Your maximum <span className="grad">bid</span></>}
        sub="Count every cost, and know when to stop bidding."
      />
      <Calculators />
    </main>
  );
}
