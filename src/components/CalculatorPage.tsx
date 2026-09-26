import BidCalculator from './BidCalculator';
import PageHero from './PageHero';

export default function CalculatorPage() {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Set your limit before the sale</span>}
        title={<>Your maximum <span className="grad">bid</span></>}
        sub="Every cost counted: premium, transfer tax, liens that stay, title and quiet title, eviction, holding, financing and selling. Know your number, and when to stop bidding. The result is only as good as the numbers you enter; it isn’t a guarantee of profit."
      />
      <BidCalculator headingLevel={2} />
    </main>
  );
}
