import PageHero from './PageHero';
import { advertisingOpen, useSiteFeatures } from '../lib/siteFeatures';
import { CATEGORIES, REVERIFY_DAYS, type Category } from '../lib/pros';
import { AD_TOPICS } from '../lib/adTopics';
import { CAPS, type AdTier } from '../lib/adPlans';
import { PlanCards, useAdPlans, type AdPlansInfo } from './PlanCards';
import { useMyState } from '../lib/myState';
import { STATES, stateByCode } from '../lib/regions';
import { regulatorFor } from '../lib/regulators';
import { spotsOn } from '../lib/adSpots';
import { useAdSpots } from './AdSpot';

/** A plan's price line: the same price everywhere, or a note that it depends on the category. */
function priceLine(info: AdPlansInfo | null | 'loading', t: AdTier): string {
  if (info === 'loading') return '…';
  const labels = info?.available ? [...new Set(Object.values(info.categories).map((c) => c[t]).filter((p) => p.available).map((p) => p.amountLabel))] : [];
  if (!labels.length) return 'Pricing is shown when advertising opens';
  return labels.length === 1 ? labels[0]! : 'Price depends on your category: see it on your dashboard';
}

const GROUPS = ['Real estate', 'Financing', 'Closing & protection', 'Inspection & repairs', 'Legal & tax', 'Ownership'] as const;

export default function AdvertisePage() {
  const mentorSpots = spotsOn(useAdSpots());
  const features = useSiteFeatures();
  const open = advertisingOpen(features);
  const plans = useAdPlans();
  const [st] = useMyState();
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">For professionals · {STATES.map((s) => s.name).join(', ').replace(/, (?=[^,]*$)/, ' and ')}</span>}
        title={<>Reach buyers at the moment <span className="grad">they need you</span></>}
        sub="People come here to buy auction, bank-owned and short-sale properties. They need agents, financing, title, insurance, inspectors, repairs, and legal and tax help."
      >
        {features && (
          <div className="row">
            {open ? <a className="btn big hero-cta" href="#/advertise/apply">Apply to advertise</a> : <><span className="badge tone-info">Coming soon</span> <span>Applications open soon.</span></>}
          </div>
        )}
      </PageHero>

      <section className="options-grid" aria-label="What you get">
        {[
          ['Your own profile page', 'A dedicated page with your photo or logo, services, service areas, languages and a license-checked badge.'],
          ['Leads sent to you', 'Buyers send contact requests straight to your inbox. Each one agrees to share their details with you only.'],
          ['Proof it works', 'A dashboard and monthly report of profile views, phone taps, email and website clicks, and leads.'],
          ['A license-checked badge', `We check every license on the official regulator or NMLS lookup and re-check it every ${REVERIFY_DAYS} days. It isn’t a recommendation.`],
        ].map(([t, d]) => (
          <div key={t} className="option-card"><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <h2>Who can advertise</h2>
      <p>
        Professionals licensed or registered to work in {STATES.map((s) => s.name).join(', ').replace(/, (?=[^,]*$)/, ' or ')}. You choose your state and
        the counties you serve, and your ads show to buyers looking in that state.
        {st ? ` Each line below names where we check a ${stateByCode(st)?.name} license.` : ''}
      </p>
      <div className="options-grid">
        {GROUPS.map((g) => (
          <div key={g} className="option-card">
            <h3>{g}</h3>
            <ul className="plain-list">
              {(Object.keys(CATEGORIES) as Category[]).filter((c) => CATEGORIES[c].group === g).map((c) => (
                <li key={c}>{open ? <a href={`#/advertise/apply/${c}`}>{CATEGORIES[c].label}</a> : CATEGORIES[c].label}{st && <span className="small muted who-reg">{regulatorFor(c, st).name}</span>}</li>
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
      <PlanCards price={(t) => { const l = priceLine(plans, t); return /\$/.test(l) ? <>{l}<span className="small muted"> per area</span></> : l; }} />
      <p className="small muted">
        Spots are limited in each city so ads stay useful: up to {CAPS.listing} advertisers per category and {CAPS.featured} Featured ad spots per
        category. When a visitor has chosen a city, every Featured advertiser for that city shows together on each page view; they don’t rotate,
        only their order is shuffled. A whole county takes one spot in each of its cities, so county and city advertisers share the same spots:
        no one gets a city to themselves. An advertiser appears once in a box, however many of its areas cover the visitor, and a spot no one has
        bought shows an “Advertisement space” box. Topic ads appear beside {AD_TOPICS.map((t) => t.label.toLowerCase()).join(', ')} topics.
        Agents, lenders, title and escrow companies and attorneys share up to {CAPS.topicSettlement} spots per topic, shown one at a time in turn.
        Other kinds of professionals get {CAPS.topicOther} spot per topic, shown every time.
      </p>

      <h2>How listing works</h2>
      <ol className="steps-rich">
        <li><strong>Apply and confirm your email.</strong><span>Takes about five minutes.</span></li>
        <li><strong>We verify you.</strong><span>We check your license on the official regulator lookup (where your state has no license for your work, such as Texas general contractors, we check your trade licenses and insurance instead), and confirm your identity through contact details we find independently.</span></li>
        <li><strong>Choose your areas and plan, pay by card and go live.</strong><span>A monthly fee for each area, at the plan you choose, paid securely through Stripe. Cancel any time.</span></li>
        <li><strong>Track your results.</strong><span>Sign in any time with a one-time email link to see your numbers and leads.</span></li>
      </ol>

      <div className="notice small" role="note">
        <strong>How placement works.</strong> Every listed professional appears in the directory list in a fair rotating order, whatever plan
        they pay for, and every plan takes turns in the rotating ad at the top of the Your Team page. Spotlight adds a separate, labeled Featured ad on your
        category’s page for your city or county, above the list. It holds up to {CAPS.featured} per category in each city, so it doesn’t rotate. Mentor Connect also adds labeled
        ads where people may want more help: beside one Learn or Practice topic you choose, and in the Mentor Connect ad spots
        {mentorSpots.length ? <> (now: {mentorSpots.map((s) => s.label).join(', ')})</> : null}. Every ad is labeled as paid. We don’t rank professionals, charge per lead or per
        closing, or take a share of any transaction, and we aren’t a party to any agreement between you and a buyer.
      </div>
      <p className="small muted">Already listed? <a href="#/advertiser">Sign in to your dashboard →</a></p>
    </main>
  );
}
