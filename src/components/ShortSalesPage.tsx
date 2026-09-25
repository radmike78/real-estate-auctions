import Disclaimer from './Disclaimer';
import BuyerChecklistBox from './BuyerChecklistBox';
import { CHECKLISTS } from '../lib/buyerChecklists';

const STEPS: [string, string][] = [
  ['Get pre-approved or show proof of funds', 'Lenders reviewing a short sale want to see that the buyer can close. A pre-approval letter or bank statement goes in with your offer.'],
  ['Hire a buyer\'s agent who has closed short sales', 'Short sales are listed on the MLS (the database agents use), marked "Short Sale" or "Subject to lender approval." An experienced agent can find them, including new listings, and knows how each lender works.'],
  ['Make an offer "subject to lender approval"', 'The seller accepts first. Then the listing agent sends your offer, the seller\'s hardship documents and a net sheet to the lender or lenders. Your earnest money is usually held in escrow.'],
  ['Wait for the lender\'s decision', 'Approval often takes weeks to a few months, and longer when there is a second mortgage, mortgage insurance or an HOA balance. The lender may approve, reject or counter at a higher price.'],
  ['Get the approval letter, then finish due diligence', 'Read the approval terms: price, closing deadline, and who pays which costs. Complete your inspection and appraisal within your contract periods.'],
  ['Close through escrow', 'You receive a regular deed through escrow, usually with title insurance, just like a standard purchase. Approval letters have hard deadlines, so be ready to close on time.'],
];

const RISKS: [string, string][] = [
  ['It can take a long time', 'Many buyers wait months. Rates, your finances or your lease situation can change while you wait.'],
  ['The lender can say no, or ask for more', 'The seller\'s acceptance isn\'t final. The lender can reject the sale or counter above your offer.'],
  ['More than one lender may need to agree', 'A second mortgage or HOA lien holder can block or delay the sale, or demand payment to release its lien.'],
  ['Foreclosure can happen first', 'If the owner is in foreclosure, the trustee sale may go ahead before approval arrives. Ask whether a sale date has been postponed for the short sale.'],
  ['Usually sold as-is', 'Sellers rarely make repairs or give credits. Budget for repairs and get a full inspection.'],
  ['"Approved" prices aren\'t always bargains', 'Lenders approve prices close to market value, based on their own appraisal or broker price opinion.'],
  ['Watch for fraud', 'Never pay a side fee to a seller, agent or "negotiator" outside escrow. Any payment must be disclosed to the lender. Be wary of anyone asking you to wire money.'],
  ['Occupied homes', 'Confirm the home will be vacant at closing, and whether any tenant has rights under a lease.'],
];

export default function ShortSalesPage() {
  return (
    <main className="page prose">
      <h1>Short sales</h1>
      <p>
        In a <strong>short sale</strong>, a homeowner sells for less than they owe on the mortgage, and the lender agrees to take less than the
        full payoff. Unlike an auction, it's a <strong>voluntary sale</strong>: the owner chooses to sell, lists with a licensed agent, and
        the lender must approve the buyer's offer. Short sales aren't forced sales, so no government list exists. They appear on the MLS
        (Multiple Listing Service), the database real estate agents use to share listings.
      </p>

      <div className="notice" role="note">
        <strong>How to find short sales:</strong> work with a licensed buyer's agent who searches the MLS for listings marked "Short Sale."
        Public listing sites often show them too, but may lag behind or miss status changes.{' '}
        <a href="#/agents/short-sales">Find a verified short-sale agent →</a>
      </div>

      <h2>Short sale vs. foreclosure auction vs. bank-owned</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th /><th>Short sale</th><th>Foreclosure / tax auction</th><th>Bank-owned (REO)</th></tr></thead>
          <tbody>
            <tr><td>Who sells</td><td>The owner, with lender approval</td><td>Trustee, sheriff or County Treasurer</td><td>The lender</td></tr>
            <tr><td>How you buy</td><td>Offer through an agent</td><td>Bid at auction, often cash only</td><td>Offer through an agent or online auction</td></tr>
            <tr><td>Inspection</td><td>Usually allowed</td><td>Usually no interior access</td><td>Usually allowed</td></tr>
            <tr><td>Financing</td><td>Allowed</td><td>Rarely; certified funds due quickly</td><td>Allowed</td></tr>
            <tr><td>Title</td><td>Normal deed; liens released at closing</td><td>No warranty; some liens may survive</td><td>Usually a special warranty deed</td></tr>
            <tr><td>Timeline</td><td>Weeks to months for approval</td><td>Fixed auction date</td><td>Similar to a normal sale</td></tr>
          </tbody>
        </table>
      </div>

      <h2>How to buy a short sale</h2>
      <ol className="steps-rich">
        {STEPS.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
      </ol>

      <BuyerChecklistBox list={CHECKLISTS.short} />

      <h2>Risks and things to watch out for</h2>
      <ul className="risk-list">
        {RISKS.map(([t, d]) => <li key={t}><strong>{t}.</strong> {d}</li>)}
      </ul>

      <h2>Don't go around the agent</h2>
      <p>
        Don't try to find short-sale candidates by contacting homeowners who are behind on payments. Nevada strictly regulates anyone who
        approaches owners in foreclosure (NRS Chapter 645F), and those deals can be undone. If an owner decides to sell, the home will be
        listed through an agent. You can follow a property's foreclosure status, without contacting anyone, in the{' '}
        <a href="#/pre-foreclosures">pre-foreclosure tracker</a>.
      </p>

      <p className="muted small">General information only, not legal, tax or financial advice. Sellers should consult a tax professional and an attorney about deficiency and tax consequences.</p>
      <Disclaimer kind="sales" compact />
    </main>
  );
}
