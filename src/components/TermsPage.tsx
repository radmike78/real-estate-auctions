import DrillDown, { type DrillSection } from './DrillDown';
import LegalDraftNotice from './LegalDraftNotice';
import PageHero from './PageHero';
import { IconBadge, IconBank, IconCheckList, IconFile, IconFlag, IconHelp, IconHome, IconLayers, IconShield, IconStop } from './Icons';
import { SITE_INFO, TERMS_EFFECTIVE } from '../lib/siteInfo';
import { fmtDate } from '../lib/status';

const S = SITE_INFO;
const mail = (addr: string) => (/^\[/.test(addr) ? <strong>{addr}</strong> : <a href={`mailto:${addr}`}>{addr}</a>);

const SECTIONS: DrillSection[] = [
  {
    key: 'agreement',
    title: 'Using the site means you agree',
    icon: <IconFile />,
    summary: 'These terms apply to everyone. You must be 18 or older',
    content: () => (
      <>
        <p>
          {S.siteName} is run by {S.operatorName} ("we"). By using the site you agree to these Terms and to our{' '}
          <a href="#/privacy">Privacy Policy</a>. If you don't agree, please don't use the site.
        </p>
        <p>You must be at least 18 years old. Professionals who advertise also agree to the Advertiser terms below.</p>
      </>
    ),
  },
  {
    key: 'what-we-are',
    title: 'What this site is, and isn’t',
    icon: <IconShield />,
    tone: 'go',
    summary: 'A free information service. Not a broker, lender, auctioneer or advisor',
    content: () => (
      <>
        <p>
          We gather public information about properties heading to a forced sale, explain how those sales work, provide free tools, and list
          professionals who advertise here. Using the site is free.
        </p>
        <p>
          We don't sell property, run auctions, take bids or hold money. We aren't a real estate broker, lender, mortgage broker, insurance agent,
          attorney or financial advisor, and we don't represent you. Nothing on the site is legal, tax, financial or investment advice, a title
          search, or a guarantee of title. See <a href="#/disclaimer">How we help</a>.
        </p>
      </>
    ),
  },
  {
    key: 'accuracy',
    title: 'Information can be wrong or out of date',
    icon: <IconFlag />,
    tone: 'wait',
    summary: 'Always confirm with the official source before you bid, buy or borrow',
    content: () => (
      <ul>
        <li>We make every effort to pull information from government and other official sources, but we don't guarantee it.</li>
        <li>Public records can be incomplete, late or wrong. Sales are often postponed, cancelled or paid off at the last minute.</li>
        <li>Values, equity, lien estimates, the maximum bid calculator and playbooks are estimates and general information, not promises.</li>
        <li>Pages marked as sample data use fictional properties to show how the site works.</li>
        <li>
          You're responsible for your own due diligence: confirm every detail with the official agency, trustee or seller, and get your own title,
          legal, tax, real estate, financial and inspection advice from qualified professionals.
        </li>
        <li>We may change, pause or remove any part of the site at any time.</li>
      </ul>
    ),
  },
  {
    key: 'rules',
    title: 'Rules for using the site',
    icon: <IconStop />,
    tone: 'stop',
    summary: 'Use it lawfully, leave homeowners in foreclosure alone, no scraping or abuse',
    content: () => (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            use the site to contact, solicit, pressure or harass homeowners in foreclosure or pre-foreclosure, or for any unfair or deceptive
            practice toward them (Nevada regulates this under NRS 645F);
          </li>
          <li>break any law, or use the site for fraud, spam or impersonation;</li>
          <li>send false information, or send messages to professionals that you don't mean in good faith;</li>
          <li>copy, scrape or harvest the site or its data with bots or other automated tools, or resell it;</li>
          <li>try to get around security, overload the site, or access parts of it you aren't authorized to use;</li>
          <li>alter, forge or republish our signed listings or directory as if they were ours.</li>
        </ul>
        <p>We may block or remove anyone who breaks these rules.</p>
      </>
    ),
  },
  {
    key: 'professionals',
    title: 'Contacting professionals',
    icon: <IconBadge />,
    summary: 'Listings are paid advertising, not recommendations. Agreements are between you and them',
    content: () => (
      <>
        <p>
          Professionals listed here pay to advertise. A listing isn't a recommendation or endorsement, and placement is equal and rotating, so no
          one can pay for a higher spot. We check each license with the state or federal regulator, but you should confirm it yourself before
          hiring anyone.
        </p>
        <p>
          When you use a contact form, your details go only to the professional you chose. Any agreement, fee, loan or service is strictly between
          you and them. We aren't a party to it, we receive nothing from any deal you make, and we aren't responsible for their work.
        </p>
      </>
    ),
  },
  {
    key: 'advertisers',
    title: 'Advertiser terms',
    icon: <IconBank />,
    summary: 'For listed professionals: eligibility, billing, cancelling, leads and removal',
    content: () => (
      <>
        <h3>Eligibility and your listing</h3>
        <ul>
          <li>You must hold an active license or registration for the services you list, and be authorized to advertise for the company named.</li>
          <li>We verify your license and identity before listing you, and re-check at least every 90 days. Your listing shows only while it's verified and paid.</li>
          <li>Keep your profile accurate. Tell us promptly if your license, company or contact details change.</li>
          <li>
            You're responsible for your listing and for following every law and rule that applies to your services and advertising, including your
            regulator's advertising rules and consumer-contact laws.
          </li>
          <li>You give us permission to display your profile content on the site and in our signed directory while you're listed.</li>
        </ul>
        <h3>Fees and billing</h3>
        <ul>
          <li>Listings are a flat monthly fee, the same for everyone in a category. The current fee is shown before you pay.</li>
          <li>
            Card payments are handled by our payment processor, Stripe. Plans renew monthly until you cancel. You can cancel at any time from your
            dashboard; your listing stays live through the period you've paid for.
          </li>
          <li>Fees already paid aren't refunded for partial months, except where the law requires.</li>
          <li>If a payment fails, your listing comes down when the paid period (plus a short grace period) ends.</li>
          <li>We'll give active advertisers at least 30 days' notice by email before a fee increase.</li>
        </ul>
        <h3>Leads</h3>
        <ul>
          <li>Use a buyer's contact details only to respond to that buyer's request.</li>
          <li>Don't sell or share leads, and don't add buyers to marketing lists without their separate permission.</li>
          <li>Follow the laws that apply to contacting consumers, including telemarketing, text-message and email rules.</li>
        </ul>
        <h3>Removal</h3>
        <p>
          We may decline an application, or suspend or remove a listing, if a license lapses or can't be verified, information is false, fees go
          unpaid, we receive credible complaints, or these Terms are broken. If we remove a listing because we've stopped the service, we'll
          refund the unused part of the current month.
        </p>
      </>
    ),
  },
  {
    key: 'ownership',
    title: 'Our content and other websites',
    icon: <IconLayers />,
    summary: 'You may use the site for your own research. Linked sites have their own terms',
    content: () => (
      <>
        <p>
          The site's design, text, tools, playbooks and software belong to us or our licensors. You may use them for your own research, including
          for your own investing. Don't copy or resell the site or its data. Public records stay public; our compilation and presentation of them is ours.
        </p>
        <p>
          We link to government agencies, regulators, payment and map services, and professionals' websites. We don't control those sites and
          aren't responsible for them.
        </p>
      </>
    ),
  },
  {
    key: 'liability',
    title: 'Disclaimers and limits on liability',
    icon: <IconCheckList />,
    summary: 'The site is provided "as is". Our liability is limited as far as the law allows',
    content: () => (
      <>
        <p>
          The site and everything on it are provided "as is" and "as available", without warranties of any kind, including accuracy, fitness for a
          particular purpose, and non-infringement, to the fullest extent the law allows.
        </p>
        <p>
          To the fullest extent the law allows, we aren't liable for any indirect, incidental, special, consequential or punitive damages, or for
          lost profits, lost opportunities or losses from any property purchase, bid, loan or service, even if we were told they were possible.
          Our total liability for any claim relating to the site is limited to the greater of the amount you paid us in the 12 months before the
          claim, or $100.
        </p>
        <p>
          You agree to cover our reasonable costs, including legal fees, from claims caused by your misuse of the site or by your breaking these
          Terms or the law.
        </p>
      </>
    ),
  },
  {
    key: 'legal',
    title: 'Governing law and disputes',
    icon: <IconHome />,
    summary: `${S.governingLaw} law. Disputes are heard in ${S.venue}`,
    content: () => (
      <>
        <p>
          These Terms are governed by the laws of the State of {S.governingLaw}, without regard to conflict-of-law rules. Any dispute is heard in
          the state or federal courts located in {S.venue}, and you and we agree to those courts' jurisdiction.
        </p>
        <p>
          If part of these Terms can't be enforced, the rest still applies. Not enforcing a term isn't a waiver of it. These Terms and the Privacy
          Policy are the whole agreement between you and us about the site. You may not transfer your rights under them; we may transfer ours
          if the site is sold or merged.
        </p>
      </>
    ),
  },
  {
    key: 'changes',
    title: 'Changes and contact',
    icon: <IconHelp />,
    summary: `Effective ${fmtDate(TERMS_EFFECTIVE)}. How we announce changes and how to reach us`,
    content: () => (
      <>
        <p>
          We may update these Terms. The effective date at the top shows the current version. For a material change, we'll post a notice on the
          site at least 30 days before it takes effect and email active advertisers. Using the site after that means you accept the new Terms.
        </p>
        <p>
          Questions: {mail(S.contactEmail)}, or by mail at {S.operatorName}, {S.mailingAddress}.
        </p>
      </>
    ),
  },
];

export default function TermsPage({ section }: { section?: string }) {
  const open = section === 'all' || SECTIONS.some((x) => x.key === section);
  return (
    <main className="page">
      <PageHero
        compact={open}
        top={open ? <a href="#/terms">← Terms of use</a> : undefined}
        eyebrow={<span className="eyebrow">Effective {fmtDate(TERMS_EFFECTIVE)}</span>}
        title={open ? <a className="title-link" href="#/terms">Terms of use</a> : <>Terms of <span className="grad">use</span></>}
        sub={open ? undefined : 'The rules for using the site, what we are and aren’t responsible for, and the terms for advertisers.'}
      />
      <LegalDraftNotice />
      <DrillDown sections={SECTIONS} active={section} baseHref="#/terms" label="Terms of use" showAll />
    </main>
  );
}
