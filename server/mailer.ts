// Outgoing email. Production sends through Postmark (postmarkMailer) when POSTMARK_SERVER_TOKEN and
// MAIL_FROM are set; otherwise consoleMailer prints messages to the server log so every flow works
// in development.

import type { LeadRow } from './db';
import type { Change, ListingSnapshot } from './tracker';
import { labelOf } from './tracker';
import { SITE_INFO } from '../src/lib/siteInfo';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  /** Extra headers, e.g. List-Unsubscribe on alert emails. */
  headers?: Record<string, string>;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export const consoleMailer: Mailer = {
  async send(mail) {
    console.log(`\n--- email to ${mail.to} ---\nSubject: ${mail.subject}\n\n${mail.text}\n--- end email ---\n`);
  },
};

export class MailError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

export interface PostmarkOptions {
  serverToken: string;
  from: string; // must be a verified sender signature or domain in Postmark
  replyTo?: string;
  messageStream?: string; // default "outbound" (Postmark's transactional stream)
  fetch?: typeof fetch; // for tests
  retryDelayMs?: number;
}

const POSTMARK_URL = 'https://api.postmarkapp.com/email';
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/** Sends through Postmark's email API. Open and link tracking are off: sign-in and confirmation links must
 *  reach people unchanged, and we don't track who reads our email. Retries once on rate limits, server
 *  errors and network failures; throws MailError when the message can't be sent. */
