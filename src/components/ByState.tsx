import { STATES, type StateCode } from '../lib/regions';
import { dropStateLead, useMyState } from '../lib/myState';
import { Cited } from './Cited';
import OwlNote from './OwlNote';
import { phoneLinks } from './PhoneLinks';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** One state-specific line: text (each sentence names its state), with optional official links after it. */
export interface StateLine {
  /** A short label shown first in bold ("Free legal help"), so a reader can scan for what they need. */
  topic?: string;
  text: string;
  links?: [label: string, url: string][];
}
/** A part of a page that differs by state. A state without lines is left out (say so in `missing` instead). */
export type ByStateLines = Partial<Record<StateCode, StateLine[]>>;

/**
 * The lines for the visitor's state, or every state folded under its name when they haven't picked one.
 * Pair with <StatePicker /> near the top of the page.
 */
export default function ByState({ lines, missing, ordered }: { lines: ByStateLines; missing?: string; ordered?: boolean }) {
  const [mine] = useMyState();
  const show = STATES.filter((s) => !mine || s.code === mine);
  const List = ordered ? 'ol' : 'ul';
  return (
    <>
      {show.map((s) => {
        const xs = lines[s.code as StateCode];
        const body = xs && xs.length ? (
          <List className={ordered ? 'steps-rich' : undefined}>
            {xs.map((x) => (
              <li key={x.text}>
                {x.topic && <strong>{x.topic}: </strong>}<Cited text={dropStateLead(x.text, s.code as StateCode)} plain={phoneLinks} />
                {x.links?.map(([label, url]) => (
                  <span key={url}> {url.startsWith('#/') ? <a href={url}>{label}&nbsp;→</a> : <a href={url} {...ext}>{label}&nbsp;↗</a>}</span>
                ))}
              </li>
            ))}
          </List>
        ) : (
          <OwlNote>{missing ?? `Nothing specific to ${s.name} here yet.`}</OwlNote>
        );
        // One state picked: just its lines. No state picked: each state folded, so the page isn't a wall of text.
        return show.length > 1 ? (
          <details key={s.code} className="by-state">
            <summary className="by-state-head">{s.name}</summary>
            {body}
          </details>
        ) : (
          <div key={s.code} className="by-state">{body}</div>
        );
      })}
    </>
  );
}
