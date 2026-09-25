import ProDirectory from './ProDirectory';
import Disclaimer from './Disclaimer';
import { REVERIFY_DAYS } from '../lib/pros';

export default function AgentsPage({ shortSales = false }: { shortSales?: boolean }) {
  return (
    <main className="page">
      <h1>Find a real estate agent</h1>
      <p className="lede">Licensed Nevada agents for short sales, bank-owned homes and auction properties.</p>
      <p className="small muted">
        Every agent's license is checked by a person on the Nevada Real Estate Division lookup at least every {REVERIFY_DAYS} days.{' '}
        <a href="#/advertise/apply/agent">Agents: apply to be listed →</a>
      </p>
      <Disclaimer kind="professionals" compact />
      <ProDirectory categories={['agent']} initialCategory="agent" showCategoryFilter={false} key={String(shortSales)} />
    </main>
  );
}
