import { DISCLAIMERS, ROLE_SHORT } from '../lib/disclaimers';

export default function DisclaimerPage() {
  return (
    <main className="page prose">
      <h1>Our role &amp; your responsibility</h1>
      <p className="lede">{ROLE_SHORT}</p>

      <h2>What we do</h2>
      <p>
        We gather public information about properties heading to forced sale, explain how those sales work, and list professionals who
        advertise here: agents, lenders, title and insurance companies, and contractors. That's all. We are an information and advertising
        service.
      </p>

      <h2>What we don't do</h2>
      <ul>
        <li>We don't sell property, run auctions, take bids, or hold or move money.</li>
        <li>We don't offer, make, arrange, broker or negotiate financing, and we don't guarantee credit.</li>
        <li>We don't represent buyers, sellers, borrowers or lenders, and we aren't a real estate broker, mortgage broker or insurance agent.</li>
        <li>We aren't a party to any agreement you make with a seller, lender, agent, contractor or anyone else you find through this site.</li>
        <li>We don't give legal, tax, financial or investment advice, and nothing here is a title search or a guarantee of title.</li>
      </ul>

      {(['sales', 'professionals', 'financing', 'services'] as const).map((k) => (
        <section key={k}>
          <h2>{DISCLAIMERS[k].title}</h2>
          <p>{DISCLAIMERS[k].text}</p>
        </section>
      ))}

      <h2>Your due-diligence checklist</h2>
      <ol>
        <li>Confirm every sale detail (date, status, minimum bid, terms) with the official agency or trustee on the day.</li>
        <li>Order a title search, and get advice on which liens survive the sale.</li>
        <li>Inspect the property, or budget for unknown repairs if you can't.</li>
        <li>Check every professional's license yourself, using the regulator link on their profile.</li>
        <li>Compare several lenders and read every disclosure before you apply or pay any fee.</li>
        <li>Get all agreements in writing, and consider independent legal advice.</li>
        <li>Never wire money based on an email, text or phone call alone. Confirm wiring instructions by calling a number you already know is real.</li>
      </ol>

      <h2>Accuracy</h2>
      <p>
        We work hard to show only current, verified information, but sources change and errors happen. Information is provided "as is,"
        without warranties. Always rely on the official source. If you find something wrong, tell us so we can fix it.
      </p>
    </main>
  );
}
