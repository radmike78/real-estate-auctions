import DrillDown, { Tile, type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { GuideSearchForm } from './GuidesPage';
import { SALE_ORDER } from '../practice/scenarios';

const PRACTICE_SALES = new Set<string>(SALE_ORDER);
import TeamList from './TeamList';
import { IconBadge, IconCheckList, IconFile, IconFlag, IconLayers, IconSteps } from './Icons';
import { PLAYBOOKS, playbookByKey, type Playbook } from '../lib/playbooks';
import { fmtDate } from '../lib/status';

const isExternal = (u: string) => /^https:\/\//.test(u);

export function sections(p: Playbook): DrillSection[] {
  return [
    {
      key: 'steps',
      title: 'Step by step',
      icon: <IconSteps />,
      summary: `${p.steps.length} steps, from finding it to taking possession`,
      content: () => (
        <ol className="steps-rich">
          {p.steps.map((s) => <li key={s.title}><strong>{s.title}</strong><span>{s.detail}</span></li>)}
        </ol>
      ),
    },
    {
      key: 'what-survives',
      title: 'What the sale wipes out, and what stays',
      icon: <IconLayers />,
      tone: 'wait',
      summary: `${p.survives.mayStay.length} things that can stay with the property`,
      content: () => (
        <div className="survive-grid">
          <div className="survive-col good"><h3>Usually wiped out</h3><ul>{p.survives.wipedOut.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="survive-col bad"><h3>Can stay with the property</h3><ul>{p.survives.mayStay.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <p className="muted survive-note">Lien priority is a legal question. Confirm with a title company or real estate attorney before you bid.</p>
        </div>
      ),
    },
    {
      key: 'mistakes',
      title: 'Costly mistakes, and how to avoid them',
      icon: <IconFlag />,
      tone: 'stop',
      summary: `${p.mistakes.length} mistakes buyers make, plus a walk-away example`,
      content: () => (
        <>
          <ul className="risk-list">
            {p.mistakes.map((m) => <li key={m.mistake}><strong>{m.mistake}</strong> {m.prevent}</li>)}
          </ul>
          <aside className="example-card">
            <span className="example-tag">Illustrative example, not a real property</span>
            <h3>{p.example.title}</h3>
            <p>{p.example.story}</p>
            <p className="example-lesson"><strong>Lesson:</strong> {p.example.lesson}</p>
          </aside>
        </>
      ),
    },
    {
      key: 'team',
      title: 'Your team',
      icon: <IconBadge />,
      summary: `${p.team.length} professionals, and when you need each one`,
      content: () => <TeamList team={p.team} />,
    },
    {
      key: 'sources',
      title: 'Official sources',
      icon: <IconFile />,
      summary: `${p.sources.length} official pages · reviewed ${fmtDate(p.lastReviewed)}`,
      content: () => (
        <>
          <ul className="source-links">
            {p.sources.map((s) => (
              <li key={s.url}>{isExternal(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a> : <a href={s.url}>{s.label} →</a>}</li>
            ))}
          </ul>
          <p className="muted">Last reviewed {fmtDate(p.lastReviewed)}. Rules, fees and dates change: always confirm in the current official notice.</p>
        </>
      ),
    },
  ];
}

export default function PlaybookPage({ playbook, section }: { playbook?: string; section?: string }) {
  const p = playbook ? playbookByKey(playbook) : null;

  if (!p) {
    return (
      <main className="page">
        <PageHero
          eyebrow={<span className="eyebrow">Clark County · Nevada law</span>}
          title={<>How each sale <span className="grad">works</span></>}
          sub="Every kind of forced sale in Clark County, step by step, and the mistakes that cost money."
        >
          <GuideSearchForm />
        </PageHero>
        {playbook && <p className="notice" role="status">We couldn’t find that guide. Choose one below.</p>}
        <div className="drill-tiles">
          {PLAYBOOKS.map((x) => <Tile key={x.key} href={`#/playbooks/${x.key}`} icon={<IconCheckList />} title={x.short} summary={x.oneLine} />)}
        </div>
        <p className="muted playbook-note">No hype, no income promises. Many good decisions are the deals you walk away from.</p>
      </main>
    );
  }

  const base = `#/playbooks/${p.key}`;
  const s = sections(p);
  const open = s.some((x) => x.key === section);
  return (
    <main className="page">
      <PageHero
        compact={open}
        top={<a href={open ? base : '#/playbooks'}>{open ? `← ${p.short} playbook` : '← All guides'}</a>}
        eyebrow={<span className="eyebrow">Nevada guide · reviewed {fmtDate(p.lastReviewed)}</span>}
        title={open ? <a className="title-link" href={base}>{p.title}</a> : p.title}
        sub={open ? undefined : p.oneLine}
      />
      {!open && (
        <>
          <div className="you-get"><span>What you get</span><strong>{p.youGet}</strong></div>
          <dl className="glance-facts">
            {p.glance.map((g) => <div key={g.label}><dt>{g.label}</dt><dd>{g.value}</dd></div>)}
          </dl>
        </>
      )}
      <DrillDown sections={s} active={section} baseHref={base} label={`${p.short} guide`} />
      {!open && <p className="muted playbook-note">Set your limit before the sale with the <a href="#/calculator">maximum bid calculator</a>.</p>}
      {!open && PRACTICE_SALES.has(p.key) && <p className="playbook-note"><a className="btn" href={`#/practice?sale=${p.key}`}>Practice this kind of sale, hands-on →</a></p>}
      {!open && p.key === 'commercial' && <p className="playbook-note"><a className="btn btn-secondary" href="#/practice">Practice buying commercial property, hands-on →</a></p>}
    </main>
  );
}
