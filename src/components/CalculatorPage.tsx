import { liveIn } from '../lib/dealStage';
import type { Deal } from '../lib/analyze';
import { useEffect, useState } from 'react';
import { CONFIRMED_EVENT } from '../lib/calcConfirmation';
import { irsWithoutRedemption } from '../lib/dealPacket';
import { loadDeals } from '../lib/analyze';
import { stateByCode, type StateCode } from '../lib/regions';
import { investorProfile, profileStart, commercialProfileStart } from '../lib/myPlan';
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
          { key: 'flip', label: 'Fix and flip (fix and sell)', about: `The most you can ${bid} and still make your profit when you fix it up and sell it.`, render: () => <BidCalculator headingLevel={2} offer={offer} saleKind={saleKind} saveAs={dealId ? `analyzed-${dealId}` : onAnalyze ? 'analyze-draft' : undefined} /> },
          { key: 'rent', label: 'Buy and hold (keep and rent)', about: offer && investorProfile().ownerOccupant ? 'What living there costs each month at your offer, and the cash it needs.' : `The most you can ${bid} and still get your return on the cash you leave in, with or without a loan afterward.`, render: () => <RentCalculator saleKind={saleKind} dealId={dealId} regional={!!state} offer={offer} storageKey={k('rent')} exactKey={!!dealId} start={onAnalyze ? profileStart(investorProfile(), offer) : undefined} /> },
          { key: 'commercial', label: 'Commercial income', about: `The most you can ${bid} for a building’s income, counting the months it takes to lease it up.`, render: () => <CommercialCalculator saleKind={saleKind} dealId={dealId} regional={!!state} offer={offer} storageKey={k('commercial')} exactKey={!!dealId} start={onAnalyze ? commercialProfileStart(investorProfile(), offer) : undefined} /> },
          { key: 'seller', label: 'Seller financing', about: 'When the seller is the lender: the payment, the balloon you’ll have to pay off, and the cash it saves against a bank loan.', render: () => <SellerFinanceCalculator /> },
          { key: 'lien', label: 'Lien certificate', about: 'What a special assessment (SID) lien certificate earns per year, counting the wait to be paid.', render: () => <LienCalculator storageKey={dealId ? `fsf.calc.lien.${dealId}${state === 'AZ' ? '-az' : ''}.v1` : undefined} /> },
        ].filter((s) => (s.key !== 'lien' || (lien && (!state || state === 'NV' || state === 'AZ'))) && (s.key !== 'seller' || offer || !state)).map((s) => (s.key === 'lien' && state === 'AZ' ? { ...s, label: 'Tax lien', about: 'What an Arizona tax lien certificate earns per year at the rate you win, counting the wait to be paid.' } : s))}
      />
      <p className="muted small">The results are only as good as the numbers you enter; they aren’t a guarantee of profit.</p>
      <BeforeYouCommit plan={initial} state={state} saleKind={saleKind} dealId={dealId} />
    </>
  );
}

