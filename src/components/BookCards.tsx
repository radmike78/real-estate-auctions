import { useState } from 'react';
import { AMAZON_TAG, amazonUrl, coverFallback, coverUrl, type Book } from '../lib/books';
import '../styles/review-lessons.css';
import { useMyState } from '../lib/myState';
import { stateByCode } from '../lib/regions';

const rel = AMAZON_TAG ? 'sponsored noopener noreferrer' : 'noopener noreferrer';

/**
 * The cover from Amazon's image link, then Amazon's image server. If neither loads, a plain book tile with the title,
 * so every card keeps the same shape (we don't copy or hotlink covers from anywhere else).
 */
export function BookCover({ b }: { b: Book }) {
  const [src, setSrc] = useState<string | null>(() => coverUrl(b));
  return (
    <a className="book-cover" href={amazonUrl(b)} target="_blank" rel={rel} tabIndex={-1} aria-hidden>
      {src ? (
        <img
          src={src}
          alt=""
          width={150}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={(e) => {
            // Amazon's image link answers with a 1×1 pixel when it has no cover for the book.
            if (e.currentTarget.naturalWidth < 20) setSrc(src === coverFallback(b) ? null : coverFallback(b));
          }}
          onError={() => setSrc(src === coverFallback(b) ? null : coverFallback(b))}
        />
      ) : (
        <span className="book-tile">
          <span className="book-tile-title">{b.title.replace(/[:…].*$/, '')}</span>
          <span className="book-tile-author">{b.author.split(/,| and | with /)[0]}</span>
        </span>
      )}
    </a>
  );
}

/** One book: cover, title, what it covers, and a real button to Amazon (plus the Audible edition when there is one). */
export function BookCard({ b, top }: { b: Book; top?: string }) {
  const [st] = useMyState();
  // "Check Nevada, California, Arizona, Utah or Texas law" reads "check Texas law" once a state is chosen.
  const note = st && b.note ? b.note.replace('Nevada, California, Arizona, Utah or Texas', stateByCode(st)?.name ?? st) : b.note;
  return (
    <li className={`book-card${top ? ' book-top' : ''}`}>
      {top && <span className="book-top-label">{top}</span>}
      <BookCover b={b} />
      <div className="book-info">
        <strong className="book-title">{b.title}</strong>
        <span className="book-author">{b.author} · {b.edition}</span>
        <span>{b.about}</span>
        {note && <span className="book-note">{note}</span>}
        {b.audio && <span className="book-audio-tag">Also on Audible</span>}
        <span className="book-buttons">
          <a className="btn" href={amazonUrl(b)} target="_blank" rel={rel}>View on Amazon&nbsp;↗</a>
          {b.audio && <a className="btn btn-secondary" href={b.audio} target="_blank" rel={rel}>Audiobook&nbsp;↗</a>}
        </span>
      </div>
    </li>
  );
}

/** A row of book cards in the fixed book grid. */
export function BookGrid({ books, topIsbn, topLabel }: { books: Book[]; topIsbn?: string; topLabel?: string }) {
  return (
    <ul className="book-list book-grid">
      {books.map((b) => <BookCard key={b.isbn10} b={b} top={b.isbn10 === topIsbn ? topLabel : undefined} />)}
    </ul>
  );
}
