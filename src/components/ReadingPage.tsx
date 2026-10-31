import PathNext from './PathNext';
import PageHero from './PageHero';
import { LEARN_MODULES } from '../lib/learn';
import { AMAZON_TAG, BOOK_GROUPS } from '../lib/books';
import { useMarkStep } from '../lib/path';
import { BookCard, BookGrid } from './BookCards';

/** If you read one book: a broad, balanced introduction that covers every step. */
const TOP_PICK = '1394289707';

/** Learn, last lesson: recommended books, with the Amazon Associates disclosure when links carry a tag. */
export default function ReadingPage() {
  useMarkStep('learn');
  const n = LEARN_MODULES.findIndex((m) => m.key === 'reading') + 1;
  const top = BOOK_GROUPS.flatMap((g) => g.books).find((b) => b.isbn10 === TOP_PICK);
  return (
    <main className="page lesson reading-page">
      <PageHero
        top={<a href="#/learn">← All lessons</a>}
        eyebrow={<span className="eyebrow">After the {n - 1} lessons</span>}
        title="Recommended reading"
        sub="Books worth your time as a new investor, picked for plain, practical advice. No get-rich-quick titles or seminar sales pitches. Books with an Audible edition say so on the card."
      />
      {top && (
        <section className="book-group book-pick" aria-labelledby="bk-pick">
          <h2 id="bk-pick">If you read one book, start here</h2>
          <p className="muted">Not sure which to read first? This one is a broad, balanced introduction. After it, pick the topic you need next below.</p>
          <ul className="book-list book-grid book-grid-one">
            <BookCard b={top} top="Our top pick" />
          </ul>
        </section>
      )}
      {BOOK_GROUPS.map((g) => (
        <section key={g.topic} className="book-group" aria-labelledby={`bk-${g.topic}`}>
          <h2 id={`bk-${g.topic}`}>{g.topic}</h2>
          <BookGrid books={g.books.filter((b) => b.isbn10 !== TOP_PICK)} />
        </section>
      ))}
      <p className="muted book-foot">Also free: your public library, and the official sources listed in each lesson.</p>
      <p className="muted">You’ve reached the end of Learn.</p>
      <PathNext step="learn" />
      {AMAZON_TAG && <p className="fine-print">As an Amazon Associate, DeedOwl earns from qualifying purchases.</p>}
    </main>
  );
}