/** The checks that most often change a beginner's numbers, shown where the decision is made. */
function BeforeYouCommit({ plan, state, saleKind, dealId }: { plan?: string; state?: StateCode; saleKind?: string; dealId?: string }) {
  // (Re-read when Fix and sell saves a rule: the redemption lines follow it.)
  const [, setTick] = useState(0);
  useEffect(() => { const on = () => setTick((n) => n + 1); window.addEventListener(CONFIRMED_EVENT, on); return () => window.removeEventListener(CONFIRMED_EVENT, on); }, []);
  // An IRS sale with "No redemption" picked (a court-ordered sale): no 180-day line.
  const irsNone = saleKind === 'irs' && !!dealId && !!state && irsWithoutRedemption({ state, kind: 'irs', id: dealId, plan: 'flip' });
  // A home you'll live in with no rent counted: no vacancies or renting rules.
  const living = !!dealId && !!saleKind && plan === 'rent' && liveIn({ id: dealId, kind: saleKind as Deal['kind'], plan: 'rent' });
  // Past the sale (won, closed or owned): not "before you bid".
  const won = !!dealId && ['contract', 'closed', 'owned'].includes(loadDeals().find((x) => x.id === dealId)?.stage ?? '');
  const name = state ? stateByCode(state)?.name : undefined;
  // Renting rules matter only when you'd keep it and rent it out.
  const renting = plan !== 'flip' && plan !== 'lien';
  // A lien certificate isn't the property: no tax bill, insurance or repairs of your own; these checks instead.
  // A forced sale (auction): paid to the officer or trustee on the sale's terms, often with no inside look.
  if (saleKind && ['trustee', 'taxSale', 'court', 'hoa', 'irs'].includes(saleKind) && plan !== 'lien') return (
    <section className="before-commit" aria-labelledby="before-commit-head">
      <h3 id="before-commit-head">Before you commit, check these</h3>
      <ul>
        <li><strong>The sale’s payment rules:</strong> the form, amount and deadline, paid to the officer or trustee, from the official notice.</li>
        <li><strong>Liens and taxes that survive this sale,</strong> from a title search.</li>
        {/* Nevada's own periods, from statute (leg.state.nv.us; 26 U.S.C. 6337(b) for the IRS): no asterisk there. */}
        {state === 'NV' && saleKind === 'court' ? <li><strong>The owner’s right to buy it back:</strong> 1 year after a sheriff’s sale, at your price plus 1% a month, plus taxes, assessments and earlier liens you paid (NRS 21.210). You get a certificate of sale first.</li>
          : state === 'NV' && saleKind === 'hoa' ? <li><strong>The owner’s right to buy it back:</strong> 60 days after an HOA sale, at your price plus 1% a month, plus the taxes, assessments and needed upkeep you paid (NRS 116.31166(3)). You get a certificate of sale first.</li>
          : saleKind === 'irs' && !irsNone ? <li><strong>The owner’s right to buy it back:</strong> 180 days after an IRS sale, at your price plus 20% a year (26 U.S.C. 6337(b)). You get a certificate of sale first.</li>
          : <li><strong>Any right to buy it back (redemption)</strong> and how long it lasts for this kind of sale in your state.*</li>}
        <li><strong>Who lives there,</strong> and the court process to get possession.</li>
        <li><strong>Insurance from the day it’s yours.</strong> <a href="#/learn/analyze">What to ask</a></li>
        <li><strong>Your tax bill, not the last owner’s.</strong> It can change when you buy or rent it out. <a href={`#/learn/analyze?section=your-tax-bill-after-you-buy${state ? `&state=${state}` : ''}`}>{name ? `${name} property tax rules` : 'Property tax rules by state'}</a></li>
        {renting && plan === 'commercial' && <li><strong>The rules for leasing it:</strong> zoning and permitted uses, the existing leases and their terms, and for apartments any local rent rules.</li>}
        {renting && !living && plan !== 'commercial' && <li><strong>The rules for renting it:</strong> HOA limits, short-term rental rules and local rent rules.</li>}
        <li><strong>Your deal, your decision.</strong> Verify with the official source, and get advice from your own attorney, tax advisor and financial advisor {won ? 'before you spend more on it' : 'before you bid'}.</li>
      </ul>
      <p className="muted small">Can’t check one yet? Get the answer {won ? 'before you rely on these numbers' : 'before you bid'}.</p>
    </section>
  );
  if (plan === 'lien') return (
    <section className="before-commit" aria-labelledby="before-commit-head">
      <h3 id="before-commit-head">Before you commit, check these</h3>
      <ul>
        <li><strong>The county’s {state === 'NV' ? 'sale rules' : 'bidder rules'} and payment deadline,</strong> from the treasurer’s own sale page.</li>
        <li><strong>Later years’ taxes</strong> you may pay to protect the lien, in your holding budget.</li>
        <li><strong>The parcel itself:</strong> would you accept owning it if the lien is never paid?</li>
        <li><strong>When you’d call an attorney</strong> to enforce an unpaid lien, and what that would cost.</li>
        <li><strong>Your deal, your decision.</strong> Verify with the official source, and get advice from your own attorney and tax advisor before {state === 'NV' ? 'the sale' : 'you bid'}.</li>
      </ul>
      <p className="muted small">Can’t check one yet? Get the answer before {state === 'NV' ? 'the sale' : 'you bid'}.</p>
    </section>
  );
  return (
    <section className="before-commit" aria-labelledby="before-commit-head">
      <h3 id="before-commit-head">Before you commit, check these</h3>
      <ul>
        <li><strong>Your tax bill, not the seller’s.</strong> It can change when you buy or rent it out. <a href={`#/learn/analyze?section=your-tax-bill-after-you-buy${state ? `&state=${state}` : ''}`}>{name ? `${name} property tax rules` : 'Property tax rules by state'}</a></li>
        <li><strong>A written insurance quote</strong> for how you’ll use it, including while it’s empty. <a href="#/learn/analyze">What to ask</a></li>
        <li><strong>A reserve cushion after closing and repairs.</strong> Plan for {living ? 'repairs' : 'vacancies'} and unexpected costs, and confirm any reserve requirement with your lender.</li>
        {renting && plan === 'commercial' && <li><strong>The rules for leasing it:</strong> zoning and permitted uses, the existing leases and their terms, and for apartments any local rent rules.</li>}
        {renting && !living && plan !== 'commercial' && <li><strong>The rules for renting it:</strong> HOA limits, short-term rental rules and local rent rules.</li>}
        <li><strong>Wire instructions confirmed by phone</strong> with your title or escrow company, using a number you looked up yourself. <a href="#/learn/negotiate">Why</a></li>
        <li><strong>Your deal, your decision.</strong> Verify with the official source, and get advice from your own attorney, tax advisor, agent and financial advisor before you bid, buy or borrow.</li>
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
