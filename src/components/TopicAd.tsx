// Beside a Learn or Practice topic: our own short, unpaid editorial block about hiring that kind of professional,
// then one labeled advertiser box in the advertiser's own voice (an advertiser in the visitor's state, when they've
// picked one). The two are kept visually apart, and the editorial never names or points to the advertiser.
// Placed after a lesson's explanation, a drill's verdict or a finished practice-case step: never inside a question,
// its answer choices or its feedback.
import { useMemo } from 'react';
import { AD_FINE_PRINT, pickRandom } from '../lib/adPlans';
import { topicForPage, type AdTopic } from '../lib/adTopics';
import { LICENSE_LOOKUPS } from '../lib/licenseLookups';
import { useMyState } from '../lib/myState';
import { proGuideByKey } from '../lib/proGuide';
import { isListable, type Pro } from '../lib/pros';
import { stateByCode, type StateCode } from '../lib/regions';
import { AdCard, inArea, useAdImpressions } from './AdBoxes';
import { useMyArea } from '../lib/myArea';
import { useDirectory } from './ProDirectory';

function LicenseLinks({ topic, state }: { topic: AdTopic; state: StateCode }) {
  const name = stateByCode(state)?.name ?? state;
  const rows = topic.editorial.lookups.flatMap((k) => {
    const l = LICENSE_LOOKUPS[k]?.[state];
    return l ? [{ k, role: proGuideByKey(k)?.title ?? k, l }] : [];
  });
  if (!rows.length) return null;
  return (
    <div className="topic-help-check">
      <strong>Check the license before you hire.</strong> In {name}:
      <ul>
        {rows.map(({ k, role, l }) => (
          <li key={k}>
            {role}: {'note' in l ? l.note : <a href={l.url} target="_blank" rel="noopener noreferrer">{l.who} ↗</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One advertiser for this topic, picked at random on each page view among those who chose it. */
function TopicAdBox({ topic, pros }: { topic: AdTopic; pros: Pro[] }) {
  const ids = pros.filter((p) => p.tier === 'premium_plus' && p.adTopic === topic.key && topic.categories.includes(p.category) && isListable(p)).map((p) => p.id).join();
  const shown = useMemo(() => pickRandom(pros.filter((p) => ids.split(',').includes(p.id)), 1), [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  useAdImpressions(shown);
  if (!shown.length) return null;
  return (
    <aside className="ad-box topic-ad" aria-label="Advertisement">
      <div className="ad-box-label">Advertisement</div>
      <AdCard p={shown[0]} />
      <p className="ad-fine-print">{AD_FINE_PRINT}</p>
    </aside>
  );
}

export default function TopicAd({ lesson, drill, caseStage }: { lesson?: string; drill?: string; caseStage?: string }) {
  const topic = topicForPage({ lesson, drill, caseStage });
  return topic ? <TopicHelp key={topic.key} topic={topic} /> : null;
}

function TopicHelp({ topic }: { topic: AdTopic }) {
  const [st] = useMyState();
  const [area] = useMyArea();
  const { pros } = useDirectory();
  const e = topic.editorial;
  return (
    <section className="topic-help" aria-labelledby={`topic-help-${topic.key}`}>
      <h2 id={`topic-help-${topic.key}`}>{e.heading}</h2>
      <div className="topic-help-cols">
        <div className="topic-help-text">
          <p>{e.body}</p>
          <ul>{e.questions.map((q) => <li key={q}>{q}</li>)}</ul>
          <LicenseLinks topic={topic} state={st ?? 'NV'} />
          {!st && <p className="small muted">Investing in California, Arizona, Utah or Texas? <a href="#/pros">Your team</a> lists each state’s license lookups.</p>}
          <p className="topic-help-dir">
            {e.directories.map((d, i) => <span key={d.href}>{i > 0 && ' · '}<a href={d.href}>{d.label} →</a></span>)}
          </p>
        </div>
        <TopicAdBox topic={topic} pros={inArea(pros, area)} />
      </div>
    </section>
  );
}
