import { useState, type FormEvent } from 'react';
import { SALE_SEARCH, saleSearchHref } from '../lib/saleSearch';
import { IconBadge, IconBank, IconLock, IconPulse, IconSearch, IconShield, IconTools } from './Icons';

const HELPERS = [
  { href: '#/agents', icon: <IconBadge />, title: 'Find an agent', text: 'Verify any license in seconds' },
  { href: '#/financing', icon: <IconBank />, title: 'Financing', text: 'Lenders for every credit situation' },
  { href: '#/pros', icon: <IconTools />, title: 'Title, insurance & repairs', text: 'Licensed pros to close and fix up' },
];

export default function HomePage() {
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const selected = SALE_SEARCH.find((o) => o.key === type)!;

  function go(e: FormEvent) {
    e.preventDefault();
    window.location.hash = saleSearchHref(type, q);
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <span className="eyebrow"><span className="live-dot" aria-hidden /> Clark County, NV</span>
          <h1>
            Foreclosures, tax&nbsp;sales
            <br />
            <span className="grad">&amp; short&nbsp;sales.</span>
          </h1>
          <p className="hero-sub">Properties heading to a forced sale, what you'd really be buying, and how to buy them.</p>

          <form className="search-card" onSubmit={go} role="search" aria-label="Search forced-sale properties">
            <div className="sale-chips" role="radiogroup" aria-label="Type of sale">
              {SALE_SEARCH.map((o) => (
                <button key={o.key} type="button" role="radio" aria-checked={type === o.key} className={`sale-chip${o.key === 'liens' ? ' muted-chip' : ''}`} onClick={() => setType(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
            <div className="search-row">
              <span className="search-icon" aria-hidden><IconSearch /></span>
              <input aria-label="City, ZIP or address" placeholder="City, ZIP or address (optional)" value={q} onChange={(e) => setQ(e.target.value)} />
              <button type="submit">Search</button>
            </div>
            <p className="search-hint">{selected.hint}</p>
          </form>
        </div>
      </section>

      <section className="helpers" aria-label="Help to buy">
        <h2>Everything you need to buy</h2>
        <div className="tiles">
          {HELPERS.map((c) => (
            <a key={c.href} href={c.href} className="tile">
              <span className="tile-icon">{c.icon}</span>
              <span className="tile-title">{c.title}</span>
              <span className="tile-text">{c.text}</span>
              <span className="tile-arrow" aria-hidden>→</span>
            </a>
          ))}
        </div>
      </section>

      <section className="trust" aria-label="Why trust it">
        <div><IconShield /><strong>Official sources</strong><span>.gov data, verified</span></div>
        <div><IconPulse /><strong>Always current</strong><span>Stale listings vanish</span></div>
        <div><IconLock /><strong>Tamper-proof</strong><span>Signed data</span></div>
      </section>
    </main>
  );
}
