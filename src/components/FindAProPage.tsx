import { useRef, useState, type ReactElement } from 'react';
import OnThisPage from './OnThisPage';
import PageHero from './PageHero';
import DrillDown, { type DrillSection } from './DrillDown';
import TeamList from './TeamList';
import ProDirectory from './ProDirectory';
import Disclaimer from './Disclaimer';
import { IconBadge, IconBank, IconCalc, IconClock, IconFile, IconHome, IconLayers, IconLock, IconPulse, IconSearch, IconShield, IconTools } from './Icons';
import { guidesFor } from '../lib/playbooks';
import { STATES, stateByCode } from '../lib/regions';
import { useMyState, forStateText } from '../lib/myState';
import { useMarkStep } from '../lib/path';
import PathNext from './PathNext';
import { CORE_TEAM, PRO_GUIDES, proGuideByKey, type ProGuide, type ProKey } from '../lib/proGuide';
import WhyBlock from './WhyBlock';
import { PRO_WHY } from '../lib/proWhy';
import { PRO_DEEP } from '../lib/deep/proDeep';
import StoryList from './StoryList';
import TeamBuilder from './TeamBuilder';

const ICONS: Record<ProKey, ReactElement> = {
  agent: <IconHome />, lender: <IconBank />, private_lender: <IconClock />, title: <IconFile />, attorney: <IconBadge />, inspector: <IconSearch />,
  contractor: <IconTools />, insurance: <IconShield />, cpa: <IconCalc />, property_manager: <IconLayers />, eviction: <IconLock />, environmental: <IconPulse />, appraiser: <IconCalc />,
};

