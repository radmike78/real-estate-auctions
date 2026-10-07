import { useEffect, useState } from 'react';
import type { Deal } from '../lib/analyze';
import { savedNumbers } from '../lib/dealPacket';
import { loadOwned, OWNED_EVENT, ownedSummary, saveOwned, type Owned } from '../lib/owned';
import { fmtMoney } from '../lib/status';
import { setDealStage, stageOf } from '../lib/dealStage';

/** The monthly cash flow the deal was bought on, from its Keep and rent numbers (null without them). */
export function projectedMonthly(d: Deal): number | null {
  const n = savedNumbers(d);
  if (n.rent) return n.rent.monthly;
  return null;
}

export function useOwned(): Record<string, Owned> {
  const [all, setAll] = useState(loadOwned);
  useEffect(() => {
    const on = () => setAll(loadOwned());
    window.addEventListener(OWNED_EVENT, on);
    return () => window.removeEventListener(OWNED_EVENT, on);
  }, []);
  return all;
}

const signed = (n: number) => `${n < 0 ? '−' : ''}${fmtMoney(Math.abs(Math.round(n)))}`;
// Today in this browser's own time zone (toISOString would give the UTC date, a day ahead in the evening).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * After you buy: record each month's rent and costs, and see them against the cash flow you planned. The numbers you
 * bought on stay as they were; this shows how the property is really doing.
 */
export default function OwnedTracker({ deal }: { deal: Deal }) {
  const all = useOwned();
  const o = all[deal.id];
  const [month, setMonth] = useState(thisMonth);
  const [rent, setRent] = useState('');
  const [costs, setCosts] = useState('');
  const [note, setNote] = useState('');
  const projected = projectedMonthly(deal);
  const put = (next: Owned | null) => {
    const copy = { ...all };
    if (next) copy[deal.id] = next;
    else delete copy[deal.id];
    saveOwned(copy);
  };
  if (!o) {
    return (
      <div>
        <p>Did you buy it? Mark it as yours to track the real rent and costs each month against the cash flow you planned.</p>
        <button type="button" className="btn btn-secondary" onClick={() => { put({ boughtOn: today(), months: [] }); if (!['closed', 'owned'].includes(stageOf(deal))) setDealStage(deal.id, 'closed'); }}>I bought this property</button>
      </div>
    );
  }
  const s = ownedSummary(o, projected);
  const negative = Number(rent) < 0 || Number(costs) < 0;
  const add = () => {
    const r = Number(rent);
    const c = Number(costs);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isFinite(r) || !Number.isFinite(c) || r < 0 || c < 0) return;
    put({ ...o, months: [{ month, rent: Math.max(0, r), costs: Math.max(0, c), note: note.slice(0, 200) }, ...o.months.filter((m) => m.month !== month)].sort((a, b) => b.month.localeCompare(a.month)) });
    setRent('');
    setCosts('');
    setNote('');
    // Move on to the month after the one just added, so the next entry doesn't replace it.
    const [y, mo] = month.split('-').map(Number);
    setMonth(mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`);
  };
  return (
    <div>
      <p className="muted">{projected === null ? 'Renting it out? Save this deal’s numbers in Keep and rent to compare each month with your plan. Fixing it to sell? Record what you pay each month, with $0 rent.' : `You planned on ${signed(projected)} a month of cash flow.`}</p>
      <div className="row owned-add">
        <label className="field"><span>Bought on</span><input type="date" value={o.boughtOn} onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && put({ ...o, boughtOn: e.target.value })} /></label>
        <label className="field"><span>Month</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <label className="field"><span>Rent collected ($)</span><input type="number" inputMode="decimal" min={0} value={rent} onChange={(e) => setRent(e.target.value)} /></label>
        <label className="field"><span>Everything you paid ($)</span><input type="number" inputMode="decimal" min={0} value={costs} onChange={(e) => setCosts(e.target.value)} /></label>
        <label className="field"><span>Note (optional)</span><input type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. water heater replaced" /></label>
        <button type="button" className="btn" disabled={rent === '' || costs === '' || negative} onClick={add}>{o.months.some((m) => m.month === month) ? 'Replace this month' : 'Add month'}</button>
      </div>
      {negative && <p className="caution small" role="alert">Enter rent and costs as $0 or more. Record a refund to a tenant as a cost.</p>}
      <p className="small muted">Count everything you paid that month: the loan, taxes, insurance, HOA, repairs, management and utilities, and any money you moved into your repair savings.</p>
      {s.months > 0 ? (
        <>
          <dl className="calc-kv">
            <div><dt>Months recorded</dt><dd>{s.months}</dd></div>
            <div><dt>Actual cash flow, in total</dt><dd>{signed(s.actual)}</dd></div>
            <div><dt>Average month</dt><dd>{signed(s.averageMonthly)}</dd></div>
            {s.gapMonthly !== null && <div><dt>Against your plan, a month</dt><dd>{signed(s.gapMonthly)} {s.gapMonthly < 0 ? '(behind)' : '(ahead)'}</dd></div>}
          </dl>
          {s.gapMonthly !== null && s.gapMonthly < -50 && <p className="caution small" role="note">It’s earning less than you planned. Look at which costs ran over, whether the rent matches new leases nearby, and whether your repair savings can carry it. Review it before you buy the next one.</p>}
          <table className="lesson-table owned-table">
            <thead><tr><th>Month</th><th>Rent</th><th>Paid</th><th>Cash flow</th><th>Note</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {o.months.map((m) => (
                <tr key={m.month}>
                  <td>{m.month}</td><td>{fmtMoney(m.rent)}</td><td>{fmtMoney(m.costs)}</td><td>{signed(m.rent - m.costs)}</td><td>{m.note}</td>
                  <td><button type="button" className="linkish" aria-label={`Remove ${m.month}`} onClick={() => put({ ...o, months: o.months.filter((x) => x.month !== m.month) })}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No months recorded yet. Add the first one when the rent comes in.</p>
      )}
      <p><button type="button" className="linkish" onClick={() => { if (window.confirm('Stop tracking this property and delete its monthly records?')) put(null); }}>I didn’t buy it, stop tracking</button></p>
    </div>
  );
}
