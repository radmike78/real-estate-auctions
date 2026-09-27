import { useState, type FormEvent, type ReactNode } from 'react';
import { SALE_SEARCH, saleSearchHref } from '../lib/saleSearch';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { IconBank, IconCalendar, IconClock, IconFile, IconFlag, IconHome, IconLayers, IconPulse, IconSearch, IconShield, IconStar } from './Icons';
import { useLiveFeed } from '../data/live';
import { ago } from '../lib/time';

// A deliberately simple homepage: say what the site is for, one search, and one tile per type of
// sale. Details (checklists, rules, listings) live one click down, on the page each tile opens.
const ICONS: Record<string, ReactNode> = {
  tax: <IconFile />,
  foreclosure: <IconCalendar />,
  pre: <IconClock />,
  short: <IconHome />,
  reo: <IconBank />,
  hoa: <IconLayers />,
  sheriff: <IconFlag />,
  liens: <IconShield />,
};
const NOT_FOR_SALE = new Set(['pre', 'liens']);

export default function HomePage() {
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [cls, setCls] = useState<ClassFilter>('all');
  const live = useLiveFeed();
  const liveCount = live.properties.length;

  function go(e: FormEvent) {
    e.preventDefault();
    window.location.hash = saleSearchHref(type, q, cls);
  }

  return (
    <main className="home">
      <section className="hero simple-hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <span className="eyebrow"><span className="live-dot" aria-hidden /> Clark County, NV</span>
          <h1>
            Las Vegas foreclosures &amp; tax&nbsp;sales, <span className="grad">explained.</span>
          </h1>
          <p className="hero-tagline">Know the deal before you bid.</p>
          <p className="hero-sub">Find forced-sale properties from official sources, learn every step, and set your number before the auction.</p>

          <div className="hero-class"><ClassSwitch value={cls} onChange={setCls} label="Residential or commercial" /></div>
          <form className="simple-search" onSubmit={go} role="search" aria-label="Search forced-sale properties">
            <select aria-label="Type of sale" value={type} onChange={(e) => setType(e.target.value)}>
              {SALE_SEARCH.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <span className="search-icon" aria-hidden><IconSearch /></span>
            <input aria-label="City, ZIP or address" placeholder="City, ZIP or address" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <p className="promise">We show you how to spot a good deal, and when to walk away.</p>
        </div>
      </section>

      <section className="browse" aria-labelledby="browse-head">
        <h2 id="browse-head">Browse by type of sale</h2>
        <div className="browse-grid">
          {SALE_SEARCH.filter((o) => o.key !== 'all').map((o) => (
            <a key={o.key} href={saleSearchHref(o.key, '', cls)} className={`browse-tile${NOT_FOR_SALE.has(o.key) ? ' wait' : ''}`}>
              <span className="browse-icon" aria-hidden>{ICONS[o.key]}</span>
              <span className="browse-title">{o.label}</span>
              {NOT_FOR_SALE.has(o.key) && <span className="browse-tag">Not for sale yet</span>}
              <span className="browse-arrow" aria-hidden>→</span>
            </a>
          ))}
        </div>
        <nav className="browse-tools" aria-label="Learn before you buy">
          <a className="btn big browse-main" href="#/practice">Practice buying, hands-on →</a>
          <span className="browse-links">
            <a href="#/playbooks">How each sale works</a>
            <a href="#/calculator">Maximum bid calculator</a>
          </span>
        </nav>
        <ul className="browse-trust" aria-label="Why trust it">
          {live.result?.ok && liveCount > 0 && (
            <li className="trust-live"><IconPulse /> {liveCount} live {liveCount === 1 ? 'listing' : 'listings'}, checked {ago(live.result.feed.generatedAt)}</li>
          )}
          <li><IconShield /> Official government and lender sources only</li>
          <li><IconStar /> Free to use, no sign-up</li>
          <li><IconClock /> Expired listings hidden automatically</li>
        </ul>
      </section>
    </main>
  );
}
