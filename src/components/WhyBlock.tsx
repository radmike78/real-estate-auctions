import type { WhyPoint } from '../lib/lessons/types';
import { Cited } from './Cited';
import { forStateText, showFor, mentionsOtherState, useMyState } from '../lib/myState';

/** One reason. With a state picked, sentences and facts about other states are left out (see forStateText). */
function Point({ p }: { p: WhyPoint }) {
  const [st] = useMyState();
  const text = forStateText(st, p.text);
  if (!text) return null;
  const example = p.example && !mentionsOtherState(st, p.example) && showFor(st, p.example) ? forStateText(st, p.example) : '';
  return (
    <li>
      <span className="why-who">{p.who}</span>
      <span className="why-text"><Cited text={text} /></span>
      {example && (
        <span className="why-example">
          <strong>Fact:</strong> <Cited text={example} />
          {p.source && <> <a href={p.source.url} target="_blank" rel="noopener noreferrer">{p.source.label}&nbsp;↗</a></>}
        </span>
      )}
    </li>
  );
}

/** "Why you would / Why you wouldn't", side by side on wide screens and stacked on phones. */
export default function WhyBlock({ title, yes, no, yesLabel = 'Why you would', noLabel = 'Why you wouldn’t', more, level }: { title?: string; yes: WhyPoint[]; no: WhyPoint[]; yesLabel?: string; noLabel?: string; more?: { href: string; label: string }; /** The column headings' level, when the block sits under a heading other than an h2. */ level?: 3 | 4 }) {
  // One level below the block's own title, or below the page section's h2 when there's no title.
  const H = level ? (`h${level}` as 'h3' | 'h4') : title ? 'h4' : 'h3';
  return (
    <div className="why-block">
      {title && <h3 className="why-title">{title}</h3>}
      <div className="why-cols">
        <div className="why-col why-yes">
          <H className="why-head"><span aria-hidden>✓</span> {yesLabel}</H>
          <ul>{yes.map((p) => <Point key={p.text} p={p} />)}</ul>
        </div>
        <div className="why-col why-no">
          <H className="why-head"><span aria-hidden>✕</span> {noLabel}</H>
          <ul>{no.map((p) => <Point key={p.text} p={p} />)}</ul>
        </div>
      </div>
      {more && <p className="why-more"><a className="btn" href={more.href}>{more.label}&nbsp;→</a></p>}
    </div>
  );
}
