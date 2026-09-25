import type { Playbook } from '../lib/playbooks';

const isExternal = (u: string) => /^https:\/\//.test(u);

/** The professionals a sale type needs, when each one comes in, and where to find a verified one. */
export default function TeamList({ team }: { team: Playbook['team'] }) {
  return (
    <ul className="team-list">
      {team.map((t) => (
        <li key={t.role}>
          <strong>{t.role}</strong>
          <span>{t.when}</span>
          {t.href && (isExternal(t.href)
            ? <a href={t.href} target="_blank" rel="noopener noreferrer">Find one ↗</a>
            : <a href={t.href}>Find a verified one →</a>)}
        </li>
      ))}
    </ul>
  );
}
