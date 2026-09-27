import type { ReactNode } from 'react';

/** The DeedOwl mascot with a short message, for empty results and not-found pages. */
export default function OwlNote({ children, big }: { children: ReactNode; big?: boolean }) {
  return (
    <div className={`owl-note${big ? ' big' : ''}`}>
      <img src="logo.svg" alt="" width={big ? 128 : 56} height={big ? 128 : 56} />
      <p>{children}</p>
    </div>
  );
}
