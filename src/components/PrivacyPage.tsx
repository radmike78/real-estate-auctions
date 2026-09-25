import DrillDown, { type DrillSection } from './DrillDown';
import LegalDraftNotice from './LegalDraftNotice';
import PageHero from './PageHero';
import { IconBadge, IconClock, IconDatabase, IconFile, IconHelp, IconHome, IconLayers, IconLock, IconShield, IconStop } from './Icons';
import { PRIVACY_EFFECTIVE, SITE_INFO } from '../lib/siteInfo';
import { fmtDate } from '../lib/status';

// Written to match what the code actually does (server/db.ts, server/app.ts, server/metrics.ts,
// src/lib/track.ts, the browser-storage keys and the map). Update it whenever those change.
// Nevada NRS 603A.340 items: categories of information and of third parties (collect, share),
// review/changes (choices), how changes are announced (changes), cross-site tracking (tracking),
// effective date (hero). NRS 603A.345: designated request address (choices).

const S = SITE_INFO;
const mail = (addr: string) => (/^\[/.test(addr) ? <strong>{addr}</strong> : <a href={`mailto:${addr}`}>{addr}</a>);

const SECTIONS: DrillSection[] = [
  {
    key: 'summary',
    title: 'The short version',
    icon: <IconShield />,
    tone: 'go',
    summary: 'No buyer accounts, no ad trackers, and we never sell your information',
    content: () => (
      <ul>
        <li>You can use the whole site without an account or sign-up.</li>
        <li>Your saved deals, bid calculations and checklists stay in your own browser. They aren't sent to us.</li>
        <li>We collect personal information only when you choose to contact a professional or apply to advertise.</li>
        <li>We don't sell personal information, and we don't use advertising networks, analytics trackers or tracking cookies.</li>
      </ul>
    ),
  },
  {
    key: 'collect',
    title: 'Information we collect',
    icon: <IconDatabase />,
    summary: 'Only what you type into a form, plus anonymous visit counts',
    content: () => (
      <>
        <h3>When you contact a professional</h3>
        <p>Your name, email address, phone number (optional), what you're interested in, and your message. You tick a box before anything is sent.</p>
        <h3>When you apply to advertise</h3>
        <p>
          Your name, company, license or registration number, service areas, services, languages, headline, business phone, email, website and
          short bio. We also keep the result of your license check, your email confirmation, your listing status, and your billing status (paid-through
          date and the customer and subscription IDs from our payment processor). We never see or store card numbers.
        </p>
        <h3>When you visit</h3>
        <ul>
          <li>
            <strong>Advertiser statistics.</strong> When a professional's listing or profile is viewed or their contact buttons are clicked, we
            add one to a daily count for that professional. To count unique visitors, we briefly keep a one-way code made from your network address
            and a random value that changes every day. The code can't be turned back into your address, is never linked across days, and is deleted
            after 2 days. We don't store your IP address with these counts.
          </li>
          <li>
            <strong>Security.</strong> To block abuse, our server keeps network addresses in memory for a short time to limit how many requests
            each one can make. Our server software doesn't write visitor logs; our hosting provider may keep standard network logs for security.
          </li>
        </ul>
        <h3>Public records about properties</h3>
        <p>
          Property information comes from government sources such as the County Treasurer, Recorder and Assessor, not from you. For homes that
          aren't for sale yet (pre-foreclosures), we don't show owner names or contact details.
        </p>
      </>
    ),
  },
  {
    key: 'use',
    title: 'How we use it',
    icon: <IconLayers />,
    summary: 'To deliver your message, run advertiser listings, and keep the site secure',
    content: () => (
      <ul>
        <li>To send your message to the one professional you chose, and to send you a receipt.</li>
        <li>To review, verify and publish advertiser listings, bill advertisers, and send them sign-in links, account notices and monthly reports.</li>
        <li>To show advertisers how their listing is doing, as totals only. They never see who viewed them.</li>
        <li>To protect the site, prevent fraud and spam, and meet legal obligations.</li>
      </ul>
    ),
  },
  {
    key: 'share',
    title: 'Who we share it with',
    icon: <IconBadge />,
    summary: 'The professional you contact, and the services that run the site. Never sold',
    content: () => (
      <>
        <ul>
          <li><strong>The professional you contact</strong>: your name, email, phone and message, and only to that one professional.</li>
          <li>
            <strong>Service providers</strong> that run the site for us: web hosting, email delivery, and our payment processor (Stripe) for
            advertisers. Stripe receives the advertiser's name and email to set up billing. Providers may use the information only to provide
            their service to us.
          </li>
          <li><strong>The public</strong>: an approved advertiser's profile (business contact details, license number, services and bio) is shown on the site.</li>
          <li><strong>Legal and safety</strong>: when the law requires it, or to protect people or the site from fraud or harm.</li>
          <li><strong>A business transfer</strong>: if the site is sold or merged, the new owner would be bound by this policy.</li>
        </ul>
        <p><strong>We don't sell personal information</strong>, and we don't share it with advertising networks or data brokers.</p>
      </>
    ),
  },
  {
    key: 'tracking',
    title: 'Cookies, tracking and other websites',
    icon: <IconLock />,
    summary: 'Two sign-in cookies, no tracking across websites',
    content: () => (
      <>
        <h3>Cookies</h3>
        <p>
          We set a cookie only when an advertiser or administrator signs in (<code>fsf_pro</code>, <code>fsf_admin</code>). It keeps you signed in, can't be
          read by page scripts, and expires within 8 hours. Buyers and visitors get no cookies from us.
        </p>
        <h3>Information saved in your browser</h3>
        <p>
          To make the tools work without an account, some things are saved only in your own browser: your saved deals and notes, your bid
          calculator numbers, due-diligence and checklist ticks, your pre-foreclosure watchlist, whether you've seen the welcome notice, and the
          version of the professionals directory you last saw (so an older, altered copy can be detected). We never receive them. Clearing your
          browser data deletes them.
        </p>
        <h3>Tracking across websites</h3>
        <p>
          We don't allow any third party to collect information about your activity over time and across different websites through our site.
          We use no advertising or analytics trackers.
        </p>
        <h3>Other services you may reach from our pages</h3>
        <ul>
          <li>The property map loads map images from OpenStreetMap's servers, which receive your network address and the map area you view.</li>
          <li>Advertisers who pay online do so on Stripe's checkout pages, under Stripe's privacy policy.</li>
          <li>Links to county, state and federal websites take you to sites with their own privacy policies.</li>
        </ul>
      </>
    ),
  },
  {
    key: 'retention',
    title: 'How long we keep it',
    icon: <IconClock />,
    summary: 'Messages about 13 months; visitor codes 2 days; sign-ins 8 hours',
    content: () => (
      <ul>
        <li><strong>Messages to professionals</strong>: deleted from our system after about 13 months. The professional keeps their own copy.</li>
        <li><strong>Daily visitor codes</strong>: 2 days. <strong>Daily counts</strong> (no personal information): kept for advertiser reports.</li>
        <li><strong>Sign-in sessions</strong>: end after 1 hour without activity, and 8 hours at most.</li>
        <li>
          <strong>Advertiser applications and records</strong> (including applications that weren't approved): kept for legal, tax, accounting and
          fraud-prevention purposes, such as spotting repeat applications, until you ask us to delete them where the law allows.
        </li>
        <li><strong>Backups</strong>: we keep 7 daily backups, so deleted information can remain in a backup for up to 7 days.</li>
      </ul>
    ),
  },
  {
    key: 'choices',
    title: 'Your choices and requests',
    icon: <IconHelp />,
    summary: 'See, correct or delete your information, and opt out of sale',
    content: () => (
      <>
        <p>Email {mail(S.privacyEmail)} to:</p>
        <ul>
          <li>see the personal information we have about you;</li>
          <li>correct it (advertisers can also ask us to update their profile at any time);</li>
          <li>delete it, unless we must keep it by law (for example, billing records);</li>
          <li>
            <strong>opt out of the sale of your information.</strong> We don't sell personal information, but Nevada residents may still send
            this request, and we'll honor it for any future information too (NRS 603A.345).
          </li>
        </ul>
        <p>
          We'll confirm who you are using the email address or other details you gave us, and reply within 60 days (at most 30 days more if
          we need longer, and we'll tell you if so). This email address is our designated request address under Nevada law.
        </p>
      </>
    ),
  },
  {
    key: 'security',
    title: 'Security',
    icon: <IconStop />,
    summary: 'Encrypted connections, hashed passwords, signed data, least access',
    content: () => (
      <p>
        We use encrypted connections, store only one-way codes of passwords and sign-in tokens, sign the listings and directory we publish so they
        can't be altered in transit, limit who can access personal information, and keep a record of administrator sign-ins and account actions. No system is perfectly secure. If a breach affects your
        information, we'll notify you as Nevada law requires (NRS 603A.220).
      </p>
    ),
  },
  {
    key: 'children-homeowners',
    title: 'Children and homeowners',
    icon: <IconHome />,
    summary: 'For adults only. Homeowners in foreclosure can find free help',
    content: () => (
      <>
        <p>
          The site is for adults. It isn't directed to children, and we don't knowingly collect information from anyone under 18. If you believe
          a child has sent us information, email {mail(S.privacyEmail)} and we'll delete it.
        </p>
        <p>
          If your home appears on the site because of a public record, we don't show owner names for homes that aren't for sale, and we tell every
          visitor not to contact homeowners in foreclosure. Our <a href="#/homeowner-help">homeowner help page</a> lists free, trustworthy help.
        </p>
      </>
    ),
  },
  {
    key: 'changes',
    title: 'Changes and contact',
    icon: <IconFile />,
    summary: `Effective ${fmtDate(PRIVACY_EFFECTIVE)}. How we announce changes and how to reach us`,
    content: () => (
      <>
        <p>
          When we change this policy, we update the effective date at the top. For a material change, we also post a notice on the site for at
          least 30 days before it takes effect and email active advertisers.
        </p>
        <p>
          {S.operatorName} runs {S.siteName}. Contact: {mail(S.privacyEmail)}, or by mail at {S.mailingAddress}.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage({ section }: { section?: string }) {
  const open = section === 'all' || SECTIONS.some((x) => x.key === section);
  return (
    <main className="page">
      <PageHero
        compact={open}
        top={open ? <a href="#/privacy">← Privacy policy</a> : undefined}
        eyebrow={<span className="eyebrow">Effective {fmtDate(PRIVACY_EFFECTIVE)}</span>}
        title={open ? <a className="title-link" href="#/privacy">Privacy policy</a> : <>Privacy <span className="grad">policy</span></>}
        sub={open ? undefined : 'What we collect, why, who sees it, and your choices. Written in plain language.'}
      />
      <LegalDraftNotice />
      <DrillDown sections={SECTIONS} active={section} baseHref="#/privacy" label="Privacy policy" showAll />
    </main>
  );
}
