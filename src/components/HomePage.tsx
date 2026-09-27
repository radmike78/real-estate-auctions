import { useState, type FormEvent, type ReactNode } from 'react';
import { SALE_SEARCH, saleSearchHref } from '../lib/saleSearch';
import ClassSwitch from './ClassSwitch';
import type { ClassFilter } from '../lib/propertyClass';
import { IconBank, IconCalendar, IconClock, IconFile, IconFlag, IconHome, IconLayers, IconLock, IconPulse, IconSearch, IconShield, IconStar } from './Icons';

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
            Foreclosures, tax&nbsp;sales <span className="grad">&amp; short&nbsp;sales.</span>
          </h1>
          <p className="hero-sub">Find properties heading to a forced sale, and learn exactly how to buy them.</p>

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
          <a href="#/playbooks">How each sale works →</a>
          <a href="#/practice">Practice buying, hands-on →</a>
          <a href="#/calculator">Maximum bid calculator →</a>
        </nav>
        <ul className="browse-trust" aria-label="Why trust it">
          <li><IconStar /> Free to use, no sign-up</li>
          <li><IconShield /> Live tax sales straight from the County Treasurer</li>
          <li><IconPulse /> Expired listings hidden automatically</li>
          <li><IconLock /> Signed data, so altered copies are detected</li>
        </ul>
      </section>
    </main>
  );
}
