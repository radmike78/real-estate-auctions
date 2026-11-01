import { analyzeAllowsAds } from '../lib/contextAds';
import NumInput from './NumInput';
import { useEffect, useState } from 'react';
import PageHero from './PageHero';
import EvidenceLog from './EvidenceLog';
import { kindLabel, loadDeals, openDeal, SALE_KINDS } from '../lib/analyze';
import { countyName } from '../lib/regions';
import { dateGuide, dealPacketText, FIT_LABEL, loadPacket, packetSections, savePacket, suggestedDates, type Fit, type PacketData, type SectionStatus } from '../lib/dealPacket';
import { TEAM_ROLES } from '../lib/myPlan';
import { proGuideByKey } from '../lib/proGuide';
import { downloadText, fileName } from '../lib/download';
import { EVIDENCE_EVENT } from '../lib/evidence';
import AdSpot from './AdSpot';
import OwnedTracker from './OwnedTracker';
import { useNoIndex } from '../lib/noindex';
import { DEAL_STAGES, type DealStage } from '../lib/analyze';
import { dealNextTask, setDealStage, stageHint, stageLabel, stageOf } from '../lib/dealStage';
import { PROGRESS_EVENT } from '../lib/roadmapState';
import { OWNED_EVENT } from '../lib/owned';

const STATUS_LABEL: Record<SectionStatus, string> = { done: 'Complete', started: 'In progress', missing: 'Missing' };

/**
 * The deal packet for a property you're analyzing: everything the decision needs on one page, each part marked
 * complete, in progress or missing, with the one next action at the top. Fill the gaps here or where each part lives.
 */
