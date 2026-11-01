import { workStorage as localStorage } from '../lib/workStorage';
import { useState, type ReactElement } from 'react';
import PageHero from './PageHero';
import DrillDown, { type DrillSection } from './DrillDown';
import TeamList from './TeamList';
import ProDirectory, { useDirectory } from './ProDirectory';
import { FeaturedAds, RotatingAd } from './AdBoxes';
import { AreaLine } from './AreaPicker';
import Disclaimer from './Disclaimer';
import { IconBadge, IconBank, IconCalc, IconClock, IconFile, IconHome, IconLayers, IconLock, IconPercent, IconPulse, IconSearch, IconShield, IconTools } from './Icons';
import { guidesFor } from '../lib/playbooks';
import { roadmapPath } from '../lib/roadmapState';
import { CURRENT_KEY, type Deal } from '../lib/analyze';
import { guideKeyFor } from '../lib/dealPacket';
import { STATES, stateByCode, type StateCode } from '../lib/regions';
import { LICENSE_LOOKUPS, type Lookup } from '../lib/licenseLookups';
import { useMyState, forStateText, showFor, mentionsOtherState } from '../lib/myState';
import { useMarkStep, stepEyebrow } from '../lib/path';
import PathNext from './PathNext';
import { PRO_GUIDES, proGuideByKey, type ProGuide, type ProKey } from '../lib/proGuide';
import WhyBlock from './WhyBlock';
import { PRO_WHY } from '../lib/proWhy';
import { PRO_DEEP } from '../lib/deep/proDeep';
import type { Story } from '../lib/deep/types';
import { cleanBuyBox, type BuyBox } from '../lib/toolkit';
import TeamBuilder from './TeamBuilder';
import { Cited } from './Cited';
import { useLastActivity } from '../lib/journey';
import { PRO_SCRIPTS } from '../lib/proScripts';

/** Buying a listed home: the agent, the lender, the inspector, then title, insurance and someone to manage it. */
const LISTING_TEAM: ProKey[] = ['agent', 'lender', 'inspector', 'title', 'insurance', 'property_manager'];

const ICONS: Record<ProKey, ReactElement> = {
  agent: <IconHome />, lender: <IconBank />, private_lender: <IconClock />, title: <IconFile />, attorney: <IconBadge />, inspector: <IconSearch />,
  contractor: <IconTools />, insurance: <IconShield />, cpa: <IconPercent />, property_manager: <IconLayers />, eviction: <IconLock />, environmental: <IconPulse />, appraiser: <IconCalc />,
};

/** Keeps an arrow on the same line as the word before it. */
const NBSP = ' ';
const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z“"])/).filter(Boolean);
/** The sentences of `text` not already said in `said` (compared by their opening words), so a fact is said once. */
const unsaid = (text: string, said: string) => sentences(text).filter((x) => !said.toLowerCase().includes(x.slice(0, 50).replace(/[.:]$/, '').toLowerCase())).join(' ');

/** Where to check a license: the visitor's own state, or every state when they haven't picked one. */
function LicenseCheck({ lookups, state, said }: { lookups: Record<StateCode, Lookup>; state: StateCode | null; said: string }) {
  const show = (state ? [state] : STATES.map((x) => x.code)).map((c) => [c, lookups[c]] as const);
  const line = (l: Lookup) => ('note' in l ? (
    <>{unsaid(l.note, said)}{l.links?.map((x) => <span key={x.url}> <a href={x.url} target="_blank" rel="noopener noreferrer">{x.who}{NBSP}↗</a></span>)}</>
  ) : <>Look them up with the {l.who}. <a href={l.url} target="_blank" rel="noopener noreferrer">Open the official lookup{NBSP}↗</a></>);
  return (
    <div className="pro-guide-tip">
      <strong>Official license lookup:</strong>{' '}
      {show.length === 1 ? line(show[0][1]) : (
        <ul>{show.map(([c, l]) => <li key={c}><strong>{stateByCode(c)?.name}:</strong> {line(l)}</li>)}</ul>
      )}
    </div>
  );
}

