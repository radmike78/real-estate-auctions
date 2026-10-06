import PageHero from './PageHero';
import { useLastActivity } from '../lib/journey';
import { showFor, useMyState } from '../lib/myState';
import ScriptBox from './ScriptBox';
import StatePicker from './StatePicker';
import ByState from './ByState';
import { DEADLINES, HELP, SCAMS, TENANTS } from '../lib/states/homeownerHelp';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Claiming surplus after a tax or trustee's sale, by state. Each line names its state so visitors see only theirs. */
const SURPLUS: { text: string; link?: { label: string; url: string } }[] = [
  { text: 'In Nevada, after a tax sale, the county first pays the taxes and costs and keeps $300 plus 10% of the next $10,000. Lienholders on record are paid next. You can claim the rest by filing a written claim with the county treasurer within 1 year after the treasurer’s deed is recorded. After that, unclaimed money goes to the county. Anyone who helps you can charge at most 10%, and the agreement has to be written and signed (NRS 361.610).', link: { label: 'Clark County Treasurer', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs' } },
  { text: 'In Nevada, after a trustee’s sale, money left after paying the loan and junior liens goes to the former owner (NRS 40.462). If someone offers to find it for you, their agreement must be written, signed and notarized, and it can’t be made until 30 days after the sale. A fee over $2,500 is presumed unreasonable (NRS 40.463).', link: { label: 'NRS chapter 40', url: 'https://www.leg.state.nv.us/NRS/NRS-040.html' } },
  { text: 'In California, after a tax sale, file a claim with the county within 1 year after the tax collector’s deed is recorded. Anyone who offers to claim it for you must show that you were told the amount, and that you can claim it yourself from the county at no cost (Revenue and Taxation Code 4675).', link: { label: 'Revenue and Taxation Code 4675', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=4675' } },
  { text: 'In California, after a trustee’s sale, the trustee must send notice of any surplus within 30 days after the trustee’s deed. It pays junior lienholders first, then the former owner (Civil Code 2924j and 2924k). Anyone paid to help you get this money counts as a foreclosure consultant under state law (Civil Code 2945.1).', link: { label: 'Civil Code 2924k', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924k' } },
  { text: 'In Arizona, a tax lien holder can sue to end your right to pay off the lien and keep the property (your right to redeem). Before the judgment, you can ask the court for an excess proceeds sale. If the court orders one, money left after costs and liens goes to you (ARS 42-18204 and 42-18236). If no one asks, the court orders a deed to the lien holder.', link: { label: 'ARS 42-18204', url: 'https://www.azleg.gov/ars/42/18204.htm' } },
  { text: 'In Arizona, after a trustee’s sale, the trustee can deposit the surplus with the county treasurer, and you apply to the superior court for it. Money left unclaimed for 2 years is presumed abandoned. A finder’s agreement made within 30 days after the sale is void, and a fee over $2,500 is presumed unreasonable (ARS 33-812).', link: { label: 'ARS 33-812', url: 'https://www.azleg.gov/ars/33/00812.htm' } },
  { text: 'In Utah, state law treats money left over after a tax sale as unclaimed property (Utah Code 59-2-1351.1(7)), but counties set the claim steps. In Utah County, you petition the district court within 90 days after the county ratifies (approves) the sale; after that, the money goes to the State Treasurer’s unclaimed property office (Utah County Ordinance 3.04.150). Ask your county auditor or treasurer.', link: { label: 'Utah County: excess funds', url: 'https://auditor.utahcounty.gov/may-tax-sale/excess-funds' } },
  { text: 'In Utah, after a trustee’s sale, the trustee pays sale costs and the loan first, and the rest goes to whoever is legally entitled to it, such as junior lienholders and then you. The trustee may instead deposit it with the district court clerk, who must notify the people on the trustee’s list within 15 days; you claim it by filing a petition with a $50 fee (Utah Code 57-1-29). You can also search for unclaimed money on the State Treasurer’s site.', link: { label: 'Utah unclaimed property', url: 'https://mycash.utah.gov/' } },
];

/** For owners and tenants facing foreclosure. The site never shares their details or helps anyone contact them. */
export default function HomeownerHelpPage() {
  const [state] = useMyState();
  useLastActivity('#/homeowner-help', 'Facing foreclosure? Free help');
  return (
    <main className="page prose">
      <PageHero
        eyebrow={<span className="eyebrow">Free help · NV, CA, AZ, UT, TX</span>}
        title={<>Facing foreclosure? <span className="grad">Get free help.</span></>}
        sub="If you’re behind on your mortgage, HOA dues or property taxes, you likely have more options than scammers want you to think. Some deadlines are short, so act now."
      />

      <p className="page-starter">This page covers Nevada, California, Arizona, Utah and Texas: free help, the deadlines in your state, scams to watch for, tenants’ rights, and how to claim money left over after a sale. Pick your state to see only its rules.</p>
      <p className="page-starter"><a className="btn" href="https://answers.hud.gov/housingcounseling/" {...ext}>Find a free HUD-approved housing counselor ↗</a> <span className="muted">The best first call, in any state.</span></p>
      <StatePicker label="Where is the home?" />

      <section>
        <h2>Free, trustworthy help: start here</h2>
        <ul className="help-links">
          <li><strong>HUD-approved housing counselors, in every state.</strong> Free advice on your options. <a href="https://answers.hud.gov/housingcounseling/" {...ext}>Find a counselor (HUD) ↗</a> · <a href="https://www.consumerfinance.gov/find-a-housing-counselor/" {...ext}>CFPB counselor search ↗</a></li>
        </ul>
        <ByState lines={HELP} />
      </section>

      <section>
        <h2>Deadlines in your state: act early, while you have the most options</h2>
        <ByState lines={DEADLINES} />
        <p>In every state, call your lender or servicer early and keep notes of every call.</p>
      </section>

      <section>
        <h2>What to have ready, and what to say</h2>
        <div className="roadmap-cols">
          <div>
            <h3>Gather these before you call</h3>
            <ul>
              <li>Your latest mortgage statement, with your loan number</li>
              <li>Any notice you’ve received, such as a notice of default</li>
              <li>Proof of income: recent pay stubs, benefits letters or tax returns</li>
              <li>A list of your monthly bills</li>
              <li>A short hardship letter: what happened, when, and what you can pay now</li>
            </ul>
          </div>
          <ScriptBox to="Your loan servicer (the number on your statement)" script="“I’m behind on my loan, number [number]. What options do I have, such as a repayment plan, a modification or a short sale? What documents do you need from me, and what are the deadlines? Please confirm what we agree in writing.”" note="Write down the date, the person’s name and what they said on every call. A housing counselor can make this call with you." />
        </div>
      </section>

      <section>
        <h2>Watch out for foreclosure scams</h2>
        <ul>
          <li>Never pay upfront fees to someone promising to “save” your home. Counselors above are free.</li>
          <li>Never sign over your deed or sign papers you don’t understand.</li>
          <li>Be wary of anyone who contacts you because they saw your home in public records.</li>
        </ul>
        <ByState lines={SCAMS} />
      </section>

      <section>
        <h2>Renting a home that’s in foreclosure?</h2>
        <p>If the home you rent is sold at a mortgage (trustee) foreclosure, you still have rights. As a bona fide tenant, you get at least 90 days’ written notice before you can be asked to leave, and you can stay to the end of your lease unless the new owner will live in the home (federal Protecting Tenants at Foreclosure Act). Keep paying rent as your lease requires, and ask a legal aid office about your rights.</p>
        <ByState lines={TENANTS} />
      </section>

      <section>
        <h2>If your home was sold: claim any money left over</h2>
        <p>If your home sold at a tax sale or a foreclosure (trustee’s) sale for more than what was owed, the extra money, called surplus or excess proceeds, goes, in most cases, to lienholders in order of priority and then to you. You can claim it yourself, for free. In 2023 the U.S. Supreme Court ruled that when a county keeps more than the tax debt, it takes property without just compensation (<a href="https://www.law.cornell.edu/supremecourt/text/22-166" {...ext}>Tyler v. Hennepin County ↗</a>).</p>
        <p><strong>Be careful with “finders.”</strong> People who find your name in sale records may offer to get the money for a share of it. Ask the county treasurer or the trustee first: you can claim directly at no cost. Read any agreement before you sign, and never sign one you don’t understand.</p>
        <ul>
          {SURPLUS.filter((x) => showFor(state, x.text)).map((x) => (
            <li key={x.text}>{x.text} {x.link && <a href={x.link.url} {...ext}>{x.link.label} ↗</a>}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>How this site treats homeowners</h2>
        <p>DeedOwl never contacts homeowners, before or after a sale, and never helps anyone else contact them, including about surplus money. We don’t show owner names for homes that aren’t for sale, and we tell every visitor not to contact homeowners in foreclosure. If someone contacts you and says they’re from DeedOwl, it isn’t us.</p>
      </section>
    </main>
  );
}
