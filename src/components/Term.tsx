import { useId, useState, type ReactNode } from 'react';
import type { KeyTerm, Piece } from '../lib/terms';
import { Cited } from './Cited';

/** A term readers can tap to see what it means, right where they meet it. */
export function Term({ term, children }: { term: KeyTerm; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button type="button" className="term" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {children}
      </button>
      <span id={id} className="term-def" role="note" hidden={!open}>
        {' '}({term.meaning})
      </span>
    </>
  );
}

/** Text split by markTerms, with the marked terms tappable. */
export function Pieces({ pieces }: { pieces: Piece[] }) {
  return <>{pieces.map((p, i) => (typeof p === 'string' ? <Cited key={i} text={p} /> : <Term key={i} term={p.term}>{p.text}</Term>))}</>;
}
