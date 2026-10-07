import type { FeedFederalSale } from '../feed/types';
import { isClarkSale, isFederalSaleUrl } from '../feed/verify';
import { COUNTY_OFFICES } from '../lib/countyOffices';
import { countyKey } from '../lib/findDeals';
import { useMyState } from '../lib/myState';
import { countyName, stateByCode, timeZoneFor, type StateCode } from '../lib/regions';
import { irsId } from '../feed/toProperty';
import { fmtDateTime, fmtMoney } from '../lib/status';
import TrackButton from './TrackButton';

/**
 * Property the IRS is selling in the states we cover, as listed on irsauctions.gov. Clark County sales are confirmed by the
 * County Assessor and get their own page; sales elsewhere are shown as the IRS lists them, with the county assessor's
 * link so the buyer can check the parcel.
 */
export default function IrsSales({ sales, ago }: { sales: FeedFederalSale[]; ago: (iso: string) => string }) {
  const clark = sales.filter(isClarkSale);
  const elsewhere = sales.filter((f) => !isClarkSale(f));
  return (
    <>
      <ClarkIrsSales sales={clark} ago={ago} />
      <OtherIrsSales sales={elsewhere} ago={ago} />
    </>
  );
}

function OtherIrsSales({ sales, ago }: { sales: FeedFederalSale[]; ago: (iso: string) => string }) {
  const [mine] = useMyState();
  if (!sales.length) return null;
  // The visitor's state first, then by sale date.
  const sorted = [...sales].sort((a, b) => Number(b.usState === mine) - Number(a.usState === mine) || a.saleStartsAt.localeCompare(b.saleStartsAt));
  return (
    <section aria-labelledby="irs-other-head">
      <h2 id="irs-other-head">IRS sales elsewhere in Nevada, California, Arizona, Utah and Texas</h2>
      <p>
        Outside Clark County these are shown as the IRS lists them: DeedOwl hasn’t matched the parcel to county records. Check the parcel
        number with the county assessor and read the IRS notice of sale before you bid. You get only the taxpayer’s interest, and senior
        liens stay. <a href="#/playbooks/irs">How IRS sales work&nbsp;→</a>
      </p>
      <div className="table-wrap">
        <table className="stack-table">
          <thead>
            <tr><th>Property</th><th>County</th><th>Parcel</th><th className="num">Minimum bid</th><th>Sale</th><th>Checked</th><th /></tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const st = (f.usState ?? 'NV') as StateCode;
              const assessor = f.county ? COUNTY_OFFICES[countyKey(st, f.county)]?.assessor?.url : undefined;
              return (
                <tr key={f.id}>
                  <td data-label="Property">
                    <span>
                      {f.address ? `${f.address}, ${f.city}` : f.title}
                      {f.saleKind === 'JUDICIAL' && <span className="small warn"><br />Court-ordered sale</span>}
                    </span>
                  </td>
                  <td data-label="County">{f.county ? `${countyName(f.county)}, ${stateByCode(st)?.name ?? st}` : st}</td>
                  <td data-label="Parcel">{f.apns.join(', ')}</td>
                  <td data-label="Minimum bid" className="num">{f.minimumBid === null ? <span className="muted">See notice</span> : fmtMoney(f.minimumBid)}</td>
                  <td data-label="Sale"><span>{fmtDateTime(f.saleStartsAt, timeZoneFor(st, f.county))}<span className="small muted"> · {f.saleFormat}</span></span></td>
                  <td data-label="Checked" className="small" title={`Snapshot SHA-256 ${f.snapshotSha256}`}>
                    <span>{ago(f.lastVerifiedAt)}<span className="muted"> · parcel not checked by DeedOwl</span></span>
                  </td>
                  <td data-label="">
                    <span>
                      {isFederalSaleUrl(f.sourceUrl) && <a href={f.sourceUrl} target="_blank" rel="noreferrer noopener">IRS notice&nbsp;↗</a>}
                      {assessor && <><br /><a href={assessor} target="_blank" rel="noreferrer noopener">County assessor&nbsp;↗</a></>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClarkIrsSales({ sales, ago }: { sales: FeedFederalSale[]; ago: (iso: string) => string }) {
  if (!sales.length) return null;
  return (
    <section aria-labelledby="irs-head">
      <h2 id="irs-head">IRS sales in Clark County</h2>
      <p>
        The IRS sells property it seized for unpaid federal taxes, and some sales are ordered by a federal court. You get only the
        taxpayer’s interest: mortgages and other senior liens stay, and after a seizure sale the owner has 180 days to buy it back.{' '}
        <a href="#/playbooks/irs">How IRS sales work&nbsp;→</a>
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
                <td data-label="">
                  <span>
                    {isFederalSaleUrl(f.sourceUrl) && <a href={f.sourceUrl} target="_blank" rel="noreferrer noopener">IRS notice&nbsp;↗</a>}
                    <br />
                    <TrackButton target={`irs:${f.id}`} label={f.address ? `${f.address}, ${f.city} (parcel ${f.apns[0]})` : `${f.title} (parcel ${f.apns[0]})`} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
