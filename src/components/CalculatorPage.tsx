import BidCalculator from './BidCalculator';
import PageHero from './PageHero';

export default function CalculatorPage() {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Set your limit before the sale</span>}
        title={<>Your maximum <span className="grad">bid</span></>}
        sub="Count every cost, and know when to stop bidding."
      />
      <p className="muted">
        Includes the premium, transfer tax, liens that stay, title and quiet title, eviction, holding, financing and selling. The result is only as
        good as the numbers you enter; it isn’t a guarantee of profit.
      </p>
      <BidCalculator headingLevel={2} />
    </main>
  );
}
