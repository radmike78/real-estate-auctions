import type { WhyPoint } from '../lib/lessons/types';

function Point({ p }: { p: WhyPoint }) {
  return (
    <li>
      <span className="why-who">{p.who}</span>
      <span className="why-text">{p.text}</span>
      {p.example && (
        <span className="why-example">
          <strong>Real example:</strong> {p.example}
          {p.source && <> <a href={p.source.url} target="_blank" rel="noopener noreferrer">{p.source.label} ↗</a></>}
        </span>
      )}
    </li>
  );
}

/** "Why you would / Why you wouldn't", side by side on wide screens and stacked on phones. */
export default function WhyBlock({ title, yes, no, yesLabel = 'Why you would', noLabel = 'Why you wouldn’t' }: { title?: string; yes: WhyPoint[]; no: WhyPoint[]; yesLabel?: string; noLabel?: string }) {
  return (
    <div className="why-block">
      {title && <h3 className="why-title">{title}</h3>}
      <div className="why-cols">
        <div className="why-col why-yes">
          <h4><span aria-hidden>✓</span> {yesLabel}</h4>
          <ul>{yes.map((p) => <Point key={p.text} p={p} />)}</ul>
        </div>
        <div className="why-col why-no">
          <h4><span aria-hidden>✕</span> {noLabel}</h4>
          <ul>{no.map((p) => <Point key={p.text} p={p} />)}</ul>
        </div>
      </div>
    </div>
  );
}
