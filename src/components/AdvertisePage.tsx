import { AD_SPOTS, spotCategories } from '../lib/adSpots';
import { analyzePlansFor, stepsFor } from '../lib/contextAds';
import { ROADMAP } from '../lib/roadmap';

const PLAN_WORD: Record<string, string> = { flip: 'fix and flip', rent: 'buy and hold', commercial: 'commercial', lien: 'lien' };
import { VERIFIED_NOTICE } from '../lib/proVerification';
import FeatureStatus from './FeatureStatus';
import PageHero from './PageHero';
import { AdPreview } from './AdBoxes';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';
import { CATEGORIES, REVERIFY_DAYS, type Category } from '../lib/pros';
import { AD_TOPICS } from '../lib/adTopics';
import { CAPS, TIER_INFO, type AdTier } from '../lib/adPlans';
import { PlanCards, useAdPlans, type AdPlansInfo } from './PlanCards';
import { useMyState } from '../lib/myState';
import { stateByCode } from '../lib/regions';
import { regulatorFor } from '../lib/regulators';
import { spotsOn } from '../lib/adSpots';
import { useAdSpots } from './AdSpot';

/** A plan's price line: the same price everywhere, or a note that it depends on the category. */
function priceLine(info: AdPlansInfo | null | 'loading', t: AdTier): string {
  if (info === 'loading') return '…';
  const labels = info?.available ? [...new Set(Object.values(info.categories).map((c) => c[t]).filter((p) => p.available).map((p) => p.amountLabel))] : [];
  if (!labels.length) return 'Coming soon';
  return labels.length === 1 ? labels[0]! : 'Price depends on your category: see it on your dashboard';
}

