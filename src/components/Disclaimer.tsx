import { DISCLAIMERS, type DisclaimerKind } from '../lib/disclaimers';

export default function Disclaimer({ kind, compact = false }: { kind: DisclaimerKind; compact?: boolean }) {
  const d = DISCLAIMERS[kind];
  return (
    // Paid-listing disclosures are fine print (CLAUDE.md): kept, but not as a box.
    <aside className={`disclaimer${compact ? ' compact' : ''}${kind === 'professionals' || kind === 'financing' ? ' fine' : ''}`} role="note" aria-label={d.title}>
      <strong>{d.title}.</strong> {d.text} <a href="#/about/not-in-scope">How DeedOwl works &amp; the details →</a>
    </aside>
  );
}
