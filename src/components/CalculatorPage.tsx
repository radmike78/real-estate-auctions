import type { StateCode } from '../lib/regions';
import BidCalculator from './BidCalculator';
import { CommercialCalculator, LienCalculator, RentCalculator } from './HoldCalculators';
import PageHero from './PageHero';
import StrategyTabs from './StrategyTabs';

/** The four calculators, one per strategy (also used on Analyze a deal). */
/** The calculators. `initial` opens a tab; `state` hides tools that don’t apply there (lien certificates are Nevada’s). */
export function Calculators({ initial, state }: { initial?: string; state?: StateCode } = {}) {
  return (
    <>
      <StrategyTabs
        initial={initial}
        strategies={[
          { key: 'flip', label: 'Fix and sell', about: 'The most you can bid and still make your profit when you fix it up and sell it.', render: () => <BidCalculator headingLevel={2} /> },
          { key: 'rent', label: 'Keep and rent', about: 'The most you can bid and still get your return on the cash you leave in, with or without a loan afterward.', render: () => <RentCalculator /> },
          { key: 'commercial', label: 'Commercial income', about: 'The most you can bid for a building’s income, counting the months it takes to lease it up.', render: () => <CommercialCalculator /> },
          { key: 'lien', label: 'Lien certificate', about: 'What a special assessment (SID) lien certificate earns per year, counting the wait to be paid.', render: () => <LienCalculator /> },
        ].filter((s) => s.key !== 'lien' || !state || state === 'NV')}
      />
      <p className="muted small">The results are only as good as the numbers you enter; they aren’t a guarantee of profit.</p>
    </>
  );
}

export default function CalculatorPage() {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Set your limit before the sale</span>}
        title={<>Your maximum <span className="grad">bid</span></>}
        sub="Count every cost, and know when to stop bidding."
      />
      <Calculators />
    </main>
  );
}