const GROUPS = ['Real estate', 'Financing', 'Closing & protection', 'Inspection & repairs', 'Legal & tax', 'Ownership'] as const;
/** What each group is called on the page ("Ownership" holds property managers). */
const GROUP_LABEL: Partial<Record<(typeof GROUPS)[number], string>> = { Ownership: 'Property management' };
const capitalize = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export default function AdvertisePage() {
  const spotSettings = useAdSpots();
  const mentorSpots = spotsOn(spotSettings);
  const features = useSiteFeatures();
  const open = advertisingOpen(features);
  const plans = useAdPlans();
  const [st] = useMyState();
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">For professionals · Local services</span>}
        title={<>Reach buyers at the moment <span className="grad">they need you</span></>}
        sub="People come here to learn real estate investing step by step, practice on sample deals, then analyze real listed and bank-owned homes in their county. Along the way they need agents, lenders, title and escrow, inspectors, contractors, insurance, and legal and tax help."
      >
        {!features || features.unavailable ? <FeatureStatus features={features} /> : (
          <div className="row">
            {open ? <a className="btn big hero-cta" href="#/advertise/apply">Apply to advertise</a> : <><span className="badge tone-info">Coming soon</span> <span>Applications open soon.</span></>}
          </div>
        )}
      </PageHero>

      <h2>What you get</h2>
      <section className="options-grid" aria-label="What you get">
        {[
          ['Your own profile page', 'A dedicated page with your photo or logo, services, service areas, languages and a Verified badge.'],
          ['Leads sent to you', 'Buyers send contact requests straight to your inbox. Each one agrees to share their details with you only.'],
          ['Proof it works', 'A dashboard and monthly report of profile views, phone taps, email and website clicks, and leads.'],
          ['Verified', `We check identity and required licenses or registrations. Where no state license applies, we check relevant qualifications and insurance. We re-check every ${REVERIFY_DAYS} days.`],
        ].map(([t, d]) => (
          <div key={t} className="option-card"><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <h2>What your ad looks like</h2>
      <p>A labeled ad in its own box, in the areas you choose, placed where buyers decide who to call: after “What to say” on your category’s page and, depending on your category, on Find deals, Analyze a deal or beside the next step in My plan (see “Where your category appears”). Its button opens your profile page, where buyers send you a contact request.</p>
      <AdPreview tag="Example" category="agent" state={st ?? 'NV'} name="Jordan Example" company="Example Realty" licenseId="00000 (example)" line="Helping first-time investors buy rentals and bank-owned homes in your county." />

      <p className="small muted" role="note">{VERIFIED_NOTICE}</p>

      <h2>Who can advertise</h2>
      <p>
        Professionals qualified to provide their advertised services in their selected service state. You choose your state and
        the counties you serve, and your ads show to buyers looking in that state.
        {st ? ` Each line below explains the verification checks in ${stateByCode(st)?.name}.` : ''}
      </p>
      <div className="options-grid ad-who">
        {GROUPS.map((g) => (
          <div key={g} className="option-card">
            <h3>{GROUP_LABEL[g] ?? g}</h3>
            <ul className="plain-list">
              {(Object.keys(CATEGORIES) as Category[]).filter((c) => CATEGORIES[c].group === g).map((c) => (
                <li key={c}>{open ? <a href={`#/advertise/apply/${c}`}>{CATEGORIES[c].label}</a> : CATEGORIES[c].label}{st && <span className="small muted who-reg">{capitalize(regulatorFor(c, st).name)}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>Plans</h2>
      <p>
        Monthly, per ad area. Cancel any time. You choose where buyers see your listing and ads: cities or towns, or a whole county (every city
        and community in it). Each area is billed at your plan’s monthly price, and you can add or drop areas from your dashboard. Your plan only
        adds labeled ad boxes: it never changes your place in the directory list.
      </p>
      <PlanCards
        price={(t) => { const l = priceLine(plans, t); return /\$/.test(l) ? <>{l}<span className="small muted"> per area</span></> : l; }}
        extra={(t) => open && <div className="plan-choose"><a className="btn" href="#/advertise/apply">Apply for {TIER_INFO[t].label}</a></div>}
      />

      <h2>How listing works</h2>
      <ol className="steps-rich ad-steps">
        <li><strong>Apply and confirm your email</strong><span>Takes about five minutes.</span></li>
        <li><strong>We verify you</strong><span>We check every license or registration required for your services on the official lookup. Where no state license applies, we check relevant qualifications and insurance instead. We confirm your identity through contact details we find independently before approving your ad.</span></li>
        <li><strong>Choose your areas and plan, pay by card and go live</strong><span>A monthly fee for each area, at the plan you choose, paid securely through Stripe. Cancel any time.</span></li>
        <li><strong>Track your results</strong><span>Sign in any time with a one-time email link to see your numbers and leads.</span></li>
      </ol>

      <h2>Where your category appears</h2>
      <p>Spotlight and Mentor Connect advertisers get a Featured ad on their category’s page, after “What to say”, and also show at the placements below for their kind of professional (the ones that are on today). Rotating advertisers take turns in the ad at the top of Your team.</p>
      <p>No ads appear on pages about forced sales (tax, trustee, HOA, sheriff and IRS sales) or lien certificates, or on pages for homeowners and business closures, so an ad is never placed beside owners in distress.</p>
      <div className="table-wrap"><table className="lesson-table where-cats">
        <thead><tr><th scope="col">Professional</th><th scope="col">Spotlight and Mentor Connect also show on</th></tr></thead>
        <tbody>
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const where: string[] = [];
            for (const spot of AD_SPOTS) {
              if (spot.key === 'analyze') {
                const plans = spotCategories(spotSettings, 'analyze', [c]).includes(c) ? analyzePlansFor(c) : [];
                if (plans.length) where.push(`Analyze a deal (${plans.map((p) => PLAN_WORD[p]).join(' and ')} plans; listed, bank-owned and short-sale homes)`);
              } else if (spot.key === 'toolkit') {
                const steps = spotCategories(spotSettings, 'toolkit', [c]).includes(c) ? stepsFor(c, ROADMAP) : [];
                if (steps.length) where.push(`My plan (${steps.map((st) => `“${st.title}”`).join(', ')})`);
              } else if (spotCategories(spotSettings, spot.key).includes(c)) where.push(spot.label);
            }
            if (CATEGORIES[c].financing) where.unshift('Financing page (Featured ad)');
            return <tr key={c}><th scope="row">{CATEGORIES[c].label}</th><td>{where.length ? where.join('; ') : 'Your category’s page only, for now'}</td></tr>;
          })}
        </tbody>
      </table></div>

      <h2>How placement works</h2>
      <ul className="ad-placement">
        <li><strong>Directory list: </strong>every listed professional appears in a fair rotating order, whatever plan they pay for.</li>
        <li><strong>Rotating ad: </strong>Rotating advertisers of every kind in the visitor’s area take turns in one ad box at the top of the Your team page; one is chosen at random on each page view. Spotlight and Mentor Connect do not take part.</li>
        <li><strong>Limited spots: </strong>up to {CAPS.listing} advertisers per category and {CAPS.featured} Featured ad spots per category in each city, so ads stay useful.</li>
        <li><strong>Featured ads (Spotlight): </strong>a separate, labeled Featured ad on your category’s page for your city or county, above the list. Every eligible fixed advertiser in the visitor’s selected area shows on each page view; neither selection nor order rotates. Fixed ads also appear at site placements that match your category and area{mentorSpots.length ? <> (now: {mentorSpots.map((s) => s.label).join(', ')})</> : null}.</li>
        <li><strong>Counties and cities: </strong>a whole county takes one spot in each of its cities, so county and city advertisers share the same spots: no one gets a city to themselves. An advertiser appears once in a box, however many of its areas cover the visitor. Where no one has bought a spot, your category’s page, Your team, Find deals and the next step in My plan show an “Advertise here” box, and the Financing page invites professionals to apply; other pages show nothing.</li>
        <li><strong>Topic ads: </strong>they appear beside {AD_TOPICS.map((t) => t.label.toLowerCase()).join(', ')} topics. Agents, lenders, title and escrow companies and attorneys share up to {CAPS.topicSettlement} spots per topic, shown together without rotation. Other kinds of professionals get {CAPS.topicOther} spot per topic, shown every time.</li>
        <li><strong>Mentor Connect: </strong>everything in Spotlight, plus an optional fixed ad beside one Learn or Practice topic you choose.</li>
        <li><strong>What we don’t do: </strong>every ad is labeled as paid. We don’t rank professionals, charge per lead or per closing, or take a share of any transaction, and we aren’t a party to any agreement between you and a buyer.</li>
      </ul>
      <p className="small muted">Already listed? <a href="#/advertiser">Sign in to your dashboard&nbsp;→</a></p>
    </main>
  );
}
