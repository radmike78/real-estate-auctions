import { analyzeAllowsAds } from '../lib/contextAds';
import NumInput from './NumInput';
import { useEffect, useLayoutEffect, useState } from 'react';
import PageHero from './PageHero';
import EvidenceLog, { DecisionGate } from './EvidenceLog';
import { kindLabel, loadDeals, openDeal, SALE_KINDS } from '../lib/analyze';
import { countyName } from '../lib/regions';
import { PACKET_KEY, laterRow, MAX_DATES, sidDeadline, calendarRows, dateRowComplete, roleTitleFor, dateGuide, calendarReady, sameDate, dealPacketText, FIT_LABEL, loadPacket, packetSections, savePacket, suggestedDates, type Fit, type PacketData, type SectionStatus, teamRolesFor } from '../lib/dealPacket';
import { RECORDED_ROWS, keyDatesAsked, overdueIntro } from '../lib/dealPacket';
import { TEAM_ROLES } from '../lib/myPlan';
import { downloadText, fileName } from '../lib/download';
import { EVIDENCE_EVENT, loadLog } from '../lib/evidence';
import OwlNote from './OwlNote';
import AdSpot from './AdSpot';
import OwnedTracker from './OwnedTracker';
import { useNoIndex } from '../lib/noindex';
import { beforeDeed, beforeWhat, paidAtWin, sealedBid, fillSealedDay, decideAnswered, recordParts, asksHome, voidByLaw, forCalendar, liveIn, setDealHome, sidState, trackerAsksHome, behindStage, NO_SID_ROW, prettyDay, redeemingNow, wayOf, DEED_AFTER_WAIT, dealNextTask, finishedDeal, REDEEMED_ROW, setDealStage, soldOf, stageHint, stageOf } from '../lib/dealStage';
import { PROGRESS_EVENT } from '../lib/roadmapState';
import { planNow } from '../lib/planNext';
import TaskActions from './TaskActions';
import StageSelect from './StageSelect';
import { OWNED_EVENT } from '../lib/owned';

const STATUS_LABEL: Record<SectionStatus, string> = { done: 'Complete', started: 'In progress', missing: 'Missing' };

/**
 * The deal packet for a property you're analyzing: everything the decision needs on one page, each part marked
 * complete, in progress or missing, with the one next action at the top. Fill the gaps here or where each part lives.
 */
/** A one-line textarea that grows to show all of its text (where CSS field-sizing isn't supported). */
const fieldSizing = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content');
const growToFit = (el: HTMLTextAreaElement | null) => { if (!el || fieldSizing) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; };
/** Every date name re-measured (after a Remove or a resize the rows' text moves), where CSS can't size them. */
const growAll = () => document.querySelectorAll<HTMLTextAreaElement>('.packet-what').forEach(growToFit);

/** After a stage button (it goes away), the cursor goes to the new next action. */
const focusNext = () => setTimeout(() => document.getElementById('packet-next-head')?.focus(), 0);

