import { EVIDENCE_EVENT } from '../lib/evidence';
import { analyzeAllowsAds } from '../lib/contextAds';
import { useAccount } from '../lib/account';
import { useEffect, useRef, useState } from 'react';
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
import { removeLog } from '../lib/evidence';
import { kindLabel, loadDeals as loadAnalyzed, openDeal, SALE_KINDS, checklistFor, type Deal } from '../lib/analyze';
import { ownedSummary } from '../lib/owned';
import { projectedMonthly, useOwned } from './OwnedTracker';
import { countyName } from '../lib/regions';
import StatusBadge from './StatusBadge';
import { dealNumbers } from '../lib/propertyPacket';
import { flipNeedsRepairs, nextAction, savedNumbers } from '../lib/dealPacket';
import { investorProfile } from '../lib/myPlan';
import { refiValueWords, rentVerdict } from '../lib/holdCalc';
import { stageLabel, stageOf, setDealStage } from '../lib/dealStage';
import AdSpot from './AdSpot';

function DealCard({ d, p, loading, known }: { d: SavedDeal; p: Property | undefined; loading: boolean; known: boolean }) {
  const [notes, setNotes] = useState(d.notes);
  // Save notes shortly after typing stops, so closing the tab doesn't lose them.
  useEffect(() => {
    if (notes === d.notes) return;
    const t = setTimeout(() => updateDeal(d.id, { notes: notes.slice(0, 2000) }), 600);
    return () => clearTimeout(t);
  }, [notes, d.id, d.notes]);
  // Leaving the page within that pause still saves what was typed.
  const latest = useRef({ notes, saved: d.notes });
  latest.current = { notes, saved: d.notes };
  useEffect(() => () => {
    const { notes: n, saved } = latest.current;
    if (n !== saved) updateDeal(d.id, { notes: n.slice(0, 2000) });
  }, [d.id]);
  if (!p && loading) return <li className="deal-card"><p className="muted">Checking the official lists…</p></li>;
  // The list couldn't be verified just now (an update is late or the source is being re-checked): don't call it gone.
  if (!p && !known) {
    return (
      <li className="deal-card">
        <div className="deal-head">
          <div>
            <h2>Being re-verified</h2>
            <p className="muted">A property you saved on {fmtDate(d.savedAt)} isn’t shown while its official list is being re-verified. Your notes and evidence are kept. Check back shortly, or check the official source.</p>
          </div>
          <button className="linkish" aria-label="Remove this saved property and its notes" onClick={() => { if (window.confirm('Remove this saved property, with its notes and evidence?')) { removeDeal(d.id); removeLog(`listing:${d.id}`); } }}>Remove</button>
        </div>
      </li>
    );
  }
  if (!p) {
    return (
      <li className="deal-card">
        <div className="deal-head">
          <div>
            <h2>No longer listed</h2>
            <p className="muted">A property you saved on {fmtDate(d.savedAt)} is no longer in our listings. It may have sold, been paid off or been removed.</p>
          </div>
          <button className="linkish" aria-label="Remove property that is no longer listed" onClick={() => { removeDeal(d.id); removeLog(`listing:${d.id}`); }}>Remove</button>
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
        <button className="linkish" aria-label={`Remove ${p.address} from My deals`} onClick={() => { removeDeal(p.id); removeLog(`listing:${p.id}`); }}>Remove</button>
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
          <dt>Your walk-away price</dt>
          <dd>{maxBid === null ? <a href={`${base}/max-bid`}>Set it&nbsp;→</a> : <>{fmtMoney(maxBid)}{minBid !== null && <span className={minBid > maxBid ? 'deal-urgent' : 'deal-ok'}> · {minBid > maxBid ? 'opening bid is above your max' : 'room to bid'}</span>}</>}</dd>
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

/** Properties you've marked as bought: how each is really doing against the plan, and all of them together. */
function OwnedPortfolio({ deals }: { deals: ReturnType<typeof loadAnalyzed> }) {
  const owned = useOwned();
  const rows = deals.filter((d) => owned[d.id]).map((d) => ({ d, o: owned[d.id], s: ownedSummary(owned[d.id], projectedMonthly(d)) }));
  if (!rows.length) return null;
  const total = rows.reduce((t, r) => t + r.s.actual, 0);
  const signed = (n: number) => `${n < 0 ? '−' : ''}${fmtMoney(Math.abs(Math.round(n)))}`;
  return (
    <section className="analyzed-deals" aria-labelledby="owned-head">
      <h2 id="owned-head">Properties you own</h2>
      <table className="lesson-table owned-table">
        <thead><tr><th>Property</th><th>Bought</th><th>Months recorded</th><th>Average month</th><th>Against your plan</th></tr></thead>
        <tbody>
          {rows.map(({ d, o, s }) => (
            <tr key={d.id}>
              <td><a href={`#/deals/packet/${d.id}`}>{d.name}</a></td>
              <td>{o.boughtOn}</td>
              <td>{s.months}</td>
              <td>{s.months ? signed(s.averageMonthly) : '—'}</td>
              <td>{s.gapMonthly === null ? '—' : `${signed(s.gapMonthly)} a month`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Actual cash flow across all of them so far: <strong>{signed(total)}</strong>. Add each month on the property’s deal packet.</p>
    </section>
  );
}

/** A fix-and-sell or lien deal's numbers in one line, from the same figures as its deal packet. */
function OtherNumbers({ d }: { d: Deal }) {
  if (d.plan !== 'flip' && d.plan !== 'lien' && d.plan !== 'commercial') return null;
  const { bid, lien, commercial } = savedNumbers(d);
  if (commercial) {
    // The same order as the deal packet: no price works, a price over $1 billion (a typo), no target, then your price.
    if (commercial.noRealistic && (commercial.none || !commercial.at)) return <p className="deal-urgent">No realistic price fits the cash you entered: {commercial.none ? 'it doesn’t cover the repairs and costs, before any price' : commercial.hasLoan ? `with what’s left for the down payment, the most you could pay is about ${fmtMoney(commercial.maxBid)}` : `it covers the costs but leaves only about ${fmtMoney(commercial.maxBid)} for the price`}.</p>;
    if (commercial.none && commercial.weakSupported) return <p className="deal-urgent">The income supports a price of only about {fmtMoney(commercial.weakSupported)}, far below the value, and the cash you entered doesn’t cover the costs either.</p>;
    if (commercial.none) return <p className="deal-urgent">No price meets your {commercial.capPct}% return on cost with the income and costs entered.</p>;
    if (commercial.noTarget && commercial.overCap) return <p className="deal-urgent">The price comes out over $1 billion with the rent and costs entered: check them for a typo.</p>;
    if (commercial.at) {
      const a = commercial.at;
      // The same test as Commercial income: the return on cost, the lender's coverage and positive cash flow.
      const missed = a.cashFlow <= 0 || !a.loanOk || (a.capOnCost !== null && a.capOnCost * 100 < commercial.capPct);
      // The same cash check as Commercial income: the cash entered there, else My plan's (a typed 0 is no limit).
      const planCash = investorProfile().investable;
      const limit = commercial.cashLimit && commercial.cashLimit > 0 ? commercial.cashLimit : commercial.cashTyped ? 0 : planCash;
      const need = commercial.atNeed ?? 0;
      const short = limit > 0 && need > limit;
      return <p className={missed || short ? 'deal-urgent' : undefined}>At your price, {fmtMoney(a.price)}: {a.cashFlow < 0 ? `loses ${fmtMoney(Math.round(-a.cashFlow / 12))}` : `${fmtMoney(Math.round(a.cashFlow / 12))} cash flow`} a month{a.capOnCost !== null ? ` · ${(a.capOnCost * 100).toFixed(1)}% return on cost (target ${commercial.capPct}%)` : ''}{!a.loanOk && a.dscr !== null ? ` · income coverage ${(Math.floor(a.dscr * 100) / 100).toFixed(2)}× (below your ${commercial.minDscr ?? ''}× minimum)` : ''}{short ? ` · needs about ${fmtMoney(Math.round(need))} of your cash (${commercial.cashLimit && commercial.cashLimit > 0 ? 'your limit' : 'My plan'}: ${fmtMoney(Math.round(limit))})` : ''}</p>;
    }
    if (commercial.noTarget) return <p className="muted">No target return entered yet: open it and enter the cap rate you require under Commercial income.</p>;
    // The cash at that price, against the cash entered in Commercial income, else My plan's (as the packet counts it).
    const planCash = investorProfile().investable;
    const limit = commercial.cashLimit && commercial.cashLimit > 0 ? commercial.cashLimit : commercial.cashTyped ? 0 : planCash;
    const need = commercial.refi ? commercial.allIn : commercial.cashLeft;
    const short = limit > 0 && need > limit;
    return <p className={short ? 'deal-urgent' : undefined}>{commercial.limitedBy === 'cash' ? 'Walk-away price, set by the cash you entered' : commercial.limitedBy === 'dscr' ? 'Walk-away price, set by the lender’s minimum coverage' : `Highest price for your ${commercial.capPct}% return on cost`}: {fmtMoney(commercial.maxBid)} · {fmtMoney(Math.round(commercial.noi))} a year of net operating income{short ? ` · needs about ${fmtMoney(Math.round(need))} of your cash at that price (${commercial.cashLimit && commercial.cashLimit > 0 ? 'your limit' : 'My plan'}: ${fmtMoney(Math.round(limit))})` : ''}</p>;
  }
  if (bid) {
    if (bid.none && bid.cashBlocked) return <p className="deal-urgent">No bid fits the cash you entered: the deal itself meets {bid.targetTyped ? 'your goal' : 'our example profit target'} at bids up to {fmtMoney(bid.profitBid)}, but every cost until you sell needs more than the cash you entered.</p>;
    if (bid.none) return <p className="deal-urgent">No price works at a {fmtMoney(bid.exitValue)} resale value with these costs and {bid.targetTyped ? 'your profit target' : 'our example profit target'}.</p>;
    // Below the opening bid (or asking price): no bid you'd make works, whatever the walk-away price says.
    if (bid.at?.source === 'listed' && bid.maxBid < bid.at.price) return <p className="deal-urgent">{bid.at.profit >= bid.target && bid.limitedBy === 'cash' ? 'Your cash doesn’t cover this deal at' : bid.targetTyped ? 'Doesn’t meet your profit target at' : 'Doesn’t meet our example profit target at'} the {d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short' ? 'asking price' : 'opening bid'} of {fmtMoney(bid.at.price)}.</p>;
    const planCash = investorProfile().investable;
    // The same rule as Fix and sell: no warning once a cash limit is entered there (the price is already capped by it).
    const short = !(bid.cashLimit > 0) && !bid.cashTyped && planCash > 0 && bid.cashPeak > planCash;
    // Your own bid or offer first, else the opening bid or asking price (as Fix and sell and the packet judge it), with
    // its cash against your limit; then the walk-away price.
    if (bid.at) {
      const a = bid.at;
      const limit = bid.cashLimit > 0 ? bid.cashLimit : bid.cashTyped ? 0 : planCash;
      const mine = limit > 0 && a.cashPeak > limit;
      const listed = d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short';
      const at = a.source === 'yours' ? `At your ${listed ? 'offer' : 'bid'}` : `At the ${listed ? 'asking price' : 'opening bid'}`;
      return (
        <p className={mine || a.profit < bid.target || a.price > bid.maxBid ? 'deal-urgent' : undefined}>
          {at}, {fmtMoney(a.price)}: profit about {fmtMoney(Math.round(a.profit))} · needs about {fmtMoney(Math.round(a.cashPeak))} of your cash{mine ? ` (${bid.cashLimit > 0 ? 'your limit' : 'My plan'}: ${fmtMoney(Math.round(limit))})` : ''} · walk-away price {fmtMoney(bid.maxBid)}{bid.unentered.length ? ' · some costs still $0 (not entered)' : ''}
        </p>
      );
    }
    return (
      <p className={short ? 'deal-urgent' : undefined}>
        Walk-away price {fmtMoney(bid.maxBid)} · needs about {fmtMoney(Math.round(bid.cashPeak))} of your cash at that price{short ? ` (My plan: ${fmtMoney(Math.round(planCash))})` : ''}{bid.unentered.length ? ' · some costs still $0 (not entered)' : ''}
      </p>
    );
  }
  if (lien?.overCap) return <p className="deal-urgent">{fmtMoney(lien.price)} certificate · the interest rate entered is above {d.state === 'AZ' ? 'Arizona’s legal maximum of 16% a year' : 'Nevada’s 1% a month'}: fix it under Lien certificate to see the yield.</p>;
  if (lien) return <p>{fmtMoney(lien.price)} certificate · {lien.yearly === null ? 'no yield' : `${(lien.yearly * 100).toFixed(1)}% a year`} if paid off in {lien.months} months</p>;
  // The resale value is in, only the repairs are missing: ask for just those.
  if (flipNeedsRepairs(d)) return <p className="muted">Almost there: open it and enter the repairs under Fix and flip (fix and sell), or 0 if there are none.</p>;
  return <p className="muted">No numbers yet: open it and enter {d.plan === 'flip' ? 'the resale value and repairs under Fix and flip (fix and sell)' : d.plan === 'commercial' ? 'the rent under Commercial income' : 'the certificate price under Lien certificate'}.</p>;
}

export default function DealsPage() {
  const account=useAccount();
  const [deals, setDeals] = useState(loadDeals);
  const { properties, loading, known } = useProperties();
  const [analyzed, setAnalyzed] = useState(loadAnalyzed);
  useEffect(() => onDealsChange(() => setDeals(loadDeals())), []);
  // A decision in an evidence log changes the card's next action: re-read it.
  const [, bump] = useState(0);
  useEffect(() => { const on = () => { bump((n) => n + 1); setAnalyzed(loadAnalyzed()); }; window.addEventListener(EVIDENCE_EVENT, on); return () => window.removeEventListener(EVIDENCE_EVENT, on); }, []);
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
        title={<>My <span className="grad">deals</span></>}
        sub="Your saved properties: what changed, what’s due, and whether your bid still fits."
      />
      <OwnedPortfolio deals={analyzed} />
      {analyzed.length > 0 && (
        <section className="analyzed-deals" aria-labelledby="analyzed-head">
          <h2 id="analyzed-head">Deals you’ve analyzed</h2>
          <ul className="deal-list">
            {analyzed.map((d) => {
              const k = SALE_KINDS.find((x) => x.key === d.kind)!;
              const all = checklistFor(d).flatMap((g) => g.items);
              const done = all.filter((i) => d.done.includes(i.id)).length;
              return (
                <li key={d.id} className="deal-card">
                  <div className="deal-head">
                    <div>
                      <h3><button type="button" className="linkish" onClick={() => openDeal(d)}>{d.name}</button>{d.practice && <span className="muted"> (practice analysis)</span>}</h3>
                      <p className="muted"><strong>{stageLabel(stageOf(d), d)}</strong> · {kindLabel(k, d.state)} · {countyName(d.county)}, {d.state} · checklist {done} of {all.length} done</p>
                      {(() => {
                        const n = dealNumbers(d);
                        // The same check as Keep and rent: the cash it needs against My plan's, unless a limit was entered there.
                        const planCash = investorProfile().investable;
                        const limit = n && n.cashLimit > 0 ? n.cashLimit : n?.cashTyped ? 0 : planCash;
                        const short = !!n && limit > 0 && n.cashNeeded > limit;
                        // You plan to live there: a monthly loss is what living there costs you (as Keep and rent says).
                        const living = !!n && !!investorProfile().ownerOccupant && (d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short');
                        return n ? (
                          <p className={rentVerdict({ cashFlow: n.monthly, cashOnCash: n.cashOnCash, targetPct: n.target, cashShort: short, exampleRefi: n.exampleValue && n.refiValue > 0, living }) === 'bad' ? 'deal-urgent' : undefined}>
                            At your price, {fmtMoney(n.price)}: {living && !(n.exampleValue && n.refiValue > 0) ? <>{Math.round(Math.abs(n.monthly)) === 0 ? 'the rent you collect about breaks even with every cost' : n.monthly < 0 ? `living there costs you about ${fmtMoney(Math.round(-n.monthly))} a month after any rent you collect` : `the rent you collect covers every cost, with about ${fmtMoney(Math.round(n.monthly))} a month to spare`}{n.mi > 0 ? `, before mortgage insurance (about ${fmtMoney(n.mi)} a month on an FHA loan; not counted)` : ''}{short ? ` · needs about ${fmtMoney(Math.round(n.cashNeeded))} of your cash (${n.cashLimit > 0 ? 'your limit' : 'My plan'}: ${fmtMoney(Math.round(limit))})` : ''}</> : <>{n.monthly < 0 ? `loses ${fmtMoney(Math.round(-n.monthly))}` : `${fmtMoney(Math.round(n.monthly))} cash flow`} a month{n.exampleValue ? ` (${refiValueWords(n.refiValue)})` : n.refi ? ' after the refinance' : ''} · {n.exampleValue && n.refiValue > 0 ? 'enter the value after repairs to see the return' : n.cashOnCash === null ? 'all your cash back' : `${(n.cashOnCash * 100).toFixed(1)}% a year on ${fmtMoney(Math.round(n.cashIn))} of your cash`} (target {n.target}%){short ? ` · needs about ${fmtMoney(Math.round(n.cashNeeded))} of your cash (${n.cashLimit > 0 ? 'your limit' : 'My plan'}: ${fmtMoney(Math.round(limit))})` : ''}</>}
                          </p>
                        ) : d.plan === 'rent' ? <p className="muted">No numbers yet: open it and type its rent, and the price you’d pay, under Keep and rent (our example rent doesn’t count).</p> : <OtherNumbers d={d} />;
                      })()}
                      {!d.locationConfirmed && <p className="muted">Its location isn’t confirmed: open it in Analyze and confirm it, so its costs follow its state and county.</p>}
                      <p><strong>Next action.</strong> {nextAction(d).text}</p>
                    </div>
                    <div className="deal-actions">
                      <a className="btn" href={`#/deals/packet/${d.id}`}>Deal packet&nbsp;→</a>
                      <button type="button" className="btn btn-secondary" onClick={() => openDeal(d)}>Open&nbsp;→</button>
                    </div>
                  </div>
                  <EvidenceLog dealId={`analyzed:${d.id}`} name={d.name} kind={d.kind} onPass={stageOf(d) === 'passed' ? undefined : () => { setDealStage(d.id, 'passed'); setAnalyzed(loadAnalyzed()); }} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {analyzed.length > 0 && sorted.length > 0 && <h2>Saved Clark County listings</h2>}
      {sorted.length === 0 && analyzed.length > 0 ? null : sorted.length === 0 ? (
        <section className="deals-empty">
          <img className="owl-empty" src="/logo.svg" alt="" width={112} height={112} />
          <h2>No saved deals yet</h2>
          <p>Found a property you like? Describe it in <strong>Analyze a deal</strong> and save it: it will show up here with its checklist.</p>
          <a className="btn big" href="#/analyze">Analyze a deal</a>
        </section>
      ) : (
        <ul className="deal-list">{sorted.map((d) => <DealCard key={d.id} d={d} p={properties.find((x) => x.id === d.id)} loading={loading} known={known(d.id)} />)}</ul>
      )}
      {/* No ad beside a forced-sale or lien deal (the same rule as Analyze and the deal packet). */}
      <AdSpot spot="deals" allow={!analyzed.some((d) => !analyzeAllowsAds(d.kind)) && sorted.every((d) => properties.find((x) => x.id === d.id)?.sale?.saleType === 'REO')} />
      <p className="muted">{account.account ? 'Use Save my work to keep these properties in your account. Notes are download-only and are not saved to your account.' : 'Saved only in this browser. Clearing your browser data removes it.'}</p>
    </main>
  );
}
