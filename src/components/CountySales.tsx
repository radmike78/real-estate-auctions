import { countyName, stateByCode, timeZoneFor } from '../lib/regions';
import type { CountySale } from '../lib/countySales';
import { fmtDateTime } from '../lib/status';
import { Cited } from './Cited';

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const date = (iso: string, timeZone: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });
/** "10 AM" or "10:30 AM", in the county's time. */
const time = (iso: string, timeZone: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).replace(':00', '');
const zone = (iso: string, timeZone: string) => new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? '';

/** When the sale runs, in the county's own local time and only as precisely as the county announced it. */
function when(s: CountySale): string {
  const tz = timeZoneFor(s.state, s.county);
  const d1 = date(s.startsAt, tz);
  const d2 = date(s.endsAt, tz);
  if (s.datesOnly) return d1 === d2 ? d1 : `${d1} to ${d2}`;
  if (s.startOnly) return `${d1}, ${time(s.startsAt, tz)} ${zone(s.startsAt, tz)}`;
  // One day: "Nov 3, 2026, 10 AM–4 PM CST" instead of repeating the date.
  if (d1 === d2) return `${d1}, ${time(s.startsAt, tz)}–${time(s.endsAt, tz)} ${zone(s.endsAt, tz)}`;
  return `${d1}, ${time(s.startsAt, tz)} ${zone(s.startsAt, tz)} to ${d2}, ${time(s.endsAt, tz)} ${zone(s.endsAt, tz)}`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The full date a sale's name starts with ("November 3, 2026 tax sale"): the date line under the title already says it. */
const LEADING_DATE = /^[A-Z][a-z]+ \d{1,2}, \d{4} /;

/** "Travis County tax sale" (its date is on the line below), or "Los Angeles County, California: 2026B follow-up auction". */
function title(s: CountySale, oneState: boolean): string {
  const state = oneState ? '' : stateByCode(s.state)?.name;
  const name = s.name.replace(LEADING_DATE, '');
  if (!state && name !== s.name) return `${countyName(s.county)} ${name}`;
  return `${countyName(s.county)}${state ? `, ${state}` : ''}: ${capitalize(name)}`;
}

/**
 * Upcoming county tax sales: the dates, and links to the county's own sale page and property list. Notes that apply to
 * every card (dates can change; Texas's no-delinquent-taxes statement) are shown once above the cards, and the state
 * is left out of the titles when every sale is in one state.
 */
export default function CountySales({ sales }: { sales: CountySale[] }) {
  const oneState = new Set(sales.map((s) => s.state)).size === 1;
  const hasTexas = sales.some((s) => s.state === 'TX');
  return (
    <>
      <div className="county-sales-notes">
        <p>Dates can change: each county’s own page is the official one.</p>
        {hasTexas && (
          <p>
            <strong>{oneState ? 'Tax statement: ' : 'Texas sales: '}</strong>
            <Cited text="in counties of 250,000 people or more, and smaller ones that adopt the rule, you need the county tax office’s statement that you owe no delinquent taxes before you get a deed (Tax Code 34.015), or, where the county uses it, a bidder registration (Tax Code 34.011). Ask for it early; it’s good for 90 days." />
          </p>
        )}
      </div>
      <ul className="county-sales">
        {sales.map((s) => {
          const tz = timeZoneFor(s.state, s.county);
          return (
            <li key={s.id} className="county-sale">
              <span className={`badge county-sale-format fmt-${s.format.split(' ')[0].toLowerCase()}`}>{s.format}</span>
              <h3>{title(s, oneState)}</h3>
              <p className="county-sale-when">{when(s)}</p>
              {s.place && <p className="county-sale-place">{s.place}</p>}
              {s.format === 'Over-the-counter offers' && (
                <p>Properties that didn’t sell at the county’s auction. Send an offer to the county during these dates, following its instructions.</p>
              )}
              {(s.registerBy || s.redeemBy || s.registerDay) && (
                <ul className="county-sale-dates">
                  {s.registerBy && <li>Register and pay the deposit by {fmtDateTime(s.registerBy, tz)}</li>}
                  {s.registerDay && <li>{s.registerWhat ?? 'Register'} by {day(s.registerDay)}</li>}
                  {s.redeemBy && <li>Owners can pay the taxes until {fmtDateTime(s.redeemBy, tz)}, so properties come off the list before the sale</li>}
                </ul>
              )}
              {s.bidRules?.length ? (
                <details className="county-sale-rules">
                  <summary>Before you can bid ({s.bidRules.length} {s.bidRules.length === 1 ? 'rule' : 'rules'})</summary>
                  <ul>{s.bidRules.map((r) => <li key={r}>{r}</li>)}</ul>
                </details>
              ) : null}
              <div className="row county-sale-actions">
                {s.listUrl ? (
                  <a className="btn" href={s.listUrl} target="_blank" rel="noreferrer noopener">Property list&nbsp;↗</a>
                ) : (
                  <span className="muted">{s.listNote ?? (s.listExpected ? `The county plans to post the list ${s.listExpected}.` : 'The county hasn’t posted the list yet.')}</span>
                )}
                <a className={s.listUrl ? 'btn btn-secondary' : 'btn'} href={s.saleUrl} target="_blank" rel="noreferrer noopener">County sale page&nbsp;↗</a>
              </div>
              <p className="small muted">Source: {s.agency}, checked {day(s.checkedOn)}.</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
