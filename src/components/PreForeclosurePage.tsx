import { useMemo, useState } from 'react';
import { PROPERTIES, SHOW_SAMPLE_DATA } from '../data';
import { foreclosureTrack, PIPELINE, STAGE_INFO, type ForeclosureStage, type ForeclosureTrack } from '../lib/foreclosure';
import { fmtDate, fmtDateTime } from '../lib/status';
import type { Property } from '../types';
import Disclaimer from './Disclaimer';
import BuyerChecklistBox from './BuyerChecklistBox';
import { CHECKLISTS } from '../lib/buyerChecklists';
import DrillDown, { type DrillSection } from './DrillDown';
import PageHero from './PageHero';
import { IconCheckList, IconClock } from './Icons';
import EmptyState from './EmptyState';
import { rememberList } from '../lib/lastList';
import ScriptBox from './ScriptBox';
import { SALE_SCRIPTS } from '../lib/saleDocs';

const WATCH_KEY = 'fsf.preforeclosure.watch.v1';

// Watchlist is a per-browser convenience: { propertyId: stage last seen }.
function loadWatch(): Record<string, ForeclosureStage> {
  try {
    const v = JSON.parse(localStorage.getItem(WATCH_KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
function saveWatch(w: Record<string, ForeclosureStage>) {
  try {
    localStorage.setItem(WATCH_KEY, JSON.stringify(w));
  } catch {
    /* storage unavailable (private mode): tracking lasts for this visit only */
  }
}

type Row = { p: Property; t: ForeclosureTrack };
type StageFilter = 'active' | 'ended' | 'all' | ForeclosureStage;

function Pipeline({ t }: { t: ForeclosureTrack }) {
  const info = STAGE_INFO[t.stage];
  return (
    <ol className="pipeline" aria-label={`Stage: ${info.label}`}>
      {PIPELINE.map((label, i) => (
        <li key={label} className={i < info.step ? 'done' : i === info.step ? `current tone-${info.tone}` : ''}>
          <span>{i === 3 && info.ended ? info.label : label}</span>
        </li>
      ))}
    </ol>
  );
}

export const GUIDE: DrillSection[] = [
  {
    key: 'how-it-works',
    title: 'How a Nevada foreclosure progresses',
    icon: <IconClock />,
    summary: 'Notice of default, a 3-month wait, notice of sale, then auction',
    content: () => (
      <>
        <ol className="timeline-steps">
          <li><strong>Notice of default</strong><span>The trustee or HOA records it. The owner can still catch up and fix the default (called curing it).</span></li>
          <li><strong>3+ months</strong><span>The shortest wait before a notice of sale can be recorded: 3 months for a mortgage (NRS 107.080) and 90 days for an HOA (NRS 116.31162).</span></li>
          <li><strong>Notice of sale</strong><span>Posted for 20 days and published for 3 weeks. It sets the auction date.</span></li>
          <li><strong>Auction</strong><span>Held, postponed or cancelled. A sale becomes an auction listing on this site.</span></li>
        </ol>
        <p className="muted">
          Many never reach auction, because owners catch up, modify the loan, sell (often as a short sale) or file bankruptcy.
        </p>
      </>
    ),
  },
  {
    key: 'prepare',
    title: 'How to get ready',
    icon: <IconCheckList />,
    summary: `${CHECKLISTS.pre.items.length} things to prepare in case a tracked home goes to sale`,
    bare: true,
    content: () => (
      <>
        <BuyerChecklistBox list={CHECKLISTS.pre} />
        <div className="roadmap-cols">
          <div>
            <h3>How to read a notice of sale</h3>
            <ul>
              <li>The date, time and place of the sale (or the website, for an online sale).</li>
              <li>The trustee’s name and phone number: the only person to ask about the sale.</li>
              <li>The property: address, parcel number and legal description.</li>
              <li>In Nevada, the law requires the date, time and place, a description of the property and its address, and the trustee’s contact details.</li>
              <li>Many notices also list an estimate of the unpaid debt and the form of payment. That isn’t required, so ask the trustee. The debt estimate and the opening bid can differ, and neither is the property’s value.</li>
            </ul>
          </div>
          <ScriptBox to={SALE_SCRIPTS.trustee[0].to} script={SALE_SCRIPTS.trustee[0].script} note="Ask the trustee only. Never contact the owner or anyone living in the home." />
        </div>
      </>
    ),
  },
];

export default function PreForeclosurePage({ initialQuery = '', section }: { initialQuery?: string; section?: string }) {
  rememberList('#/pre-foreclosures', 'Back to the pre-foreclosure tracker');
  const now = useMemo(() => new Date(), []);
  const rows: Row[] = useMemo(
    () =>
      PROPERTIES.map((p) => ({ p, t: foreclosureTrack(p, now) }))
        .filter((r): r is Row => r.t !== null)
        .sort(
          (a, b) =>
            Number(STAGE_INFO[a.t.stage].ended) - Number(STAGE_INFO[b.t.stage].ended) ||
            (a.t.saleAt ?? '9999').localeCompare(b.t.saleAt ?? '9999') ||
            b.t.defaultRecordedOn.localeCompare(a.t.defaultRecordedOn),
        ),
    [now],
  );
  const [watch, setWatch] = useState(loadWatch);
  const [q, setQ] = useState(initialQuery);
  const [stage, setStage] = useState<StageFilter>('active');
  const [trackedOnly, setTrackedOnly] = useState(false);

  const update = (w: Record<string, ForeclosureStage>) => {
    setWatch(w);
    saveWatch(w);
  };
  const toggle = (r: Row) => {
    const w = { ...watch };
    if (w[r.p.id]) delete w[r.p.id];
    else w[r.p.id] = r.t.stage;
    update(w);
  };

  const needle = q.trim().toLowerCase();
  const shown = rows.filter(({ p, t }) => {
    if (trackedOnly && !watch[p.id]) return false;
    if (needle && !`${p.address} ${p.city} ${p.zip} ${p.apn}`.toLowerCase().includes(needle)) return false;
    if (stage === 'active') return !STAGE_INFO[t.stage].ended;
    if (stage === 'ended') return STAGE_INFO[t.stage].ended;
    return stage === 'all' || t.stage === stage;
  });
  const guideOpen = GUIDE.some((g) => g.key === section);
  const changed = rows.filter((r) => watch[r.p.id] && watch[r.p.id] !== r.t.stage);

  return (
    <main className="page">
      <PageHero
        compact={guideOpen}
        eyebrow={<span className="eyebrow">Not for sale yet · Nevada</span>}
        title={guideOpen ? <a className="title-link" href="#/pre-foreclosures">Pre-foreclosure tracker</a> : <>Pre-foreclosure <span className="grad">tracker</span></>}
        sub={guideOpen ? undefined : 'Follow homes from notice of default to auction, without contacting anyone.'}
      />

      <div className="caution" role="alert">
        <strong>Do not contact these homeowners.</strong> A notice of default means an owner is behind on payments. It does not mean the home
        is for sale. Nevada licenses foreclosure consultants, and a buyer who uses fraud or deceit on an owner in foreclosure faces criminal penalties.
        The owner can also cancel such a purchase for up to 2 years (NRS Chapter 645F). Owners may be in the state's Foreclosure Mediation Program, too. That's why this tracker shows no
        owner names or contact details. Use it only to follow a property toward auction, or to recognize it if the owner lists it for sale
        through an agent. Homeowners can find free help on our <a href="#/homeowner-help">homeowner help page</a>.
      </div>

      {SHOW_SAMPLE_DATA && (
        <p className="muted">
          <strong>Sample data:</strong> a live feed of Clark County Recorder notices will be
          connected once a data-use agreement with the Recorder's office is in place.
        </p>
      )}

      {!guideOpen && rows.length === 0 && (
        <EmptyState title="No notices to track yet">
          <p>Notices of default and sale will appear here once our feed of Clark County Recorder filings is connected.</p>
          <p>Until then, read how the process works in the guide below.</p>
        </EmptyState>
      )}

      <DrillDown sections={GUIDE} active={section} baseHref="#/pre-foreclosures" label="Pre-foreclosure guide" />

      {!guideOpen && (
        <>
          {changed.length > 0 && (
            <div className="notice" role="status">
              <strong>{changed.length} tracked {changed.length === 1 ? 'property has' : 'properties have'} moved to a new stage</strong> since you
              last marked them seen.
              <button className="linkish" onClick={() => update({ ...watch, ...Object.fromEntries(changed.map((r) => [r.p.id, r.t.stage])) })}>
                Mark all seen
              </button>
            </div>
          )}

          {rows.length === 0 ? null : (
          <>
          <div className="toolbar">
            <input aria-label="Filter by address, city, ZIP or parcel number" placeholder="Address, city, ZIP or parcel number" value={q} onChange={(e) => setQ(e.target.value)} />
            <select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value as StageFilter)}>
              <option value="active">In progress</option>
              <option value="ended">Ended</option>
              <option value="all">All stages</option>
              {(Object.keys(STAGE_INFO) as ForeclosureStage[]).map((s) => (
                <option key={s} value={s}>{STAGE_INFO[s].label}</option>
              ))}
            </select>
            <label className="check">
              <input type="checkbox" checked={trackedOnly} onChange={(e) => setTrackedOnly(e.target.checked)} /> Tracked only ({Object.keys(watch).length})
            </label>
          </div>

          {shown.length === 0 && (
            <EmptyState title={trackedOnly ? 'You’re not tracking any notices yet' : 'No notices match'}>
              <p>{trackedOnly ? 'Choose “Track” on any notice below to follow it here. Clear “Tracked only” to see them all.' : 'Try another address, parcel number or stage, or choose “All stages”.'}</p>
            </EmptyState>
          )}
          <p className="small muted">{shown.length} of {rows.length} properties</p>
          <ul className="track-list">
            {shown.map((r) => {
              const { p, t } = r;
              const info = STAGE_INFO[t.stage];
              const tracked = !!watch[p.id];
              const moved = tracked && watch[p.id] !== t.stage;
              return (
                <li key={p.id} className="track-card">
                  <div className="track-top">
                    <span className="track-badges">
                      <span className={`badge tone-${info.tone}`}>{info.label}</span>
                      {moved && <span className="badge tone-info">Stage changed</span>}
                    </span>
                    <button className={tracked ? 'btn' : ''} aria-pressed={tracked} onClick={() => toggle(r)}>
                      {tracked ? '★ Tracking' : '☆ Track'}
                    </button>
                  </div>
                  <div className="track-id">
                    <div className="small muted">{t.kind}</div>
                    <h3>{p.address}</h3>
                    <div className="small muted">{p.city}, {p.state} {p.zip} · <span className="nowrap">Parcel {p.apn}</span></div>
                  </div>
                  <Pipeline t={t} />
                  <p className="track-key">
                    {t.saleAt ? <>Auction <strong>{fmtDateTime(t.saleAt)}</strong></> : t.noticeOfSaleOn ? <>Notice of sale <strong>{fmtDate(t.noticeOfSaleOn)}</strong></> : <>Notice of sale not before <strong>{fmtDate(t.earliestNoticeOfSale)}</strong></>}
                  </p>
                  <details className="track-more">
                    <summary>Dates &amp; what happens next</summary>
                    <dl className="card-stats">
                      <div><dt>Default recorded</dt><dd>{fmtDate(t.defaultRecordedOn)}</dd></div>
                      <div><dt>Days in foreclosure</dt><dd>{info.ended ? '—' : t.daysInForeclosure}</dd></div>
                      <div><dt>Notice of sale</dt><dd>{t.noticeOfSaleOn ? fmtDate(t.noticeOfSaleOn) : `Not before ${fmtDate(t.earliestNoticeOfSale)}`}</dd></div>
                      <div><dt>Auction</dt><dd>{t.saleAt ? fmtDateTime(t.saleAt) : '—'}</dd></div>
                    </dl>
                    <p className="small">{t.next}</p>
                  </details>
                  <a className="small" href={`#/property/${p.id}`}>Property details →</a>
                </li>
              );
            })}
          </ul>
          </>
          )}
        </>
      )}
      <Disclaimer kind="sales" />
    </main>
  );
}
