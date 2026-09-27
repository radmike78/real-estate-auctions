import { useEffect, useRef, useState } from 'react';
import { loadDeals, onDealsChange } from '../lib/deals';

// The tasks people come for, one click away. Everything else is under More, grouped.
const PRIMARY = [
  ['#/search', 'Properties'],
  ['#/playbooks', 'Learn'],
  ['#/practice', 'Practice'],
  ['#/calculator', 'Calculator'],
  ['#/agents', 'Find a pro'],
] as const;

const MORE: { group: string; links: (readonly [string, string])[] }[] = [
  { group: 'Buy', links: [['#/live', 'Live tax sales'], ['#/bank-owned', 'Bank-owned & government homes'], ['#/short-sales', 'Short sales'], ['#/business-assets', 'Business assets & closures'], ['#/pre-foreclosures', 'Pre-foreclosure tracker']] },
  { group: 'Get help', links: [['#/agents', 'Real estate agents'], ['#/financing', 'Financing'], ['#/pros', 'Title, insurance & repairs']] },
  { group: 'Stay informed', links: [['#/alerts', 'Email alerts'], ['#/about', 'How it works'], ['#/disclaimer', 'How we help']] },
];

export default function SiteHeader({ current }: { current: string }) {
  const [deals, setDeals] = useState(() => loadDeals().length);
  useEffect(() => onDealsChange(() => setDeals(loadDeals().length)), []);
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
    document.querySelectorAll('details.more[open]').forEach((d) => d.removeAttribute('open'));
  }, [current]);
  // Opening the phone menu moves the keyboard into it; Escape closes More and the phone menu.
  useEffect(() => {
    if (open) nav.current?.querySelector<HTMLElement>('a')?.focus();
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const more = document.querySelector<HTMLDetailsElement>('details.more[open]');
      if (more) {
        more.removeAttribute('open');
        more.querySelector<HTMLElement>('summary')?.focus();
      } else if (open) {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  // `current` is the hash path without "#/" (e.g. "search?q=x", "pros/abc"); hrefs are "#/search".
  const active = (href: string) => {
    const path = current.split('?')[0];
    const target = href.slice(2);
    return path === target || path.startsWith(`${target}/`) || (target === 'practice' && path.startsWith('practice/'));
  };
  return (
    <header className="site-header">
      <a href="#/" className="logo" aria-label="DeedOwl home">
        <span className="logo-mark" aria-hidden />
        <span>Deed<b>Owl</b></span>
      </a>
      <nav ref={nav} id="site-nav" className={`site-nav${open ? ' open' : ''}`} aria-label="Main">
        {PRIMARY.map(([href, label]) => (
          <a key={href} href={href} className={active(href) ? 'active' : ''}>{label}</a>
        ))}
        <a href="#/deals" className={active('#/deals') ? 'active' : ''}>My deals{deals > 0 && <><span className="nav-count" aria-hidden>{deals}</span><span className="sr-only">, {deals} saved</span></>}</a>
        <details className="more">
          <summary>More</summary>
          <div className="more-menu">
            {MORE.map((g) => (
              <div key={g.group} className="more-group" role="group" aria-label={g.group}>
                <span className="more-group-title" aria-hidden>{g.group}</span>
                {g.links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
              </div>
            ))}
          </div>
        </details>
      </nav>
      <button ref={menuBtn} className="menu-btn" aria-expanded={open} aria-controls="site-nav" aria-label="Menu" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </header>
  );
}
