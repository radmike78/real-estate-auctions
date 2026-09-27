import { useEffect, useRef, useState } from 'react';
import { loadDeals, onDealsChange } from '../lib/deals';

// The tasks people come for, one click away. Everything else is under More, grouped.
const PRIMARY = [
  ['#/search', 'Properties'],
  ['#/playbooks', 'Learn'],
  ['#/practice', 'Practice'],
  ['#/agents', 'Find a pro'],
] as const;

const MORE: { group: string; links: (readonly [string, string])[] }[] = [
  { group: 'Tools', links: [['#/calculator', 'Maximum bid calculator'], ['#/deals', 'My deals']] },
  { group: 'Buy', links: [['#/live', 'Live tax sales'], ['#/bank-owned', 'Bank-owned & government homes'], ['#/short-sales', 'Short sales'], ['#/business-assets', 'Business assets & closures']] },
  { group: 'Get help', links: [['#/financing', 'Financing'], ['#/pros', 'Title, insurance & repairs']] },
  { group: 'Research & about', links: [['#/pre-foreclosures', 'Pre-foreclosures (not for sale)'], ['#/about', 'How it works'], ['#/disclaimer', 'How we help']] },
];

export default function SiteHeader({ current, nav: navCount = 0 }: { current: string; nav?: number }) {
  const [deals, setDeals] = useState(() => loadDeals().length);
  useEffect(() => onDealsChange(() => setDeals(loadDeals().length)), []);
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
    document.querySelectorAll('details.more[open]').forEach((d) => d.removeAttribute('open'));
  }, [current, navCount]);
  // Close menus on a click outside them, and on any menu link (even one to the page you're on).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const more = document.querySelector<HTMLDetailsElement>('details.more[open]');
      if (t?.closest?.('.site-nav a')) {
        more?.removeAttribute('open');
        setOpen(false);
      } else if (more && !more.contains(t)) {
        more.removeAttribute('open');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
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
    const pros = ['agents', 'pros', 'financing'];
    return path === target || path.startsWith(`${target}/`) || (target === 'agents' && pros.some((x) => path === x || path.startsWith(`${x}/`)));
  };
  return (
    <header className="site-header">
      <a href="#/" className="logo" aria-label="DeedOwl home">
        <img className="logo-mark" src="logo.svg" alt="" width={42} height={42} />
        <span>Deed<b>Owl</b></span>
      </a>
      <nav ref={nav} id="site-nav" className={`site-nav${open ? ' open' : ''}`} aria-label="Main">
        {PRIMARY.map(([href, label]) => (
          <a key={href} href={href} className={active(href) ? 'active' : ''}>{label}</a>
        ))}
        <details className="more">
          <summary className={MORE.some((g) => g.links.some(([h]) => h !== '#/pros' && h !== '#/financing' && active(h))) ? 'active' : ''}>
            More{deals > 0 && <><span className="nav-count" aria-hidden>{deals}</span><span className="sr-only">, {deals} saved deals</span></>}
          </summary>
          <div className="more-menu">
            {MORE.map((g) => (
              <div key={g.group} className="more-group" role="group" aria-label={g.group}>
                <span className="more-group-title" aria-hidden>{g.group}</span>
                {g.links.map(([href, label]) => (
                  <a key={href} href={href}>{label}{href === '#/deals' && deals > 0 && <span className="nav-count">{deals}</span>}</a>
                ))}
              </div>
            ))}
          </div>
        </details>
        <a href="#/alerts" className={`nav-cta${active('#/alerts') ? ' active' : ''}`}>Get alerts</a>
      </nav>
      <button ref={menuBtn} className="menu-btn" aria-expanded={open} aria-controls="site-nav" aria-label="Menu" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </header>
  );
}
