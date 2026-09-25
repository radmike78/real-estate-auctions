import { useEffect, useState } from 'react';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { loadDeals, onDealsChange, toggleDeal, updateDeal, type SavedDeal } from '../lib/deals';
import { DD_STEPS, loadDdDone } from '../lib/ddFunnel';
import { SALE_TYPE_LABEL } from '../lib/rules';
import { STATUS, fmtDate, fmtDateTime, fmtMoney } from '../lib/status';
import { savedMaxBid } from './BidCalculator';
import { daysUntil } from './ResultsList';
import PageHero from './PageHero';
import StatusBadge from './StatusBadge';

function DealCard({ d }: { d: SavedDeal }) {
  const p = SAMPLE_PROPERTIES.find((x) => x.id === d.id);
  const [notes, setNotes] = useState(d.notes);
  if (!p) return null;
  const s = p.sale;
  const changed = p.status !== d.statusAtSave;
  const newPostponements = (s?.postponements ?? 0) - d.postponementsAtSave;
  const dd = loadDdDone(p.id).length;
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
          <p className="muted">{p.city}, {p.state} {p.zip} · APN {p.apn} · saved {fmtDate(d.savedAt.slice(0, 10))}</p>
        </div>
        <button className="linkish" onClick={() => toggleDeal(p.id, p.status, s?.postponements ?? 0)}>Remove</button>
      </div>

      {(changed || newPostponements > 0) && (
        <div className="caution" role="status">
          <strong>Changed since you saved it:</strong>{' '}
          {changed && <>status went from “{STATUS[d.statusAtSave].label}” to “{STATUS[p.status].label}”. </>}
          {newPostponements > 0 && <>Postponed {newPostponements} more time{newPostponements === 1 ? '' : 's'}.</>}
          <button className="linkish" onClick={() => updateDeal(p.id, { statusAtSave: p.status, postponementsAtSave: s?.postponements ?? 0 })}>Mark seen</button>
        </div>
      )}

      <dl className="deal-facts">
        <div><dt>Sale</dt><dd>{s?.startsAt ? <>{fmtDateTime(s.startsAt)}{days !== null && days >= 0 && <span className="deal-soon"> · in {days} day{days === 1 ? '' : 's'}</span>}</> : '—'}</dd></div>
        <div><dt>Register by</dt><dd>{s?.registrationDeadline ? <>{fmtDateTime(s.registrationDeadline)}{regClosed ? <span className="deal-urgent"> · closed</span> : regDays !== null && regDays <= 7 && <span className="deal-urgent"> · {regDays <= 1 ? 'closes within a day' : `${regDays} days left`}</span>}</> : '—'}</dd></div>
        <div><dt>Opening / minimum bid</dt><dd>{fmtMoney(minBid)}</dd></div>
        <div>
          <dt>Your max safe bid</dt>
          <dd>{maxBid === null ? <a href={`${base}/max-bid`}>Set it →</a> : <>{fmtMoney(maxBid)}{minBid !== null && <span className={minBid > maxBid ? 'deal-urgent' : 'deal-ok'}> · {minBid > maxBid ? 'opening bid is above your max' : 'room to bid'}</span>}</>}</dd>
        </div>
        <div>
          <dt>Due diligence</dt>
          <dd><a href={`${base}/due-diligence`}>{dd} of {DD_STEPS.length} steps</a><span className="deal-bar" aria-hidden><span style={{ width: `${(dd / DD_STEPS.length) * 100}%` }} /></span></dd>
        </div>
      </dl>

      <label className="field deal-notes">
        <span>Notes</span>
        <textarea rows={2} value={notes} placeholder="Questions for the title company, drive-by notes, your bid plan…" onChange={(e) => setNotes(e.target.value)} onBlur={() => updateDeal(p.id, { notes: notes.slice(0, 2000) })} />
      </label>
    </li>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState(loadDeals);
  useEffect(() => onDealsChange(() => setDeals(loadDeals())), []);
  const sorted = [...deals].sort((a, b) => {
    const at = (id: string) => SAMPLE_PROPERTIES.find((p) => p.id === id)?.sale?.startsAt ?? '9999';
    return at(a.id).localeCompare(at(b.id));
  });

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Saved in this browser</span>}
        title={<>My <span className="grad">deals</span></>}
        sub="The properties you’re working on: what changed, what’s due, how far your due diligence has come, and whether the bid still fits your limit."
      />
      {sorted.length === 0 ? (
        <section className="deals-empty">
          <h2>No saved properties yet</h2>
          <p>Open any property and choose <strong>☆ Save to My deals</strong>. It will show up here with its deadlines, your max bid and your due-diligence progress.</p>
          <a className="btn big" href="#/search">Browse properties</a>
        </section>
      ) : (
        <ul className="deal-list">{sorted.map((d) => <DealCard key={d.id} d={d} />)}</ul>
      )}
      <p className="muted">Saved only in this browser. Clearing your browser data removes it.</p>
    </main>
  );
}
