import type { ReactNode } from 'react';

// US phone numbers as written on the site: "(800) 569-4287", "1-888-529-5277", "801-742-1898".
const PHONE = /((?:1-)?(?:\(\d{3}\) |\d{3}-)\d{3}-\d{4})/;

/** Text with each phone number as a tap-to-call link that never breaks across lines. */
export function phoneLinks(text: string): ReactNode {
  const parts = text.split(PHONE);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (!(i % 2)) return p;
    const digits = p.replace(/\D/g, '');
    return <a key={i} className="tel" href={`tel:+1${digits.length === 11 ? digits.slice(1) : digits}`}>{p}</a>;
  });
}
