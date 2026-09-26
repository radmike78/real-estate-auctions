import { DISCLAIMERS, type DisclaimerKind } from '../lib/disclaimers';

export default function Disclaimer({ kind, compact = false }: { kind: DisclaimerKind; compact?: boolean }) {
  const d = DISCLAIMERS[kind];
  return (
    <aside className={`disclaimer${compact ? ' compact' : ''}`} role="note" aria-label={d.title}>
      <strong>{d.title}.</strong> {d.text} <a href="#/disclaimer/not-in-scope">How we help &amp; the details →</a>
    </aside>
  );
}
