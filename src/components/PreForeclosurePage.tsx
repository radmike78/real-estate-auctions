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
import StatePicker from './StatePicker';
import ByState from './ByState';
import { BUY, NO_CONTACT, READ_NOTICE, TIMELINE, TIMELINE_NOTES, WHERE } from '../lib/states/preForeclosure';

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
    title: 'How a foreclosure progresses, state by state',
    icon: <IconClock />,
    summary: 'Notices, the waiting periods, then the trustee’s auction, in Nevada, California, Arizona and Utah',
    content: () => (
      <>
        <p>Each state has its own steps and waiting periods. Pick your state above to see only its steps.</p>
        <ByState lines={TIMELINE} ordered />
        <p className="muted">
          In every state, many foreclosures never reach auction, because owners catch up, modify the loan, sell (often as a short sale) or file bankruptcy.
        </p>
        <ByState lines={TIMELINE_NOTES} missing="Nothing more to add for this state." />
      </>
    ),
  },
  {
    key: 'where-notices',
    title: 'Where to find notices',
    icon: <IconCheckList />,
    summary: 'Which county office records them, and where they are posted and published',
    content: () => (
      <>
        <p>Notices are public records. Follow the property through the county recorder and the trustee named on the notice, never through the owner.</p>
        <ByState lines={WHERE} />
      </>
    ),
  },
  {
    key: 'how-to-buy',
    title: 'How investors buy, without contacting owners',
    icon: <IconCheckList />,
    summary: 'At the trustee’s sale, from the lender after it, or from an agent’s listing',
    content: () => (
      <>
        <p>A home in pre-foreclosure isn’t for sale. You can buy it in three ways, none of which involves the owner: at the trustee’s sale, from the lender afterward (bank-owned), or from a listing if the owner decides to sell through an agent.</p>
        <ByState lines={BUY} />
        <h3>Step-by-step guides</h3>
        <ul>
          <li>Trustee sales: <a href="#/playbooks/foreclosure">Nevada</a> · <a href="#/playbooks/caforeclosure">California</a> · <a href="#/playbooks/azforeclosure">Arizona</a> · <a href="#/playbooks/utforeclosure">Utah</a></li>
          <li>After the sale: <a href="#/bank-owned">bank-owned homes</a></li>
        </ul>
      </>
    ),
  },
  {
    key: 'prepare',
    title: 'How to get ready',
    icon: <IconCheckList />,
    summary: `${CHECKLISTS.pre.items.length} things to prepare in case a tracked home goes to sale, and how to read a notice of sale`,
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
              <li>Many notices also list an estimate of the unpaid debt and the form of payment. That isn’t required, so ask the trustee. The debt estimate and the opening bid can differ, and neither is the property’s value.</li>
            </ul>
            <h3>What the law requires in the notice</h3>
            <ByState lines={READ_NOTICE} />
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
        eyebrow={<span className="eyebrow">Not for sale yet · Tracker data: Clark County, NV · Guide: NV, CA, AZ, UT</span>}
        title={guideOpen ? <a className="title-link" href="#/pre-foreclosures">Pre-foreclosure tracker</a> : <>Pre-foreclosure <span className="grad">tracker</span></>}
        sub={guideOpen ? undefined : 'Follow homes from notice of default to auction, without contacting anyone.'}
      />

      <StatePicker label="Where is the home?" />

      <div className="caution" role="alert">
        <strong>Do not contact these homeowners.</strong> A notice of default means an owner is behind on payments. It does not mean the home
        is for sale. Every state we cover restricts deals with owners in foreclosure, and DeedOwl goes further: we never show owner names or
        contact details, and never help anyone reach owners. Use this tracker only to follow a property toward auction, or to recognize it if
        the owner lists it for sale through an agent. Ask only the trustee named on the notice, or the county recorder. Homeowners can find free
        help on our <a href="#/homeowner-help">homeowner help page</a>.
        <ByState lines={NO_CONTACT} />
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
          <p>Until then, read how the process works in the guide below. Homes in foreclosure aren’t for sale until the trustee’s auction or later, when a bank owns them.</p>
          <p className="empty-next"><strong>Buying your first rental?</strong> You don’t have to wait for an auction. Most first rentals are bought from a listing: <a href="#/toolkit/buy-box">write your buy box</a>, ask a buyer’s agent for listings that match it, look at <a href="#/bank-owned">bank-owned homes</a>, or <a href="#/practice/case">practice a purchase</a> first.</p>

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
