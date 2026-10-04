import { STATES, type StateCode } from '../lib/regions';
import { useMyState } from '../lib/myState';
import { Cited } from './Cited';
import OwlNote from './OwlNote';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** One state-specific line: text (each sentence names its state), with optional official links after it. */
export interface StateLine {
  text: string;
  links?: [label: string, url: string][];
}
/** A part of a page that differs by state. A state without lines is left out (say so in `missing` instead). */
export type ByStateLines = Partial<Record<StateCode, StateLine[]>>;

/**
 * The lines for the visitor's state, or every state under its own heading when they haven't picked one.
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
        return (
          <div key={s.code} className="by-state">
            {show.length > 1 && <h3 className="by-state-head">{s.name}</h3>}
            {xs && xs.length ? (
              <List className={ordered ? 'steps-rich' : undefined}>
                {xs.map((x) => (
                  <li key={x.text}>
                    <Cited text={x.text} />
                    {x.links?.map(([label, url]) => (
                      <span key={url}> <a href={url} {...ext}>{label} ↗</a></span>
                    ))}
                  </li>
                ))}
              </List>
            ) : (
              <OwlNote>{missing ?? `Nothing specific to ${s.name} here yet.`}</OwlNote>
            )}
          </div>
        );
      })}
    </>
  );
}
