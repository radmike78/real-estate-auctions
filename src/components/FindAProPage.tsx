import { useState, type ReactElement } from 'react';
import PageHero from './PageHero';
import DrillDown, { type DrillSection } from './DrillDown';
import TeamList from './TeamList';
import ProDirectory from './ProDirectory';
import Disclaimer from './Disclaimer';
import { IconBadge, IconBank, IconCalc, IconClock, IconFile, IconHome, IconLayers, IconLock, IconPulse, IconSearch, IconShield, IconTools } from './Icons';
import { guidesFor, stateOf } from '../lib/playbooks';
import { useMyState } from '../lib/myState';
import { useMarkStep } from '../lib/path';
import PathNext from './PathNext';
import { CORE_TEAM, PRO_GUIDES, proGuideByKey, type ProGuide, type ProKey } from '../lib/proGuide';
import WhyBlock from './WhyBlock';
import { PRO_WHY } from '../lib/proWhy';
import { PRO_DEEP } from '../lib/deep/proDeep';
import StoryList from './StoryList';

const ICONS: Record<ProKey, ReactElement> = {
  agent: <IconHome />, lender: <IconBank />, private_lender: <IconClock />, title: <IconFile />, attorney: <IconBadge />, inspector: <IconSearch />,
  contractor: <IconTools />, insurance: <IconShield />, cpa: <IconCalc />, property_manager: <IconLayers />, eviction: <IconLock />, environmental: <IconPulse />,
};

function GuideBody({ g }: { g: ProGuide }) {
  return (
    <div className="pro-guide">
      <p className="pro-guide-does">{g.does}</p>
      {PRO_WHY[g.key] && <WhyBlock yes={PRO_WHY[g.key].yes} no={PRO_WHY[g.key].no} yesLabel="Why you would hire one" noLabel="Why you might not, or when to be careful" />}
      {PRO_DEEP[g.key] && PRO_DEEP[g.key]!.overview.length > 0 && (
        <div className="pro-guide-overview">{PRO_DEEP[g.key]!.overview.map((p) => <p key={p}>{p}</p>)}</div>
      )}
      {PRO_DEEP[g.key] && PRO_DEEP[g.key]!.stories.length > 0 && (
        <div className="pro-guide-stories">
          <h3>Real stories: what happened to other buyers</h3>
          <p className="muted">True accounts from news reports, court cases and government agencies. Private people aren’t named.</p>
          <StoryList stories={PRO_DEEP[g.key]!.stories} />
        </div>
      )}
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
          {PRO_DEEP[g.key]!.money.length > 0 && <div><h3>How they’re paid</h3><ul className="deep-list">{PRO_DEEP[g.key]!.money.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {PRO_DEEP[g.key]!.checklist.length > 0 && <div><h3>Check before you hire</h3><ul className="deep-list">{PRO_DEEP[g.key]!.checklist.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
      )}
      {g.license && (
        <p className="pro-guide-tip">
          <strong>Before you hire:</strong> look them up with the {g.license.who.replace(/ \(via NMLS Consumer Access\)$/, '')}.{' '}
          <a href={g.license.url} target="_blank" rel="noopener noreferrer">Open the official lookup ↗</a>
        </p>
      )}
      {g.directory && (
        <ProDirectory
          categories={g.directory}
          initialCategory={g.directory.length === 1 ? g.directory[0] : 'any'}
          showCategoryFilter={g.directory.length > 1}
          hideWhenEmpty
          header={<h3 className="pro-guide-ads">Advertising on DeedOwl</h3>}
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
  const sections: DrillSection[] = PRO_GUIDES.map((g) => ({ key: g.key, title: g.title, summary: g.summary, icon: ICONS[g.key], content: () => <GuideBody g={g} /> }));
  const [mine] = useMyState();
  const book = guidesFor(mine).find((p) => p.key === sale);
  const team = book
    ? book.team
    : CORE_TEAM.map((k) => proGuideByKey(k)!).map((g) => ({ role: g.title, when: g.summary, href: `#/pros/${g.key}` }));

  return (
    <main className="page">
      <PageHero
        compact={open}
        top={open ? <a href="#/pros">← Your deal team</a> : undefined}
        eyebrow={open ? undefined : <span className="eyebrow">Step 3 of 6</span>}
        title={open ? <a className="title-link" href="#/pros">Your deal team</a> : <>Your <span className="grad">deal team</span></>}
        sub={open ? undefined : 'Who helps with a forced-sale purchase, when you need each one, and how to find them.'}
      />
      {!open && (
        <section className="pro-chooser" aria-labelledby="pro-chooser-head">
          <h2 id="pro-chooser-head" className="section-title">Who you need for your kind of sale</h2>
          <div className="chip-tabs" role="group" aria-label="Kind of sale">
            <button aria-pressed={sale === 'start'} onClick={() => setSale('start')}>Not sure yet</button>
            {guidesFor(mine).map((p) => (
              <button key={p.key} aria-pressed={sale === p.key} onClick={() => setSale(p.key)}>{p.short}{mine ? '' : ` (${stateOf(p)})`}</button>
            ))}
          </div>
          <p className="muted">
            {book ? <>For {book.short.toLowerCase()}, in the order you’ll usually need them.</> : <>Most first-time buyers of a forced-sale property need these five.</>}{' '}
            <a href={book ? `#/playbooks/${book.key}` : '#/playbooks'}>{book ? `How ${book.short.toLowerCase()} work →` : 'How each sale works →'}</a>
          </p>
          <TeamList team={team} />
        </section>
      )}
      {!open && <h2 className="section-title">The professionals</h2>}
      <DrillDown sections={sections} active={open ? section : undefined} baseHref="#/pros" label="Professionals" />
      {!open && <PathNext step="team" />}
    </main>
  );
}