export function postmarkMailer(opts: PostmarkOptions): Mailer {
  const doFetch = opts.fetch ?? fetch;
  const delay = opts.retryDelayMs ?? 1000;
  async function attempt(mail: Mail): Promise<void> {
    let res: Response;
    try {
      res = await doFetch(POSTMARK_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': opts.serverToken },
        body: JSON.stringify({
          From: opts.from,
          To: oneLine(mail.to),
          Subject: oneLine(mail.subject),
          TextBody: mail.text,
          ...(opts.replyTo ? { ReplyTo: opts.replyTo } : {}),
          ...(mail.headers ? { Headers: Object.entries(mail.headers).map(([Name, Value]) => ({ Name: oneLine(Name), Value: oneLine(Value) })) } : {}),
          MessageStream: opts.messageStream ?? 'outbound',
          TrackOpens: false,
          TrackLinks: 'None',
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      throw new MailError(`Postmark request failed: ${(e as Error).message}`, true);
    }
    let body: { ErrorCode?: number; Message?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page */
    }
    if (res.ok && (body.ErrorCode ?? 0) === 0) return;
    const detail = `Postmark HTTP ${res.status}${body.ErrorCode !== undefined ? `, error ${body.ErrorCode}` : ''}${body.Message ? `: ${body.Message}` : ''}`;
    throw new MailError(detail, res.status === 429 || res.status >= 500);
  }
  return {
    async send(mail) {
      try {
        await attempt(mail);
      } catch (e) {
        if (!(e instanceof MailError) || !e.retryable) throw e;
        await new Promise((r) => setTimeout(r, delay));
        await attempt(mail);
      }
    },
  };
}

/** Hides most of an address for logs: "jo***@example.com". */
export const maskEmail = (to: string) => to.replace(/^(.{0,2})[^@]*@/, '$1***@');

const FOOTER =
  '\n--\nForced-Sale Finder helps people find options. We are not a lender, broker, agent or party to any transaction, ' +
  'and we are not responsible for any agreement between you and anyone you contact through the site.\n';

// No applicant-supplied text is echoed here: the address isn't confirmed yet, so an attacker
// could otherwise use us to send their words to anyone.
export function confirmationEmail(to: string, link: string, regulator: string): Mail {
  return {
    to,
    subject: 'Confirm your email for your Forced-Sale Finder advertiser application',
    text:
      `Hello,\n\nThanks for applying to advertise. Please confirm this email address:\n\n${link}\n\n` +
      `The link expires in 48 hours. After you confirm, we verify your license with ${regulator} and confirm your ` +
      `identity through contact details we find independently, before your profile goes live.\n\n` +
      `If you didn't apply, ignore this email. Nothing will be published.\n` +
      FOOTER,
  };
}

export function loginLinkEmail(to: string, name: string, link: string): Mail {
  return {
    to,
    subject: 'Your Forced-Sale Finder advertiser sign-in link',
    text: `Hi ${name},\n\nSign in to see your advertising results and leads:\n\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.\n` + FOOTER,
  };
}

export function approvedEmail(to: string, name: string, dashboardUrl: string, payOnline: boolean): Mail {
  return {
    to,
    subject: 'You are approved to advertise on Forced-Sale Finder',
    text:
      `Hi ${name},\n\nWe verified your license and identity, and your advertiser profile is approved.\n\n` +
      (payOnline
        ? `To go live, sign in to your dashboard and choose "Start advertising". You pay by card on Stripe's secure page, and your profile goes live as soon as the payment clears:\n\n${dashboardUrl}\n`
        : `We will contact you to set up your advertising plan. Your profile goes live once your plan is active. Your dashboard:\n\n${dashboardUrl}\n`) +
      FOOTER,
  };
}

export function paymentFailedEmail(to: string, name: string, dashboardUrl: string): Mail {
  return {
    to,
    subject: 'Your Forced-Sale Finder payment did not go through',
    text:
      `Hi ${name},\n\nThe latest payment for your advertising plan did not go through. Your profile stays live until the end of the period you already paid for.\n\n` +
      `To update your card, sign in to your dashboard and choose "Manage billing":\n\n${dashboardUrl}\n\nWe never ask for card details by email or phone.\n` +
      FOOTER,
  };
}

export function leadEmail(to: string, proName: string, lead: LeadRow, dashboardUrl: string): Mail {
  return {
    to,
    subject: `New contact request from ${lead.name} via Forced-Sale Finder`,
    text:
      `Hi ${proName},\n\n${lead.name} asked to be contacted through your Forced-Sale Finder profile.\n\n` +
      `  Name:    ${lead.name}\n  Email:   ${lead.email}\n  Phone:   ${lead.phone ?? '(not given)'}\n` +
      `  About:   ${lead.interest ?? '(not specified)'}\n\n  Message:\n  ${lead.message}\n\n` +
      `They agreed to share these details with you only. Please respond directly and follow all laws that apply to ` +
      `contacting consumers. All your leads and results: ${dashboardUrl}\n` +
      FOOTER,
  };
}

export function leadReceiptEmail(to: string, proName: string): Mail {
  return {
    to,
    subject: `Your message was sent to ${proName}`,
    text:
      `Hello,\n\nWe sent your contact details and message to ${proName}. They will contact you directly.\n\n` +
      `Before you sign anything or send money: verify their license yourself, compare options, read every document, ` +
      `and consider independent legal and financial advice. Never wire money based on an email or text alone.\n` +
      FOOTER,
  };
}

// ---------------- email alerts ----------------

/** Every alert email ends with how to manage or stop them, and our postal address (required by CAN-SPAM). */
function alertsFooter(manageUrl: string, unsubscribeUrl: string): string {
  return (
    `\n--\nYou're getting this because you signed up for email from Forced-Sale Finder.\n` +
    `Change what you get: ${manageUrl}\nUnsubscribe from everything: ${unsubscribeUrl}\n` +
    `${SITE_INFO.operatorName}, ${SITE_INFO.mailingAddress}\n`
  );
}

/** Headers that let mail apps show a one-click "Unsubscribe" button (RFC 8058). */
export const unsubscribeHeaders = (oneClickUrl: string): Record<string, string> => ({
  'List-Unsubscribe': `<${oneClickUrl}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});

// Nothing the requester typed is echoed: the address isn't confirmed yet, so this can't be used to
// send someone else's words to a stranger.
/** `tracking` is a property label from our own verified feed, never text the requester typed. */
export function alertsConfirmEmail(to: string, link: string, tracking?: string, kind: 'property' | 'search' = 'property'): Mail {
  return {
    to,
    subject: 'Confirm your Forced-Sale Finder email alerts',
    text:
      `Hello,\n\nPlease confirm that you want email from Forced-Sale Finder${tracking ? (kind === 'search' ? `, starting with daily emails about new matches for "${tracking}"` : `, starting with updates on ${tracking}`) : ''}:\n\n${link}\n\n` +
      `The link expires in 48 hours. If you didn't sign up, ignore this email and you won't hear from us again.\n\n` +
      `${SITE_INFO.operatorName}, ${SITE_INFO.mailingAddress}\n`,
  };
}

export function alertsWelcomeEmail(to: string, manageUrl: string, unsubscribeUrl: string, oneClickUrl: string): Mail {
  return {
    to,
    subject: "You're signed up for Forced-Sale Finder email",
    text:
      `Hello,\n\nYour email is confirmed. Keep this message: the link below lets you change or stop your alerts at any time, ` +
      `no password needed.\n\n${manageUrl}\n\nEmail alerts are free. We never sell or share your address.\n` +
      alertsFooter(manageUrl, unsubscribeUrl),
    headers: unsubscribeHeaders(oneClickUrl),
  };
}

/** Sent when someone who is already signed up asks again: their manage link, and nothing is changed. */
export function alertsManageLinkEmail(to: string, manageUrl: string, unsubscribeUrl: string, oneClickUrl: string): Mail {
  return {
    to,
    subject: 'Your Forced-Sale Finder email alerts link',
    text:
      `Hello,\n\nYou're already signed up. To change what you get, or to stop all email, use this link:\n\n${manageUrl}\n\n` +
      `If you didn't ask for this, you can ignore it. Nothing has changed.\n` +
      alertsFooter(manageUrl, unsubscribeUrl),
    headers: unsubscribeHeaders(oneClickUrl),
  };
}

const vegasTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const when = (iso: string | null) => (iso ? vegasTime.format(new Date(iso)) : 'not scheduled');
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** One line per change, in plain words. */
export function describeChange(c: Change): string {
  switch (c.kind) {
    case 'removed':
      return "No longer on the Treasurer's auction list. It may have been paid off, withdrawn or sold. We'll email you if it comes back on a future list.";
    case 'back':
      return `On the Treasurer's auction list${c.auctionStartsAt ? ` for the auction on ${when(c.auctionStartsAt)}` : ''}. Minimum bid ${usd(c.minimumBid)}.`;
    case 'date':
      return `Auction date changed: ${when(c.from)} → ${when(c.to)}.`;
    case 'minimumBid':
      return `Minimum bid changed: ${usd(c.from)} → ${usd(c.to)}.`;
    case 'place':
      return `Auction details changed: ${[c.format, c.location].filter(Boolean).join(', ') || 'see the official notice'}.`;
    case 'register':
      return `Auction on ${when(c.auctionStartsAt)}. Registration usually closes about a week before, with a $5,000 deposit in certified funds. Check this year's notice and register now if you plan to bid.`;
    case 'tomorrow':
      return `Auction tomorrow: ${when(c.auctionStartsAt)}. Winning bids are paid the same day in certified funds.`;
  }
}

export function trackedChangesEmail(
  to: string,
  items: { snapshot: ListingSnapshot; changes: Change[] }[],
  links: { manage: string; unsubscribe: string; oneClick: string; live: string },
): Mail {
  const one = items.length === 1;
  const body = items
    .map((i) => `${labelOf(i.snapshot)}\n${i.changes.map((c) => `  - ${describeChange(c)}`).join('\n')}\n  Official record: ${i.snapshot.sourceUrl}`)
    .join('\n\n');
  return {
    to,
    subject: one ? `Update: ${labelOf(items[0].snapshot)}` : `Updates on ${items.length} properties you're tracking`,
    text:
      `Hello,\n\n${one ? 'A property you track changed' : 'Properties you track changed'} on the Clark County Treasurer's list:\n\n${body}\n\n` +
      `Live tax-sale list: ${links.live}\n\nAlways confirm with the official source before you bid. Lists change often, right up to the auction.\n` +
      alertsFooter(links.manage, links.unsubscribe),
    headers: unsubscribeHeaders(links.oneClick),
  };
}

/** For an address that's already signed up: confirm adding a property from their own manage page. */
export function alertsAddEmail(to: string, label: string, addUrl: string, manageUrl: string, unsubscribeUrl: string, oneClickUrl: string, kind: 'property' | 'search' = 'property'): Mail {
  const what = kind === 'search' ? `daily emails about new matches for "${label}"` : `updates on ${label}`;
  return {
    to,
    subject: kind === 'search' ? `Confirm: save the search "${label}"` : `Confirm: track ${label}`,
    text:
      `Hello,\n\nSomeone (hopefully you) asked to add ${what} to your Forced-Sale Finder email alerts. To add it, open this link and choose "Add it":\n\n${addUrl}\n\n` +
      `If you didn't ask for this, ignore this email. Nothing has changed.\n` +
      alertsFooter(manageUrl, unsubscribeUrl),
    headers: unsubscribeHeaders(oneClickUrl),
  };
}

/** Most listings shown per saved search in one digest; the rest are on the site. */
export const DIGEST_MAX = 25;

export function searchDigestEmail(
  to: string,
  groups: { label: string; listings: ListingSnapshot[] }[],
  links: { manage: string; unsubscribe: string; oneClick: string; live: string },
): Mail {
  const total = groups.reduce((n, g) => n + g.listings.length, 0);
  const body = groups
    .map((g) => {
      const shown = g.listings.slice(0, DIGEST_MAX);
      const lines = shown.map((l) => `  - ${labelOf(l)}: minimum bid ${usd(l.minimumBid)}, auction ${when(l.auctionStartsAt)}`);
      const more = g.listings.length - shown.length;
      return `${g.label} (${g.listings.length} new)\n${lines.join('\n')}${more > 0 ? `\n  …and ${more} more on the site.` : ''}`;
    })
    .join('\n\n');
  return {
    to,
    subject: `${total} new ${total === 1 ? 'match' : 'matches'} for your saved ${groups.length === 1 ? 'search' : 'searches'}`,
    text:
      `Hello,\n\nNew parcels on the Clark County Treasurer's tax-sale list match your saved ${groups.length === 1 ? 'search' : 'searches'}:\n\n${body}\n\n` +
      `See them all, with maps and official links: ${links.live}\n\n` +
      `Always confirm with the official source before you bid. Owners can pay until 3 business days before the sale, so lists change often.\n` +
      alertsFooter(links.manage, links.unsubscribe),
    headers: unsubscribeHeaders(links.oneClick),
  };
}