function GuideBody({ g }: { g: ProGuide }) {
  const [st] = useMyState();
  const ref = useRef<HTMLDivElement>(null);
  const fit = (xs: string[]) => xs.map((x) => forStateText(st, x)).filter(Boolean);
  return (
    <div className="pro-guide" ref={ref}>
      {/* One short role summary, then the practical part (when, how to find, what to ask, how they're paid); background,
          the case for and against, and the stories after. */}
      <p className="pro-guide-does">{g.does}</p>
      <OnThisPage root={ref} selector="h3.part-head" />
      <h3 className="part-head">Hiring one</h3>
      <div className="pro-guide-cols">
        <section>
          <h3>When you need one</h3>
          <ul>{g.when.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section>
          <h3>How to find one</h3>
          <ul>{g.find.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section>
          <h3>Questions to ask</h3>
          <ul>{g.ask.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
      {PRO_DEEP[g.key] && (PRO_DEEP[g.key]!.money.length > 0 || PRO_DEEP[g.key]!.checklist.length > 0) && (
        <div className="deep-two pro-guide-deep">
          {PRO_DEEP[g.key]!.money.length > 0 && <div><h3>How they’re paid</h3><ul className="deep-list">{fit(PRO_DEEP[g.key]!.money).map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {PRO_DEEP[g.key]!.checklist.length > 0 && <div><h3>Check before you hire</h3><ul className="deep-list">{fit(PRO_DEEP[g.key]!.checklist).map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
      )}
      {g.license && (
        <p className="pro-guide-tip">
          <strong>Before you hire:</strong> look them up with the {g.license.who.replace(/ \(via NMLS Consumer Access\)$/, '')}.{' '}
          <a href={g.license.url} target="_blank" rel="noopener noreferrer">Open the official lookup ↗</a>
        </p>
      )}
      {PRO_DEEP[g.key] && PRO_DEEP[g.key]!.overview.length > 0 && (
        <>
          <h3 className="part-head">Working with one</h3>
          <div className="pro-guide-overview">{fit(PRO_DEEP[g.key]!.overview).map((p) => <p key={p}>{p}</p>)}</div>
        </>
      )}
      {PRO_WHY[g.key] && <h3 className="part-head">Should you hire one?</h3>}
      {PRO_WHY[g.key] && <WhyBlock yes={PRO_WHY[g.key].yes} no={PRO_WHY[g.key].no} yesLabel="Why you would hire one" noLabel="Why you might not, or when to be careful" />}
      {PRO_DEEP[g.key] && PRO_DEEP[g.key]!.stories.length > 0 && (
        <div className="pro-guide-stories">
          <h3 className="part-head">Real stories: what happened to other buyers</h3>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named.</p>
          <StoryList stories={PRO_DEEP[g.key]!.stories} />
        </div>
      )}
      {g.directory && (
        <ProDirectory
          categories={g.directory}
          initialCategory={g.directory.length === 1 ? g.directory[0] : 'any'}
          showCategoryFilter={g.directory.length > 1}
          hideWhenEmpty
          header={<h3 className="pro-guide-ads part-head">Advertising on DeedOwl</h3>}
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
  const all = !open && !build; // the full page: #/pros (and the old #/pros/all)
  const sections: DrillSection[] = PRO_GUIDES.map((g) => ({ key: g.key, title: g.title, summary: g.summary, icon: ICONS[g.key], content: () => <GuideBody g={g} /> }));
  const [mine, setMine] = useMyState();
  const book = guidesFor(mine).find((p) => p.key === sale);
  const team = book
    ? book.team
    : CORE_TEAM.map((k) => proGuideByKey(k)!).map((g) => ({ role: g.title, when: g.summary, href: `#/pros/${g.key}` }));

  return (
    <main className="page">
      <PageHero
        compact={open || build}
        top={open || build ? <a href="#/pros">← Your deal team</a> : undefined}
        eyebrow={open || build ? undefined : <span className="eyebrow">Step 3 of 6</span>}
        title={open ? proGuideByKey(section)!.title : build ? <>Build <span className="grad">your team</span></> : <>Your <span className="grad">deal team</span></>}
        sub={open ? undefined : build ? undefined : 'Who helps with a purchase, when you need each one, and how to find them.'}
      />
      {build && <TeamBuilder />}
      {all && (
        <section className="not-sure" aria-labelledby="not-sure-head">
          <h2 id="not-sure-head">Don’t know who you need?</h2>
          <p>Answer five quick questions about what you want to buy and how, and we’ll narrow this down to the professionals you need, and why. If you’re not sure of an answer, we’ll suggest one.</p>
          <a className="btn" href="#/pros/build">Help me choose →</a>
        </section>
      )}
      {all && (
        <section className="pro-chooser" aria-labelledby="pro-chooser-head">
          <h2 id="pro-chooser-head" className="section-title">Who you need for your kind of sale</h2>
          {mine ? (
            <div className="chip-tabs" role="group" aria-label="Kind of sale">
              <button aria-pressed={sale === 'start'} onClick={() => setSale('start')}>Not sure yet</button>
              {guidesFor(mine).map((p) => (
                <button key={p.key} aria-pressed={sale === p.key} onClick={() => setSale(p.key)}>{p.short}</button>
              ))}
            </div>
          ) : (
            <div className="chip-tabs" role="group" aria-label="Your state">
              <span className="chip-label">First, where do you invest?</span>
              {STATES.map((st) => <button key={st.code} onClick={() => setMine(st.code)}>{st.name}</button>)}
            </div>
          )}
          {mine && <p className="muted">Sales in {stateByCode(mine)?.name}. <button type="button" className="linkish" onClick={() => { setMine(null); setSale('start'); }}>Change state</button></p>}
          <p className="muted">
            {book ? <>For {book.short.toLowerCase()}, in the order you’ll usually need them.</> : <>Most first-time buyers of a forced-sale property need these five.</>}{' '}
            <a href={book ? `#/playbooks/${book.key}` : '#/playbooks'}>{book ? `How ${book.short.toLowerCase()} work →` : 'How each sale works →'}</a>
          </p>
          <TeamList team={team} />
        </section>
      )}
      {all && <h2 className="section-title">The professionals</h2>}
      {(open || all) && <DrillDown sections={sections} active={open ? section : undefined} baseHref="#/pros" label="Professionals" titled />}
      {!open && <PathNext step="team" />}
    </main>
  );
}
