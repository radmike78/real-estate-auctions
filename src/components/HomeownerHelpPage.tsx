import PageHero from './PageHero';
import { showFor, useMyState } from '../lib/myState';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Claiming surplus after a tax or trustee's sale, by state. Each line names its state so visitors see only theirs. */
const SURPLUS: { text: string; link?: { label: string; url: string } }[] = [
  { text: 'In Nevada, after a tax sale: file a written claim with the county treasurer within 1 year after the treasurer’s deed is recorded; after that the money goes to the county. The county first keeps $300 plus 10% of the next $10,000. Anyone who helps you can charge at most 10%, under a written, signed agreement (NRS 361.610).', link: { label: 'Clark County Treasurer', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs' } },
  { text: 'In Nevada, after a trustee’s sale: money left after the loan and junior liens goes to the former owner (NRS 40.462). A finder’s agreement must be written, signed and notarized, can’t be made until 30 days after the sale, and a fee over $2,500 is presumed unreasonable (NRS 40.463).', link: { label: 'NRS chapter 40', url: 'https://www.leg.state.nv.us/NRS/NRS-040.html' } },
  { text: 'In California, after a tax sale: file a claim with the county within 1 year after the tax collector’s deed is recorded. Anyone who offers to claim for you must show that you were told the amount and that you can claim directly with the county at no cost (Revenue and Taxation Code 4675).', link: { label: 'Revenue and Taxation Code 4675', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=4675' } },
  { text: 'In California, after a trustee’s sale: the trustee must send notice of any surplus within 30 days after the trustee’s deed, and pays junior lienholders and then the former owner (Civil Code 2924j and 2924k). Someone paid to help you get this money counts as a foreclosure consultant under state law (Civil Code 2945.1).', link: { label: 'Civil Code 2924k', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924k' } },
  { text: 'In Arizona, if a tax lien holder sues to foreclose your right to redeem: before the judgment, you can ask the court for an excess proceeds sale. If the court orders one, money left after costs and liens goes to you (ARS 42-18204 and 42-18236). If no one asks, the court orders a deed to the lien holder.', link: { label: 'ARS 42-18204', url: 'https://www.azleg.gov/ars/42/18204.htm' } },
  { text: 'In Arizona, after a trustee’s sale: the trustee can deposit the surplus with the county treasurer, and you apply to the superior court for it; money left for 2 years is presumed abandoned. A finder’s agreement made within 30 days after the sale is void, and a fee over $2,500 is presumed unreasonable (ARS 33-812).', link: { label: 'ARS 33-812', url: 'https://www.azleg.gov/ars/33/00812.htm' } },
  { text: 'In Utah, after a tax sale, the steps depend on the county. In Utah County, you petition the district court within 90 days after the county ratifies the sale; after that, the money goes to the State Treasurer’s unclaimed property office. Ask your county auditor or treasurer.', link: { label: 'Utah County: excess funds', url: 'https://auditor.utahcounty.gov/may-tax-sale/excess-funds' } },
  { text: 'In Utah, after a trustee’s sale, ask the trustee named on the notice of sale about any surplus. Unclaimed money can be searched at the State Treasurer’s site.', link: { label: 'Utah unclaimed property', url: 'https://mycash.utah.gov/' } },
];

/** For owners and tenants facing foreclosure. The site never shares their details or helps anyone contact them. */
export default function HomeownerHelpPage() {
  const [state] = useMyState();
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
        <h2>If your home was sold: claim any money left over</h2>
        <p>If your home sold at a tax sale or a foreclosure (trustee’s) sale for more than what was owed, the extra money, called surplus or excess proceeds, goes to lienholders in order of priority and then to you. You can claim it yourself, for free. In 2023 the U.S. Supreme Court held that a county that keeps more than the tax debt takes property without just compensation (<a href="https://www.law.cornell.edu/supremecourt/text/22-166" {...ext}>Tyler v. Hennepin County ↗</a>).</p>
        <p><strong>Be careful with “finders.”</strong> People who find your name in sale records may offer to get the money for a share of it. Ask the county treasurer or the trustee first: you can claim directly at no cost. Read any agreement before you sign, and never sign one you don’t understand.</p>
        <ul>
          {SURPLUS.filter((x) => showFor(state, x.text)).map((x) => (
            <li key={x.text}>{x.text} {x.link && <a href={x.link.url} {...ext}>{x.link.label} ↗</a>}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>How this site treats homeowners</h2>
        <p>We don’t show owner names for homes that aren’t for sale, and we tell every visitor not to contact homeowners in foreclosure. If someone contacts you and mentions this site, please tell us.</p>
      </section>
    </main>
  );
}
