import ProDirectory from './ProDirectory';

export default function ProsPage() {
  return (
    <main className="page">
      <h1>Title, insurance & repairs</h1>
      <p className="lede">Title and escrow companies, insurance agents, and licensed contractors for fixing up a home.</p>
      <p className="small muted">
        Licenses are checked with the Nevada Division of Insurance or the Nevada State Contractors Board. Use only licensed contractors, and get
        written bids and proof of insurance before work starts.
      </p>
      <ProDirectory categories={['title_escrow', 'insurance', 'contractor']} />
    </main>
  );
}
