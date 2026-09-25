import ProDirectory from './ProDirectory';
import PageHero from './PageHero';
import Disclaimer from './Disclaimer';

export default function ProsPage({ initialLocation = '' }: { initialLocation?: string }) {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Licensed professionals · Nevada</span>}
        title={<>Title, insurance <span className="grad">&amp; repairs</span></>}
        sub="Title and escrow companies, insurance agents, and licensed contractors for fixing up a home."
      />
      <p className="small muted">
        Licenses are checked with the Nevada Division of Insurance or the Nevada State Contractors Board. Use only licensed contractors, and get
        written bids and proof of insurance before work starts.
      </p>
      <Disclaimer kind="services" compact />
      <ProDirectory initialLocation={initialLocation} categories={['title_escrow', 'insurance', 'contractor']} />
    </main>
  );
}
