import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { AMAZON_TAG, amazonUrl, BOOK_GROUPS } from '../lib/books';
import { useMarkStep } from '../lib/path';

/** Learn, lesson 10: recommended books, with the Amazon Associates disclosure when links carry a tag. */
export default function ReadingPage() {
  useMarkStep('learn');
  const n = LEARN_MODULES.findIndex((m) => m.key === 'reading') + 1;
  return (
    <main className="page lesson">
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">Lesson {n} of {LEARN_MODULES.length}</span>}
        title="Recommended reading"
        sub="Books worth your time as a new investor, picked for plain, practical advice. No get-rich-quick titles or seminar sales pitches."
      />
      {BOOK_GROUPS.map((g) => (
        <section key={g.topic} className="book-group" aria-labelledby={`bk-${g.topic}`}>
          <h2 id={`bk-${g.topic}`}>{g.topic}</h2>
          <ul className="book-list">
            {g.books.map((b) => (
              <li key={b.isbn10} className="book-card">
                <strong className="book-title">{b.title}</strong>
                <span className="muted">{b.author} · {b.edition}</span>
                <span>{b.about}</span>
                {b.note && <span className="book-note">{b.note}</span>}
                <a href={amazonUrl(b)} target="_blank" rel={AMAZON_TAG ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}>View on Amazon ↗</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted book-foot">Also free: your public library, and the official sources listed in each lesson.</p>
      <nav className="path-next" aria-label="Next step">
        <span className="muted">Next: step 2 of 6</span>
        <a className="btn" href="#/decide">Decide →</a>
      </nav>
      {AMAZON_TAG && <p className="fine-print">As an Amazon Associate, DeedOwl earns from qualifying purchases.</p>}
    </main>
  );
}
