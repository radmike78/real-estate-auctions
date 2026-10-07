import type { FeedCertificate } from '../feed/types';
import { isCertificateSourceUrl } from '../feed/verify';

const cents = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const saleDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

/**
 * SID lien certificates on the current city or county list. These homes are not for sale, so
 * this shows only the parcel, address, district, amount and sale: no owner, pictures, maps,
 * Assessor links, property pages or tracking.
 */
export default function SidCertificates({ certificates, ago }: { certificates: FeedCertificate[]; ago: (iso: string) => string }) {
  if (!certificates.length) return null;
  const sales = [...new Map(certificates.map((c) => [`${c.jurisdiction}|${c.saleDate}`, c])).values()];
  const publisher = certificates[0].publishedBy;
  return (
    <section aria-labelledby="sid-head">
      <h2 id="sid-head">Special assessment (SID) lien certificates</h2>
      <p><span className="badge tone-info badge-wrap">Lien certificate sale, not a property sale</span></p>
      <p>
        You buy the right to be repaid an unpaid special improvement district assessment plus 1% a month. The owner keeps the home and
        can still pay it off. You can ask for a deed only if they don’t redeem in time (120 days, or 2 years if there’s a building).{' '}
        <a href="#/playbooks/sid">How lien certificates work&nbsp;→</a>
      </p>
      <p className="muted">
        Published by {publisher} for Clark County and the cities. Every parcel is checked against the County Assessor’s records. Registration is
        in person, about an hour before the sale (city sales set their own times). At county sales the buyer is picked by random drawing, not highest bid; each sale’s
        notice sets its own procedures.
      </p>
      {sales.map((s) => {
        const rows = certificates.filter((c) => c.jurisdiction === s.jurisdiction && c.saleDate === s.saleDate);
        return (
          <div key={`${s.jurisdiction}|${s.saleDate}`}>
            <h3>{s.jurisdiction} · {saleDay(s.saleDate)}</h3>
            <div className="table-wrap">
              <table className="stack-table">
                <thead>
                  <tr><th>Parcel (APN)</th><th>Address</th><th>District</th><th className="num">Amount due</th><th>Verified</th><th /></tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={`${c.district}|${c.apn}`}>
                      <td data-label="Parcel (APN)">{c.apn}</td>
                      <td data-label="Address">{c.address ?? <span className="muted">No street address</span>}</td>
                      <td data-label="District">{c.district}</td>
                      <td data-label="Amount due" className="num">{cents(c.amountDue)}</td>
                      <td data-label="Verified" className="small" title={`Snapshot SHA-256 ${c.snapshotSha256}`}><span>{ago(c.lastVerifiedAt)}<span className="muted"> · Assessor confirmed</span></span></td>
                      <td data-label="">{isCertificateSourceUrl(c.sourceUrl) && <a href={c.sourceUrl} target="_blank" rel="noreferrer noopener">Confirm&nbsp;↗</a>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}
