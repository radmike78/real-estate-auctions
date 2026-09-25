import { useState, type FormEvent, type ReactNode } from 'react';
import { SALE_SEARCH, saleSearchHref } from '../lib/saleSearch';
import { CHECKLISTS } from '../lib/buyerChecklists';
import BuyerChecklistBox from './BuyerChecklistBox';
import { IconBadge, IconBank, IconHome, IconLock, IconPulse, IconSearch, IconShield, IconTools } from './Icons';

const HELP: { href: string; icon: ReactNode; label: string }[] = [
  { href: '#/agents', icon: <IconBadge />, label: 'Find an agent' },
  { href: '#/financing', icon: <IconBank />, label: 'Financing' },
  { href: '#/pros', icon: <IconTools />, label: 'Title, insurance & repairs' },
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
      <section className="hero hero-band">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <span className="eyebrow"><span className="live-dot" aria-hidden /> Clark County, NV</span>
          <h1>
            Foreclosures, tax&nbsp;sales <span className="grad">&amp; short&nbsp;sales.</span>
          </h1>
          <p className="hero-sub">Properties heading to a forced sale, what you'd really be buying, and how to buy them.</p>
        </div>
      </section>

      <div className="home-app">
        <aside className="home-side" aria-label="Browse">
          <div className="side-group">
            <h2 className="side-heading"><IconHome /> Find property</h2>
            <div className="side-tabs" role="tablist" aria-orientation="vertical" aria-label="Type of sale">
              {SALE_SEARCH.map((o) => (
                <button
                  key={o.key}
                  role="tab"
                  aria-selected={type === o.key}
                  aria-controls="home-panel"
                  className={`side-tab${o.key === 'liens' || o.key === 'pre' ? ' not-sale' : ''}`}
                  onClick={() => setType(o.key)}
                >
                  {o.label}
                  {(o.key === 'pre' || o.key === 'liens') && <span className="side-note">not for sale yet</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="side-group">
            <h2 className="side-heading">Help to buy</h2>
            <nav className="side-links" aria-label="Help to buy">
              {HELP.map((h) => (
                <a key={h.href} href={h.href} className="side-link">
                  <span className="side-link-icon">{h.icon}</span>
                  {h.label}
                  <span className="side-arrow" aria-hidden>→</span>
                </a>
              ))}
            </nav>
          </div>

          <ul className="side-trust" aria-label="Why trust it">
            <li><IconShield /> Official .gov sources</li>
            <li><IconPulse /> Stale listings vanish</li>
            <li><IconLock /> Tamper-proof data</li>
          </ul>
        </aside>

        <section className="home-main" id="home-panel" role="tabpanel" aria-label={selected.label}>
          <div className="home-main-head">
            <h2>{selected.label}</h2>
            <p>{selected.hint}</p>
          </div>
          <form className="search-row big" onSubmit={go} role="search" aria-label={`Search ${selected.label}`}>
            <span className="search-icon" aria-hidden><IconSearch /></span>
            <input aria-label="City, ZIP or address" placeholder="City, ZIP or address (optional)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit">{selected.route ? 'Open' : 'Search'}</button>
          </form>
          <BuyerChecklistBox list={CHECKLISTS[type] ?? CHECKLISTS.all} variant="wide" />
        </section>
      </div>
    </main>
  );
}
