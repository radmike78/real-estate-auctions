import { countyName, stateByCode } from '../lib/regions';
import { SALE_TIME_ZONE, type CountySale } from '../lib/countySales';
import { fmtDateTime } from '../lib/status';

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

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
              <strong>{s.format}</strong>, {fmtDateTime(s.startsAt, tz)} to {fmtDateTime(s.endsAt, tz)}
            </p>
            <ul className="county-sale-dates">
              {s.registerBy && <li>Register and pay the deposit by {fmtDateTime(s.registerBy, tz)}</li>}
              {s.redeemBy && <li>Owners can pay the taxes until {fmtDateTime(s.redeemBy, tz)}, so properties come off the list before the sale</li>}
            </ul>
            <div className="row">
              {s.listUrl ? (
                <a className="btn" href={s.listUrl} target="_blank" rel="noreferrer noopener">Property list (PDF) ↗</a>
              ) : (
                <span className="muted">The county hasn’t posted the list yet.</span>
              )}
              <a className={s.listUrl ? 'btn btn-secondary' : 'btn'} href={s.saleUrl} target="_blank" rel="noreferrer noopener">County sale page ↗</a>
            </div>
            <p className="small muted">
              From the {s.agency}, checked {day(s.checkedOn)}. Dates can change: the county’s page is the official one.
            </p>
          </li>
        );
      })}
    </ul>
  );
}
