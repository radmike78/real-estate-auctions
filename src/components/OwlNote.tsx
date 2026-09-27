import type { ReactNode } from 'react';

/** The DeedOwl mascot with a short message, for empty results and not-found pages. */
export default function OwlNote({ children }: { children: ReactNode }) {
  return (
    <div className="owl-note">
      <img src="logo.svg" alt="" width={56} height={56} />
      <p>{children}</p>
    </div>
  );
}
