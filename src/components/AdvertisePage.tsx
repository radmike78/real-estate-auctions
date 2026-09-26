import PageHero from './PageHero';
import { CATEGORIES, REVERIFY_DAYS, type Category } from '../lib/pros';

const GROUPS = ['Real estate', 'Financing', 'Closing & protection', 'Repairs & renovation'] as const;

export default function AdvertisePage() {
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">For professionals</span>}
        title={<>Reach buyers at the moment <span className="grad">they need you</span></>}
        sub="People come here to buy auction, bank-owned and short-sale properties. They need agents, financing, title, insurance and repairs."
      >
        <div>
          <a className="btn big hero-cta" href="#/advertise/apply">Apply to advertise</a>
        </div>
      </PageHero>

      <section className="options-grid" aria-label="What you get">
        {[
          ['Your own profile page', 'A dedicated page with your services, service areas, languages and a license-checked badge.'],
          ['Leads sent to you', 'Buyers send contact requests straight to your inbox. Each one agrees to share their details with you only.'],
          ['Proof it works', 'A dashboard and monthly report of profile views, phone taps, email and website clicks, and leads.'],
          ['A license-checked badge', `We check every license on the official regulator or NMLS lookup and re-check it every ${REVERIFY_DAYS} days. It isn’t a recommendation.`],
        ].map(([t, d]) => (
          <div key={t} className="option-card"><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <h2>Who can advertise</h2>
      <div className="options-grid">
        {GROUPS.map((g) => (
          <div key={g} className="option-card">
            <h3>{g}</h3>
            <ul className="plain-list">
              {(Object.keys(CATEGORIES) as Category[]).filter((c) => CATEGORIES[c].group === g).map((c) => (
                <li key={c}><a href={`#/advertise/apply/${c}`}>{CATEGORIES[c].label}</a> <span className="small muted">({CATEGORIES[c].regulator})</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>How listing works</h2>
      <ol className="steps-rich">
        <li><strong>Apply and confirm your email.</strong><span>Takes about five minutes.</span></li>
        <li><strong>We verify you.</strong><span>We check your license on the official regulator lookup, and confirm your identity through contact details we find independently.</span></li>
        <li><strong>Pay by card and go live.</strong><span>A flat monthly fee, the same for everyone in your category, paid securely through Stripe. Cancel any time.</span></li>
        <li><strong>Go live and track results.</strong><span>Sign in any time with a one-time email link to see your numbers and leads.</span></li>
      </ol>

      <div className="notice small" role="note">
        <strong>Fair placement.</strong> Results are filtered by what the buyer needs and shown in a rotating order. No one can pay for a higher
        position. Your profile is labeled as an advertisement. Every advertiser in a category pays the same flat monthly fee. We don't charge per lead or per closing, or take a share of any transaction, and we aren't
        a party to any agreement between you and a buyer.
      </div>
      <p className="small muted">Already listed? <a href="#/advertiser">Sign in to your dashboard →</a></p>
    </main>
  );
}
