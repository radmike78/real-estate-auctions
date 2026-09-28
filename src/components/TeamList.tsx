import type { Playbook } from '../lib/playbooks';

const isExternal = (u: string) => /^https:\/\//.test(u);

/** The professionals a sale type needs, when each one comes in, and how to find one. */
export default function TeamList({ team }: { team: Playbook['team'] }) {
  return (
    <ul className="team-list">
      {team.map((t) => (
        <li key={t.role}>
          <strong>{t.role}</strong>
          <span>{t.when}</span>
          {t.href && (isExternal(t.href)
            ? <a href={t.href} target="_blank" rel="noopener noreferrer">Find one ↗</a>
            : <a href={t.href}>How to find one →</a>)}
        </li>
      ))}
    </ul>
  );
}