export default function DealPacketPage({ dealId, section }: { dealId: string; section?: string }) {
  const deal = loadDeals().find((d) => d.id === dealId);
  const key = `analyzed:${dealId}`;
  const [p, setP] = useState<PacketData>(() => loadPacket(key));
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
      const next = { ...cur, ...patch, ...(patch.dates && reviewDates ? { calendarReviewedFor: undefined } : {}) };
      savePacket(key, next);
      return next;
    });

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

  const Head = ({ k }: { k: string }) => {
    const s = sec(k);
    return (
      <h2 id={`packet-${k}`}>
        {s.title} <span className={`packet-status ${s.status}`}>{s.status === 'done' && s.doneLabel ? s.doneLabel : STATUS_LABEL[s.status]}</span>
      </h2>
    );
  };
  const Lines = ({ k }: { k: string }) => {
    const s = sec(k);
    return (
      <>
        <ul className="packet-lines">{s.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
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
      <p>Everything this decision needs, on one page: your plan, the dates, the cash and when it’s due, your numbers with a downside case, what you’ve verified, your professionals’ answers and your decision. {done} of {sections.length} parts are complete. Every number is your estimate until a source backs it.</p>

      <div className="packet-stage">
        <label className="field">
          <span>Where it stands</span>
          <select value={stage} onChange={(e) => setDealStage(deal.id, e.target.value as DealStage)}>
            {DEAL_STAGES.map((st) => <option key={st} value={st}>{stageLabel(st, deal)}</option>)}
          </select>
        </label>
        <p className="muted">{stageHint(stage, deal)} The stage picks the next action here and in My plan.</p>
      </div>
      <div className="packet-next" role="status">
        <strong>Your next action</strong>
        <p>{next.label}{next.urgent ? '' : <>. <span className="muted">You’ll have {next.produces}.</span></>}{' '}
          {next.openDeal ? <a href="#/analyze" onClick={(e) => { e.preventDefault(); openDeal(deal); }}>Open in Analyze&nbsp;→</a>
            : next.setStage ? <button type="button" className="linkish" onClick={() => setDealStage(deal.id, next.setStage!)}>Do it now&nbsp;→</button>
            : !next.href.startsWith(`#/deals/packet/${deal.id}`) ? <a href={next.href}>Go there&nbsp;→</a> : null}
        </p>
        {next.advance && <button type="button" className="btn btn-secondary" onClick={() => setDealStage(deal.id, next.advance!.stage)}>{next.advance.label}</button>}
      </div>
      <div className="row packet-actions">
        <button type="button" className="btn btn-secondary" onClick={() => downloadText(fileName(`deal packet ${deal.name}`, 'txt'), dealPacketText(deal, p))}>Download the packet</button>
        <button type="button" className="btn btn-secondary" onClick={() => openDeal(deal)}>Open in Analyze</button>
        <a className="btn btn-secondary" href="#/deals">My deals</a>
      </div>

      <section className="deal-setup packet-section" aria-labelledby="packet-plan">
        <Head k="plan" />
        <Lines k="plan" />
        <fieldset className="packet-fit">
          <legend>Does it fit your buy box?</legend>
          {(Object.keys(FIT_LABEL) as Exclude<Fit, ''>[]).map((f) => (
            <label key={f} className="check"><input type="radio" name="packet-fit" checked={p.fit === f} onChange={() => update({ fit: f })} /> {FIT_LABEL[f]}</label>
          ))}
        </fieldset>
        <label className="field wide">
          <span>Why (the evidence, not the feeling)</span>
          <textarea rows={2} maxLength={600} value={p.fitWhy} onChange={(e) => update({ fitWhy: e.target.value })} placeholder="e.g. Under my price limit, 3 bed, but the cash flow only works if rent is $2,300 and comparables say $2,150." />
        </label>
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-property">
        <Head k="property" />
        <Lines k="property" />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-dates">
        <Head k="dates" />
        <p className="muted">From the {deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short' ? 'signed contract' : 'official notice'}: the contract or notice wins over anything here.</p>
        <ul className="packet-dates">
          {p.dates.map((x, i) => (
            <li key={i}>
              <input type="date" aria-label="Date" value={x.when} onChange={(e) => update({ dates: p.dates.map((y, j) => (j === i ? { ...y, when: e.target.value, resolved: false } : y)) })} />
              <input aria-label="What" maxLength={200} value={x.what} onChange={(e) => update({ dates: p.dates.map((y, j) => (j === i ? { ...y, what: e.target.value, resolved: false } : y)) })} />
              <input aria-label="Who handles it" placeholder="Who" maxLength={120} value={x.who} onChange={(e) => update({ dates: p.dates.map((y, j) => (j === i ? { ...y, who: e.target.value, resolved: false } : y)) })} />
              <label><input type="checkbox" checked={!!x.resolved} onChange={(e) => update({ dates: p.dates.map((y, j) => j === i ? { ...y, resolved: e.target.checked } : y) }, false)} /> Handled</label>
              <button type="button" className="linkish" aria-label={`Remove ${x.what || 'date'}`} onClick={() => update({ dates: p.dates.filter((_, j) => j !== i) })}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="row">
          {p.dates.length === 0 && <button type="button" className="btn" onClick={() => update({ dates: suggestedDates(deal).map((what) => ({ when: '', what, who: '' })) })}>Start with the usual dates for this sale</button>}
          <button type="button" className="btn btn-secondary" onClick={() => update({ dates: [...p.dates, { when: '', what: '', who: '' }] })}>Add a date</button>
        </div>
        <label className="field">
          <span><input type="checkbox" checked={p.calendarReviewedFor === stageOf(deal)} disabled={!p.dates.length || p.dates.some((d) => !d.when || !d.what.trim() || !d.who.trim())} onChange={(e) => update({ calendarReviewedFor: e.target.checked ? stageOf(deal) : undefined })} /> I checked every applicable deadline for this stage against the signed contract or official notice, including who acts and how notice must be delivered.{(!p.dates.length || p.dates.some((d) => !d.when || !d.what.trim() || !d.who.trim())) && <span className="muted"> (Fill in the date, task and who handles it for every entry first.)</span>}</span>
        </label>
        <p className="muted small">Past dates stay open until you mark them handled. Confirm completion or an agreed resolution with your team. Fill in the date, task and responsible person for each applicable deadline; remove entries that do not apply. Ask your agent or attorney to confirm the calendar. Adding or changing a date requires another review.</p>
        <Lines k="dates" />
        {guideRows.length > 0 && (
          <>
            <details><summary>How each {deal.state === 'TX' ? 'Texas contract ' : ''}date works</summary>
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
          <span>{deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short' ? 'Earnest money deposit' : 'Bidder deposit, if the sale requires one'}</span>
          <NumInput blank value={p.earnest} onValue={(n) => update({ earnest: n ?? 0 })} />
        </label>
        {(deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short') && <details><summary>Separate fees and confirmed deposit credits</summary>
          <p className="muted small">If your saved amount combined earnest money and an option fee, split them here. Enter only credits your title or escrow professional has confirmed. Include any uncredited fee once in your calculator’s acquisition costs; this field does not add it automatically.</p>
          <label className="field"><span>Option fee, if applicable</span><NumInput blank max={1e9} value={p.optionFee} onValue={(n) => update({ optionFee: n ?? 0 })} /></label>
          <label className="field"><span>Confirmed deposit/fee credits toward closing</span><NumInput blank max={1e9} value={p.depositCredit} onValue={(n) => update({ depositCredit: n ?? 0 })} /></label>
          <p className="muted small"><a href="https://www.consumerfinance.gov/owning-a-home/closing-disclosure/" target="_blank" rel="noopener noreferrer">CFPB: understand cash to close ↗</a>. This consumer-mortgage example may use different documents from your investment purchase.</p>
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
        <EvidenceLog dealId={key} name={deal.name} initiallyOpen={section === 'evidence'} />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-pros">
        <Head k="pros" />
        <p className="muted">One question per professional that this deal raises, and their answer with the date. Their written answers are the evidence; this page only records them.</p>
        <ul className="packet-qa">
          {p.qa.map((x, i) => (
            <li key={i}>
              <select aria-label="Professional" value={x.role} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, role: e.target.value } : y)) })}>
                {TEAM_ROLES.map((r) => <option key={r} value={r}>{proGuideByKey(r)?.title ?? r}</option>)}
                <option value="other">Other</option>
              </select>
              <textarea aria-label="Your question" rows={2} maxLength={500} placeholder="Your question" value={x.q} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} />
              <textarea aria-label="Their answer" rows={2} maxLength={1000} placeholder="Their answer" value={x.a} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
              <input type="date" aria-label="Date answered" value={x.on} onChange={(e) => update({ qa: p.qa.map((y, j) => (j === i ? { ...y, on: e.target.value } : y)) })} />
              <button type="button" className="linkish" aria-label="Remove this question" onClick={() => update({ qa: p.qa.filter((_, j) => j !== i) })}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-secondary" onClick={() => update({ qa: [...p.qa, { role: TEAM_ROLES[p.qa.length % TEAM_ROLES.length], q: '', a: '', on: '' }] })}>Add a question</button>
        <Lines k="pros" />
      </section>

      <section className="deal-setup packet-section" aria-labelledby="packet-decision">
        <Head k="decision" />
        <p className="muted">Choose Investigate, Pass or Proceed under “Decision” at the end of the evidence log in the section above (open the log if it’s closed). Write down why, and anything that must be true before you sign or bid.</p>
        <label className="field wide">
          <span>Why</span>
          <textarea rows={2} maxLength={1000} value={p.decisionWhy} onChange={(e) => update({ decisionWhy: e.target.value })} />
        </label>
        <label className="field wide">
          <span>Still to resolve before you commit</span>
          <textarea rows={2} maxLength={1000} value={p.conditions} onChange={(e) => update({ conditions: e.target.value })} placeholder="e.g. Title company confirms the 2023 lien will be released; insurance quote under $1,500." />
        </label>
        <Lines k="decision" />
      </section>
      <section className="deal-setup packet-section" aria-labelledby="packet-owned">
        <h2 id="packet-owned">After you buy: actual results</h2>
        <OwnedTracker deal={deal} />
      </section>
      <AdSpot spot="dealPacket" allow={analyzeAllowsAds(deal.kind)} />
      <p className="muted">This packet is not included in account saves. Download it to keep a copy; guest packets also stay in this browser. This packet records your own review; it doesn’t clear title or certify a deal.</p>
    </main>
  );
}
