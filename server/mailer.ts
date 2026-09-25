// Outgoing email. The default mailer prints messages to the server log so every flow works in
// development. In production, implement `Mailer` with your email provider (SMTP or an API) and
// pass it to createApp().

import type { LeadRow } from './db';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export const consoleMailer: Mailer = {
  async send(mail) {
    console.log(`\n--- email to ${mail.to} ---\nSubject: ${mail.subject}\n\n${mail.text}\n--- end email ---\n`);
  },
};

const FOOTER =
  '\n--\nForced-Sale Finder helps people find options. We are not a lender, broker, agent or party to any transaction, ' +
  'and we are not responsible for any agreement between you and anyone you contact through the site.\n';

export function confirmationEmail(to: string, name: string, link: string, regulator: string): Mail {
  return {
    to,
    subject: 'Confirm your email for your Forced-Sale Finder advertiser application',
    text:
      `Hi ${name},\n\nThanks for applying to advertise. Please confirm this email address:\n\n${link}\n\n` +
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

export function leadReceiptEmail(to: string, name: string, proName: string): Mail {
  return {
    to,
    subject: `Your message was sent to ${proName}`,
    text:
      `Hi ${name},\n\nWe sent your contact details and message to ${proName}. They will contact you directly.\n\n` +
      `Before you sign anything or send money: verify their license yourself, compare options, read every document, ` +
      `and consider independent legal and financial advice. Never wire money based on an email or text alone.\n` +
      FOOTER,
  };
}
