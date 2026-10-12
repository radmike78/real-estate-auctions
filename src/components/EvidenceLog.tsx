import { useEffect, useState } from 'react';
import { emptyRow, EVIDENCE_AREAS, EVIDENCE_EVENT, GATES, loadLog, logText, saveLog, type EvidenceLog as Log, type EvidenceRow } from '../lib/evidence';
import { downloadText, fileName } from '../lib/download';

/** For one deal: what you verified, where it came from and what's still open, then the decision it supports. */
export default function EvidenceLog({ dealId, name, initiallyOpen = false }: { dealId: string; name: string; initiallyOpen?: boolean }) {
  const [log, setLog] = useState<Log>(() => loadLog(dealId));
  useReloadOnSave(dealId, setLog);
  // Saved on every change, so another editor of the same deal (a roadmap step) never works from an old copy.
  const update = (f: (l: Log) => Log) => {
    const next = f(loadLog(dealId));
    saveLog(dealId, next);
    setLog(next);
  };
  const done = EVIDENCE_AREAS.filter((a) => log.rows[a.key]?.done).length;
  const openCount = EVIDENCE_AREAS.filter((a) => (log.rows[a.key]?.open ?? '').trim()).length;
  const set = (key: string, patch: Partial<EvidenceRow>) => update((l) => ({ ...l, rows: { ...l.rows, [key]: { ...(l.rows[key] ?? emptyRow()), ...patch } } }));
  const gate = GATES.find((g) => g.key === log.gate);
  return (
    <details className="evidence-log" open={initiallyOpen}>
      <summary>Verify: evidence log ({done} of {EVIDENCE_AREAS.length} checked{openCount ? `, ${openCount} open question${openCount === 1 ? '' : 's'}` : ''}){gate ? ` · ${gate.label}` : ''}</summary>
      <p className="muted small">For each area, record where the answer came from and when. A checkmark records your review; it doesn’t clear title or certify a deal. Get qualified local help for anything legal or title-related.</p>
      <ol className="evidence-areas">
        {EVIDENCE_AREAS.map((a) => {
          const r = log.rows[a.key] ?? emptyRow();
          return (
            <li key={a.key}>
              <label className="evidence-done">
                <input type="checkbox" checked={r.done} onChange={() => set(a.key, { done: !r.done })} />
                <span><strong>{a.title}</strong> <span className="muted">{a.what}</span></span>
              </label>
              <div className="evidence-fields">
                <label className="field"><span>Source</span><input type="text" maxLength={300} value={r.source} placeholder="Document, office or person" onChange={(e) => set(a.key, { source: e.target.value })} /></label>
                <label className="field"><span>Date checked</span><input type="date" value={r.checked} onChange={(e) => set(a.key, { checked: e.target.value })} /></label>
                <label className="field"><span>Finding</span><input type="text" maxLength={600} value={r.finding} onChange={(e) => set(a.key, { finding: e.target.value })} /></label>
                <label className="field"><span>Open question</span><input type="text" maxLength={600} value={r.open} onChange={(e) => set(a.key, { open: e.target.value })} /></label>
                <label className="field"><span>Who handles it, by when</span><input type="text" maxLength={200} value={r.owner} onChange={(e) => set(a.key, { owner: e.target.value })} /></label>
              </div>
            </li>
          );
        })}
      </ol>
      <fieldset className="evidence-gate">
        <legend>Decision</legend>
        {GATES.map((g) => (
          <label key={g.key}>
            <input type="radio" name={`gate-${dealId}`} checked={log.gate === g.key} onChange={() => update((l) => ({ ...l, gate: g.key }))} />
            <span><strong>{g.label}</strong> <span className="muted">{g.when}</span></span>
          </label>
        ))}
      </fieldset>
      {log.gate === 'proceed' && openCount > 0 && <p className="caution" role="status">You still have {openCount} open question{openCount === 1 ? '' : 's'}. Resolve them before you commit money.</p>}
      <button type="button" className="btn btn-secondary" onClick={() => downloadText(fileName(`evidence log ${name}`, 'txt'), logText(name, log))}>Download the log</button>
    </details>
  );
}

/**
 * One area of one deal's evidence log, inside a roadmap step: the property it's about, and the same fields as the
 * full log, saved to it. `askFinding` reminds the reader to record what they found when they mark the step done.
 */
export function EvidenceArea({ dealId, dealName, area, askFinding }: { dealId: string; dealName: string; area: string; askFinding?: boolean }) {
  const a = EVIDENCE_AREAS.find((x) => x.key === area);
  const [log, setLog] = useState<Log>(() => loadLog(dealId));
  useReloadOnSave(dealId, setLog);
  if (!a) return null;
  const r = log.rows[a.key] ?? emptyRow();
  // Built from what's stored now, so edits made in another editor of this deal are kept.
  const set = (patch: Partial<EvidenceRow>) => {
    const l = loadLog(dealId);
    const next = { ...l, rows: { ...l.rows, [a.key]: { ...(l.rows[a.key] ?? emptyRow()), ...patch } } };
    saveLog(dealId, next);
    setLog(next);
  };
  return (
    <div className="evidence-step">
      <h4>For {dealName}: {a.title}</h4>
      <p className="muted">{a.what} This saves to the deal’s evidence log in <a href="#/deals">My deals</a>.</p>
      <div className="evidence-fields">
        <label className="field"><span>Source</span><input type="text" maxLength={300} value={r.source} placeholder="Document, office or person" onChange={(e) => set({ source: e.target.value })} /></label>
        <label className="field"><span>Date checked</span><input type="date" value={r.checked} onChange={(e) => set({ checked: e.target.value })} /></label>
        <label className="field"><span>Finding</span><input type="text" maxLength={600} value={r.finding} onChange={(e) => set({ finding: e.target.value })} /></label>
        <label className="field"><span>Open question</span><input type="text" maxLength={600} value={r.open} onChange={(e) => set({ open: e.target.value })} /></label>
        <label className="field"><span>Who handles it, by when</span><input type="text" maxLength={200} value={r.owner} onChange={(e) => set({ owner: e.target.value })} /></label>
      </div>
      <label className="evidence-done"><input type="checkbox" checked={r.done} onChange={() => set({ done: !r.done })} /> <span>I’ve reviewed this area for this deal</span></label>
      {askFinding && !r.finding.trim() && <p className="caution" role="status">You marked this step done. Write what you found above, so this deal’s evidence log shows it.</p>}
    </div>
  );
}

/** Reload this deal's log when another editor saves it. */
function useReloadOnSave(dealId: string, setLog: (l: Log) => void) {
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail === dealId) setLog(loadLog(dealId));
    };
    window.addEventListener(EVIDENCE_EVENT, on);
    return () => window.removeEventListener(EVIDENCE_EVENT, on);
  }, [dealId, setLog]);
}
