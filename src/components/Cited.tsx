import { Fragment, type ReactNode } from 'react';
import { splitCites } from '../lib/cite';

/** Text with its statute citations in small, muted type. `plain` styles the non-citation parts (e.g. bold numbers). */
export function Cited({ text, plain }: { text: string; plain?: (s: string) => ReactNode }) {
  const parts = splitCites(text);
  if (parts.length === 1 && typeof parts[0] === 'string') return <>{plain ? plain(text) : text}</>;
  return <>{parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{plain ? plain(p) : p}</Fragment> : <cite key={i} className="cite">{p.cite}</cite>))}</>;
}
