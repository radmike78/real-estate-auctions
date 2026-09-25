import ProDirectory from './ProDirectory';
import Disclaimer from './Disclaimer';
import { FINANCING_CATEGORIES } from '../lib/pros';

const OPTIONS: [string, string][] = [
  ['Buying a home to live in', 'Conventional, FHA, VA and USDA loans from loan officers, banks and credit unions. FHA 203k and HomeStyle loans cover repairs too.'],
  ['Buying at auction', 'Most auctions need cash or certified funds within hours or days. Buyers often use savings, a HELOC, or a hard-money or bridge loan arranged before the sale.'],
  ['Fix and flip', 'Short-term fix-and-flip, bridge and hard-money loans lend against the property and the renovation plan. Costs are higher, and terms are short.'],
  ['Rental investors', 'DSCR loans qualify on the rent a property earns rather than personal income. Portfolio loans from banks are another option.'],
  ['Credit challenges', 'FHA, non-QM and some private lenders work with lower scores, recent credit events or ITIN borrowers, usually at higher rates. Compare several offers.'],
];

export default function FinancingPage() {
  return (
    <main className="page">
      <h1>Find financing</h1>
      <p className="lede">Loan officers, mortgage companies, banks, credit unions, and hard-money and private lenders.</p>

      <Disclaimer kind="financing" />

      <section className="options-grid" aria-label="Financing options">
        {OPTIONS.map(([t, d]) => (
          <div key={t} className="option-card">
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <h2>Lenders</h2>
      <p className="small muted">
        Credit situations are what each lender says it works with. They are not an offer or a guarantee of credit. Every lender's license or
        registration is checked on NMLS Consumer Access, FDIC BankFind or the NCUA locator.
      </p>
      <ProDirectory categories={FINANCING_CATEGORIES} />
    </main>
  );
}
