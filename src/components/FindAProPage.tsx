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
import { STATES, stateByCode, type StateCode } from '../lib/regions';
import { LICENSE_LOOKUPS, type Lookup } from '../lib/licenseLookups';
import { useMyState, forStateText, showFor } from '../lib/myState';
import { useMarkStep } from '../lib/path';
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
const unsaid = (text: string, said: string) => sentences(text).filter((x) => !said.includes(x.slice(0, 50).replace(/[.:]$/, ''))).join(' ');

/** Where to check a license: the visitor's own state, or every state when they haven't picked one. */
function LicenseCheck({ lookups, state, said }: { lookups: Record<StateCode, Lookup>; state: StateCode | null; said: string }) {
  const show = (state ? [state] : STATES.map((x) => x.code)).map((c) => [c, lookups[c]] as const);
  const line = (l: Lookup) => ('note' in l ? unsaid(l.note, said) : <>Look them up with the {l.who}. <a href={l.url} target="_blank" rel="noopener noreferrer">Open the official lookup{NBSP}↗</a></>);
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
          <option value="">All states</option>
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

function StoryCard({ s }: { s: Story }) {
  const scope = storyScope(s);
  return (
    <li className={`story-card story-card-${s.tone}`}>
      <span className="story-tags">
        <span className={`story-tag tag-${s.tone}`}>{s.tone === 'good' ? 'When it worked' : 'When it went wrong'}</span>
        {scope === 'nationwide' && <span className="story-tag tag-scope">Nationwide</span>}
        {scope === 'outside' && <span className="story-tag tag-scope">Outside our states</span>}
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
  const own = order(state ? stories.filter(mine) : stories);
  const other = order(state ? stories.filter((s) => !mine(s)) : []);
  const name = state ? stateByCode(state)?.name : '';
  // With none from this state, the best two from elsewhere (one that worked, one that went wrong) show; the rest wait.
  const best = own.length ? [] : [other.find((s) => s.tone === 'good'), other.find((s) => s.tone === 'caution')].filter((s): s is Story => !!s);
  const rest = other.filter((s) => !best.includes(s));
  const grid = (xs: Story[]) => <ul className="story-grid">{xs.map((s) => <StoryCard key={s.title} s={s} />)}</ul>;
  return (
    <>
      {own.length > 0 && grid(own)}
      {own.length === 0 && best.length > 0 && (
        <>
          <h4 className="story-other-head">From other states</h4>
          <p className="muted">We don’t have a story from {name} yet. These happened elsewhere, where the rules may differ.</p>
          {grid(best)}
        </>
      )}
      {rest.length > 0 && (
        <details className="story-other">
          <summary>More stories from other states ({rest.length})</summary>
          <p className="muted">These happened outside {name}, where the rules may differ.</p>
          {grid(rest)}
        </details>
      )}
    </>
  );
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

/** Keyword-led text ("Dual agency: …") split into its label and the rest. */
const keyword = (t: string) => t.match(/^([A-Z][A-Za-z’' -]{1,30}): (.+)$/s);

function GuideBody({ g }: { g: ProGuide }) {
  const [st] = useMyState();
  const keep = (x: string) => showFor(st, x) && forStateText(st, x) !== '';
  const fit = (xs: string[]) => xs.filter(keep).map((x) => forStateText(st, x)).filter(Boolean);
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
  const pay = money.length > 0 || checklist.length > 0 || !!lookups;
  const learn = [
    'When you need one, how to find one and what to ask',
    script && 'What to say when you first get in touch, and what to have ready',
    pay && 'How they’re paid, and what to check before you hire',
    PRO_WHY[g.key] && `When hiring one is worth it, and when to be careful${deep?.stories.length ? ', with real stories from other buyers' : ''}`,
  ].filter(Boolean) as string[];
  const keyed = overview.length > 0 && overview.every((p) => keyword(p));
  return (
    <div className="pro-guide">
      <StateLine />
      <p className="pro-guide-does">{does}</p>
      <div className="pro-learn">
        <strong>What you’ll learn</strong>
        <ul>{learn.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <h3 className="part-head">Hiring one</h3>
      <div className="pro-guide-cols">
        <section>
          <h3>When you need one</h3>
          <ul>{fit(g.when).map((x) => <li key={x}><Cited text={x} /></li>)}</ul>
        </section>
        <section>
          <h3>How to find one</h3>
          <ul>{fit(g.find).map((x) => <li key={x}><Cited text={x} /></li>)}</ul>
        </section>
        <section>
          <h3>Questions to ask</h3>
          <ul>{fit(g.ask).map((x) => <li key={x}><Cited text={x} /></li>)}</ul>
        </section>
      </div>
      {script && (
        <>
          <h3 className="part-head">What to say</h3>
          <div className="pro-guide-cols pro-script-cols">
            <section className="pro-script-say">
              <h3>Your opening</h3>
              {/\[/.test(script.say) && (
                <p className="fill-note">Fill in the blanks: the <span className="fill-blank">underlined words</span> are yours to change{Object.keys(fills).length ? ', and some are filled in from your buy box' : ''}.</p>
              )}
              <Script say={script.say} fills={fills} />
            </section>
            {script.bring && (
              <section>
                <h3>Have ready</h3>
                <ul>{script.bring.map((x) => <li key={x}>{x}</li>)}</ul>
              </section>
            )}
            {script.read && (
              <section>
                <h3>{script.read.title}</h3>
                <ul>{script.read.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </section>
            )}
          </div>
        </>
      )}
      {/* The Featured ad spot gets its own full-width row, so no box is left half empty beside it. */}
      {g.directory && script && <div className="pro-ad-row"><FeaturedAds pros={pros} categories={g.directory} placeholder /></div>}
      {pay && (
        <>
          <h3 className="part-head">Paying them and checking them</h3>
          {(money.length > 0 || checklist.length > 0) && (
            <div className="pro-guide-cols pro-pay-cols">
              {money.length > 0 && <section><h3>How they’re paid</h3><ul>{money.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></section>}
              {checklist.length > 0 && <section><h3>Check before you hire</h3><ul>{checklist.map((x) => <li key={x}><Cited text={x} /></li>)}</ul></section>}
            </div>
          )}
          {lookups && <LicenseCheck lookups={lookups} state={st} said={does} />}
        </>
      )}
      <p className="pro-next"><a className="btn" href="#/toolkit/team">Add them to your team in My{NBSP}plan{NBSP}→</a></p>
      {overview.length > 0 && (
        <>
          <h3 className="part-head">Working with one</h3>
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
        </>
      )}
      {PRO_WHY[g.key] && <h3 className="part-head">Should you hire one?</h3>}
      {PRO_WHY[g.key] && <WhyBlock yes={PRO_WHY[g.key].yes} no={PRO_WHY[g.key].no} yesLabel="Why you would hire one" noLabel="Why you might not, or when to be careful" />}
      {deep && deep.stories.length > 0 && (
        <div className="pro-guide-stories">
          <h3 className="part-head">Real stories: what happened to other buyers</h3>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named.</p>
          <ProStories stories={deep.stories} state={st} />
        </div>
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
              <p className="small muted pro-guide-ads">Listed professionals are paid advertisements. Check any license yourself before you hire.</p>
            </>
          }
          notice={<Disclaimer kind={g.key === 'lender' || g.key === 'private_lender' ? 'financing' : 'professionals'} compact />}
        />
      )}
    </div>
  );
}

/** "Your deal team" (the Find a pro tab): who helps with a forced-sale purchase, when you need each one, and how to find them. */
export default function FindAProPage({ section }: { section?: string }) {
  useMarkStep('team');
  const [sale, setSale] = useState<string>('start');
  const open = !!section && !!proGuideByKey(section);
  const build = section === 'build';
  useLastActivity(open ? `#/pros/${section}` : '#/pros', open ? `Your team: ${proGuideByKey(section!)!.title}` : 'Your team');
  const all = !open && !build; // the full page: #/pros (and the old #/pros/all)
  const sections: DrillSection[] = PRO_GUIDES.map((g) => ({ key: g.key, title: g.title, summary: g.summary, icon: ICONS[g.key], content: () => <GuideBody g={g} /> }));
  const [mine, setMine] = useMyState();
  const { pros } = useDirectory();
  const book = mine ? guidesFor(mine).find((p) => p.key === sale) : undefined;
  const team = book
    ? book.team
    : sale === 'listing'
      ? LISTING_TEAM.map((k) => proGuideByKey(k)!).map((g) => ({ role: g.title, when: g.summary, href: `#/pros/${g.key}` }))
      : null;

  return (
    <main className="page pros-page">
      <PageHero
        compact={open || build}
        top={open || build ? <a href="#/pros">← Your team</a> : undefined}
        eyebrow={open || build ? undefined : <span className="eyebrow">Step 3 of 6</span>}
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
                {book ? <>For {book.short.toLowerCase()}, in the order you’ll usually need them.</> : <>For a home listed for sale, the way most first rentals are bought, in the order you’ll usually need them.</>}{' '}
                {book ? <a href={`#/playbooks/${book.key}`}>How {book.short.toLowerCase()} work{NBSP}→</a> : <a href="#/practice/case">Practice a listed purchase, start to finish{NBSP}→</a>}
              </p>
              <TeamList team={team} />
            </>
          )}
        </section>
      )}
      {all && <div className="pros-ad-row"><RotatingAd pros={pros} placeholder /></div>}
      {all ? (
        <section className="pros-all" aria-labelledby="pros-all-head">
          <h2 id="pros-all-head">The professionals</h2>
          <p className="muted">Most first-time buyers need six of these, whatever the kind of sale: an agent, a lender, a title company, an attorney, an inspector and an insurance agent. Paying cash, you can skip the lender.</p>
          <DrillDown sections={sections} baseHref="#/pros" label="Professionals" titled />
        </section>
      ) : open && (
        <DrillDown sections={sections} active={section} baseHref="#/pros" label="Professionals" titled overviewLabel="Your team" />
      )}
      {!open && <PathNext step="team" />}
    </main>
  );
}
