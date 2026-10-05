import { countyName, stateByCode } from '../lib/regions';
import { SALE_TIME_ZONE, type CountySale } from '../lib/countySales';
import { fmtDateTime } from '../lib/status';

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const date = (iso: string, timeZone: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });

/** When the sale runs, in the county's own local time and only as precisely as the county announced it. */
function when(s: CountySale): string {
  const tz = SALE_TIME_ZONE[s.state];
  if (s.datesOnly) return `${date(s.startsAt, tz)} to ${date(s.endsAt, tz)}`;
  if (s.startOnly) return fmtDateTime(s.startsAt, tz);
  return `${fmtDateTime(s.startsAt, tz)} to ${fmtDateTime(s.endsAt, tz)}`;
}

/** Upcoming county tax sales: the dates, and links to the county's own sale page and property list. */
export default function CountySales({ sales }: { sales: CountySale[] }) {
  return (
    <ul className="county-sales">
      {sales.map((s) => {
        const tz = SALE_TIME_ZONE[s.state];
        return (
          <li key={s.id} className="county-sale">
            <h3>
              {countyName(s.county)}, {stateByCode(s.state)?.name}: {s.name}
            </h3>
            <p>
              <strong>{s.format}</strong>, {when(s)}
              {s.place && <>, {s.place}</>}
            </p>
            {s.format === 'Over-the-counter offers' && (
              <p>Properties that didn’t sell at the county’s auction. Send an offer to the county during these dates, following its instructions.</p>
            )}
            {(s.registerBy || s.redeemBy) && (
              <ul className="county-sale-dates">
                {s.registerBy && <li>Register and pay the deposit by {fmtDateTime(s.registerBy, tz)}</li>}
                {s.redeemBy && <li>Owners can pay the taxes until {fmtDateTime(s.redeemBy, tz)}, so properties come off the list before the sale</li>}
              </ul>
            )}
            <div className="row">
              {s.listUrl ? (
                <a className="btn" href={s.listUrl} target="_blank" rel="noreferrer noopener">Property list ↗</a>
              ) : (
                <span className="muted">{s.listExpected ? `The county plans to post the list ${s.listExpected}.` : 'The county hasn’t posted the list yet.'}</span>
              )}
              <a className={s.listUrl ? 'btn btn-secondary' : 'btn'} href={s.saleUrl} target="_blank" rel="noreferrer noopener">County sale page ↗</a>
            </div>
            <p className="small muted">
              Source: {s.agency}, checked {day(s.checkedOn)}. Dates can change: the county’s page is the official one.
            </p>
          </li>
        );
      })}
    </ul>
  );
}
