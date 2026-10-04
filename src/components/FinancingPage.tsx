import ProDirectory from './ProDirectory';
import Disclaimer from './Disclaimer';
import PageHero from './PageHero';
import { FINANCING_CATEGORIES } from '../lib/pros';
import ScriptBox from './ScriptBox';
import { PRO_SCRIPTS } from '../lib/proScripts';

const OPTIONS: [string, string][] = [
  ['Buying a home to live in', 'Conventional, FHA, VA and USDA loans from loan officers, banks and credit unions. FHA 203k and HomeStyle loans cover repairs too.'],
  ['Buying at auction', 'Most auctions need cash or certified funds within hours or days. Buyers often use savings, a HELOC, or a hard-money or bridge loan arranged before the sale.'],
  ['Fix and flip', 'Short-term fix-and-flip, bridge and hard-money loans lend against the property and the renovation plan. Costs are higher, and terms are short.'],
  ['Rental investors', 'DSCR loans qualify on the rent a property earns rather than personal income. Portfolio loans from banks are another option.'],
  ['Credit challenges', 'FHA and non-QM loans can work with lower scores or recent credit problems. Some non-QM and private lenders work with ITIN borrowers, usually at higher rates. Compare several offers.'],
];

export default function FinancingPage({ initialLocation = '' }: { initialLocation?: string }) {
  return (
    <main className="page">
      <PageHero
        title={<>Find <span className="grad">financing</span></>}
        sub="Loan officers, mortgage companies, banks, credit unions, and hard-money and private lenders."
      />

      <Disclaimer kind="financing" />

      <section className="options-grid" aria-label="Financing options">
        {OPTIONS.map(([t, d]) => (
          <div key={t} className="option-card">
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <section className="roadmap-cols" aria-label="Before you call a lender">
        <ScriptBox to="A loan officer" script={PRO_SCRIPTS.lender.say} note="Ask two or three lenders the same question, so you can compare." />
        <div>
          <h3>Have ready</h3>
          <ul>{PRO_SCRIPTS.lender.bring!.map((x) => <li key={x}>{x}</li>)}</ul>
          <p><a className="btn btn-secondary" href="#/learn/financing">Compare ways to pay →</a></p>
        </div>
      </section>

      <h2>Lenders</h2>
      <p className="small muted">
        Credit situations are what each lender says it works with. They are not an offer or a guarantee of credit. Every lender's license or
        registration is checked on NMLS Consumer Access, FDIC BankFind or the NCUA locator.
      </p>
      <ProDirectory initialLocation={initialLocation} categories={FINANCING_CATEGORIES} />
    </main>
  );
}
