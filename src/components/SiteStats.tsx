import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtDate } from '../lib/status';
import { ranges } from './AdvertiserPage';
import DailyColumns from './DailyColumns';

interface SiteSummary {
  from: string;
  to: string;
  days: number;
  visits: number;
  pageViews: number;
  avgDailyVisitors: number;
  busiestDay: { day: string; visits: number } | null;
  daily: { day: string; visits: number; pageViews: number }[];
  pages: { key: string; label: string; views: number; visits: number }[];
  actions: { key: string; label: string; total: number; visits: number }[];
  advertisers: { appearances: number; profileViews: number; contactClicks: number; leads: number };
}

const n = (x: number) => x.toLocaleString();

/** Site-wide traffic for the admin, plus a one-page summary to show prospective advertisers. */
export default function SiteStats() {
  const [rangeKey, setRangeKey] = useState('d30');
  const range = ranges()[rangeKey];
  const [s, setS] = useState<SiteSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  useEffect(() => {
    setErr(null);
    api<SiteSummary>(`/api/admin/site-stats?from=${range.from}&to=${range.to}`).then(setS).catch((e: Error) => setErr(e.message));
  }, [range.from, range.to]);

  function printSummary() {
    document.body.classList.add('print-kit');
    const done = () => {
      document.body.classList.remove('print-kit');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  const act = (k: string) => s?.actions.find((a) => a.key === k)?.total ?? 0;
  const researchers = s ? act('calculator_used') + act('deal_saved') + act('photos_opened') : 0;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="seg">
            {Object.entries(ranges()).map(([k, r]) => (
              <button key={k} aria-selected={rangeKey === k} onClick={() => setRangeKey(k)}>{r.label}</button>
            ))}
          </div>
          <span className="small muted">{fmtDate(range.from)} – {fmtDate(range.to)}</span>
        </div>
        {s && <button onClick={printSummary}>Print advertiser summary</button>}
      </div>
      {err && <div className="caution small" role="alert">{err}</div>}

      {s && (
        <>
          <section className="kpis" aria-label="Site traffic">
            <div className="kpi kpi-lead">
              <span className="kpi-label">Visits</span>
              <strong>{n(s.visits)}</strong>
              <span className="kpi-sub">one per visitor per day · {n(s.avgDailyVisitors)} a day on average</span>
            </div>
            <div className="kpi"><span className="kpi-label">Page views</span><strong>{n(s.pageViews)}</strong><span className="kpi-sub">{s.visits ? (s.pageViews / s.visits).toFixed(1) : '0'} per visit</span></div>
            <div className="kpi"><span className="kpi-label">Research actions</span><strong>{n(researchers)}</strong><span className="kpi-sub">calculator, saved deals, photos</span></div>
            <div className="kpi"><span className="kpi-label">Advertiser profile views</span><strong>{n(s.advertisers.profileViews)}</strong><span className="kpi-sub">{n(s.advertisers.contactClicks)} contact clicks</span></div>
            <div className="kpi"><span className="kpi-label">Leads to advertisers</span><strong>{n(s.advertisers.leads)}</strong><span className="kpi-sub">contact forms sent</span></div>
          </section>

          <div className="viz-root">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Daily traffic</h2>
              <button className="linkish" onClick={() => setShowTable(!showTable)}>{showTable ? 'Show charts' : 'Show as table'}</button>
            </div>
            {showTable ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Day</th><th className="num">Visits</th><th className="num">Page views</th></tr></thead>
                  <tbody>{s.daily.map((d) => <tr key={d.day}><td>{fmtDate(d.day)}</td><td className="num">{n(d.visits)}</td><td className="num">{n(d.pageViews)}</td></tr>)}</tbody>
                </table>
              </div>
            ) : (
              <div className="small-multiples">
                <DailyColumns title="Visits" data={s.daily.map((d) => ({ day: d.day, value: d.visits }))} />
                <DailyColumns title="Page views" data={s.daily.map((d) => ({ day: d.day, value: d.pageViews }))} />
              </div>
            )}
          </div>

          <div className="stats-two">
            <section>
              <h2>Most visited</h2>
              {s.pages.length === 0 ? <p className="muted">No visits in this period yet.</p> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Section</th><th className="num">Page views</th><th className="num">Visits</th></tr></thead>
                    <tbody>{s.pages.map((p) => <tr key={p.key}><td>{p.label}</td><td className="num">{n(p.views)}</td><td className="num">{n(p.visits)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>
            <section>
              <h2>What visitors did</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Action</th><th className="num">Times</th><th className="num">Visits</th></tr></thead>
                  <tbody>
                    {s.actions.map((a) => <tr key={a.key}><td>{a.label}</td><td className="num">{n(a.total)}</td><td className="num">{n(a.visits)}</td></tr>)}
                    <tr><td>Appeared in advertiser search results</td><td className="num">{n(s.advertisers.appearances)}</td><td className="num">—</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="media-kit" aria-label="Advertiser summary">
            <div className="media-kit-head">
              <span className="media-kit-label">Audience summary</span>
              <h2>Forced-Sale Finder · Clark County, NV</h2>
              <p className="muted">{fmtDate(s.from)} – {fmtDate(s.to)} ({s.days} days)</p>
            </div>
            <dl className="media-kit-grid">
              <div><dt>Visits</dt><dd>{n(s.visits)}</dd></div>
              <div><dt>Average visitors a day</dt><dd>{n(s.avgDailyVisitors)}</dd></div>
              <div><dt>Page views</dt><dd>{n(s.pageViews)}</dd></div>
              <div><dt>Research actions</dt><dd>{n(researchers)}</dd></div>
              <div><dt>Advertiser profile views</dt><dd>{n(s.advertisers.profileViews)}</dd></div>
              <div><dt>Leads sent to advertisers</dt><dd>{n(s.advertisers.leads)}</dd></div>
            </dl>
            {s.pages.length > 0 && <p><strong>Most visited:</strong> {s.pages.slice(0, 4).map((p) => p.label).join(', ')}.</p>}
            <p className="small muted">
              Who visits: buyers and investors researching Clark County tax sales, foreclosure auctions and bank-owned homes. Counted by our own
              server: known bots and repeat views are excluded, and a visit is one visitor on one day. No cookies or ad trackers, and no one is
              tracked across days. Advertisers never pay for a higher position.
            </p>
          </section>
          <p className="small muted">
            “Visits” count each visitor once per day. We can’t count unique people per month, because nothing links a visitor from one day to the
            next. That’s deliberate, for privacy.
          </p>
        </>
      )}
    </>
  );
}
