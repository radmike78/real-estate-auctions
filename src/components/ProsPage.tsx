import ProDirectory from './ProDirectory';
import PageHero from './PageHero';
import Disclaimer from './Disclaimer';

export default function ProsPage({ initialLocation = '' }: { initialLocation?: string }) {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Licensed professionals · Nevada</span>}
        title={<>Your <span className="grad">deal team</span></>}
        sub="Title, insurance, inspectors, contractors, attorneys, CPAs and property managers."
      />
      <p className="small muted">
        Every license is checked with its Nevada regulator. Get written bids and proof of insurance before work starts, and a written engagement
        letter from any attorney or CPA.
      </p>
      <ProDirectory initialLocation={initialLocation} categories={['title_escrow', 'insurance', 'home_inspector', 'contractor', 'attorney', 'cpa', 'property_manager']} notice={<Disclaimer kind="services" compact />} />
    </main>
  );
}
