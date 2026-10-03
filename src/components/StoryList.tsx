import type { Story } from '../lib/deep/types';

/** Real stories: what happened to other people, good and cautionary, each with its source. */
export default function StoryList({ stories }: { stories: Story[] }) {
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
              <a href={s.source.url} target="_blank" rel="noopener noreferrer">{s.source.label} ↗</a>
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
