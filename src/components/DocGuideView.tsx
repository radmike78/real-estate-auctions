import type { DocGuide } from '../lib/docGuides';
import { forStateText, useMyState } from '../lib/myState';

/** One document, annotated: who gives it to you, the parts to find, who fills each in, and how to check a corrected version. */
export default function DocGuideView({ g, label }: { g: DocGuide; label?: string }) {
  // State-specific sentences ("In California, …") show only for the visitor's chosen state.
  const [state] = useMyState();
  return (
    <details className="doc-guide">
      <summary>{label ?? `How to read a real one: ${g.title}`}</summary>
      <p><strong>Who gives it to you, and when:</strong> {forStateText(state, g.from)}</p>
      <div className="table-wrap">
        <table className="lesson-table doc-guide-table">
          <thead>
            <tr><th scope="col">Find this</th><th scope="col">What to check</th><th scope="col">Who fills it in</th><th scope="col">Example</th></tr>
          </thead>
          <tbody>
            {g.parts.map((x) => (
              <tr key={x.part}>
                <th scope="row">{x.part}</th>
                <td data-label="What to check">{forStateText(state, x.look)}</td>
                <td data-label="Who fills it in">{x.who}</td>
                <td data-label="Example">{x.example ? forStateText(state, x.example) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><strong>What changes a deadline or your decision:</strong> {g.changes}</p>
      <p><strong>Checking a corrected version:</strong> {g.corrected}</p>
      <p className="muted">A general guide to common forms, not your state’s required form. Have a professional review any form that commits you.</p>
    </details>
  );
}
