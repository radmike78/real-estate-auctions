// Outgoing email. The default mailer prints messages to the server log so the signup flow
// works in development. In production, replace it with your email provider (SMTP or an API)
// by implementing `Mailer` and passing it to createApp().

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

export function confirmationEmail(to: string, name: string, link: string): Mail {
  return {
    to,
    subject: 'Confirm your email for your Forced-Sale Finder agent application',
    text:
      `Hi ${name},\n\n` +
      `Thanks for applying to be listed as an agent. Please confirm this email address:\n\n${link}\n\n` +
      `The link expires in 48 hours. After you confirm, we verify your license with the Nevada Real Estate Division and ` +
      `contact your brokerage to confirm your identity before your profile goes live.\n\n` +
      `If you didn't apply, ignore this email. Nothing will be published.\n`,
  };
}
