import { useEffect, useState } from 'react';
import { useProperties } from '../data/live';
import type { Property } from '../types';
import { loadDeals, onDealsChange, removeDeal, updateDeal, type SavedDeal } from '../lib/deals';
import { DD_STEPS, loadDdDone } from '../lib/ddFunnel';
import { SALE_TYPE_LABEL } from '../lib/rules';
import { STATUS, fmtDate, fmtDateTime, fmtMoney } from '../lib/status';
import { savedMaxBid } from './BidCalculator';
import { daysUntil, whenLabel } from './ResultsList';
import PageHero from './PageHero';
import EvidenceLog from './EvidenceLog';
import { kindLabel, loadDeals as loadAnalyzed, openDeal, SALE_KINDS, checklistFor } from '../lib/analyze';
import { countyName } from '../lib/regions';
import StatusBadge from './StatusBadge';

function DealCard({ d, p, loading }: { d: SavedDeal; p: Property | undefined; loading: boolean }) {
  const [notes, setNotes] = useState(d.notes);
  // Save notes shortly after typing stops, so closing the tab doesn't lose them.
  useEffect(() => {
    if (notes === d.notes) return;
    const t = setTimeout(() => updateDeal(d.id, { notes: notes.slice(0, 2000) }), 600);
    return () => clearTimeout(t);
  }, [notes, d.id, d.notes]);
  if (!p && loading) return <li className="deal-card"><p className="muted">Checking the official lists…</p></li>;
  if (!p) {
    return (
      <li className="deal-card">
        <div className="deal-head">
          <div>
            <h2>No longer listed</h2>
            <p className="muted">A property you saved on {fmtDate(d.savedAt)} is no longer in our listings. It may have sold, been paid off or been removed.</p>
          </div>
          <button className="linkish" aria-label="Remove property that is no longer listed" onClick={() => removeDeal(d.id)}>Remove</button>
        </div>
      </li>
    );
  }
  const s = p.sale;
  const was = d.statusAtSave ? STATUS[d.statusAtSave] : null;
  const changed = was !== null && p.status !== d.statusAtSave;
  const newPostponements = (s?.postponements ?? 0) - d.postponementsAtSave;
  const doneKeys = loadDdDone(p.id);
  const dd = DD_STEPS.filter((x) => doneKeys.includes(x.key)).length;
  const maxBid = savedMaxBid(p.id);
  const minBid = s?.minimumBid ?? null;
  const days = s?.startsAt ? daysUntil(s.startsAt) : null;
  const regDays = s?.registrationDeadline ? daysUntil(s.registrationDeadline) : null;
  const regClosed = !!s?.registrationDeadline && new Date(s.registrationDeadline).getTime() < Date.now();
  const base = `#/property/${p.id}`;

  return (
    <li className="deal-card">
      <div className="deal-head">
        <div>
          <div className="deal-badges"><StatusBadge status={p.status} />{s && <span className="deal-type">{SALE_TYPE_LABEL[s.saleType]}</span>}</div>
          <h2><a href={base}>{p.address}</a></h2>
          <p className="muted">{p.city}, {p.state} {p.zip} · <span className="nowrap">Parcel {p.apn}</span> · saved {fmtDate(d.savedAt)}</p>
        </div>
        <button className="linkish" aria-label={`Remove ${p.address} from My deals`} onClick={() => removeDeal(p.id)}>Remove</button>
      </div>

      {(changed || newPostponements > 0) && (
        <div className="caution" role="status">
          <strong>Changed since you saved it:</strong>{' '}
          {changed && <>status went from “{was?.label}” to “{STATUS[p.status].label}”. </>}
          {newPostponements > 0 && <>Postponed {newPostponements} more time{newPostponements === 1 ? '' : 's'}.</>}
          <button className="linkish" aria-label={`Mark changes to ${p.address} as seen`} onClick={() => updateDeal(p.id, { statusAtSave: p.status, postponementsAtSave: s?.postponements ?? 0 })}>Mark seen</button>
        </div>
      )}

      <dl className="deal-facts">
        <div><dt>Sale</dt><dd>{s?.startsAt ? <>{fmtDateTime(s.startsAt)}{days !== null && (days < 0 ? <span className="muted"> · passed</span> : <span className="deal-soon"> · {whenLabel(days)}</span>)}</> : '—'}</dd></div>
        <div><dt>Register by</dt><dd>{s?.registrationDeadline ? <>{fmtDateTime(s.registrationDeadline)}{regClosed ? <span className="deal-urgent"> · closed</span> : regDays !== null && regDays <= 7 && <span className="deal-urgent"> · {regDays === 0 ? 'closes today' : regDays === 1 ? 'closes tomorrow' : `${regDays} days left`}</span>}</> : '—'}</dd></div>
        <div><dt>Opening / minimum bid</dt><dd>{fmtMoney(minBid)}</dd></div>
        <div>
          <dt>Your max bid</dt>
          <dd>{maxBid === null ? <a href={`${base}/max-bid`}>Set it →</a> : <>{fmtMoney(maxBid)}{minBid !== null && <span className={minBid > maxBid ? 'deal-urgent' : 'deal-ok'}> · {minBid > maxBid ? 'opening bid is above your max' : 'room to bid'}</span>}</>}</dd>
        </div>
        <div>
          <dt>Due diligence</dt>
          <dd><a href={`${base}/due-diligence`}>{dd} of {DD_STEPS.length} steps</a><span className="deal-bar" aria-hidden><span style={{ width: `${(dd / DD_STEPS.length) * 100}%` }} /></span></dd>
        </div>
      </dl>

      <label className="field deal-notes">
        <span>Notes</span>
        <textarea rows={2} value={notes} placeholder="Questions for the title company, drive-by notes, your bid plan…" maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <EvidenceLog dealId={`listing:${p.id}`} name={p.address} />
    </li>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState(loadDeals);
  const { properties, loading } = useProperties();
  const [analyzed] = useState(loadAnalyzed);
  useEffect(() => onDealsChange(() => setDeals(loadDeals())), []);
  const sorted = [...deals].sort((a, b) => {
    // Upcoming sales soonest first, then sales that have passed, then anything without a date.
    const rank = (id: string) => {
      const t = Date.parse(properties.find((p) => p.id === id)?.sale?.startsAt ?? '');
      return Number.isNaN(t) ? Infinity : t >= Date.now() ? t : 1e15 - t;
    };
    return rank(a.id) - rank(b.id);
  });

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Saved in this browser</span>}
        title={<>My <span className="grad">deals</span></>}
        sub="Your saved properties: what changed, what’s due, and whether your bid still fits."
      />
      {analyzed.length > 0 && (
        <section className="analyzed-deals" aria-labelledby="analyzed-head">
          <h2 id="analyzed-head">Deals you’re analyzing</h2>
          <ul className="deal-list">
            {analyzed.map((d) => {
              const k = SALE_KINDS.find((x) => x.key === d.kind)!;
              const all = checklistFor(d).flatMap((g) => g.items);
              const done = all.filter((i) => d.done.includes(i.id)).length;
              return (
                <li key={d.id} className="deal-card">
                  <div className="deal-head">
                    <div>
                      <h3><button type="button" className="linkish" onClick={() => openDeal(d)}>{d.name}</button></h3>
                      <p className="muted">{kindLabel(k, d.state)} · {countyName(d.county)}, {d.state} · checklist {done} of {all.length} done</p>
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={() => openDeal(d)}>Open →</button>
                  </div>
                  <EvidenceLog dealId={`analyzed:${d.id}`} name={d.name} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {analyzed.length > 0 && sorted.length > 0 && <h2>Saved Clark County listings</h2>}
      {sorted.length === 0 && analyzed.length > 0 ? null : sorted.length === 0 ? (
        <section className="deals-empty">
          <img className="owl-empty" src="logo.svg" alt="" width={112} height={112} />
          <h2>No saved deals yet</h2>
          <p>Found a property you like? Describe it in <strong>Analyze a deal</strong> and save it: it will show up here with its checklist.</p>
          <a className="btn big" href="#/analyze">Analyze a deal</a>
        </section>
      ) : (
        <ul className="deal-list">{sorted.map((d) => <DealCard key={d.id} d={d} p={properties.find((x) => x.id === d.id)} loading={loading} />)}</ul>
      )}
      <p className="muted">Saved only in this browser. Clearing your browser data removes it.</p>
    </main>
  );
}