export default function DealPacketPage({ dealId, section }: { dealId: string; section?: string }) {
  // (Date names: re-measured after each render and on resize, where CSS field-sizing isn't supported.)
  useLayoutEffect(() => { growAll(); });
  useEffect(() => { if (fieldSizing) return; window.addEventListener('resize', growAll); return () => window.removeEventListener('resize', growAll); }, []);
  const deal = loadDeals().find((d) => d.id === dealId);
  const key = `analyzed:${dealId}`;
  // (A sealed-bid sale with a dated sale day: a blank bid deadline is filled in, the day before, and kept.)
  const [p, setP] = useState<PacketData>(() => { const raw = loadPacket(key); const f = deal ? fillSealedDay(deal, raw) : raw; if (f !== raw) savePacket(key, f); return f; });
  // (Saved in another tab: show that, so editing here doesn't save an old copy over it.)
  useEffect(() => { const on = (e: StorageEvent) => { if (!e.key || e.key === PACKET_KEY) setP(loadPacket(key)); else if (e.key === 'deedowl.analyze.v1' || e.key === 'deedowl.owned.v1') bump((n) => n + 1); }; window.addEventListener('storage', on); return () => window.removeEventListener('storage', on); }, [key]);
  // The evidence log below saves on its own; re-render so the status and next action follow it.
  const [, bump] = useState(0);
  useNoIndex(!deal);
  useEffect(() => {
    const on = () => bump((n) => n + 1);
    const events = [EVIDENCE_EVENT, PROGRESS_EVENT, OWNED_EVENT];
    events.forEach((e) => window.addEventListener(e, on));
    return () => events.forEach((e) => window.removeEventListener(e, on));
  }, []);
  // A link from My plan's next step opens the part of the packet the task is in.
  useEffect(() => {
    if (section) document.getElementById(`packet-${section}`)?.scrollIntoView({ block: 'start' });
  }, [section]);
  const update = (patch: Partial<PacketData>, reviewDates = true) =>
    setP((cur) => {
      const merged = { ...cur, ...patch, ...(patch.dates && reviewDates ? { calendarReviewedFor: undefined } : {}) };
      // (A sealed-bid sale's first or changed sale date: a blank bid deadline, or one still on the usual day before the
      // old date, follows; a date typed from the notice is kept.)
      const next = patch.dates && deal ? fillSealedDay(deal, merged, cur) : merged;
      savePacket(key, next);
      // (Saving can settle a row a roadmap step answered: show what was saved.)
      return patch.dates ? loadPacket(key) : next;
    });

  const [editDates, setEditDates] = useState(false);
  if (!deal) {
    return (
      <main className="page">
        <PageHero title={<>Deal <span className="grad">packet</span></>} sub="One page per property you’re analyzing." />
        <section className="deals-empty">
          <img className="owl-empty" src="/logo.svg" alt="" width={112} height={112} />
          <h2>We couldn’t find that deal</h2>
          <p>It may have been deleted, or saved in another browser. Packets are not included in account saves. Keep a download of your packet.</p>
          <a className="btn big" href="#/deals">Back to My deals</a>
        </section>
      </main>
    );
  }

  const kind = SALE_KINDS.find((k) => k.key === deal.kind);
  const sections = packetSections(deal, p);
  const stage = stageOf(deal);
  const next = dealNextTask(deal, p, undefined, stage);
  const done = sections.filter((s) => s.status === 'done').length;
  const sec = (k: string) => sections.find((s) => s.key === k)!;
  const guideRows = dateGuide(deal).filter((g) => g.when);

  // Bought (closed or owned), or finished: the decision parts are records now.
  // (A won auction counts too: only payment and recording are left.)
  const wonAuction = stageOf(deal) === 'contract' && wayOf(deal) !== 'offer';
  // (A void sale marked passed went past the sale too: its parts are records.)
  // Passed, sold or repaid: its dates are a record (the rows fold under "Edit these dates").
  const finalDeal = stageOf(deal) === 'passed' || !!soldOf(deal) || finishedDeal(deal);
  // (A deal moved to Passed by its repayment is finished, not passed on.)
  const passedOn = stageOf(deal) === 'passed' && !finishedDeal(deal);
  // An offer bought with no dates in its packet: Key dates is a record left blank, like the other parts from before.
  const boughtNoDates = wayOf(deal) === 'offer' && ['closed', 'owned'].includes(stageOf(deal)) && p.dates.length === 0;
  // Usual dates removed (or added since the packet was started): add back only those, at the end.
  // (Past the sale, not the dates already behind it; once redeemed, not the deed.)
  const behind = wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) ? [] : behindStage(deal, finishedDeal(deal) ? 'closed' : stageOf(deal));
  const redeemed = p.dates.some((x) => sameDate(x.what, REDEEMED_ROW));
  const missingUsual = p.dates.length ? suggestedDates(deal).filter((w) => !p.dates.some((x) => sameDate(x.what, w)) && !behind.some((b) => sameDate(w, b)) && !(redeemed && sameDate(w, DEED_AFTER_WAIT)) && !(sidState(deal) === 'void' && (RECORDED_ROWS.some((r) => sameDate(w, r)) || sameDate(w, 'Recovery-suit window ends') || sameDate(w, 'SID certificate payoff'))) && !(sameDate(w, 'SID certificate payoff') && p.dates.some((x) => sameDate(x.what, NO_SID_ROW)))) : [];
  const pastSale = ['closed', 'owned'].includes(stageOf(deal)) || finishedDeal(deal) || wonAuction || sidState(deal) === 'void';
  // The parts from before you bought: records now, not homework.
  // (After the closing or the deed, the evidence log and the questions were for before you bought: records too.)
  const RECORD_PARTS = recordParts(deal);
  const Head = ({ k }: { k: string }) => {
    const s = sec(k);
    return (
      <>
        <h2 id={`packet-${k}`}>
          {s.title} {pastSale && RECORD_PARTS.includes(k) && s.status !== 'done' ? <span className="packet-status record">{s.status === 'missing' ? 'Left blank' : 'Partly filled in'}</span> : (k === 'dates' && boughtNoDates ? <span className="packet-status record">Left blank</span> : k === 'dates' && finalDeal && stageOf(deal) !== 'passed' && p.dates.length === 0 ? <span className="packet-status record">Not needed now</span> : stageOf(deal) === 'passed' && sidState(deal) !== 'void' && s.status !== 'done' && (k !== 'dates' || p.dates.length === 0) && k !== 'decision' ? <span className="packet-status record">Not needed (you passed)</span> : s.status === 'missing' && (stageOf(deal) === 'researching' || (wayOf(deal) === 'offer' && stageOf(deal) === 'offer' && k === 'dates')) ? <span className="packet-status record">{k === 'dates' && wayOf(deal) === 'offer' ? 'Not needed yet' : 'Not started'}</span> : <span className={`packet-status ${k === 'dates' && finalDeal && p.dates.length ? 'record' : s.status}`}>{k === 'dates' && finalDeal && p.dates.length ? 'Kept as a record' : s.status === 'done' && s.doneLabel ? s.doneLabel : STATUS_LABEL[s.status]}</span>)}
        </h2>
        {pastSale && RECORD_PARTS.includes(k) && sections.find((x) => RECORD_PARTS.includes(x.key))?.key === k && <p className="muted small">{sidState(deal) === 'void' ? 'From before the sale: kept as your records.' : `From before ${beforeWhat(deal)}: kept as your records.`}</p>}
      </>
    );
  };
  const Lines = ({ k }: { k: string }) => {
    const s = sec(k);
    return (
      <>
        <ul className="packet-lines">{s.lines.map((l, i) => <li key={i}>{k === 'dates' && l === 'All dated items are marked handled.' && missingUsual.length && !finalDeal ? `Every date entered is marked handled. Still to add: ${missingUsual.join('; ')} (use “Add the usual dates that are missing” above).` : l}</li>)}</ul>
        {s.fix && <p><a href={s.fix.href} onClick={s.fix.href === '#/analyze' ? (e) => { e.preventDefault(); openDeal(deal); } : undefined}>{s.fix.label}&nbsp;→</a></p>}
      </>
    );
  };

  return (
    <main className="page deal-packet">
      <PageHero
        title={<>Deal <span className="grad">packet</span></>}
        sub={`${deal.name} · ${kind ? kindLabel(kind, deal.state) : deal.kind} · ${countyName(deal.county)}, ${deal.state}`}
      />
      <p>{sidState(deal) === 'void' && stageOf(deal) !== 'passed' ? <>This sale is void: what’s left is the refund*. Its dates and your records from the sale are kept here.</> : sidState(deal) === 'void' ? <>Everything about this property, on one page: its dates and your records from the sale (the sale was void).</> : stageOf(deal) === 'passed' && sidState(deal) !== 'void' && !finishedDeal(deal) ? <>Everything about this property, on one page. You passed on it: its dates and notes are kept as records.</> : finishedDeal(deal) ? <>Everything about this property, on one page: its dates and your records from the sale.</> : wonAuction ? <>{wayOf(deal) === 'lien' ? (paidAtWin(deal) ? 'You were picked and paid: the certificate comes next.' : overdueIntro(deal) || 'You were picked: pay on time.') : (paidAtWin(deal) ? (sealedBid(deal) ? 'You won the bid; the payment went in with your sealed bid. Your next action below says what comes next.' : 'You won the bid and paid. Your next action below says what comes next.') : overdueIntro(deal) ? overdueIntro(deal) : 'You won the bid: pay and record it on time.')} The parts from before {beforeWhat(deal)} are kept as your records.</> : redeemingNow(deal) ? <>Everything about this property, on one page: its dates, the payoff and your records from the sale.</> : pastSale ? <>Everything about this property, on one page: its dates, costs and results, with the records from before {beforeWhat(deal)}. {(() => { const live = sections.filter((x) => !RECORD_PARTS.includes(x.key) && !(x.key === 'dates' && boughtNoDates)); return live.length === 0 ? '' : live.length === 1 ? (live[0].status === 'done' ? `The ${live[0].title} part is complete.` : live[0].key === 'dates' && keyDatesAsked(deal) ? 'Key dates: Your next action above says what it still needs.' : live[0].key === 'dates' && calendarReady(forCalendar(deal, p, stageOf(deal)), stageOf(deal)) && !p.dates.some((x) => x.when && !x.resolved) ? 'Key dates: tick “I checked every deadline…” to finish.' : live[0].status === 'started' ? `The ${live[0].title} part is in progress.` : `Still to fill in: ${live[0].title}.`) : `${live.filter((x) => x.status === 'done').length} of ${live.length} parts after the sale are filled in.`; })()}</> : <>Everything this decision needs, on one page: your plan, the dates, the cash and when it’s due, your numbers with a downside case, what you’ve verified, your professionals’ answers and your decision. {done} of {sections.length} parts are complete.</>} Every number is your estimate until a source backs it.</p>

      <div className="packet-stage">
        <StageSelect stage={stage} deal={deal} onMove={(st) => { /* Moved back off a repaid finish: the payoff isn't collected after all. */ if (st !== 'passed' && p.dates.some((x) => sameDate(x.what, REDEEMED_ROW) && x.resolved)) update({ dates: p.dates.map((x) => (sameDate(x.what, REDEEMED_ROW) ? { ...x, resolved: false } : x)) }, false); setDealStage(deal.id, st); /* (A stage change can save rows, such as a sealed bid's payment: show them.) */ setP(loadPacket(key)); }} />
        <p className="muted">{stageHint(stage, deal)} {(() => { const plan = planNow(); return plan.source === 'deal' && plan.deal?.id === deal.id ? 'Change the stage when something happens; Your next action below and My plan follow it.' : stage === 'passed' || soldOf(deal) ? 'Change the stage when something happens; Your next action below follows it.' : <>Change the stage when something happens; Your next action below follows it. <a href="#/toolkit">My plan</a> {plan.source === 'deal' ? 'is working on another property' : 'shows the lessons and practice first'}; choose this property there to work on it now.</>; })()}</p>
      </div>
      <div className="packet-next">
        <h2 id="packet-next-head" className="packet-next-head" tabIndex={-1}>Your next action</h2>
        <p aria-live="polite">{next.label}{next.urgent ? (/[?.!]$/.test(next.label) ? '' : '.') : <>{/[?.!]$/.test(next.label) ? '' : '.'} <span className="muted">You’ll have: {next.produces}.</span></>}{' '}
          {next.openDeal ? <a href="#/analyze" onClick={(e) => { e.preventDefault(); openDeal(deal); }}>Open in Analyze&nbsp;→</a>
            : next.setStage ? <button type="button" className="linkish" onClick={() => { setDealStage(deal.id, next.setStage!); setP(loadPacket(key)); focusNext(); }}>Do it now&nbsp;→</button>
            : next.key === 'qa-wait' ? <button type="button" className="linkish" onClick={() => { const i = p.qa.findIndex((x) => x.q && !x.a); const el = document.querySelectorAll<HTMLElement>('textarea[aria-label="Their answer"]')[i]; el?.scrollIntoView({ block: 'center' }); el?.focus(); }}>Record their answer&nbsp;↓</button>
            : /^Enter the new sale date/.test(next.label) ? <button type="button" className="linkish" onClick={() => { const i = p.dates.findIndex((x) => sameDate(x.what, 'Sale day')); const el = document.querySelectorAll('.packet-dates > li')[i]?.querySelector<HTMLElement>('input[type="date"]'); el?.scrollIntoView({ block: 'center' }); el?.focus(); }}>Enter the date&nbsp;↓</button>
            : !next.answer && next.advance ? null
            : !next.answer && !next.href.startsWith(`#/deals/packet/${deal.id}`) ? <a href={next.href}>Go there&nbsp;→</a>
            : !next.answer && /\/(plan|dates|cash|evidence|pros|decision|owned)$/.test(next.href) ? (() => { const sec = /\/(\w+)$/.exec(next.href)![1]; return <button type="button" className="linkish" onClick={() => { const h = document.getElementById(`packet-${sec}`); h?.setAttribute('tabindex', '-1'); /* (the evidence log opens) */ h?.closest('section')?.querySelectorAll('details').forEach((x, i) => { if (i === 0) x.open = true; }); h?.scrollIntoView({ block: 'start' }); h?.focus(); }}>Go to {sec === 'dates' ? 'Key dates' : sec === 'evidence' ? 'the evidence log' : sec === 'owned' ? 'After you buy' : sec === 'decision' ? 'Your decision' : sec === 'pros' ? 'the questions' : sec === 'cash' ? 'the cash' : 'your plan'}&nbsp;↓</button>; })() : null}
        </p>
        {(next.advance || next.advance2 || next.tick || next.undo || next.redate || next.postpone || next.record) && <div className="packet-next-actions">
          <TaskActions task={next} dealId={deal.id} edit={(f) => setP((cur) => { const n = f(cur); savePacket(key, n); return n; })} after={() => focusNext()} />
        </div>}
      </div>
      <div className="row packet-actions">
        <button type="button" className="btn btn-secondary" onClick={() => downloadText(fileName(`deal packet ${deal.name}`, 'txt'), dealPacketText(deal, p))}>Download the packet</button>
        <button type="button" className="btn btn-secondary" onClick={() => openDeal(deal)}>Open in Analyze</button>
        <a className="btn btn-secondary" href="#/deals">My deals</a>
      </div>

      <section className="deal-setup packet-section" aria-labelledby="packet-plan">
        <Head k="plan" />
        <Lines k="plan" />
        {asksHome(deal) && !trackerAsksHome(deal) && stageOf(deal) !== 'passed' && (
          <fieldset className="packet-fit">
            <legend>Will you live in this property?</legend>
            {(deal.homeFrom === 'plan' || (!deal.home && decideAnswered())) && <p className="muted small packet-fit-note">Your plan says {liveIn(deal) ? 'you’ll live here' : 'it’s a rental'}. Pick Yes or No to confirm it for this property.</p>}
            <label className="check"><input type="radio" name="packet-home" checked={deal.home === 'live' && deal.homeFrom !== 'plan'} onChange={() => setDealHome(deal.id, 'live')} /> Yes, it’s my home</label>
            <label className="check"><input type="radio" name="packet-home" checked={deal.home === 'rent' && deal.homeFrom !== 'plan'} onChange={() => setDealHome(deal.id, 'rent')} /> No, it’s a rental</label>
          </fieldset>
        )}
        {(() => { const fit = (<>
        <fieldset className="packet-fit">
          <legend>Does it fit your buy box?</legend>
          {(Object.keys(FIT_LABEL) as Exclude<Fit, ''>[]).map((f) => (
            <label key={f} className="check"><input type="radio" name="packet-fit" checked={p.fit === f} onChange={() => update({ fit: f })} /> {FIT_LABEL[f]}</label>
          ))}
        </fieldset>
        <label className="field wide">
          <span>Why (the evidence, not the feeling)</span>
          <textarea rows={2} maxLength={600} value={p.fitWhy} onChange={(e) => update({ fitWhy: e.target.value })} placeholder={liveIn(deal) ? 'e.g. Under my price limit, 3 bed, near work, but the monthly cost is $150 over my budget unless the inspection comes back clean.' : 'e.g. Under my price limit, 3 bed, but the cash flow only works if rent is $2,300 and comparables say $2,150.'} />
        </label>
        </>); return (pastSale || stageOf(deal) === 'passed') && !p.fit ? <details><summary>Add to the record: did it fit your buy box?</summary>{fit}</details> : fit; })()}
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-property">
        <Head k="property" />
        <Lines k="property" />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-dates">
        <Head k="dates" />
        {finalDeal || boughtNoDates ? null : <p className="muted">{wayOf(deal) === 'offer' ? (['researching', 'offer'].includes(stageOf(deal)) ? 'From the listing and your offer; once it’s signed, the contract wins over anything here.' : 'From the signed contract: the contract wins over anything here.') : 'From the official notice: the notice wins over anything here.'}</p>}
        {p.dates.length === 0 && <OwlNote>{boughtNoDates ? 'No dates were recorded before you bought. Add one if you want it on file.' : passedOn ? 'No dates were added before you passed. Add one if you want it on file.' : finalDeal ? 'No dates were added for this property. Add one if you want it on file.' : wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) ? 'No dates yet. Nothing needs a date until your offer is accepted; then the contract’s deadlines go here.' : `No dates yet. Start with the usual dates for this kind of sale below (the ${wayOf(deal) === 'offer' ? 'signed contract' : 'official notice'} wins), then fill in each one.`}</OwlNote>}
        {(() => { const rows = (<>
        <ul className="packet-dates">
          {p.dates.map((x, i) => (
            <li key={i}>
              <label className="packet-f packet-what-f"><span aria-hidden="true">What</span><textarea className="packet-what" rows={1} ref={growToFit} onInput={(e) => growToFit(e.currentTarget)} aria-label={`Name of date ${i + 1}`} maxLength={200} value={x.what} onChange={(e) => update({ dates: p.dates.map((y, j) => { if (j !== i) return y; const what = e.target.value.replace(/\n/g, ' '); /* (a note added to its name: still the same date, still handled) */ const same = [...suggestedDates(deal), REDEEMED_ROW].some((n) => sameDate(y.what, n) && sameDate(what, n)); return { ...y, what, resolved: same ? y.resolved : false }; }) })} /></label>
              <label className="packet-f"><span aria-hidden="true">Date</span><input type="date" aria-label={`Date: ${x.what || 'new date'}`} value={x.when} onChange={(e) => update({ dates: p.dates.map((y, j) => (j === i ? { ...y, when: e.target.value } : y)) }, !laterRow(x.what))} /></label>
              <label className="packet-f"><span aria-hidden="true">Who handles it</span><input aria-label={`Who handles ${x.what || 'this date'}`} placeholder="Who" maxLength={120} value={x.who} onChange={(e) => update({ dates: p.dates.map((y, j) => (j === i ? { ...y, who: e.target.value } : y)) }, !laterRow(x.what))} /></label>
              <label><input type="checkbox" aria-label={`${x.what || 'This date'}: handled`} checked={!!x.resolved} onChange={(e) => update({ dates: p.dates.map((y, j) => j === i ? { ...y, resolved: e.target.checked } : y) }, false)} /> Handled</label>
              <button type="button" className="linkish" aria-label={`Remove ${x.what || 'date'}`} onClick={() => update({ dates: p.dates.filter((_, j) => j !== i) })}>Remove</button>
              {deal.state === 'NV' && deal.kind === 'taxSale' && sameDate(x.what, 'SID certificate payoff') && !!x.when && !!sidDeadline(p) && x.when > sidDeadline(p) && <p className="caution small packet-row-note" role="note">{sidState(deal) === 'void' ? (voidByLaw(p) ? 'Not paid within 20 days: the sale is void.' : 'Paid after the deadline: the sale is void.') : <>This is after {prettyDay(sidDeadline(p))}, 20 days after the sale. If it isn’t paid by then, the sale is void (NRS 361.595(6)). Check the date with the Treasurer.</>}</p>}
            </li>
          ))}
        </ul>
        <div className="row">
          {p.dates.length === 0 && !finalDeal && !boughtNoDates && <button type="button" className={wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) ? 'btn btn-secondary' : 'btn'} onClick={() => { update({ dates: suggestedDates(deal).map((what) => ({ when: '', what, who: '' })) }); setTimeout(() => document.querySelector<HTMLInputElement>('#dates input, [data-section="dates"] input, .packet-dates input')?.focus(), 0); }}>{wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) ? 'Add the contract’s usual dates now (they can stay blank)' : 'Start with the usual dates for this sale'}</button>}
          {(() => {
            // (missingUsual:) usual dates removed (or added since the packet was started): add back only those, at the end.
            const missing = missingUsual;
            return missing.length && !finalDeal ? <button type="button" className="btn btn-secondary" onClick={() => {
              // Each one after the nearest usual date before it that's still there (the list reads as a timeline).
              const usual = suggestedDates(deal);
              const rows = [...p.dates];
              let first = -1;
              for (const what of missing) {
                const before = usual.slice(0, usual.indexOf(what)).reverse().map((w) => rows.findIndex((x) => sameDate(x.what, w))).find((k) => k >= 0);
                const at = before === undefined ? 0 : before + 1;
                rows.splice(at, 0, { when: '', what, who: '' });
                if (first < 0 || at <= first) first = at;
              }
              update({ dates: rows });
              setTimeout(() => document.querySelectorAll<HTMLInputElement>('.packet-dates input[type="date"]')[first]?.focus(), 0);
            }}>Add the usual dates that are missing ({missing.length})</button> : null;
          })()}
          <button type="button" className="btn btn-secondary" disabled={p.dates.length >= MAX_DATES} onClick={() => { setEditDates(true); const at = p.dates.length; update({ dates: [...p.dates, { when: '', what: '', who: '' }] }); setTimeout(() => document.querySelector<HTMLElement>(`[aria-label="Name of date ${at + 1}"]`)?.focus(), 0); }}>Add a date</button>
          {p.dates.length >= MAX_DATES && <span className="muted small">{MAX_DATES} dates is the most a packet keeps: remove one you don’t need.</span>}
        </div>
        </>); return finalDeal && p.dates.length ? <details open={editDates} onToggle={(e) => setEditDates(e.currentTarget.open)}><summary>Edit these dates</summary>{rows}</details> : rows; })()}
        {p.dates.length > 0 && !finalDeal && !(wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal))) && sidState(deal) !== 'void' && <>
        <label className="check packet-reviewed"><input type="checkbox" checked={p.calendarReviewedFor === stageOf(deal)} disabled={p.calendarReviewedFor !== stageOf(deal) && !calendarReady(forCalendar(deal, p, stageOf(deal)), stageOf(deal))} onChange={(e) => update({ calendarReviewedFor: e.target.checked ? stageOf(deal) : undefined })} /> <strong>I checked every deadline for this stage against the {wayOf(deal) === 'offer' ? 'signed contract' : 'official notice'}, including who acts and how notice must be delivered.</strong></label>
        <p className="muted small">{stageOf(deal) !== 'passed' && !calendarReady(forCalendar(deal, p, stageOf(deal)), stageOf(deal)) && <span>{p.dates.length === 0 ? (wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) ? 'Nothing needs a date until your offer is accepted. ' : 'Add this sale’s dates first: use “Start with the usual dates for this sale” above. ') : `${(() => { const miss = calendarRows(forCalendar(deal, p, stageOf(deal)), stageOf(deal)).filter((x) => !dateRowComplete(x)); const noDate = miss.filter((x) => !x.when || !x.what.trim()).map((x) => x.what || 'an unnamed date'); const noWho = miss.filter((x) => x.when && x.what.trim()).map((x) => x.what); return [noDate.length ? `No date yet: ${noDate.join('; ')}.` : '', noWho.length ? `Who handles it is still blank for: ${noWho.join('; ')}.` : ''].filter(Boolean).join(' '); })()} `}{wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal)) && p.dates.length === 0 ? null : <>Fill in the date, task and who handles it for every entry first; a date marked “(if …)” {['researching', 'offer'].includes(stageOf(deal)) ? (wayOf(deal) === 'offer' ? 'and the contract’s dates (until your offer is accepted)' : 'and the dates after the sale') : 'and one that counts from a later event'} can stay blank for now.</>}</span>}</p>
        </>}
        {p.dates.length > 0 && !finalDeal && <p className="muted small">Past dates stay open until you mark them handled. Confirm completion or an agreed resolution with your team, and remove entries that do not apply. Ask your {wayOf(deal) === 'offer' ? 'agent' : 'title company'} or attorney to confirm the calendar.{!(wayOf(deal) === 'offer' && ['researching', 'offer'].includes(stageOf(deal))) && sidState(deal) !== 'void' ? ' Adding or changing a date requires another review.' : ''}</p>}
        {!((passedOn || boughtNoDates) && p.dates.length === 0) && <Lines k="dates" />}
        {guideRows.length > 0 && !finalDeal && !boughtNoDates && (
          <>
            <details><summary>What the less familiar {deal.state === 'TX' ? (['listing', 'reo', 'short'].includes(deal.kind) ? 'Texas contract ' : 'Texas ') : ''}dates mean</summary>
            <div className="table-wrap">
              <table className="lesson-table doc-guide-table packet-date-guide">
                <thead>
                  <tr><th scope="col">Date</th><th scope="col">When, or how it’s counted</th><th scope="col">Who acts</th><th scope="col">What to do</th><th scope="col">If it’s missed</th></tr>
                </thead>
                <tbody>
                  {guideRows.map((g) => (
                    <tr key={g.what}>
                      <th scope="row">{g.what}{g.why && <span className="packet-date-why small muted">Why: {g.why}</span>}</th>
                      <td data-label="When">{g.when}</td>
                      <td data-label="Who acts">{g.who}</td>
                      <td data-label="What to do">{g.todo}</td>
                      <td data-label="If it’s missed">{g.missed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></details>
          </>
        )}
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-cash">
        <Head k="cash" />
        <label className="field">
          <span>{deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short' ? 'Earnest money deposit' : (deal.kind === 'lien' ? 'Certificate payment, due by the Treasurer’s deadline' : sealedBid(deal) && (['contract', 'closed', 'owned'].includes(stageOf(deal)) || (stageOf(deal) === 'passed' && paidAtWin(deal))) ? 'Full payment you sent with your sealed bid' : sealedBid(deal) && stageOf(deal) === 'passed' ? 'Full payment you planned to send with a sealed bid' : sealedBid(deal) ? 'Full payment, enclosed with your sealed bid (due by the notice’s deadline, usually 4 p.m. the day before the sale; the office is open Monday to Thursday except holidays, so if it’s closed that day the deadline may be earlier*)' : ['contract', 'closed', 'owned'].includes(stageOf(deal)) ? 'Bidder deposit you paid, if the sale required one' : 'Bidder deposit, if the sale requires one')}</span>
          <NumInput blank value={p.earnest} onValue={(n) => update({ earnest: n ?? 0 })} />
        </label>
        {(deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short') && <details><summary>{deal.state === 'TX' ? 'Separate fees and confirmed deposit credits' : 'Confirmed deposit credits'}</summary>
          {deal.state === 'TX' ? <p className="muted small">If your saved amount combined earnest money and an option fee, split them here. Enter only credits your title or escrow professional has confirmed. Include any uncredited fee once in your calculator’s acquisition costs; this field does not add it automatically.</p> : <p className="muted small">Enter only credits your title or escrow professional has confirmed toward closing.</p>}
          {deal.state === 'TX' && <label className="field"><span>Option fee, if applicable</span><NumInput blank max={1e9} value={p.optionFee} onValue={(n) => update({ optionFee: n ?? 0 })} /></label>}
          <label className="field"><span>{deal.state === 'TX' ? 'Confirmed deposit/fee credits toward closing' : 'Confirmed deposit credits toward closing'}</span><NumInput blank max={1e9} value={p.depositCredit} onValue={(n) => update({ depositCredit: n ?? 0 })} /></label>
          <p className="muted small"><a href="https://www.consumerfinance.gov/owning-a-home/closing-disclosure/" target="_blank" rel="noopener noreferrer">CFPB: understand cash to close ↗</a>. This consumer-mortgage example may use different documents from your purchase{liveIn(deal) ? '' : ' of an investment property'}.</p>
        </details>}
        <Lines k="cash" />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-numbers">
        <Head k="numbers" />
        <Lines k="numbers" />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-evidence">
        <Head k="evidence" />
        <Lines k="evidence" />
        <EvidenceLog dealId={key} name={deal.name} kind={deal.kind} initiallyOpen={section === 'evidence'} />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-pros">
        <Head k="pros" />
        <p className="muted">One question per professional that this deal raises, and their answer with the date. Their written answers are the evidence; this page only records them.</p>
        <ul className="packet-qa">
          {p.qa.map((x, i) => (
            <li key={i}>
              <label className="packet-f"><span aria-hidden="true">Professional</span><select aria-label="Professional" value={x.role} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, role: e.target.value } : y)) })}>
                {TEAM_ROLES.map((r) => <option key={r} value={r}>{roleTitleFor(deal, r)}</option>)}
                <option value="other">Other</option>
              </select></label>
              <label className="packet-f"><span aria-hidden="true">Your question</span><textarea aria-label="Your question" rows={2} maxLength={500} placeholder="Your question" value={x.q} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} /></label>
              <label className="packet-f"><span aria-hidden="true">Their answer</span><textarea aria-label="Their answer" rows={2} maxLength={1000} placeholder="Their answer" value={x.a} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} /></label>
              <label className="packet-f"><span aria-hidden="true">Answered on</span><input type="date" aria-label="Date answered" value={x.on} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, on: e.target.value } : y)) })} /></label>
              <button type="button" className="linkish" aria-label="Remove this question" onClick={() => update({ qa: p.qa.filter((_, j) => j !== i) })}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-secondary" onClick={() => { const team = teamRolesFor(deal); update({ qa: [...p.qa, { role: team.length ? team[p.qa.length % team.length] : TEAM_ROLES[p.qa.length % TEAM_ROLES.length], q: '', a: '', on: '' }] }); setTimeout(() => [...document.querySelectorAll<HTMLElement>('textarea[aria-label="Your question"]')].pop()?.focus(), 0); }}>Add a question</button>
        {p.qa.length === 0 ? <OwlNote>{sec('pros').lines[0]}</OwlNote> : <Lines k="pros" />}
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-decision">
        <Head k="decision" />
        <DecisionGate dealId={key} record={pastSale || stageOf(deal) === 'passed'} passed={passedOn} before={beforeWhat(deal)} onPass={stageOf(deal) === 'passed' ? undefined : () => { setDealStage(deal.id, 'passed'); }} />
        {passedOn ? <p className="muted">You passed on this property: nothing needs deciding here now.</p> : pastSale ? <p className="muted">{loadLog(key).gate ? `This records the choice you made before ${beforeWhat(deal)}: nothing needs deciding here now.` : `No decision was recorded before ${beforeWhat(deal)}. Nothing needs deciding here now; add your reasons below if you’d like them on file.`}</p> : <p className="muted">Write down why, and anything that must be true before you sign or bid. The same choice shows at the end of the evidence log.</p>}
        {(() => { const boxes = (<>
        <label className="field wide">
          <span>Why</span>
          <textarea rows={2} maxLength={1000} value={p.decisionWhy} onChange={(e) => update({ decisionWhy: e.target.value })} />
        </label>
        <label className="field wide">
          <span>{pastSale || stageOf(deal) === 'passed' ? 'Conditions you had (optional)' : 'Still to resolve before you commit'}</span>
          <textarea rows={2} maxLength={1000} value={p.conditions} onChange={(e) => update({ conditions: e.target.value })} placeholder="e.g. Title company confirms the 2023 lien will be released; insurance quote under $1,500." />
        </label>
        </>); return pastSale || stageOf(deal) === 'passed' ? <details open={p.decisionWhy || p.conditions ? true : undefined}><summary>{passedOn ? (p.decisionWhy || p.conditions ? 'Why you passed' : 'Add why you passed (optional)') : 'Add to the record'}</summary>{boxes}</details> : boxes; })()}
        {!(pastSale || stageOf(deal) === 'passed') && <Lines k="decision" />}
      </section>
      <section className="deal-setup packet-section" aria-labelledby="packet-owned">
        <h2 id="packet-owned">After you buy: actual results</h2>
        {/* A lien certificate earns interest, not rent: no monthly rent tracker. */}
        {deal.kind === 'lien' ? <p>{finishedDeal(deal) ? 'Paid off: keep the Treasurer’s payoff receipt with the certificate record for your taxes.' : redeemingNow(deal) ? 'Paid off: collect the Treasurer’s payoff and keep the receipt with the certificate record.' : 'Holding the certificate? Keep the Treasurer’s certificate record (the city or county that sold it), any later taxes you pay to protect it with the written notice of them you gave the Treasurer (without it they aren’t repaid, NRS 271.595(1)), and the payoff when the owner redeems, with your notes and the Treasurer’s receipts.'}</p> : ['closed', 'owned'].includes(stageOf(deal)) && beforeDeed(deal) ? <p className="caution" role="note">You hold a certificate of sale, not the deed yet{beforeDeed(deal) !== 'unknown' ? ` (the redemption period ends ${prettyDay(beforeDeed(deal))})` : ''}. Keep receipts for what you pay while you wait; Key dates say what a redemption repays. Tracking costs and a sale start here once you have the deed.</p> : <OwnedTracker deal={deal} />}
      </section>
      <AdSpot spot="dealPacket" allow={analyzeAllowsAds(deal.kind)} />
      <p className="muted">This packet is not included in account saves. Download it to keep a copy; guest packets also stay in this browser. This packet records your own review; it doesn’t clear title or certify a deal.</p>
    </main>
  );
}
