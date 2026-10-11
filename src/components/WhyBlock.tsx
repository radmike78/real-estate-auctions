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
export default function WhyBlock({ title, yes, no, yesLabel = 'Why you would', noLabel = 'Why you wouldn’t', more }: { title?: string; yes: WhyPoint[]; no: WhyPoint[]; yesLabel?: string; noLabel?: string; more?: { href: string; label: string } }) {
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
      {more && <p className="why-more"><a className="btn" href={more.href}>{more.label}&nbsp;→</a></p>}
    </div>
  );
}
