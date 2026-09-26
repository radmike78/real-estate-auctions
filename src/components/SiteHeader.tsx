import { useEffect, useState } from 'react';
import { loadDeals, onDealsChange } from '../lib/deals';

const PRIMARY = [
  ['#/search', 'Properties'],
  ['#/agents', 'Find an agent'],
  ['#/financing', 'Financing'],
  ['#/pros', 'Title, insurance & repairs'],
] as const;

const MORE = [
  ['#/playbooks', 'Nevada playbooks'],
  ['#/calculator', 'Max bid calculator'],
  ['#/live', 'Live tax sales'],
  ['#/pre-foreclosures', 'Pre-foreclosure tracker'],
  ['#/short-sales', 'Short sales guide'],
  ['#/bank-owned', 'Bank-owned & government homes'],
  ['#/business-assets', 'Business assets & closures'],
  ['#/about', 'How it works'],
  ['#/disclaimer', 'How we help'],
  ['#/advertise', 'Advertise with us'],
  ['#/advertiser', 'Advertiser sign-in'],
] as const;

export default function SiteHeader({ current }: { current: string }) {
  const [deals, setDeals] = useState(() => loadDeals().length);
  useEffect(() => onDealsChange(() => setDeals(loadDeals().length)), []);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
    document.querySelectorAll('details.more[open]').forEach((d) => d.removeAttribute('open'));
  }, [current]);
  // `current` is the hash path without "#/" (e.g. "search?q=x", "pros/abc"); hrefs are "#/search".
  const active = (href: string) => {
    const path = current.split('?')[0];
    const target = href.slice(2);
    return path === target;
  };
  return (
    <header className="site-header">
      <a href="#/" className="logo" aria-label="Forced-Sale Finder home">
        <span className="logo-mark" aria-hidden />
        <span>Forced-Sale <b>Finder</b></span>
      </a>
      <nav className={`site-nav${open ? ' open' : ''}`} aria-label="Main">
        {PRIMARY.map(([href, label]) => (
          <a key={href} href={href} className={active(href) ? 'active' : ''}>{label}</a>
        ))}
        <a href="#/deals" className={active('#/deals') ? 'active' : ''}>My deals{deals > 0 && <><span className="nav-count" aria-hidden>{deals}</span><span className="sr-only">, {deals} saved</span></>}</a>
        <details className="more">
          <summary>More</summary>
          <div className="more-menu">
            {MORE.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </div>
        </details>
      </nav>
      <button className="menu-btn" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </header>
  );
}
