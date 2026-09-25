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
