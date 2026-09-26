import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { PROPERTIES } from '../data';
import type { LienType } from '../types';
import { diligenceReport, type CheckResult } from '../lib/diligence';
import { assessLiens, moneySummary, SALE_TYPE_LABEL, WHAT_YOU_BUY, type SurvivalOutcome } from '../lib/rules';
import { STATUS, fmtDate, fmtDateTime, fmtMoney, purchaseSteps } from '../lib/status';
import StatusBadge from './StatusBadge';
import SourceTag from './SourceTag';
import { daysUntil } from './ResultsList';
import Disclaimer from './Disclaimer';
import BuyerChecklistBox from './BuyerChecklistBox';
import { checklistForProperty } from '../lib/buyerChecklists';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBadge, IconCalc, IconCalendar, IconFile, IconFlag, IconLayers, IconShield, IconSteps } from './Icons';
import BidCalculator from './BidCalculator';
import { DD_STEPS } from '../lib/ddFunnel';
import DueDiligenceFunnel from './DueDiligenceFunnel';
import SaveDealButton from './SaveDealButton';
import TeamList from './TeamList';
import { defaultsFor } from '../lib/bidCalc';
import { playbookForSale } from '../lib/playbooks';
import { ago } from '../lib/time';

const LIEN_LABEL: Record<LienType, string> = {
  PROPERTY_TAX: 'Delinquent property tax',
  FIRST_DEED_OF_TRUST: '1st deed of trust',
  SECOND_DEED_OF_TRUST: '2nd deed of trust',
  HOA_SUPERPRIORITY: 'HOA lien (super-priority)',
  HOA_SUBPRIORITY: 'HOA lien (sub-priority)',
  FEDERAL_TAX: 'Federal tax lien',
  STATE_TAX: 'State tax lien',
  JUDGMENT: 'Judgment lien',
  MECHANICS: "Mechanic's lien",
  CODE_ENFORCEMENT: 'Code-enforcement lien',
  MUNICIPAL_UTILITY: 'Utility / assessment lien',
};

const OUTCOME_LABEL: Record<SurvivalOutcome, string> = {
  FORECLOSING: 'Being foreclosed',
  LIKELY_EXTINGUISHED: 'Likely wiped out',
  LIKELY_SURVIVES: 'Likely survives',
  UNCERTAIN: 'Uncertain, review',
};


