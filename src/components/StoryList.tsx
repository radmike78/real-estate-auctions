import type { Story } from '../lib/deep/types';

/** A source label the second time it appears in a list: just the outlet ("Bloomberg (via WealthManagement.com)"). */
const shortLabel = (label: string) => label.replace(/:.*$/, '');

function StoryCard({ s, place, repeat }: { s: Story; place?: string; repeat: boolean }) {
  return (
    <li className={`story-card story-${s.tone}-card`}>
      <span className="story-tags">
        <span className={`story-tone story-tone-${s.tone}`}>{s.tone === 'good' ? 'Worked out' : 'Went wrong, or needed care'}</span>
        {place && <span className="story-place">{place}</span>}
      </span>
      <span className="story-who">{s.who} · {s.year}</span>
      <strong className="story-title">{s.title}</strong>
      <p>{s.happened}</p>
      <p className="story-lesson"><strong>Lesson:</strong> {s.lesson}</p>
      <a href={s.source.url} target="_blank" rel="noopener noreferrer">{repeat ? `${shortLabel(s.source.label)} (same article)` : s.source.label}&nbsp;↗</a>
    </li>
  );
}

/**
 * Real stories: what happened to other people, good and cautionary, each with its source. By default in two columns
 * (worked / went wrong); `grid` puts them in one even grid, each card tagged with how it went and where (`placeOf`).
 */
export default function StoryList({ stories, grid, placeOf }: { stories: Story[]; grid?: boolean; placeOf?: (s: Story) => string | undefined }) {
  if (grid) {
    const seen = new Set<string>();
    const ordered = [...stories.filter((s) => s.tone === 'good'), ...stories.filter((s) => s.tone === 'caution')];
    return (
      <ul className="story-grid">
        {ordered.map((s) => {
          const repeat = seen.has(s.source.url);
          seen.add(s.source.url);
          return <StoryCard key={s.title} s={s} place={placeOf?.(s)} repeat={repeat} />;
        })}
      </ul>
    );
  }
  const good = stories.filter((s) => s.tone === 'good');
  const caution = stories.filter((s) => s.tone === 'caution');
  const col = (list: Story[], tone: Story['tone']) =>
    list.length > 0 && (
      <div className={`story-col story-${tone}`}>
        <h3>{tone === 'good' ? 'When it worked' : 'When it went wrong, or needed care'}</h3>
        <ul>
          {list.map((s) => (
            <li key={s.title} className="story-card">
              <span className="story-who">{s.who} · {s.year}</span>
              <strong className="story-title">{s.title}</strong>
              <p>{s.happened}</p>
              <p className="story-lesson"><strong>Lesson:</strong> {s.lesson}</p>
              <a href={s.source.url} target="_blank" rel="noopener noreferrer">{s.source.label}&nbsp;↗</a>
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="story-cols">
      {col(good, 'good')}
      {col(caution, 'caution')}
    </div>
  );
}
