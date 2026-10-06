import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { navigate, replaceAddress } from '../lib/nav';
import PageHero from './PageHero';
import { IconSearch } from './Icons';
import { highlight, searchGuides, type GuideIndex } from '../lib/guideSearch';
import OwlNote from './OwlNote';
import StatePicker from './StatePicker';
import { useMyState } from '../lib/myState';
import AdSpot from './AdSpot';

const TRY = ['Deposit', 'Redemption period', 'What survives an HOA foreclosure?', 'Cashier’s check', 'Occupied home', 'Title insurance'];

/** The search box on its own, for other pages (the Learn page) to send people here. */
export function GuideSearchForm({ initial = '', onSearch }: { initial?: string; onSearch?: (q: string) => void }) {
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  const go = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
    else navigate(`/guides?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form className="simple-search guide-search" onSubmit={go} role="search" aria-label="Search the guides">
      <span className="search-icon" aria-hidden><IconSearch /></span>
      <input
        type="search"
        aria-label="Search the guides"
        placeholder="Ask about deposits, liens, redemption…"
        value={q}
        maxLength={200}
        onChange={(e) => {
          setQ(e.target.value);
          onSearch?.(e.target.value);
        }}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default function GuidesPage({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [index, setIndex] = useState<GuideIndex | null>(null);
  const [failed, setFailed] = useState(false);

  // The index is built from the guide pages themselves, only once someone opens this page.
  useEffect(() => {
    let live = true;
    import('./guideIndex')
      .then((m) => live && setIndex(m.guideIndex()))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const search = (next: string) => {
    setQ(next);
    const t = next.trim();
    // Keep the address shareable without adding a history entry for every letter typed.
    replaceAddress(t ? `/guides?q=${encodeURIComponent(t)}` : '/guides');
  };

  const [mine] = useMyState();
  const results = useMemo(() => (index ? searchGuides(index, q, 20, mine) : null), [index, q, mine]);
  const searched = q.trim() !== '';

  return (
    <main className="page">
      <PageHero
        title={<>Search the <span className="grad">guides</span></>}
        sub="Answers from our guides, which are written from official sources and link to them."
      >
        <GuideSearchForm initial={q} onSearch={search} />
      </PageHero>

      <StatePicker label="Show my state’s guides first" />
      {failed && <p className="notice" role="alert">Search didn’t load. Refresh the page to try again.</p>}
      {!failed && !index && searched && <p className="muted" role="status">Loading the guides…</p>}

      {!searched && (
        <div className="guide-try">
          <h2 id="try-head" className="part-bar">Try one of these</h2>
          <div className="guide-try-list">
            {TRY.map((t) => (
              <button key={t} type="button" className="btn btn-secondary" onClick={() => search(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {results && searched && (
        <div className="guide-results-wrap" aria-live="polite">
          <h2 id="results-head" className="guide-count">
            {results.hits.length === 0
              ? 'No matches in our guides'
              : `${results.hits.length}${results.hits.length === 20 ? '+' : ''} ${results.hits.length === 1 ? 'section' : 'sections'} ${results.partial ? 'match some of your words' : 'match'}`}
          </h2>
          {results.hits.length === 0 ? (
            <OwlNote>Try fewer or different words, or <a href="#/playbooks">browse the guides</a>.</OwlNote>
          ) : (
            <ol className="guide-results">
              {results.hits.map((h) => (
                <li key={h.doc.href + h.doc.title} className="guide-hit">
                  <a className="guide-hit-link" href={h.doc.href}>
                    <span className="guide-hit-page">{h.doc.page}</span>
                    <span className="guide-hit-title">{h.doc.title} <span aria-hidden>→</span></span>
                  </a>
                  <p className="guide-hit-snippet">
                    {highlight(h.snippet, results.terms).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
                  </p>
                  {h.doc.sources.length > 0 && (
                    <details className="guide-hit-sources">
                      <summary>Sources ({Math.min(h.doc.sources.length, 3)})</summary>
                      {h.doc.sources.slice(0, 3).map((s, i) => (
                        <span key={s.url}>
                          {i > 0 && ' · '}
                          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
                        </span>
                      ))}
                    </details>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <p className="muted guide-note">
        Results are passages from DeedOwl’s own guides, matched to your words. Nothing is pulled from other websites or generated when you search, and we don’t keep what you search for. Rules, fees and dates change: always confirm in the current official notice.
      </p>
      <AdSpot spot="guides" />
    </main>
  );
}
