import type { FeedFederalSale } from '../feed/types';
import { isFederalSaleUrl } from '../feed/verify';
import { irsId } from '../feed/toProperty';
import { fmtDateTime, fmtMoney } from '../lib/status';

/** Clark County property the IRS is selling, as listed on irsauctions.gov and confirmed by the Assessor. */
export default function IrsSales({ sales, ago }: { sales: FeedFederalSale[]; ago: (iso: string) => string }) {
  if (!sales.length) return null;
  return (
    <section aria-labelledby="irs-head">
      <h2 id="irs-head">IRS sales in Clark County</h2>
      <p>
        The IRS sells property it seized for unpaid federal taxes, and some sales are ordered by a federal court. You get only the
        taxpayer’s interest: mortgages and other senior liens stay, and after a seizure sale the owner has 180 days to buy it back.{' '}
        <a href="#/playbooks/irs">How IRS sales work →</a>
      </p>
      <div className="table-wrap">
        <table className="stack-table">
          <thead>
            <tr><th>Property</th><th>Parcel (APN)</th><th className="num">Minimum bid</th><th>Sale</th><th>Verified</th><th /></tr>
          </thead>
          <tbody>
            {sales.map((f) => (
              <tr key={f.id}>
                <td data-label="Property">
                  <span>
                    <a href={`#/property/${irsId(f.id)}`}>{f.address ? `${f.address}, ${f.city}` : f.title}</a>
                    {f.saleKind === 'JUDICIAL' && <span className="small warn"><br />Court-ordered sale</span>}
                  </span>
                </td>
                <td data-label="Parcel (APN)">{f.apns.join(', ')}</td>
                <td data-label="Minimum bid" className="num">{f.minimumBid === null ? <span className="muted">See notice</span> : fmtMoney(f.minimumBid)}</td>
                <td data-label="Sale">
                  <span>{fmtDateTime(f.saleStartsAt)}<span className="small muted"> · {f.saleFormat}</span></span>
                </td>
                <td data-label="Verified" className="small" title={`Snapshot SHA-256 ${f.snapshotSha256}`}>
                  <span>{ago(f.lastVerifiedAt)}<span className="muted"> · Assessor confirmed</span></span>
                </td>
                <td data-label="">{isFederalSaleUrl(f.sourceUrl) && <a href={f.sourceUrl} target="_blank" rel="noreferrer noopener">IRS notice ↗</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
