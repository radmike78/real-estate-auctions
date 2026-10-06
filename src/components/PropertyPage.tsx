import { useEffect, useState } from 'react';
import { lastList } from '../lib/lastList';
import { SHOW_SAMPLE_DATA } from '../data';
import { flushSync } from 'react-dom';
import { useProperties } from '../data/live';
import { IRS_ID_PREFIX, LIVE_ID_PREFIX } from '../feed/toProperty';
import TrackButton from './TrackButton';
import type { LienType } from '../types';
import { diligenceReport, type CheckResult } from '../lib/diligence';
import { assessLiens, moneySummary, SALE_TYPE_LABEL, WHAT_YOU_BUY, type SurvivalOutcome } from '../lib/rules';
import { STATUS, fmtDate, fmtDateTime, fmtMoney, purchaseSteps } from '../lib/status';
import StatusBadge from './StatusBadge';
import SourceTag from './SourceTag';
import { daysUntil, whenLabel } from './ResultsList';
import Disclaimer from './Disclaimer';
import BuyerChecklistBox from './BuyerChecklistBox';
import { checklistForProperty, CHECKLISTS, forCommercial, forLand } from '../lib/buyerChecklists';
import { classOfType } from '../lib/propertyClass';
import IncomeValue from './IncomeValue';
import StrategyTabs from './StrategyTabs';
import { buyFromBid, CommercialCalculator, RentCalculator } from './HoldCalculators';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconBadge, IconCalc, IconCalendar, IconCamera, IconFile, IconFlag, IconLayers, IconShield, IconSteps } from './Icons';
import PhotosAndViews from './PhotosAndViews';
import { parcelDigits, propertyViews } from '../lib/propertyViews';
import BidCalculator, { setSavedExitValue } from './BidCalculator';
import { DD_STEPS } from '../lib/ddFunnel';
import DueDiligenceFunnel from './DueDiligenceFunnel';
import SaveDealButton from './SaveDealButton';
import TeamList from './TeamList';
import { defaultsFor } from '../lib/bidCalc';
import { playbookByKey, playbookForSale } from '../lib/playbooks';
import { ago } from '../lib/time';
import OwlNote from './OwlNote';
import { analyzeHref } from '../lib/analyze';
import AdSpot from './AdSpot';

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
  const { properties, loading, known } = useProperties();
  const [printAll, setPrintAll] = useState(false);
  const [calcVersion, setCalcVersion] = useState(0); // remounts the bid calculator when the income value is applied
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

  const p = properties.find((x) => x.id === id);
  if (!p) {
    if (loading) return <main className="page"><p>Checking the official lists…</p></main>;
    if (!known(id) && (id.startsWith(LIVE_ID_PREFIX) || id.startsWith(IRS_ID_PREFIX))) {
      return (
        <main className="page empty-page">
          <OwlNote big>This list is being re-verified</OwlNote>
          <h1 className="sr-only">Listing being re-verified</h1>
          <p>We only show listings we’ve just verified against the official source, and that check is running late. This doesn’t mean the property was sold or removed. Check back shortly, or <a href="#/live">see the official sources</a>.</p>
        </main>
      );
    }
    return (
      <main className="page empty-page">
        <OwlNote big>This property isn’t available</OwlNote>
        <h1 className="sr-only">Property not available</h1>
        {id.startsWith(LIVE_ID_PREFIX) ? (
          <p>
            This parcel is no longer on the Clark County Treasurer’s verified auction list. It may have been paid off, withdrawn or sold.{' '}
            <a href="#/live">See the current list</a>
          </p>
        ) : id.startsWith(IRS_ID_PREFIX) ? (
          <p>
            This IRS sale is no longer listed on irsauctions.gov. It may have been cancelled, postponed or held.{' '}
            <a href="#/live">See current sales</a>
          </p>
        ) : (
          <p>We couldn’t find that property. It may have sold or been removed. <a href="#/search">Back to search</a></p>
        )}
      </main>
    );
  }
  const verified = p.origin === 'treasurer-feed' || p.origin === 'irs-feed';
  const irs = p.origin === 'irs-feed';
  const notChecked = (v: number | null, text: string) => (v === null ? <span className="muted">{text}</span> : fmtMoney(v));
  const s = p.sale;
  const analyzeLink = analyzeHref({ address: p.address, city: p.city, state: p.state, county: p.county, saleType: s?.saleType });
  const status = STATUS[p.status];
  // A home that isn't for sale (in pre-foreclosure, or the sale ended) gets no bid, spread, calculator or save tools:
  // it isn't a deal, and the owner may still keep it. Only its timeline and the official notice are shown.
  const forSale = status.purchasable && !!s;
  const money = moneySummary(p);
  const liens = assessLiens(p);
  const steps = purchaseSteps(p);
  const report = diligenceReport(p);
  const days = s?.startsAt ? daysUntil(s.startsAt) : null;
  const priceLabel = s?.saleType === 'REO' ? 'List price' : 'Minimum bid';
  const online = p.status === 'ONLINE_BIDDING';
  const baseHref = `#/property/${p.id}`;
  const count = (r: CheckResult) => report.filter((c) => c.result === r).length;
  const flags = count('flag');
  const reviews = count('review');
  const surviving = liens.filter((l) => l.outcome === 'LIKELY_SURVIVES').length;
  const commercial = classOfType(p.propertyType) === 'commercial';
  const baseChecklist = checklistForProperty(s?.saleType ?? null, p.status);
  const worded = commercial ? forCommercial(baseChecklist) : baseChecklist;
  const checklist = p.propertyType === 'Vacant Land' || p.propertyType === 'Commercial Land' ? forLand(worded) : worded;
  const saleBook = playbookForSale(s?.saleType);
  const commercialBook = commercial ? playbookByKey('commercial') : null;
  const playbook = commercialBook ?? saleBook;
  const bidDefaults = defaultsFor(p);
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  // Pictures only for homes that are for sale (never pre-foreclosure: the Assessor's record names the owner).
  const sampleViews = parcelDigits(p.apn) === null;
  // Sample parcels aren't real, so they get a placeholder parcel number; their buttons are shown disabled.
  // Before a trustee, HOA or judicial foreclosure sale the owner is still a homeowner in foreclosure: leave out the
  // county links (aerial map, building sketch, Assessor record) that name them. Street View stays.
  const ownerInForeclosure = s?.saleType === 'TRUSTEE_SALE' || s?.saleType === 'HOA_FORECLOSURE' || s?.saleType === 'JUDICIAL_FORECLOSURE';
  const views = status.purchasable
    ? propertyViews({ apn: sampleViews ? '100-00-000-000' : p.apn, address: p.address, city: p.city, lat: p.lat, lng: p.lng, listingUrl: s?.saleType === 'REO' ? s.officialUrl : null })
        .filter((v) => !ownerInForeclosure || !['aerial', 'sketch', 'assessor'].includes(v.key))
    : [];
  const auction = !!s && s.saleType !== 'REO';

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
          <p>{s ? (s.whatYouBuy ?? WHAT_YOU_BUY[s.saleType]) : 'Nothing is for sale. Liens alone do not force a sale until an enforcement action is recorded.'}</p>
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
    ...(views.length
      ? [
          {
            key: 'photos',
            title: 'Photos & views',
            icon: <IconCamera />,
            summary: `${views.map((v) => v.label).join(' · ')}${auction ? ' · no interior access before auction' : ''}`,
            content: () => <PhotosAndViews links={views} sample={sampleViews} maxBidHref={`${baseHref}/max-bid`} auction={auction} />,
          } satisfies DrillSection,
        ]
      : []),
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
                  <div><dt>{s.saleType === 'REO' ? 'List price' : 'Minimum bid'}</dt><dd>{s.minimumBid ? fmtMoney(s.minimumBid) : 'Announced at sale'}</dd></div>
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
      tone: surviving > 0 ? 'stop' : p.liensChecked === false ? 'wait' : undefined,
      summary: p.liensChecked === false ? 'Not searched yet: search the County Recorder or order a title search' : `${plural(liens.length, 'lien')} recorded · ${fmtMoney(money.likelySurviving)} likely ${s ? 'survive' : 'remain'}`,
      content: () =>
        p.liensChecked === false ? (
          <>
            <div className="verify">
              <strong>Liens haven’t been searched for this listing.</strong>{' '}
              {s?.saleType === 'FEDERAL_TAX_SEIZURE'
                ? 'The IRS notice doesn’t list other liens. You get only the taxpayer’s interest: mortgages and other liens recorded before the federal tax lien, and property taxes, stay with the property.'
                : 'The Treasurer’s list shows the minimum bid, not the liens. Not all liens are cleared by a tax sale: a federal tax lien, special assessments and some government liens can stay.'}{' '}
              Before you bid, search the Clark County Recorder by parcel number, or order a title search from a title company.
            </div>
            <dl className="mini money-box">
              <div><dt>{priceLabel}</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
              <div><dt>Liens that may stay</dt><dd>Not searched</dd></div>
            </dl>
            <p className="row">
              <a href="https://recorderecomm.clarkcountynv.gov/AcclaimWeb/" target="_blank" rel="noreferrer noopener">Search Recorder documents ↗</a>
              <a href="#/pros">Find a title company</a>
            </p>
          </>
        ) : (
        <>
          <dl className="mini money-box">
            <div><dt>Minimum / opening bid</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
            <div><dt>Likely surviving liens</dt><dd className={money.likelySurviving ? 'neg' : ''}>{fmtMoney(money.likelySurviving)}</dd></div>
            <div><dt>Uncertain liens</dt><dd>{fmtMoney(money.uncertain)}</dd></div>
            <div><dt>Est. market value</dt><dd>{notChecked(p.estimatedMarketValue, 'Not estimated')}</dd></div>
            <div className="total"><dt>Rough spread at minimum bid</dt><dd className={money.estimatedEquity !== null && money.estimatedEquity < 0 ? 'neg' : ''}>{fmtMoney(money.estimatedEquity)}</dd></div>
          </dl>
          <p className="muted small">
            Spread = estimated value minus the minimum bid and likely surviving liens. It leaves out uncertain liens, repairs and costs, so it isn’t profit or equity.
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
      summary: commercial ? 'Value by rent income, every cost counted, and your walk-away number' : 'Every cost counted, your walk-away number, and what-if scenarios',
      content: () => (
        <>
          {commercial && (
            <IncomeValue
              propertyId={p.id}
              onUse={(v) => {
                setSavedExitValue(p.id, bidDefaults, v);
                setCalcVersion((n) => n + 1);
              }}
            />
          )}
          <StrategyTabs
            strategies={[
              { key: 'flip', label: 'Fix and sell', about: 'The most you can bid and still make your profit when you fix it up and sell it.', render: () => <BidCalculator key={calcVersion} propertyId={p.id} defaults={bidDefaults} openingBid={s?.minimumBid ?? null} commercial={commercial} /> },
              commercial
                ? { key: 'commercial', label: 'Commercial income', about: 'The most you can bid for the building’s income, counting the months it takes to lease it up.', render: () => <CommercialCalculator storageKey={`fsf.calc.commercial.${p.id}.v1`} start={buyFromBid(bidDefaults)} /> }
                : { key: 'rent', label: 'Keep and rent', about: 'The most you can bid and still get your return on the cash you leave in, with or without a loan afterward.', render: () => <RentCalculator storageKey={`fsf.calc.rent.${p.id}.v1`} start={buyFromBid(bidDefaults)} /> },
            ]}
          />
        </>
      ),
    },
    {
      key: 'how-to-buy',
      title: forSale ? 'How to buy it' : 'If it goes to sale',
      icon: <IconSteps />,
      summary: `${plural(steps.length, 'step')} and ${plural(checklist.items.length + (commercial ? CHECKLISTS.commercial.items.length : 0), 'item')} to have ready`,
      content: () => (
        <>
          <ol className="steps">
            {steps.map((st) => <li key={st}>{st}</li>)}
          </ol>
          {saleBook && <p><a href={`#/playbooks/${saleBook.key}`}>Read the full guide for this sale type →</a></p>}
          {commercialBook && <p><a href="#/playbooks/commercial">Buying commercial? Read the commercial property guide →</a></p>}
          <BuyerChecklistBox list={checklist} playbook={s?.saleType === 'FEDERAL_TAX_SEIZURE' ? 'irs' : undefined} />
          {commercial && <BuyerChecklistBox list={p.propertyType === 'Commercial Land' ? forLand(CHECKLISTS.commercial) : CHECKLISTS.commercial} />}
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
            summary: `${plural(playbook.team.length, 'professional')} you need for this ${commercial ? 'commercial property' : 'sale type'}`,
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
          {/* Owner names aren't needed to research or bid, so homeowners' names are never shown: the parcel number and the
              county's own records are enough. Only a bank or agency selling a home it owns is named, as the seller. */}
          {p.status === 'BROKER_OFFER' && p.ownerOfRecord ? (
            <div><dt>Seller (owner of record)</dt><dd>{p.ownerOfRecord}</dd></div>
          ) : (
            <div><dt>Owner of record</dt><dd className="muted">Not shown: you don’t need it to research or bid. The county’s records are linked on this page.</dd></div>
          )}
          {p.legalDescription && <div><dt>Legal description</dt><dd className="small">{p.legalDescription}</dd></div>}
          <div><dt>Type</dt><dd>{p.propertyType}</dd></div>
          {p.landUse && <div><dt>Land use <span className="prov official">County Assessor</span></dt><dd>{p.landUse.code} {p.landUse.description}</dd></div>}
          {p.beds !== null && <div><dt>Beds / baths</dt><dd>{p.beds} / {p.baths}</dd></div>}
          {p.sqft && <div><dt>Living area</dt><dd>{p.sqft.toLocaleString()} sq ft</dd></div>}
          {!!p.lotSqft && <div><dt>Lot</dt><dd>{p.lotSqft.toLocaleString()} sq ft</dd></div>}
          {p.yearBuilt && <div><dt>Year built</dt><dd>{p.yearBuilt}</dd></div>}
          <div><dt>Assessed value <span className="prov official">County Assessor</span></dt><dd>{notChecked(p.assessedValue, 'See the Assessor record')}</dd></div>
          <div><dt>Estimated market value <span className="prov estimate">Estimate, not verified</span></dt><dd>{notChecked(p.estimatedMarketValue, 'Not estimated: pull recent sales of similar properties')}</dd></div>
          <div><dt>Last sale <span className="prov official">County Recorder</span></dt><dd>{p.lastSale ? `${fmtMoney(p.lastSale.price)} on ${fmtDate(p.lastSale.date)}` : verified ? <span className="muted">See the Recorder</span> : 'None on record'}</dd></div>
          {forSale ? <div><dt>Occupancy <span className="prov estimate">Confirm from the street or the listing</span></dt><dd>{p.occupancy}</dd></div> : <div><dt>Occupancy</dt><dd className="muted">Not shown: this home isn’t for sale. Don’t visit or contact the owner.</dd></div>}
          <div><dt>Record updated</dt><dd>{fmtDateTime(p.lastUpdated)}</dd></div>
        </dl>
      ),
    },
  ];
  const shownSections = forSale ? sections : sections.filter((x) => x.key !== 'max-bid');
  const open = !printAll && shownSections.some((x) => x.key === section);

  return (
    <main className="page">
      <PageHero
        compact={open}
        top={
          <>
            <a href={open ? baseHref : lastList().href}>{open ? '← Property overview' : `← ${lastList().label}`}</a>
            <span className="hero-actions">
              {forSale && <SaveDealButton p={p} />}
              {forSale && analyzeLink && <a className="hero-btn" href={analyzeLink}>Analyze this property</a>}
              {verified && <TrackButton target={irs ? `irs:${p.id.slice(IRS_ID_PREFIX.length)}` : `tax:${p.apn}`} label={`${p.address} (parcel ${p.apn})`} />}
              <button className="hero-btn" onClick={() => window.print()}>Print full report</button>
            </span>
          </>
        }
        eyebrow={
          <>
            <StatusBadge status={p.status} />
            {s && <span className="eyebrow">{SALE_TYPE_LABEL[s.saleType]}</span>}
            {verified && <span className="eyebrow"><span className="live-dot" aria-hidden /> {irs ? 'Listed by the IRS on irsauctions.gov' : 'On the Treasurer’s official list'}</span>}
          </>
        }
        title={open ? <a className="title-link" href={baseHref}>{p.address}</a> : p.address}
        sub={
          <>
            {p.zip ? `${p.city}, ${p.state} ${p.zip} · ${p.county} County` : `${p.county} County, ${p.state}`} · <span className="nowrap">Parcel {p.apn}</span>
            {!open && (
              <span className="hero-meta">
                <span>You’d buy: <strong>{s?.whatYouBuy ? 'what the court’s order sets (read it)' : playbook ? playbook.youGet.split(',')[0].replace(/\.$/, '') : s ? SALE_TYPE_LABEL[s.saleType] : 'nothing yet (not for sale)'}</strong></span>
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
              {days !== null && days >= 0 && <div className="countdown-days">{whenLabel(days)}</div>}
            </div>
          ) : undefined
        }
      >
        {!open && forSale && (
          <dl className="glance" aria-label="At a glance">
            <div className="key"><dt>{priceLabel}</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
            <div><dt>Est. market value</dt><dd>{notChecked(p.estimatedMarketValue, 'Your comps')}</dd></div>
            <div><dt>Liens likely {s ? 'surviving' : 'remaining'}</dt><dd className={money.likelySurviving ? 'caution' : ''}>{p.liensChecked === false ? <span className="muted">Not searched</span> : fmtMoney(money.likelySurviving)}</dd></div>
            <div><dt>Spread before costs</dt><dd className={money.estimatedEquity !== null && money.estimatedEquity < 0 ? 'neg' : ''}>{notChecked(money.estimatedEquity, 'Needs your numbers')}</dd></div>
          </dl>
        )}
      </PageHero>

      {!verified && SHOW_SAMPLE_DATA && (
        <div className="caution sample-banner" role="note">
          <strong>Sample property: fictional, for practice.</strong> The address, dates and numbers are made up to show how a listing reads. At a real auction the opening bid isn’t the price: bidding usually rises toward what buyers think the property is worth after its liens, repairs and risks, and many sales are postponed or cancelled.
        </div>
      )}

      <div className="verify" role="alert">
        {verified && !irs && <>On the Clark County Treasurer’s official list, re-checked {ago(p.lastUpdated)}. The list shows the minimum bid and auction details only: value, liens and condition are for you to research. </>}
        {irs && <>Listed by the IRS on irsauctions.gov, re-checked {ago(p.lastUpdated)}; the parcel is confirmed in the County Assessor’s records. Read the full notice of sale for the terms: value, liens and condition are for you to research. </>}
        <strong>Verify before bidding.</strong> Sales are often paid off, postponed, cancelled or challenged at the last minute. Confirm with{' '}
        {s?.conductedBy ?? 'the conducting agency'} and read the official notice. This report is a screening tool, not a title search, and does
        not mean title is clear.
      </div>

      <DrillDown sections={shownSections} active={section} baseHref={baseHref} label="Property sections" printAll={printAll} />
      <AdSpot spot="property" />
    </main>
  );
}
