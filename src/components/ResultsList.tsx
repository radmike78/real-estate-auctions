import { useEffect, useState } from 'react';
import type { Property } from '../types';
import { moneySummary, SALE_TYPE_LABEL } from '../lib/rules';
import { fmtDate, fmtMoney, STATUS } from '../lib/status';
import { ago } from '../lib/time';
import StatusBadge from './StatusBadge';
import OwlNote from './OwlNote';
import type { ReactNode } from 'react';
import type { SaleType } from '../types';
import { IconBank, IconCalendar, IconClock, IconFile, IconFlag, IconLayers, IconShield } from './Icons';

// One icon per kind of sale, so a list can be scanned by type at a glance.
const SALE_ICON: Record<SaleType, ReactNode> = {
  TAX_DEED: <IconFile />,
  TAX_LIEN_CERTIFICATE: <IconShield />,
  TRUSTEE_SALE: <IconCalendar />,
  JUDICIAL_FORECLOSURE: <IconFlag />,
  HOA_FORECLOSURE: <IconLayers />,
  SHERIFF_EXECUTION: <IconFlag />,
  FEDERAL_TAX_SEIZURE: <IconFlag />,
  REO: <IconBank />,
};

const pacificDate = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);

/** Calendar days until a time, counted on Las Vegas dates: 0 is today, 1 tomorrow; negative means it has passed. */
export function daysUntil(iso: string, now = Date.now()) {
  const t = new Date(iso).getTime();
  const days = Math.round((Date.parse(pacificDate(t)) - Date.parse(pacificDate(now))) / 86_400_000);
  return t < now ? Math.min(-1, days) : days;
}

/** "today", "tomorrow" or "in 5 days" for a non-negative daysUntil value. */
export const whenLabel = (days: number) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

const PAGE = 24;

export default function ResultsList({ properties }: { properties: Property[] }) {
  // Show results a page at a time so the list stays short; a new search starts again at the first page.
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [properties]);
  if (!properties.length) {
    return (
      <div className="empty">
        <OwlNote big>No properties match. Try a nearby ZIP code or remove some filters.</OwlNote>
        <p className="muted">This site covers Clark County, NV only: Las Vegas, Henderson, North Las Vegas, Boulder City, Mesquite and the county’s unincorporated towns.</p>
      </div>
    );
  }
  return (
    <>
    <ul className="cards">
      {properties.slice(0, shown).map((p) => {
        const m = moneySummary(p);
        const d = p.sale?.startsAt ? daysUntil(p.sale.startsAt) : null;
        // The top stripe only signals risk: red = not for sale / cancelled, amber = caution, otherwise the brand color.
        const tone = STATUS[p.status].tone;
        const risk = tone === 'stop' ? ' risk-stop' : tone === 'wait' || (m.likelySurviving > 0 && p.sale) ? ' risk-wait' : '';
        return (
          <li key={p.id}>
            <a className={`card${risk}`} href={`#/property/${p.id}`}>
              <div className="card-top">
                <span className={`card-icon${p.sale ? '' : ' wait'}`} aria-hidden>{p.sale ? SALE_ICON[p.sale.saleType] : <IconClock />}</span>
                <StatusBadge status={p.status} />
                {p.sale && <span className="muted small">{SALE_TYPE_LABEL[p.sale.saleType]}</span>}
              </div>
              <h3>{p.address}</h3>
              <div className="muted small">
                {p.zip ? `${p.city}, ${p.state} ${p.zip}` : `${p.city}, ${p.state}`} · <span className="nowrap">Parcel {p.apn}</span>
              </div>
              <div className="muted small">
                {p.propertyType}
                {p.beds ? ` · ${p.beds} bd / ${p.baths} ba` : ''}
                {p.sqft ? ` · ${p.sqft.toLocaleString()} sq ft` : ''} · {p.occupancy === 'Unknown' ? 'Occupancy unknown' : p.occupancy}
              </div>
              <dl className="card-stats">
                <div className="key big">
                  <dt>{p.sale?.saleType === 'REO' ? 'List price' : 'Min. bid'}</dt>
                  {/* A seven-figure price takes a smaller size so it doesn't run into the auction date. */}
                  <dd className={fmtMoney(m.minimumBid).length > 9 ? 'long' : undefined}>{fmtMoney(m.minimumBid)}</dd>
                </div>
                <div className="key">
                  <dt>Auction</dt>
                  <dd>
                    {p.sale?.startsAt ? fmtDate(p.sale.startsAt) : '—'}
                    {d !== null && d >= 0 && <span className="card-days">{whenLabel(d)}</span>}
                  </dd>
                </div>
                <div>
                  <dt>Est. value</dt>
                  <dd>{fmtMoney(p.estimatedMarketValue)}</dd>
                </div>
                <div>
                  <dt>Spread before costs</dt>
                  {/* Plain ink, not "profit" green: this is before repairs, costs and uncertain liens. */}
                  <dd className={m.estimatedEquity !== null && m.estimatedEquity < 0 ? 'neg' : ''}>
                    {fmtMoney(m.estimatedEquity)}
                    <span className="card-days">not profit</span>
                  </dd>
                </div>
              </dl>
              {m.likelySurviving > 0 && p.sale && (
                <div className="warn small">⚠ {fmtMoney(m.likelySurviving)} in liens likely survive the sale</div>
              )}
              <SourceLine p={p} />
            </a>
          </li>
        );
      })}
    </ul>
    {properties.length > shown && (
      <div className="show-more">
        <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>
          Show {Math.min(PAGE, properties.length - shown)} more
        </button>
        <span className="muted">Showing {shown} of {properties.length}</span>
      </div>
    )}
    </>
  );
}

/** Where the listing comes from and when it was last checked, right where people decide. */
function SourceLine({ p }: { p: Property }) {
  const agency = p.origin === 'treasurer-feed' ? 'Clark County Treasurer' : p.origin === 'irs-feed' ? 'IRS (irsauctions.gov)' : null;
  if (!agency) return <div className="source-line sample">Sample record: not a real property</div>;
  return (
    <div className="source-line">
      <span className="source-check" aria-hidden>✓</span> Source: <strong>{agency}</strong> · checked {ago(p.lastUpdated)}
    </div>
  );
}
