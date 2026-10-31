import { getMyArea } from '../lib/myArea';
import type { StateCode } from '../lib/regions';
import NarrowDown from './NarrowDown';
import { useLastActivity } from '../lib/journey';
import { guidesConfig } from '../lib/narrow';
import DrillDown, { Tile, type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { GuideSearchForm } from './GuidesPage';
import { SALE_ORDER } from '../practice/scenarios';
import { drillById } from '../practice/drills';
import { guideKey } from '../lib/narrow';

const PRACTICE_SALES = new Set<string>(SALE_ORDER);

/** The kind of sale a guide covers, the same across states ("txforeclosure" and "foreclosure" are both "foreclosure"). */
const kindOf = (key: string) => key.replace(/^(ca|az|ut|tx)(?=[a-z]{3})/, '').replace(/^taxlien$/, 'tax');

/** A hands-on drill for another state's guide, where one exists (trustee-sale-tx, tax-lien-az, hoa-sale-ca…). */
function stateDrill(p: Playbook): string | null {
  const st = stateOf(p);
  if (st === 'NV') return null;
  const s = st.toLowerCase();
  const kind = kindOf(p.key);
  const ids: Record<string, string[]> = {
    foreclosure: [`trustee-sale-${s}`],
    tax: [`tax-deed-${s}`, `tax-lien-${s}`, `tax-sale-${s}`],
    hoa: [`hoa-sale-${s}`],
    sheriff: [`sheriff-sale-${s}`],
  };
  return (ids[kind] ?? []).find((id) => drillById(id)) ?? null;
}

/** Key facts end with a period, like the sentences around them. */
const withPeriod = (t: string) => (/[.!?*]["”’]?$/.test(t.trim()) ? t : `${t.trim()}.`);

/** "Illustrative example: a postponed trustee sale" under an "Illustrative example" badge says it twice: keep the story's name. */
function exampleHeading(title: string) {
  const t = title.replace(/^(?:illustrative|fictional) example(?: \(fictional\))?:?\s*/i, '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'How it could play out';
}

/** Placeholders like "[date]" in a script, shown as blanks to fill in. */
export const hasBlanks = (t: string) => /\[[^\]]+\]/.test(t);

/** On the hub the page already names the chosen state, so the cards don't repeat it ("Most Texas home loans" → "Most home loans"). */
function withoutState(text: string, name: string) {
  return text
    .replace(new RegExp(`\\b([Aa]) ${name} (?=[AEIOUaeiou])`, 'g'), (_m, a: string) => `${a}n `)
    .replace(new RegExp(`\\b([Aa]n?) ${name} `, 'g'), '$1 ')
    .replace(new RegExp(` in ${name}\\b`, 'g'), '')
    .replace(new RegExp(`\\b${name} `, 'g'), '');
}
import TeamList from './TeamList';
import { IconBadge, IconBank, IconBuilding, IconCheckList, IconFile, IconFlag, IconGavel, IconHomeDown, IconHouses, IconLayers, IconPercent, IconReceipt, IconSteps } from './Icons';

/** Bold only the amounts and deadlines in a fact, so they stand out (bolding everything highlights nothing). */
function boldNumbers(text: string) {
  const re = /(\$[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%|\b\d+(?:–\d+)?[- ](?:business )?(?:days?|weeks?|months?|years?)\b)/gi;
  return text.split(re).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

/** An icon for each kind of sale ("catax" and "tax" are both tax sales), so the guide cards differ at a glance. */
function saleIcon(key: string) {
  const kind = key.replace(/^(ca|az|ut|tx)(?=[a-z]{3})/, '');
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
import { StateSelect } from './GuidesPage';
import { useMyState } from '../lib/myState';
import { STATES, stateByCode } from '../lib/regions';
import { fmtDate } from '../lib/status';
import { Cited } from './Cited';
import { saleDocsFor } from '../lib/saleDocs';
import SaleDocsPanel from './SaleDocsPanel';
import { useEffect } from 'react';
import { replaceAddress } from '../lib/nav';
import AdSpot from './AdSpot';

/** The right calculator for the kind of sale: a lien's yield, an offer on a listed home, or an auction bid. Links open
 * Analyze already set to this guide's state and kind of sale, in the reader's county when it's in that state. */
function calcNote(p: { key: string }) {
  const pre = p.key.match(/^(ca|az|ut|tx)(?=[a-z]{3})/)?.[1];
  const kind = p.key.replace(/^(ca|az|ut|tx)(?=[a-z]{3})/, '');
  const st = (pre ? pre.toUpperCase() : 'NV') as StateCode;
  const saleKind: Record<string, string> = { tax: 'taxSale', foreclosure: 'trustee', sheriff: 'court', hoa: 'hoa', irs: 'irs', reo: 'reo', short: 'short' };
  const area = getMyArea();
  const county = area?.state === st && area.county ? area.county : GUIDE_COUNTY[st];
  const href = (plan: string) => saleKind[kind] ? `#/analyze?${new URLSearchParams({ plan, state: st, county, kind: saleKind[kind] }).toString()}` : `#/analyze?plan=${plan}`;
  if (kind === 'sid' || kind === 'taxlien') return <>Work out what a certificate earns, counting the wait to be paid, with the <a href="#/analyze?plan=lien">lien calculator</a>.</>;
  if (kind === 'commercial') return <>Set your limit from the building’s income: <a href="#/analyze?plan=commercial">analyze this building’s income</a> (rent, vacancy, operating costs and replacement reserves). For a building you’ll renovate and resell, use <a href="#/analyze?plan=flip">fix and sell</a>.</>;
  if (kind === 'reo' || kind === 'short') return <>Set your maximum offer before you make one: <a href={href('rent')}>to keep and rent it</a>, or <a href={href('flip')}>to fix and sell it</a>.</>;
  return <>Set your limit before the sale: <a href={href('rent')}>to keep and rent it</a>, or <a href={href('flip')}>to fix and sell it</a>. When you’re ready, <a href="#/find-deals">find your county’s official sale list</a>.</>;
}

/** The county Analyze starts in for a guide's state, when the reader hasn't picked one there. */
const GUIDE_COUNTY: Record<StateCode, string> = { NV: 'Clark', CA: 'Los Angeles', AZ: 'Maricopa', UT: 'Salt Lake', TX: 'Harris' };

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
      key: 'documents',
      title: 'Documents and what to say',
      icon: <IconCheckList />,
      summary: `${saleDocsFor(p.key, stateOf(p)).length} documents to have, check or sign, and what to ask`,
      content: () => <SaleDocsPanel guideKey={p.key} state={stateOf(p)} />,
    },
    {
      key: 'what-survives',
      title: 'What the sale wipes out, and what stays',
      icon: <IconLayers />,
      tone: 'wait',
      summary: `${p.survives.mayStay.length} things that can stay with the property`,
      content: () => (
        <div className="survive-grid">
          <div className="survive-col good"><h3 className="guide-sub">Usually wiped out</h3><ul>{p.survives.wipedOut.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></div>
          <div className="survive-col bad"><h3 className="guide-sub">Can stay with the property</h3><ul>{p.survives.mayStay.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></div>
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
            <h3>{exampleHeading(p.example.title)}</h3>
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
              <li key={s.url}>{isExternal(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}&nbsp;↗</a> : <a href={s.url}>{s.label}&nbsp;→</a>}</li>
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
          eyebrow={<span className="eyebrow">{st ? `${st.name} law` : 'Nevada, California, Arizona, Utah and Texas'}</span>}
          title={<>Sale <span className="grad">guides</span></>}
          sub={st ? `How each kind of forced sale works in ${st.name}, step by step, and the mistakes that cost money.` : 'How each kind of forced sale works, step by step, and the mistakes that cost money. Choose your state to see only its guides.'}
        >
          <GuideSearchForm />
        </PageHero>
        <StateSelect label="Show guides for" />
        <NarrowDown config={guidesConfig(mine)} intro="Tell us how and what you want to buy, and we’ll point you to the guides to read first. Every guide is still listed below." />
        {playbook && <p className="notice" role="status">We couldn’t find that guide. Choose one below.</p>}
        {groups.map((g) => (
          <section key={g.code} className="guide-group" aria-label={`${g.name} guides`}>
            {!st && <h2 className="section-title">{g.name}{g.code === 'NV' ? ' (Clark County)' : ''}</h2>}
            <div className="drill-tiles">
              {guidesFor(g.code).map((x) => <Tile key={x.key} href={`#/playbooks/${x.key}`} icon={saleIcon(x.key)} title={x.short} summary={st ? withoutState(x.teaser ?? x.oneLine, st.name) : x.teaser ?? x.oneLine} />)}
            </div>
          </section>
        ))}
        <p className="walk-away-callout" role="note"><strong>No hype, no income promises.</strong> Many good decisions are the deals you walk away from.</p>
        <AdSpot spot="playbook" />
      </main>
    );
  }

  const base = `#/playbooks/${p.key}`;
  // A visitor who chose another state (e.g. Texas) and landed on a Nevada guide gets a link to their own state's guide.
  const mineName = mine && mine !== stateOf(p) ? stateByCode(mine)?.name : null;
  const mineGuide = mineName ? playbookByKey(guideKey(mine!, kindOf(p.key)) ?? '') : null;
  if (mineName) return (
    <main className="page">
      <h1>Open the guide for {mineName}</h1>
      <p>This link is outside your selected investing state. Choose the matching local guide before reviewing sale procedures.</p>
      <a className="btn" href={mineGuide ? `#/playbooks/${mineGuide.key}` : '#/playbooks'}>{mineGuide ? `Read ${mineGuide.title}` : 'Choose a local sale guide'} →</a>
    </main>
  );
  const drill = stateDrill(p);
  const s = sections(p);
  const open = s.some((x) => x.key === section);
  return (
    <main className="page">
      <PageHero
        compact={open}
        top={<a href={open ? base : '#/playbooks'}>{open ? `← ${stateByCode(stateOf(p))?.name ?? ''} ${p.short.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}` : '← All sale guides'}</a>}
        eyebrow={<span className="eyebrow">{stateOf(p) === 'NV' ? 'Nevada · Clark County · ' : ''}Reviewed {fmtDate(p.lastReviewed)}</span>}
        title={open ? <a className="title-link" href={base}>{p.title}</a> : p.title}
        sub={open ? undefined : p.oneLine}
      />
      {mineGuide && mineGuide.key !== p.key && (
        <p className="other-state-guide" role="note">
          This guide follows {stateByCode(stateOf(p))?.name ?? ''} law. You chose {mineName}: <a href={`#/playbooks/${mineGuide.key}`}>see {mineGuide.title}&nbsp;→</a>
        </p>
      )}
      {!open && (
        <>
          <div className="you-get">
            <span>What you get</span>
            <strong>{p.plain ?? p.youGet}</strong>
            {p.plain && (
              <details className="you-get-legal">
                <summary>In legal terms</summary>
                <p><Cited text={p.youGet} /></p>
              </details>
            )}
          </div>
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
        <section className="guide-group" aria-labelledby="glance-head">
          <h2 id="glance-head" className="section-title">The key facts</h2>
          <dl className="glance-facts guide-facts">
            {p.glance.filter((g) => g.label !== 'What you get').map((g) => <div key={g.label}><dt>{g.label}</dt><dd><Cited text={withPeriod(g.value)} plain={boldNumbers} /></dd></div>)}
          </dl>
        </section>
      )}
      {!open && <p className="muted playbook-note">{calcNote(p)}</p>}
      {!open && PRACTICE_SALES.has(p.key) && <p className="playbook-note"><a className="btn" href={`#/practice?sale=${p.key}`}>Practice this kind of sale (Nevada rules), hands-on&nbsp;→</a></p>}
      {!open && drill && <p className="playbook-note"><a className="btn" href={`#/practice/drills/${drill}`}>Practice this kind of sale with the {stateByCode(stateOf(p))?.name ?? ''} drill, hands-on&nbsp;→</a></p>}
      {!open && p.key === 'commercial' && <p className="playbook-note"><a className="btn btn-secondary" href="#/practice">Practice buying commercial property, hands-on&nbsp;→</a></p>}
      <AdSpot spot="playbook" />
    </main>
  );
}
