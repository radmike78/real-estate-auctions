import { useState, type FormEvent } from 'react';
import { IconBadge, IconBank, IconHome, IconLock, IconPulse, IconSearch, IconShield, IconTools } from './Icons';

type Tab = 'properties' | 'agents' | 'financing' | 'pros';

const TABS: { key: Tab; label: string; placeholder: string; cta: string }[] = [
  { key: 'properties', label: 'Properties', placeholder: 'City, ZIP or address', cta: 'Search' },
  { key: 'agents', label: 'Find an agent', placeholder: 'Agent name or license #', cta: 'Look up' },
  { key: 'financing', label: 'Financing', placeholder: 'City or ZIP', cta: 'Find lenders' },
  { key: 'pros', label: 'Pros', placeholder: 'City or ZIP', cta: 'Find pros' },
];

const CARDS = [
  { href: '#/search', icon: <IconHome />, title: 'Properties', text: 'Auctions, foreclosures and tax sales' },
  { href: '#/agents', icon: <IconBadge />, title: 'Find an agent', text: 'Verify any license in seconds' },
  { href: '#/financing', icon: <IconBank />, title: 'Financing', text: 'Lenders for every credit situation' },
  { href: '#/pros', icon: <IconTools />, title: 'Title, insurance & repairs', text: 'Licensed pros to close and fix up' },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('properties');
  const [q, setQ] = useState('');
  const t = TABS.find((x) => x.key === tab)!;

  function go(e: FormEvent) {
    e.preventDefault();
    const v = encodeURIComponent(q.trim());
    const base = tab === 'properties' ? '#/search' : `#/${tab}`;
    window.location.hash = v ? `${base}?q=${v}` : base;
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <span className="eyebrow"><span className="live-dot" aria-hidden /> Clark County, NV</span>
          <h1>
            Distressed property,
            <br />
            <span className="grad">decoded.</span>
          </h1>
          <p className="hero-sub">Find forced sales. See what survives. Meet verified pros to close.</p>

          <div className="search-card">
            <div className="search-tabs" role="tablist" aria-label="Search for">
              {TABS.map((x) => (
                <button key={x.key} role="tab" aria-selected={tab === x.key} onClick={() => { setTab(x.key); setQ(''); }}>
                  {x.label}
                </button>
              ))}
            </div>
            <form className="search-row" onSubmit={go} role="search">
              <span className="search-icon" aria-hidden><IconSearch /></span>
              <input aria-label={t.placeholder} placeholder={t.placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
              <button type="submit">{t.cta}</button>
            </form>
          </div>
        </div>
      </section>

      <section className="tiles" aria-label="Explore">
        {CARDS.map((c) => (
          <a key={c.href} href={c.href} className="tile">
            <span className="tile-icon">{c.icon}</span>
            <span className="tile-title">{c.title}</span>
            <span className="tile-text">{c.text}</span>
            <span className="tile-arrow" aria-hidden>→</span>
          </a>
        ))}
      </section>

      <section className="trust" aria-label="Why trust it">
        <div><IconShield /><strong>Official sources</strong><span>.gov data, verified</span></div>
        <div><IconPulse /><strong>Always current</strong><span>Stale listings vanish</span></div>
        <div><IconLock /><strong>Tamper-proof</strong><span>Signed data</span></div>
      </section>
    </main>
  );
}