/** "Showing Texas · Change state": with a state picked, other states' rules are hidden; this switches state, or back to all. */
function StateLine() {
  const [st, setSt] = useMyState();
  if (!st) return null;
  return (
    <p className="pro-state-line">
      <span>Showing <strong>{stateByCode(st)?.name}</strong> rules and stories</span>
      <label>
        Change state{' '}
        <select value={st} onChange={(e) => setSt((e.target.value || null) as StateCode | null)}>
          {STATES.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
          <option value="" disabled>Choose a state</option>
        </select>
      </label>
    </p>
  );
}

const OTHER_PLACES = /Alabama|Alaska|Arkansas|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Denver/;
const COVERED: [RegExp, StateCode][] = [[/Nevada/, 'NV'], [/California/, 'CA'], [/Arizona/, 'AZ'], [/Utah/, 'UT'], [/Texas/, 'TX']];
/** Where a story happened: one of our states, a federal case that applies everywhere, or a state we don't cover. */
function storyScope(s: Story): StateCode[] | 'nationwide' | 'outside' {
  if (/U\.S\. Tax Court/.test(s.who)) return 'nationwide';
  const covered = COVERED.filter(([re]) => re.test(s.who)).map(([, c]) => c);
  if (covered.length) return covered;
  return OTHER_PLACES.test(s.who) ? 'outside' : 'nationwide';
}

/** A story that quotes interest rates (e.g. "offered 5.25%"). */
const RATE_STORY = /\brates?\b[^.]*\d(?:\.\d+)?%|\d(?:\.\d+)?%[^.]*\brates?\b/i;

function StoryCard({ s }: { s: Story }) {
  const scope = storyScope(s);
  return (
    <li className={`story-card story-card-${s.tone}`}>
      <span className="story-tags">
        <span className={`story-tag tag-${s.tone}`}>{s.tone === 'good' ? 'When it worked' : 'When it went wrong'}</span>
        {scope === 'nationwide' && <span className="story-tag tag-scope">Nationwide</span>}
        {scope === 'outside' && <span className="story-tag tag-scope">Outside our states</span>}
        {/* Dated where everyone sees it: a mortgage rate from years ago isn't today's rate. */}
        <span className="story-tag tag-date">{RATE_STORY.test(`${s.title} ${s.happened}`) ? `Rates as of ${s.year}, not today’s` : `From ${s.year}`}</span>
      </span>
      <span className="story-who">{s.who} · {s.year}</span>
      <strong className="story-title">{s.title}</strong>
      <p>{s.happened}</p>
      <p className="story-lesson"><strong>Lesson:</strong> {s.lesson}</p>
      <a href={s.source.url} target="_blank" rel="noopener noreferrer">{s.source.label}{NBSP}↗</a>
    </li>
  );
}

/**
 * Real stories in one grid, each tagged (worked or went wrong; nationwide; outside our states). With a state picked, its
 * own and nationwide stories show, and the rest wait under "From other states" (shown directly when there are no others).
 */
function ProStories({ stories, state }: { stories: Story[]; state: StateCode | null }) {
  const order = (xs: Story[]) => [...xs.filter((s) => s.tone === 'good'), ...xs.filter((s) => s.tone === 'caution')];
  const mine = (s: Story) => {
    const sc = storyScope(s);
    return sc === 'nationwide' || (Array.isArray(sc) && (!state || sc.includes(state)));
  };
  const own = order(stories.filter((story) => mine(story) && !mentionsOtherState(state, JSON.stringify(story))));
  const grid = (xs: Story[]) => <ul className="story-grid">{xs.map((s) => <StoryCard key={s.title} s={s} />)}</ul>;
  return own.length ? grid(own) : <p className="muted">We don’t have a local story for this topic yet. Use the guidance and official sources for your selected state.</p>;
}

/** The saved buy box, when there is one, to fill the agent script's blanks. */
function readBuyBox(): BuyBox | null {
  try {
    const raw = localStorage.getItem('deedowl.buybox.v1');
    return raw ? cleanBuyBox(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** A script with its [blanks] shown as fill-in blanks, filled from the buy box where that's plain. */
function Script({ say, fills }: { say: string; fills: Record<string, string> }) {
  return (
    <blockquote className="roadmap-script pro-script-quote">
      {say.split(/(\[[^\]]+\])/).map((x, i) => {
        const m = x.match(/^\[([^\]]+)\]$/);
        if (!m) return x;
        const filled = fills[m[1]];
        return <span key={i} className={`fill-blank${filled ? ' filled' : ''}`} title={filled ? `From your buy box (${m[1]})` : 'Fill this in'}>{filled ?? m[1]}</span>;
      })}
    </blockquote>
  );
}

// Each state's lawyer-licensing body, by its own name, for "check the lawyer's license" lines once a state is chosen.
const ALL_BARS = 'the State Bar of Nevada, California, Arizona, Utah or Texas';
const BAR: Record<string, string> = { NV: 'the State Bar of Nevada', CA: 'the State Bar of California', AZ: 'the State Bar of Arizona', UT: 'the Utah State Bar', TX: 'the State Bar of Texas' };
const oneBar = (st: string | null, x: string) => (st && BAR[st] ? x.replace(ALL_BARS, BAR[st]) : x);

/** Keyword-led text ("Dual agency: …") split into its label and the rest. */
const keyword = (t: string) => t.match(/^([A-Z][A-Za-z’' -]{1,30}): (.+)$/s);

function GuideBody({ g }: { g: ProGuide }) {
  const [st] = useMyState();
  const keep = (x: string) => showFor(st, x) && forStateText(st, x) !== '';
  const fit = (xs: string[]) => xs.filter(keep).map((x) => oneBar(st, forStateText(st, x))).filter(Boolean);
  // A paragraph cut down to just its opening line (the rest was about other states) would dangle: leave it out.
  const fitPara = (xs: string[]) => xs.map((p) => {
    const kept = forStateText(st, p);
    return kept !== p && sentences(kept).length === 1 && sentences(p).length >= 3 ? '' : kept;
  }).filter(Boolean);
  const { pros } = useDirectory();
  const script = PRO_SCRIPTS[g.key];
  const deep = PRO_DEEP[g.key];
  const does = forStateText(st, g.does);
  const money = deep ? fit(deep.money) : [];
  const checklist = deep ? fit(deep.checklist) : [];
  const overview = deep ? fitPara(deep.overview) : [];
  const lookups = LICENSE_LOOKUPS[g.key];
  const box = g.key === 'agent' ? readBuyBox() : null;
  const fills: Record<string, string> = {};
  if (box?.types[0]) fills['kind of property'] = box.types[0].toLowerCase();
  if (box?.area) fills.area = box.area;
  if (box?.priceMax) fills['$price'] = `$${box.priceMax.toLocaleString('en-US')}`;
  const find = fit(g.find);
  const stories = deep?.stories ?? [];
  const learn = [
    'The short version: when you need one, what to bring, what to ask and what you should get back',
    find.length > 0 || checklist.length > 0 ? 'How to find one and check them before you hire' : '',
    script && 'What to say when you first get in touch',
    money.length > 0 && 'How they’re paid',
    PRO_WHY[g.key] && 'When hiring one is worth it, and when to be careful',
    (overview.length > 0 || stories.length > 0) && `The details${stories.length ? ' and real stories from other buyers' : ''}, folded away until you want them`,
  ].filter(Boolean) as string[];
  const keyed = overview.length > 0 && overview.every((p) => keyword(p));
  // The decision first: four short columns that answer "do I need one, and what happens when I call?"
  const decide: { title: string; items: string[]; cited?: boolean }[] = [
    { title: 'When you need one', items: fit(g.when), cited: true },
    { title: 'What to bring', items: fit(script?.bring ?? []) },
    { title: 'What to ask', items: fit(g.ask), cited: true },
    { title: 'What you should get back', items: fit(script?.get ?? []) },
  ].filter((c) => c.items.length > 0);
  return (
    <div className="pro-guide">
      <StateLine />
      <p className="pro-guide-does">{does}</p>
      <div className="pro-learn">
        <strong>What you’ll learn</strong>
        <ul>{learn.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <h3 className="part-head">The short version</h3>
      <div className="pro-guide-cols pro-decide-cols">
        {decide.map((c) => (
          <section key={c.title}>
            <h3>{c.title}</h3>
            <ul>{c.items.map((x) => <li key={x}>{c.cited ? <Cited text={x} /> : x}</li>)}</ul>
          </section>
        ))}
      </div>
      {(find.length > 0 || checklist.length > 0 || script?.read || lookups) && (
        <>
          <h3 className="part-head">Finding and checking one</h3>
          <div className="pro-guide-cols pro-find-cols">
            {find.length > 0 && <section><h3>How to find one</h3><ul>{find.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></section>}
            {script?.read && <section><h3>{script.read.title}</h3><ul>{fit(script.read.items).map((x) => <li key={x}>{x}</li>)}</ul></section>}
            {checklist.length > 0 && <section><h3>Check before you hire</h3><ul>{checklist.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></section>}
          </div>
          {lookups && <LicenseCheck lookups={lookups} state={st} said={does} />}
        </>
      )}
      {script && (
        <>
          <h3 className="part-head">What to say</h3>
          <section className="pro-script-say pro-script-wide">
            {/\[/.test(script.say) && (
              <p className="fill-note">Fill in the blanks: the <span className="fill-blank">underlined words</span> are yours to change{Object.keys(fills).length ? ', and some are filled in from your buy box' : ''}.</p>
            )}
            <Script say={script.say} fills={fills} />
          </section>
        </>
      )}
      {/* The Featured ad spot gets its own full-width row, so no box is left half empty beside it. */}
      {g.directory && script && <div className="pro-ad-row"><FeaturedAds pros={pros} categories={g.directory} placeholder /></div>}
      {money.length > 0 && (
        <>
          <h3 className="part-head">How they’re paid</h3>
          <ul className="pro-pay-list">{money.map((x) => <li key={x}><Cited text={x} /></li>)}</ul>
        </>
      )}
      <p className="pro-next"><a className="btn" href="#/toolkit/team">Add them to your team in My{NBSP}plan{NBSP}→</a></p>
      {PRO_WHY[g.key] && <h3 className="part-head">Should you hire one?</h3>}
      {PRO_WHY[g.key] && <WhyBlock yes={PRO_WHY[g.key].yes} no={PRO_WHY[g.key].no} yesLabel="Why you would hire one" noLabel="Why you might not, or when to be careful" level={4} />}
      {overview.length > 0 && (
        <details className="pro-fold">
          <summary><h3 className="part-head">The details: how working with one goes, and the evidence</h3></summary>
          {keyed ? (
            <ul className="pro-guide-overview pro-overview-list">
              {overview.map((p) => {
                const m = keyword(p)!;
                return <li key={p}><strong>{m[1]}:</strong> <Cited text={m[2]} /></li>;
              })}
            </ul>
          ) : (
            <div className="pro-guide-overview">{overview.map((p) => <p key={p}><Cited text={p} /></p>)}</div>
          )}
        </details>
      )}
      {stories.length > 0 && (
        <details className="pro-fold pro-guide-stories">
          <summary><h3 className="part-head">Real stories: what happened to other buyers ({stories.length})</h3></summary>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named. Each one is dated: prices, rates and rules may have changed since.</p>
          <ProStories stories={stories} state={st} />
        </details>
      )}
      {g.directory && (
        <ProDirectory
          categories={g.directory}
          initialCategory={g.directory.length === 1 ? g.directory[0] : 'any'}
          showCategoryFilter={g.directory.length > 1}
          hideWhenEmpty
          featured={!script}
          header={
            <>
              <h3 className="part-head">Listed on DeedOwl{st ? ` (${stateByCode(st)?.name})` : ''}</h3>
            </>
          }
          notice={<Disclaimer kind={g.key === 'lender' || g.key === 'private_lender' ? 'financing' : 'professionals'} compact />}
        />
      )}
    </div>
  );
}

/** "Your deal team" (the Your team tab): who helps with a forced-sale purchase, when you need each one, and how to find them. */
export default function FindAProPage({ section }: { section?: string }) {
  useMarkStep('team');
  const open = !!section && !!proGuideByKey(section);
  const build = section === 'build';
  useLastActivity(open ? `#/pros/${section}` : '#/pros', open ? `Your team: ${proGuideByKey(section!)!.title}` : 'Your team');
  const all = !open && !build; // the full page: #/pros (and the old #/pros/all)
  const sections: DrillSection[] = PRO_GUIDES.map((g) => ({ key: g.key, title: g.title, summary: g.summary, icon: ICONS[g.key], content: () => <GuideBody g={g} /> }));
  const [mine, setMine] = useMyState();
  // Opens on the kind of sale your roadmap route is about (an auction, a lien certificate), when your state has it.
  const [sale, setSale] = useState<string>(() => {
    // The property open in Analyze (a saved one) decides first: its own kind of sale.
    try {
      const cur = JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null') as { id?: string; kind?: Deal['kind']; state?: string; plan?: Deal['plan'] } | null;
      const pre0 = mine === 'NV' ? '' : (mine ?? '').toLowerCase();
      if (cur?.id && cur.kind && cur.state === mine) {
        // A commercial building bought through an agent or from a bank: the commercial team.
        const offerKind = cur.kind === 'listing' || cur.kind === 'reo' || cur.kind === 'short';
        const k = cur.plan === 'commercial' && offerKind ? `${pre0}commercial` : cur.kind === 'listing' ? 'listing' : guideKeyFor({ kind: cur.kind, state: mine });
        if (k === 'listing' || guidesFor(mine).some((p) => p.key === k)) return k;
      }
    } catch { /* storage unavailable */ }
    const r = roadmapPath();
    const pre = mine === 'NV' ? '' : (mine ?? '').toLowerCase();
    const want = r === 'auction' ? `${pre}foreclosure` : r === 'certificate' ? (mine === 'NV' ? 'sid' : 'aztaxlien') : '';
    if (want && guidesFor(mine).some((p) => p.key === want)) return want;
    // The agent route (the roadmap's default): the team for a listed home, or the commercial team for a commercial buy box.
    try {
      const box = JSON.parse(localStorage.getItem('deedowl.buybox.v1') ?? 'null') as { strategy?: unknown } | null;
      if (mine && r === 'listing' && box?.strategy === 'Apartments and commercial property' && guidesFor(mine).some((p) => p.key === `${pre}commercial`)) return `${pre}commercial`;
    } catch { /* storage unavailable */ }
    return mine && r === 'listing' ? 'listing' : 'start';
  });
  const { pros } = useDirectory();
  const book = mine ? guidesFor(mine).find((p) => p.key === sale) : undefined;
  const team = book
    ? book.team
    : sale === 'listing'
      ? LISTING_TEAM.map((k) => proGuideByKey(k)!).map((g) => ({ role: g.title, when: g.summary, href: `#/pros/${g.key}` }))
      : null;

  const teamCats = team && sale !== 'start'
    ? new Set(team.flatMap((t) => proGuideByKey(t.href?.replace(/^#\/pros\//, '') ?? '')?.directory ?? []))
    : null;

  return (
    <main className="page pros-page">
      <PageHero
        compact={open || build}
        top={open || build ? <a href="#/pros">← Your team</a> : undefined}
        eyebrow={open || build ? undefined : <span className="eyebrow">{stepEyebrow('team')}</span>}
        title={open ? proGuideByKey(section)!.title : build ? <>Build <span className="grad">your team</span></> : <>Your <span className="grad">team</span></>}
        sub={open ? undefined : build ? undefined : 'Who helps with a purchase, when you need each one, and how to find them.'}
      />
      {all && <AreaLine what="Showing professionals advertising there." />}
      {build && <TeamBuilder />}
      {all && (
        // One way in: five questions (Help me choose), or pick the kind of sale for its team, in order. The rotating ad spot
        // (an advertiser in the visitor's area, when picked) gets its own full-width row after it.
        <section className="not-sure pros-start" aria-labelledby="not-sure-head">
          <h2 id="not-sure-head">Not sure where to start?</h2>
          <p>Answer five quick questions about what you want to buy and how, and we’ll narrow this down to the professionals you need, and why. If you’re not sure of an answer, we’ll suggest one.</p>
          <a className="btn" href="#/pros/build">Help me choose{NBSP}→</a>
          <div className="pros-sale-pick">
            {mine ? (
              <label>
                <span>Or see who you need for one kind of sale:</span>
                <select value={sale} onChange={(e) => setSale(e.target.value)}>
                  <option value="start">Kind of sale: not sure yet</option>
                  <option value="listing">A listed home (through an agent)</option>
                  {guidesFor(mine).map((p) => <option key={p.key} value={p.key}>{p.short}</option>)}
                </select>
              </label>
            ) : (
              <label>
                <span>Or see who you need for one kind of sale. First, where do you invest?</span>
                <select value="" onChange={(e) => e.target.value && setMine(e.target.value as StateCode)}>
                  <option value="">Choose your state</option>
                  {STATES.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
                </select>
              </label>
            )}
          </div>
          {team && (
            <>
              <p className="muted">
                {book ? <>{book.short}: the team, in the order you’ll usually need them.</> : <>For a home listed for sale, the way most first rentals are bought, in the order you’ll usually need them.</>}{' '}
                {book ? <a href={`#/playbooks/${book.key}`}>Read the guide: {book.short}{NBSP}→</a> : <a href="#/practice/case">Practice a listed purchase, start to finish{NBSP}→</a>}
              </p>
              <TeamList team={team} />
            </>
          )}
        </section>
      )}
      {/* With a sale's team shown, the ad comes from one of that team's roles (no lender ad under a cash-only team). */}
      {all && <div className="pros-ad-row"><RotatingAd pros={teamCats ? pros.filter((x) => teamCats.has(x.category)) : pros} placeholder /></div>}
      {all ? (
        <section className="pros-all" aria-labelledby="pros-all-head">
          <h2 id="pros-all-head">The professionals</h2>
          <p className="muted">For a home bought through an agent, most first-time buyers need six of these: an agent, a lender, a title company, an attorney, an inspector and an insurance agent. Paying cash, you can skip the lender. At an auction you usually can’t inspect and must pay in cash, so the core team is title, an attorney and insurance. The team and any required roles vary by location and sale type.</p>
          <DrillDown sections={sections} baseHref="#/pros" label="Professionals" titled />
        </section>
      ) : open && (
        <DrillDown sections={sections} active={section} baseHref="#/pros" label="Professionals" titled overviewLabel="Your team" />
      )}
      {!open && <PathNext step="team" />}
    </main>
  );
}
