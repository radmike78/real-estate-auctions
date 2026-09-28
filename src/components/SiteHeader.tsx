import { useEffect, useRef, useState } from 'react';
import { loadDeals, onDealsChange } from '../lib/deals';

// The tasks people come for, one click away. Everything else is under More, grouped.
const PRIMARY = [
  ['#/', 'Home'],
  ['#/search', 'Properties'],
  ['#/playbooks', 'Learn'],
  ['#/practice', 'Practice'],
  ['#/agents', 'Find a pro'],
] as const;

const MORE: { group: string; links: (readonly [string, string])[] }[] = [
  { group: 'Tools', links: [['#/calculator', 'Maximum bid calculator'], ['#/deals', 'My deals']] },
  { group: 'Buy', links: [['#/live', 'Live tax sales'], ['#/bank-owned', 'Bank-owned & government homes'], ['#/short-sales', 'Short sales'], ['#/business-assets', 'Business assets & closures']] },
  { group: 'Get help', links: [['#/financing', 'Financing'], ['#/pros', 'Title, inspectors, attorneys & more']] },
  { group: 'Research', links: [['#/guides', 'Search the guides'], ['#/pre-foreclosures', 'Pre-foreclosures (not for sale)']] },
  { group: 'About', links: [['#/about', 'How it works'], ['#/disclaimer', 'How we help']] },
  { group: 'For professionals', links: [['#/advertise', 'Advertise on DeedOwl'], ['#/advertiser', 'Advertiser sign-in']] },
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
      <ThemeButton />
      <button ref={menuBtn} className="menu-btn" aria-expanded={open} aria-controls="site-nav" aria-label="Menu" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </header>
  );
}

const THEME_KEY = 'deedowl.theme';
const systemDark = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

/** Light/dark switch. Until someone picks, the site follows the device setting; picking the same mode
 *  as the device goes back to following it. */
function ThemeButton() {
  const [dark, setDark] = useState(() => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : systemDark();
  });
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (!document.documentElement.dataset.theme) setDark(mq.matches); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    const follow = next === systemDark();
    if (follow) delete root.dataset.theme;
    else root.dataset.theme = next ? 'dark' : 'light';
    try {
      if (follow) localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, root.dataset.theme!);
    } catch { /* private mode: applies to this visit only */ }
  };
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      )}
    </button>
  );
}
