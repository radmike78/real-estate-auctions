// Outgoing email. Production sends through Resend (resendMailer, RESEND_API_KEY) or Postmark (postmarkMailer,
// POSTMARK_SERVER_TOKEN), together with MAIL_FROM; otherwise consoleMailer prints messages to the server log so
// every flow works in development.

import { randomUUID } from 'node:crypto';
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
  /** Bulk updates to the general list: Postmark's separate broadcast stream, or Resend's broadcast sender. */
  stream?: 'broadcast';
  /** Sent by the server on its own (alerts, reports, list updates): waits behind email someone is waiting for. */
  bulk?: boolean;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export const consoleMailer: Mailer = {
  async send(mail) {
    console.log(`\n--- email to ${mail.to}${mail.stream ? ` (${mail.stream} stream)` : ''} ---\nSubject: ${mail.subject}\n\n${mail.text}\n--- end email ---\n`);
  },
};

export class MailError extends Error {
  readonly retryable: boolean;
  /** The service's daily or monthly sending allowance is used up: more sends fail until it resets. */
  readonly quota: boolean;
  constructor(message: string, retryable: boolean, quota = false) {
    super(message);
    this.retryable = retryable;
    this.quota = quota;
  }
}

export interface PostmarkOptions {
  serverToken: string;
  from: string; // must be a verified sender signature or domain in Postmark
  replyTo?: string;
  messageStream?: string; // default "outbound" (Postmark's transactional stream)
  broadcastStream?: string; // default "broadcast": for updates to the general list
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
          MessageStream: mail.stream === 'broadcast' ? (opts.broadcastStream ?? 'broadcast') : (opts.messageStream ?? 'outbound'),
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

export interface ResendOptions {
  apiKey: string;
  from: string; // must be on a domain verified in Resend
  replyTo?: string;
  /** Optional sender for updates to the general list, e.g. on a separate subdomain, so bulk mail can't hurt
   *  delivery of sign-in links. Default: `from`. */
  broadcastFrom?: string;
  fetch?: typeof fetch; // for tests
  retryDelayMs?: number;
  /** Space between requests, to stay under Resend's per-second rate limit. Default 600 ms. */
  minIntervalMs?: number;
}

const RESEND_URL = 'https://api.resend.com/emails';

/** Sends through Resend's email API, one request at a time and spaced out to stay under its rate limit.
 *  Retries once on rate limits, server errors and network failures, with the same idempotency key so a retry
 *  can never send the message twice. A used-up daily or monthly quota is not retried. Open and click tracking
 *  are Resend domain settings and are off unless you turn them on; leave them off (see README: Email). */
export function resendMailer(opts: ResendOptions): Mailer {
  const doFetch = opts.fetch ?? fetch;
  const delay = opts.retryDelayMs ?? 1000;
  const gap = opts.minIntervalMs ?? 600;
  // Requests run one after another, at least `gap` ms apart. Email someone is waiting for (sign-in links,
  // confirmations, leads) goes ahead of bulk email, so a big list update never delays a sign-in link.
  type Job = { fn: () => Promise<void>; done: (e?: unknown) => void };
  const urgent: Job[] = [];
  const bulk: Job[] = [];
  let running = false;
  let lastAt = 0;
  async function drain() {
    if (running) return;
    running = true;
    try {
      while (urgent.length || bulk.length) {
        // Wait first, then choose: email that arrived during the wait can still go ahead of bulk email.
        const wait = lastAt + gap - Date.now();
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        const job = urgent.shift() ?? bulk.shift();
        if (!job) break;
        lastAt = Date.now();
        try {
          await job.fn();
          job.done();
        } catch (e) {
          job.done(e ?? new Error('send failed'));
        }
      }
    } finally {
      running = false;
    }
  }
  const spaced = (fn: () => Promise<void>, isBulk: boolean): Promise<void> =>
    new Promise((resolve, reject) => {
      (isBulk ? bulk : urgent).push({ fn, done: (e) => (e ? reject(e) : resolve()) });
      void drain();
    });
  async function attempt(mail: Mail, idempotencyKey: string): Promise<void> {
    let res: Response;
    try {
      res = await doFetch(RESEND_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          from: mail.stream === 'broadcast' && opts.broadcastFrom ? opts.broadcastFrom : opts.from,
          to: [oneLine(mail.to)],
          subject: oneLine(mail.subject),
          text: mail.text,
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          ...(mail.headers ? { headers: Object.fromEntries(Object.entries(mail.headers).map(([k, v]) => [oneLine(k), oneLine(v)])) } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      throw new MailError(`Resend request failed: ${(e as Error).message}`, true);
    }
    let body: { name?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page */
    }
    if (res.ok) return;
    const detail = `Resend HTTP ${res.status}${body.name ? `, ${body.name}` : ''}${body.message ? `: ${body.message}` : ''}`;
    const quota = /quota/i.test(body.name ?? '');
    throw new MailError(detail, !quota && (res.status === 429 || res.status >= 500), quota);
  }
  return {
    send(mail) {
      const key = randomUUID();
      return spaced(async () => {
        try {
          await attempt(mail, key);
        } catch (e) {
          if (!(e instanceof MailError) || !e.retryable) throw e;
          await new Promise((r) => setTimeout(r, delay));
          await attempt(mail, key);
        }
      }, !!mail.bulk || mail.stream === 'broadcast');
    },
  };
}

/** Hides most of an address for logs: "jo***@example.com". */
export const maskEmail = (to: string) => to.replace(/^(.{0,2})[^@]*@/, '$1***@');

const FOOTER =
  '\n--\nDeedOwl is a free information site about Clark County forced sales. We are not a lender, broker, agent or party to any transaction, ' +
  'and we are not responsible for any agreement between you and anyone you contact through the site.\n';

// No applicant-supplied text is echoed here: the address isn't confirmed yet, so an attacker
// could otherwise use us to send their words to anyone.
export function confirmationEmail(to: string, link: string, regulator: string): Mail {
  return {
    to,
    subject: 'Confirm your email for your DeedOwl advertiser application',
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
    subject: 'Your DeedOwl advertiser sign-in link',
    text: `Hi ${name},\n\nSign in to see your advertising results and leads:\n\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.\n` + FOOTER,
  };
}

export function approvedEmail(to: string, name: string, dashboardUrl: string, payOnline: boolean): Mail {
  return {
    to,
    subject: 'You are approved to advertise on DeedOwl',
    text:
      `Hi ${name},\n\nWe verified your license and identity, and your advertiser profile is approved.\n\n` +
      (payOnline
        ? `To go live, sign in to your dashboard, choose a plan and select "Start advertising". You pay by card on Stripe's secure page, and your profile goes live as soon as the payment clears:\n\n${dashboardUrl}\n`
        : `We will contact you to set up your advertising plan. Your profile goes live once your plan is active. Your dashboard:\n\n${dashboardUrl}\n`) +
      FOOTER,
  };
}

export function paymentFailedEmail(to: string, name: string, dashboardUrl: string): Mail {
  return {
    to,
    subject: 'Your DeedOwl payment did not go through',
    text:
      `Hi ${name},\n\nThe latest payment for your advertising plan did not go through. Your profile stays live until the end of the period you already paid for.\n\n` +
      `To update your card, sign in to your dashboard and choose "Manage billing":\n\n${dashboardUrl}\n\nWe never ask for card details by email or phone.\n` +
      FOOTER,
  };
}

export function leadEmail(to: string, proName: string, lead: LeadRow, dashboardUrl: string): Mail {
  return {
    to,
    subject: `New contact request from ${lead.name} via DeedOwl`,
    text:
      `Hi ${proName},\n\n${lead.name} asked to be contacted through your DeedOwl profile.\n\n` +
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

/** Who sent it: the business name. Alerts and confirmations carry no postal address. */
const senderLine = () => `${SITE_INFO.operatorName}\n`;

/** Every alert email ends with how to manage or stop them, and who sent it. */
function alertsFooter(manageUrl: string, unsubscribeUrl: string): string {
  return (
    `\n--\nYou're getting this because you signed up for email from DeedOwl.\n` +
    `Change what you get: ${manageUrl}\nUnsubscribe from everything: ${unsubscribeUrl}\n` +
    senderLine()
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
export function alertsConfirmEmail(to: string, link: string, tracking?: string, kind: 'property' | 'search' = 'property', list = !tracking): Mail {
  return {
    to,
    subject: 'Confirm your DeedOwl email alerts',
    text:
      `Hello,\n\nPlease confirm that you want email from DeedOwl${tracking ? (kind === 'search' ? `, starting with daily emails about new matches for "${tracking}"` : `, starting with updates on ${tracking}`) : ''}:\n\n${link}\n\n` +
      (list ? `This includes occasional general DeedOwl updates. You can turn those off from the link in any email.\n\n` : '') +
      `The link expires in 48 hours. If you didn't sign up, ignore this email and you won't hear from us again.\n\n` +
      senderLine(),
  };
}

export function alertsWelcomeEmail(to: string, manageUrl: string, unsubscribeUrl: string, oneClickUrl: string): Mail {
  return {
    to,
    subject: "You're signed up for DeedOwl email",
    text:
      `Hello,\n\nYour email is confirmed. Keep this message: the link below lets you change or stop your alerts at any time, ` +
      `no password needed.\n\n${manageUrl}\n\nEmail alerts are free. We never sell your address or share it with advertisers.\n` +
      alertsFooter(manageUrl, unsubscribeUrl),
    headers: unsubscribeHeaders(oneClickUrl),
  };
}

/** Sent when someone who is already signed up asks again: their manage link, and nothing is changed. */
export function alertsManageLinkEmail(to: string, manageUrl: string, unsubscribeUrl: string, oneClickUrl: string): Mail {
  return {
    to,
    subject: 'Your DeedOwl email alerts link',
    text:
      `Hello,\n\nYou're already signed up. To change what you get, or to stop all email, use this link:\n\n${manageUrl}\n\n` +
      `If you didn't ask for this, you can ignore it. Nothing has changed.\n` +
      alertsFooter(manageUrl, unsubscribeUrl),
    headers: unsubscribeHeaders(oneClickUrl),
  };
}

const vegasTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const when = (iso: string | null) => (iso ? vegasTime.format(new Date(iso)) : 'not scheduled');
const usd = (n: number | null) => (n === null ? 'see the notice' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));

/** One line per change, in plain words. */
export function describeChange(c: Change, source?: ListingSnapshot['source']): string {
  if (source === 'irs') {
    switch (c.kind) {
      case 'removed':
        return "No longer listed on irsauctions.gov. The sale may have been cancelled, postponed or held. We'll email you if it's listed again.";
      case 'back':
        return `Listed on irsauctions.gov${c.auctionStartsAt ? ` for the sale on ${when(c.auctionStartsAt)}` : ''}. Minimum bid ${usd(c.minimumBid)}.`;
      case 'register':
        return `Sale on ${when(c.auctionStartsAt)}. Read the IRS notice of sale now for registration, deposit and payment terms.`;
      case 'tomorrow':
        return `Sale tomorrow: ${when(c.auctionStartsAt)}. Bring payment in the form the notice of sale requires.`;
      default:
        break; // date, bid and place changes read the same for both lists
    }
  }
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
    .map((i) => `${labelOf(i.snapshot)}\n${i.changes.map((c) => `  - ${describeChange(c, i.snapshot.source)}`).join('\n')}\n  Official record: ${i.snapshot.sourceUrl}`)
    .join('\n\n');
  return {
    to,
    subject: one ? `Update: ${labelOf(items[0].snapshot)}` : `Updates on ${items.length} properties you're tracking`,
    text:
      `Hello,\n\n${one ? 'A property you track changed' : 'Properties you track changed'} on ${items.every((i) => i.snapshot.source === 'irs') ? 'irsauctions.gov' : items.some((i) => i.snapshot.source === 'irs') ? 'the official lists' : "the Clark County Treasurer's list"}:\n\n${body}\n\n` +
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
      `Hello,\n\nSomeone (hopefully you) asked to add ${what} to your DeedOwl email alerts. To add it, open this link and choose "Add it":\n\n${addUrl}\n\n` +
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

/** An update the admin writes for the general list. The body is the admin's own plain text. */
/** `postalAddress` comes from the server's MAIL_POSTAL_ADDRESS setting; CAN-SPAM requires it in bulk updates. */
export function broadcastEmail(to: string, subject: string, body: string, links: { manage: string; unsubscribe: string; oneClick: string }, postalAddress: string): Mail {
  return {
    to,
    subject,
    text:
      `${body.trim()}\n\n` +
      `Always confirm details with the official source before you bid.\n` +
      `\n--\nYou're getting this because you signed up for general updates from DeedOwl.\n` +
      `Change what you get: ${links.manage}\nUnsubscribe from everything: ${links.unsubscribe}\n` +
      `${SITE_INFO.operatorName}, ${postalAddress}\n`,
    headers: unsubscribeHeaders(links.oneClick),
    stream: 'broadcast',
  };
}