export default function PropertyPage({ id, section }: { id: string; section?: string }) {
  const [printAll, setPrintAll] = useState(false);
  // Printing (button or Ctrl+P) always prints the full report, whichever section is open.
  useEffect(() => {
    const before = () => flushSync(() => setPrintAll(true));
    const after = () => setPrintAll(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const p = PROPERTIES.find((x) => x.id === id);
  if (!p) {
    return (
      <main className="page">
        <p>Property not found. <a href="#/search">Back to search</a></p>
      </main>
    );
  }
  const s = p.sale;
  const status = STATUS[p.status];
  const money = moneySummary(p);
  const liens = assessLiens(p);
  const steps = purchaseSteps(p);
  const report = diligenceReport(p);
  const checklist = checklistForProperty(s?.saleType ?? null, p.status);
  const days = s?.startsAt ? daysUntil(s.startsAt) : null;
  const online = p.status === 'ONLINE_BIDDING';
  const baseHref = `#/property/${p.id}`;
  const count = (r: CheckResult) => report.filter((c) => c.result === r).length;
  const flags = count('flag');
  const reviews = count('review');
  const surviving = liens.filter((l) => l.outcome === 'LIKELY_SURVIVES').length;
  const playbook = playbookForSale(s?.saleType);
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const sections: DrillSection[] = [
    {
      key: 'status',
      title: 'Status & history',
      icon: <IconFlag />,
      tone: status.tone,
      summary: `${status.purchasable ? 'For sale' : 'Not for sale now'} · ${status.label}${s && s.postponements ? ` · postponed ${plural(s.postponements, 'time')}` : ''}`,
      content: () => (
        <>
          <p className="lead"><strong>{status.purchasable ? 'Heading to sale.' : 'Not for sale right now.'}</strong> {status.explanation}</p>
          <div className="provenance">
            <span className="prov-chip">Record last checked {ago(p.lastUpdated)}</span>
            {s && <span className="prov-chip">Sale run by {s.conductedBy}</span>}
            {s && s.postponements > 0 && <span className="prov-chip warn">Postponed {plural(s.postponements, 'time')} so far</span>}
          </div>
          <h3>What you would be buying</h3>
          <p>{s ? WHAT_YOU_BUY[s.saleType] : 'Nothing is for sale. Liens alone do not force a sale until an enforcement action is recorded.'}</p>
          <h3>History</h3>
          <ol className="timeline">
            {p.events.map((e, i) => (
              <li key={i}>
                <div className="small muted">{fmtDate(e.date)}</div>
                <div>{e.description}</div>
                <SourceTag source={e.source} />
              </li>
            ))}
          </ol>
        </>
      ),
    },
    ...(s
      ? [
          {
            key: 'sale',
            title: online ? 'Online auction details' : 'Sale details',
            icon: <IconCalendar />,
            summary: `${s.startsAt ? fmtDate(s.startsAt) : 'Date not set'} · ${s.conductedBy}`,
            content: () => (
              <>
                <dl className="facts">
                  <div><dt>Conducted by</dt><dd>{s.conductedBy}</dd></div>
                  <div><dt>{online ? 'Bidding opens' : 'Date & time'}</dt><dd>{s.startsAt ? fmtDateTime(s.startsAt) : 'Not set'}</dd></div>
                  {s.endsAt && <div><dt>Bidding closes</dt><dd>{fmtDateTime(s.endsAt)}</dd></div>}
                  <div><dt>Where</dt><dd>{s.location}</dd></div>
                  <div><dt>Minimum bid</dt><dd>{s.minimumBid ? fmtMoney(s.minimumBid) : 'Announced at sale'}</dd></div>
                  {s.registrationDeadline && <div><dt>Registration deadline</dt><dd>{fmtDateTime(s.registrationDeadline)}</dd></div>}
                  <div><dt>Deposit</dt><dd>{s.deposit ?? 'See official terms'}</dd></div>
                  <div><dt>Payment accepted</dt><dd>{s.paymentMethods.join(', ')}</dd></div>
                  {s.finalPaymentDeadline && <div><dt>Final payment due</dt><dd>{fmtDateTime(s.finalPaymentDeadline)}</dd></div>}
                  <div><dt>Buyer premium</dt><dd>{s.buyerPremiumPct ? `${s.buyerPremiumPct}%` : 'None listed'}</dd></div>
                  <div><dt>Deed type</dt><dd>{s.deedType}</dd></div>
                  <div><dt>Redemption</dt><dd>{s.redemptionPeriod ?? 'N/A'}</dd></div>
                  {s.eligibility && <div><dt>Eligibility</dt><dd>{s.eligibility}</dd></div>}
                  {s.postponements > 0 && <div><dt>Postponements</dt><dd>{s.postponements}</dd></div>}
                </dl>
                <div className="official">
                  {s.officialUrl ? (
                    <a className="btn" href={s.officialUrl} target="_blank" rel="noreferrer">
                      {online ? 'Go to official bidding site ↗' : 'View official sale notice ↗'}
                    </a>
                  ) : (
                    <button className="btn" disabled title="Sample data has no real official link">
                      {online ? 'Official bidding site' : 'Official sale notice'} (sample: no real link)
                    </button>
                  )}
                  <span className="muted small">We link to the official sale. We never take bids or money.</span>
                </div>
              </>
            ),
          },
        ]
      : []),
    {
      key: 'liens',
      title: 'Liens',
      icon: <IconLayers />,
      tone: surviving > 0 ? 'stop' : undefined,
      summary: `${plural(liens.length, 'lien')} recorded · ${fmtMoney(money.likelySurviving)} likely ${s ? 'survive' : 'remain'}`,
      content: () => (
        <>
          <dl className="mini money-box">
            <div><dt>Minimum / opening bid</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
            <div><dt>Likely surviving liens</dt><dd className={money.likelySurviving ? 'neg' : ''}>{fmtMoney(money.likelySurviving)}</dd></div>
            <div><dt>Uncertain liens</dt><dd>{fmtMoney(money.uncertain)}</dd></div>
            <div><dt>Est. market value</dt><dd>{fmtMoney(p.estimatedMarketValue)}</dd></div>
            <div className="total"><dt>Rough equity</dt><dd className={money.estimatedEquity !== null && money.estimatedEquity < 0 ? 'neg' : ''}>{fmtMoney(money.estimatedEquity)}</dd></div>
          </dl>
          <p className="muted small">
            Survival is estimated from Nevada rules and recording order. Lien priority is a legal question, so confirm with a title company or
            real-estate attorney.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Lien</th><th>Holder</th><th>Recorded</th><th className="num">Amount</th><th>If sold</th><th>Why</th><th>Source</th></tr>
              </thead>
              <tbody>
                {liens.map(({ lien, outcome, reason }) => (
                  <tr key={lien.id}>
                    <td>{LIEN_LABEL[lien.type]}</td>
                    <td>{lien.holder}</td>
                    <td>{fmtDate(lien.recordedDate)}</td>
                    <td className="num">{fmtMoney(lien.amount)}</td>
                    <td><span className={`pill out-${outcome}`}>{s ? OUTCOME_LABEL[outcome] : 'Remains'}</span></td>
                    <td className="small">{reason}</td>
                    <td><SourceTag source={lien.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      key: 'max-bid',
      title: 'Your maximum bid',
      icon: <IconCalc />,
      tone: 'go',
      summary: 'Every cost counted, your walk-away number, and what-if scenarios',
      content: () => <BidCalculator propertyId={p.id} defaults={defaultsFor(p)} openingBid={s?.minimumBid ?? null} />,
    },
    {
      key: 'how-to-buy',
      title: 'How to buy it',
      icon: <IconSteps />,
      summary: `${plural(steps.length, 'step')} and ${plural(checklist.items.length, 'item')} to have ready`,
      content: () => (
        <>
          <ol className="steps">
            {steps.map((st) => <li key={st}>{st}</li>)}
          </ol>
          {playbook && <p><a href={`#/playbooks/${playbook.key}`}>Read the full Nevada playbook for this sale type →</a></p>}
          <BuyerChecklistBox list={checklist} />
          <Disclaimer kind="sales" compact />
        </>
      ),
    },
    {
      key: 'due-diligence',
      title: 'Due diligence, step by step',
      icon: <IconShield />,
      tone: flags ? 'stop' : reviews ? 'wait' : 'go',
      summary: `${DD_STEPS.length} steps · ${[flags && plural(flags, 'flag'), reviews && `${reviews} to review`, `${count('manual')} to check yourself`].filter(Boolean).join(' · ')}`,
      content: () => <DueDiligenceFunnel p={p} maxBidHref={`${baseHref}/max-bid`} />,
    },
    ...(playbook
      ? [
          {
            key: 'team',
            title: 'Your team',
            icon: <IconBadge />,
            summary: `${plural(playbook.team.length, 'professional')} you need for this sale type`,
            content: () => (
              <>
                <p className="muted">Who you need, and when, for a {playbook.short.toLowerCase().replace(/s$/, '')}. Line them up before you bid.</p>
                <TeamList team={playbook.team} />
              </>
            ),
          } satisfies DrillSection,
        ]
      : []),
    {
      key: 'record',
      title: 'Property record',
      icon: <IconFile />,
      summary: [p.propertyType, p.beds !== null && `${p.beds} bd / ${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sq ft`, p.occupancy].filter(Boolean).join(' · '),
      content: () => (
        <dl className="facts">
          {/* Owners of homes that aren't for sale (pre-foreclosure, cancelled, lien-only) are not shown, to discourage solicitation. */}
          {status.purchasable ? (
            <div><dt>Owner of record</dt><dd>{p.ownerOfRecord}</dd></div>
          ) : (
            <div><dt>Owner of record</dt><dd className="muted">Withheld: not for sale</dd></div>
          )}
          <div><dt>Legal description</dt><dd className="small">{p.legalDescription}</dd></div>
          <div><dt>Type</dt><dd>{p.propertyType}</dd></div>
          {p.beds !== null && <div><dt>Beds / baths</dt><dd>{p.beds} / {p.baths}</dd></div>}
          {p.sqft && <div><dt>Living area</dt><dd>{p.sqft.toLocaleString()} sq ft</dd></div>}
          {p.lotSqft > 0 && <div><dt>Lot</dt><dd>{p.lotSqft.toLocaleString()} sq ft</dd></div>}
          {p.yearBuilt && <div><dt>Year built</dt><dd>{p.yearBuilt}</dd></div>}
          <div><dt>Assessed value <span className="prov official">County Assessor</span></dt><dd>{fmtMoney(p.assessedValue)}</dd></div>
          <div><dt>Estimated market value <span className="prov estimate">Estimate, not verified</span></dt><dd>{fmtMoney(p.estimatedMarketValue)}</dd></div>
          <div><dt>Last sale <span className="prov official">County Recorder</span></dt><dd>{p.lastSale ? `${fmtMoney(p.lastSale.price)} on ${fmtDate(p.lastSale.date)}` : 'None on record'}</dd></div>
          <div><dt>Occupancy <span className="prov estimate">Drive by to confirm</span></dt><dd>{p.occupancy}</dd></div>
          <div><dt>Record updated</dt><dd>{fmtDateTime(p.lastUpdated)}</dd></div>
        </dl>
      ),
    },
  ];
  const open = !printAll && sections.some((x) => x.key === section);

  return (
    <main className="page">
      <PageHero
        compact={open}
        top={
          <>
            <a href={open ? baseHref : '#/search'}>{open ? '← Property overview' : '← Back to results'}</a>
            <span className="hero-actions">
              <SaveDealButton p={p} />
              <button className="hero-btn" onClick={() => window.print()}>Print full report</button>
            </span>
          </>
        }
        eyebrow={
          <>
            <StatusBadge status={p.status} />
            {s && <span className="eyebrow">{SALE_TYPE_LABEL[s.saleType]}</span>}
          </>
        }
        title={open ? <a className="title-link" href={baseHref}>{p.address}</a> : p.address}
        sub={
          <>
            {p.city}, {p.state} {p.zip} · {p.county} County · APN {p.apn}
            {!open && (
              <span className="hero-meta">
                <span>You’d buy: <strong>{playbook ? playbook.youGet.split(',')[0].replace(/\.$/, '') : s ? SALE_TYPE_LABEL[s.saleType] : 'nothing yet (not for sale)'}</strong></span>
                <span>Record checked {ago(p.lastUpdated)}</span>
              </span>
            )}
          </>
        }
        aside={
          s?.startsAt && !open ? (
            <div className="countdown">
              <div className="countdown-label">
                {days !== null && days >= 0 && <span className="live-dot" aria-hidden />}
                {days !== null && days < 0 ? 'Scheduled sale was' : 'Sale starts'}
              </div>
              <div className="big">{fmtDateTime(s.startsAt)}</div>
              {days !== null && days >= 0 && <div className="countdown-days">{days === 1 ? 'within a day' : `in ${days} days`}</div>}
            </div>
          ) : undefined
        }
      >
        {!open && (
          <dl className="glance" aria-label="At a glance">
            <div><dt>Minimum bid</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
            <div><dt>Est. market value</dt><dd>{fmtMoney(p.estimatedMarketValue)}</dd></div>
            <div><dt>Liens likely {s ? 'surviving' : 'remaining'}</dt><dd className={money.likelySurviving ? 'neg' : ''}>{fmtMoney(money.likelySurviving)}</dd></div>
            <div><dt>Rough equity</dt><dd className={money.estimatedEquity !== null && money.estimatedEquity < 0 ? 'neg' : 'grad'}>{fmtMoney(money.estimatedEquity)}</dd></div>
          </dl>
        )}
      </PageHero>

      <div className="verify" role="alert">
        <strong>Verify before bidding.</strong> Sales are often paid off, postponed, cancelled or challenged at the last minute. Confirm with{' '}
        {s?.conductedBy ?? 'the conducting agency'} and read the official notice. This report is a screening tool, not a title search, and does
        not mean title is clear.
      </div>

      <DrillDown sections={sections} active={section} baseHref={baseHref} label="Property sections" printAll={printAll} />
    </main>
  );
}
