import PageHero from './PageHero';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** For owners and tenants facing foreclosure. The site never shares their details or helps anyone contact them. */
export default function HomeownerHelpPage() {
  return (
    <main className="page prose">
      <PageHero
        eyebrow={<span className="eyebrow">Free help · Nevada</span>}
        title={<>Facing foreclosure? <span className="grad">Get free help.</span></>}
        sub="If you’re behind on your mortgage, HOA dues or property taxes, you have more options and more time than scammers want you to think."
      />

      <section>
        <h2>First: you have time and options</h2>
        <ul>
          <li>In Nevada, at least 3 months must pass after a notice of default is recorded before a notice of sale can follow, and the sale notice must be published for 3 weeks.</li>
          <li>If you live in the home, you can generally catch up (reinstate) until 5 days before the sale (NRS 107.0805), work out a modification or repayment plan, sell (including a short sale), or get legal help to review your case.</li>
          <li>Call your lender or servicer early and keep notes of every call.</li>
        </ul>
      </section>

      <section>
        <h2>Free, trustworthy help</h2>
        <ul className="help-links">
          <li><strong>Foreclosure Mediation Program (Nevada courts).</strong> If you live in the home, you can petition the district court for mediation with your lender within 30 days after the notice of default is served (NRS 107.086). There is a $25 filing fee plus your half of the mediation fee; the law caps the total mediation fee at $500. In Clark County it is run by the Eighth Judicial District Court. <a href="https://www.clarkcountycourts.us/departments/adr/foreclosure-mediation/" {...ext}>Foreclosure mediation (Clark County courts) ↗</a></li>
          <li><strong>HUD-approved housing counselors.</strong> Free advice on your options. <a href="https://answers.hud.gov/housingcounseling/" {...ext}>Find a counselor (HUD) ↗</a> · <a href="https://www.consumerfinance.gov/find-a-housing-counselor/" {...ext}>CFPB counselor search ↗</a></li>
          <li><strong>Free legal help.</strong> <a href="https://www.lacsn.org/" {...ext}>Legal Aid Center of Southern Nevada ↗</a> · <a href="https://nevadalegalservices.org/" {...ext}>Nevada Legal Services ↗</a> · <a href="https://www.civillawselfhelpcenter.org/" {...ext}>Civil Law Self-Help Center ↗</a></li>
        </ul>
      </section>

      <section>
        <h2>Watch out for foreclosure scams</h2>
        <ul>
          <li>Never pay upfront fees to someone promising to “save” your home. Counselors above are free.</li>
          <li>Never sign over your deed or sign papers you don’t understand. Nevada licenses foreclosure consultants, and buyers who use fraud or deceit on owners in foreclosure face criminal penalties (NRS 645F). If a buyer used fraud or deceit, you can cancel the sale within 2 years.</li>
          <li>Be wary of anyone who contacts you because they saw your home in public records.</li>
          <li>Report scams to the <a href="https://ag.nv.gov/" {...ext}>Nevada Attorney General ↗</a>.</li>
        </ul>
      </section>

      <section>
        <h2>Renting a home that’s in foreclosure?</h2>
        <p>If the home you rent is sold at a mortgage (trustee) foreclosure, federal law (the Protecting Tenants at Foreclosure Act) gives a bona fide tenant at least 90 days’ written notice before you can be asked to leave, and lets you stay to the end of your lease unless the new owner will live in the home. For homes with up to 4 units, Nevada also requires a notice of the change of ownership (NRS 40.255). Keep paying rent as your lease requires and ask a legal aid office about your rights.</p>
      </section>

      <section>
        <h2>If your home was sold at a county tax sale</h2>
        <p>If it sold for more than the taxes and costs owed, you may be able to claim the extra (excess proceeds). File a written claim with the Treasurer within 1 year after the Treasurer’s deed is recorded; after that the money goes to the county (NRS 361.610). You don’t need to pay anyone to claim it, and by law anyone who helps can charge at most 10%. See the <a href="https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs" {...ext}>Clark County Treasurer ↗</a>.</p>
      </section>

      <section>
        <h2>How this site treats homeowners</h2>
        <p>We don’t show owner names for homes that aren’t for sale, and we tell every visitor not to contact homeowners in foreclosure. If someone contacts you and mentions this site, please tell us.</p>
      </section>
    </main>
  );
}
