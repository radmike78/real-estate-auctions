import type { Property } from '../types';
import { moneySummary, SALE_TYPE_LABEL } from '../lib/rules';
import { fmtDate, fmtMoney } from '../lib/status';
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

/** Whole days until a time: 1 means within the next day, negative means it has passed. */
export function daysUntil(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  return ms < 0 ? Math.floor(ms / 86_400_000) : Math.max(1, Math.ceil(ms / 86_400_000));
}

export default function ResultsList({ properties }: { properties: Property[] }) {
  if (!properties.length) {
    return (
      <div className="empty">
        <OwlNote big>No properties match. Try a nearby ZIP code or remove some filters.</OwlNote>
        <p className="muted">This site covers Clark County, NV only: Las Vegas, Henderson, North Las Vegas, Boulder City, Mesquite and the county’s unincorporated towns.</p>
      </div>
    );
  }
  return (
    <ul className="cards">
      {properties.map((p) => {
        const m = moneySummary(p);
        const d = p.sale?.startsAt ? daysUntil(p.sale.startsAt) : null;
        return (
          <li key={p.id}>
            <a className="card" href={`#/property/${p.id}`}>
              <div className="card-top">
                <span className={`card-icon${p.sale ? '' : ' wait'}`} aria-hidden>{p.sale ? SALE_ICON[p.sale.saleType] : <IconClock />}</span>
                <StatusBadge status={p.status} />
                {p.sale && <span className="muted small">{SALE_TYPE_LABEL[p.sale.saleType]}</span>}
                {p.origin === 'treasurer-feed' && <span className="badge tone-go">Treasurer list</span>}
                {p.origin === 'irs-feed' && <span className="badge tone-go">IRS sale</span>}
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
                <div className="key">
                  <dt>Min. bid</dt>
                  <dd>{fmtMoney(m.minimumBid)}</dd>
                </div>
                <div className="key">
                  <dt>Auction</dt>
                  <dd>
                    {p.sale?.startsAt ? fmtDate(p.sale.startsAt) : '—'}
                    {d !== null && d >= 0 && <span className="muted small"> ({d === 1 ? '<1d' : `${d}d`})</span>}
                  </dd>
                </div>
                <div>
                  <dt>Est. value</dt>
                  <dd>{fmtMoney(p.estimatedMarketValue)}</dd>
                </div>
                <div>
                  <dt title="Estimated value minus the minimum bid and likely surviving liens. Leaves out uncertain liens, repairs and costs.">Spread before costs</dt>
                  <dd className={m.estimatedEquity !== null && m.estimatedEquity < 0 ? 'neg' : ''}>{fmtMoney(m.estimatedEquity)}</dd>
                </div>
              </dl>
              {m.likelySurviving > 0 && p.sale && (
                <div className="warn small">⚠ {fmtMoney(m.likelySurviving)} in liens likely survive the sale</div>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
