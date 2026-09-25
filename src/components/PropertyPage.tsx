import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import type { LienType } from '../types';
import { diligenceReport, type CheckResult } from '../lib/diligence';
import { assessLiens, moneySummary, SALE_TYPE_LABEL, WHAT_YOU_BUY, type SurvivalOutcome } from '../lib/rules';
import { STATUS, fmtDate, fmtDateTime, fmtMoney, purchaseSteps } from '../lib/status';
import StatusBadge from './StatusBadge';
import SourceTag from './SourceTag';
import { daysUntil } from './ResultsList';
import Disclaimer from './Disclaimer';

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

const CHECK_LABEL: Record<CheckResult, string> = { ok: 'OK', flag: 'Flag', review: 'Review', manual: 'Manual' };

export default function PropertyPage({ id }: { id: string }) {
  const p = SAMPLE_PROPERTIES.find((x) => x.id === id);
  if (!p) {
    return (
      <main className="page">
        <p>Property not found. <a href="#/">Back to search</a></p>
      </main>
    );
  }
  const s = p.sale;
  const status = STATUS[p.status];
  const money = moneySummary(p);
  const liens = assessLiens(p);
  const steps = purchaseSteps(p);
  const report = diligenceReport(p);
  const days = s?.startsAt ? daysUntil(s.startsAt) : null;
  const online = p.status === 'ONLINE_BIDDING';

  return (
    <main className="page">
      <div className="page-actions no-print">
        <a href="#/">← Back to results</a>
        <button onClick={() => window.print()}>Print due-diligence report</button>
      </div>

      <header className="prop-head">
        <div>
          <div className="card-top">
            <StatusBadge status={p.status} />
            {s && <span className="muted">{SALE_TYPE_LABEL[s.saleType]}</span>}
          </div>
          <h1>{p.address}</h1>
          <p className="muted">
            {p.city}, {p.state} {p.zip} · {p.county} County · APN {p.apn}
          </p>
        </div>
        {s?.startsAt && (
          <div className="countdown">
            <div className="small muted">{days !== null && days < 0 ? 'Scheduled sale was' : 'Sale starts'}</div>
            <div className="big">{fmtDateTime(s.startsAt)}</div>
            {days !== null && days >= 0 && <div className="small">{days === 0 ? 'Today' : `in ${days} day${days === 1 ? '' : 's'}`}</div>}
          </div>
        )}
      </header>

      <div className="verify" role="alert">
        <strong>Verify before bidding.</strong> Sales are often paid off, postponed, cancelled or challenged at the last minute. Confirm with{' '}
        {s?.conductedBy ?? 'the conducting agency'} and read the official notice. This report is a screening tool, not a title search, and does
        not mean title is clear.
      </div>

      <section className="four" aria-label="Summary">
        <div className={`q tone-border-${status.tone}`}>
          <h2>1. Is it actually heading to sale?</h2>
          <p>
            <strong>{status.purchasable ? 'Yes.' : 'Not right now.'}</strong> {status.explanation}
          </p>
        </div>
        <div className="q">
          <h2>2. What would I be buying?</h2>
          <p>{s ? WHAT_YOU_BUY[s.saleType] : 'Nothing is for sale. Liens alone do not force a sale until an enforcement action is recorded.'}</p>
        </div>
        <div className="q">
          <h2>3. What liens may remain?</h2>
          <dl className="mini">
            <div><dt>Minimum / opening bid</dt><dd>{fmtMoney(money.minimumBid)}</dd></div>
            <div><dt>Likely surviving liens</dt><dd className={money.likelySurviving ? 'neg' : ''}>{fmtMoney(money.likelySurviving)}</dd></div>
            <div><dt>Uncertain liens</dt><dd>{fmtMoney(money.uncertain)}</dd></div>
            <div><dt>Est. market value</dt><dd>{fmtMoney(p.estimatedMarketValue)}</dd></div>
            <div className="total"><dt>Rough equity</dt><dd className={money.estimatedEquity !== null && money.estimatedEquity < 0 ? 'neg' : ''}>{fmtMoney(money.estimatedEquity)}</dd></div>
          </dl>
        </div>
        <div className="q">
          <h2>4. What do I do next?</h2>
          <p>{steps[0]}</p>
          <a href="#steps" onClick={(e) => { e.preventDefault(); document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' }); }}>
            See all {steps.length} steps ↓
          </a>
        </div>
      </section>

      {s && (
        <section>
          <h2>{online ? 'Online auction details' : 'Sale details'}</h2>
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
        </section>
      )}

      <section>
        <h2>Recorded liens &amp; apparent survival</h2>
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
                  <td><span className={`pill out-${outcome}`}>{p.sale ? OUTCOME_LABEL[outcome] : 'Remains'}</span></td>
                  <td className="small">{reason}</td>
                  <td><SourceTag source={lien.source} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="steps">
        <h2>How to buy this property</h2>
        <ol className="steps">
          {steps.map((st) => <li key={st}>{st}</li>)}
        </ol>
        <Disclaimer kind="sales" compact />
      </section>

      <section>
        <h2>Due-diligence report</h2>
        <p className="muted small">Automated screening only. It does not clear title, and a title company or attorney must make that call.</p>
        <ul className="checks">
          {report.map((c) => (
            <li key={c.area} className={`check-${c.result}`}>
              <span className="check-tag">{CHECK_LABEL[c.result]}</span>
              <div>
                <strong>{c.area}</strong>
                <div className="small">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="two-col">
        <section>
          <h2>Property record</h2>
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
            <div><dt>Assessed value</dt><dd>{fmtMoney(p.assessedValue)}</dd></div>
            <div><dt>Last sale</dt><dd>{p.lastSale ? `${fmtMoney(p.lastSale.price)} on ${fmtDate(p.lastSale.date)}` : 'None on record'}</dd></div>
            <div><dt>Occupancy</dt><dd>{p.occupancy}</dd></div>
            <div><dt>Record updated</dt><dd>{fmtDateTime(p.lastUpdated)}</dd></div>
          </dl>
        </section>
        <section>
          <h2>Timeline</h2>
          <ol className="timeline">
            {p.events.map((e, i) => (
              <li key={i}>
                <div className="small muted">{fmtDate(e.date)}</div>
                <div>{e.description}</div>
                <SourceTag source={e.source} />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
