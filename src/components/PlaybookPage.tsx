import NarrowDown from './NarrowDown';
import { useLastActivity } from '../lib/journey';
import { guidesConfig } from '../lib/narrow';
import DrillDown, { Tile, type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { GuideSearchForm } from './GuidesPage';
import { SALE_ORDER } from '../practice/scenarios';

const PRACTICE_SALES = new Set<string>(SALE_ORDER);
import TeamList from './TeamList';
import { IconBadge, IconBank, IconBuilding, IconCheckList, IconFile, IconFlag, IconGavel, IconHomeDown, IconHouses, IconLayers, IconPercent, IconReceipt, IconSteps } from './Icons';

/** Bold only the amounts and deadlines in a fact, so they stand out (bolding everything highlights nothing). */
function boldNumbers(text: string) {
  const re = /(\$[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%|\b\d+(?:–\d+)?[- ](?:business )?(?:days?|weeks?|months?|years?)\b)/gi;
  return text.split(re).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

/** An icon for each kind of sale ("catax" and "tax" are both tax sales), so the guide cards differ at a glance. */
function saleIcon(key: string) {
  const kind = key.replace(/^(ca|az|ut)(?=[a-z]{3})/, '');
  if (kind === 'taxlien' || kind === 'sid') return <IconPercent />;
  if (kind === 'tax') return <IconReceipt />;
  if (kind === 'foreclosure') return <IconGavel />;
  if (kind === 'hoa') return <IconHouses />;
  if (kind === 'sheriff') return <IconBadge />;
  if (kind === 'irs') return <IconFlag />;
  if (kind === 'reo') return <IconBank />;
  if (kind === 'commercial') return <IconBuilding />;
  if (kind === 'short') return <IconHomeDown />;
  return <IconCheckList />;
}
import { guidesFor, playbookByKey, stateOf, type Playbook } from '../lib/playbooks';
import StatePicker from './StatePicker';
import { useMyState } from '../lib/myState';
import { STATES, stateByCode } from '../lib/regions';
import { fmtDate } from '../lib/status';
import { Cited } from './Cited';
import { useEffect } from 'react';
import { replaceAddress } from '../lib/nav';

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
          {p.steps.map((s) => <li key={s.title}><strong>{s.title}</strong><span><Cited text={s.detail} plain={boldNumbers} /></span></li>)}
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
          <div className="survive-col good"><h3>Usually wiped out</h3><ul>{p.survives.wipedOut.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></div>
          <div className="survive-col bad"><h3>Can stay with the property</h3><ul>{p.survives.mayStay.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></div>
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
            {p.mistakes.map((m) => <li key={m.mistake}><strong>{m.mistake}</strong> <Cited text={m.prevent} /></li>)}
          </ul>
          <aside className="example-card">
            <span className="example-tag">Illustrative example, not a real property</span>
            <h3>{p.example.title}</h3>
            <p><Cited text={p.example.story} /></p>
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
  useLastActivity(`#/playbooks/${playbook ?? ''}`, p ? `Guide: ${p.title}` : undefined);
  const [mine, setMine] = useMyState();
  // Links like /playbooks?state=CA (from the lessons) open that state's guides.
  useEffect(() => {
    if (p) return;
    const want = new URLSearchParams(window.location.search).get('state');
    const st = want ? stateByCode(want) : null;
    if (st) {
      setMine(st.code);
      replaceAddress('/playbooks');
    }
  }, [p, setMine]);

  if (!p) {
    const st = mine ? stateByCode(mine) : null;
    const groups = st ? [{ code: st.code, name: st.name }] : STATES.map((x) => ({ code: x.code, name: x.name }));
    return (
      <main className="page">
        <PageHero
          eyebrow={<span className="eyebrow">{st ? `${st.name} law` : 'Nevada, California, Arizona and Utah'}</span>}
          title={<>Sale <span className="grad">guides</span></>}
          sub={st ? `How each kind of forced sale works in ${st.name}, step by step, and the mistakes that cost money.` : 'How each kind of forced sale works, step by step, and the mistakes that cost money. Choose your state to see only its guides.'}
        >
          <GuideSearchForm />
        </PageHero>
        <StatePicker label="Show guides for" />
        <NarrowDown config={guidesConfig(mine)} intro="Tell us how and what you want to buy, and we’ll point you to the guides to read first. Every guide is still listed below." />
        {playbook && <p className="notice" role="status">We couldn’t find that guide. Choose one below.</p>}
        {groups.map((g) => (
          <section key={g.code} aria-label={`${g.name} guides`}>
            {!st && <h2 className="section-title">{g.name}{g.code === 'NV' ? ' (Clark County)' : ''}</h2>}
            <div className="drill-tiles">
              {guidesFor(g.code).map((x) => <Tile key={x.key} href={`#/playbooks/${x.key}`} icon={saleIcon(x.key)} title={x.short} summary={x.oneLine} />)}
            </div>
          </section>
        ))}
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
        top={<a href={open ? base : '#/playbooks'}>{open ? `← ${stateByCode(stateOf(p))?.name ?? ''} ${p.short.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}` : '← All sale guides'}</a>}
        eyebrow={<span className="eyebrow">{stateByCode(stateOf(p))?.name} guide{stateOf(p) === 'NV' ? ' · Clark County' : ''} · reviewed {fmtDate(p.lastReviewed)}</span>}
        title={open ? <a className="title-link" href={base}>{p.title}</a> : p.title}
        sub={open ? undefined : p.oneLine}
      />
      {!open && (
        <>
          <div className="you-get"><span>What you get</span><strong>{p.plain ?? p.youGet}</strong>{p.plain && <small>In legal terms: {p.youGet}</small>}</div>
          {/* The most costly mistake goes on the first screen, not one click deep: risks stay visible for everyone. */}
          {p.mistakes[0] && (
            <p className="top-mistake" role="note">
              <strong>Mistake to avoid: {p.mistakes[0].mistake.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}.</strong> <Cited text={p.mistakes[0].prevent} />
            </p>
          )}
        </>
      )}
      {/* The step-by-step tiles come before the fact cards, so beginners see the way in first. */}
      <DrillDown sections={s} active={section} baseHref={base} label={`${p.short} guide`} />
      {!open && (
        <section aria-labelledby="glance-head">
          <h2 id="glance-head" className="section-title">The key facts</h2>
          <dl className="glance-facts">
            {p.glance.filter((g) => g.label !== 'What you get').map((g) => <div key={g.label}><dt>{g.label}</dt><dd><Cited text={g.value} plain={boldNumbers} /></dd></div>)}
          </dl>
        </section>
      )}
      {!open && <p className="muted playbook-note">Set your limit before the sale with the <a href="#/analyze?plan=flip">maximum bid calculator</a>.</p>}
      {!open && PRACTICE_SALES.has(p.key) && <p className="playbook-note"><a className="btn" href={`#/practice?sale=${p.key}`}>Practice this kind of sale, hands-on →</a></p>}
      {!open && p.key === 'commercial' && <p className="playbook-note"><a className="btn btn-secondary" href="#/practice">Practice buying commercial property, hands-on →</a></p>}
    </main>
  );
}
