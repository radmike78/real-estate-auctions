import { saleDocsFor, saleScriptsFor } from '../lib/saleDocs';

/** "[date]" in a script becomes a blank to fill in, so it doesn't read as leftover placeholder text. */
function withBlanks(script: string) {
  return script.split(/\[([^\]]+)\]/).map((part, i) => (i % 2 ? <span key={i} className="fill-blank">{part}</span> : part));
}

/** Documents to have, check or sign for a kind of sale, and words to use with the official seller or your own team. */
export default function SaleDocsPanel({ guideKey, state }: { guideKey: string; state: string }) {
  const scripts = saleScriptsFor(guideKey, state);
  const blanks = scripts.some((x) => /\[[^\]]+\]/.test(x.script));
  return (
    <div className="roadmap-cols sale-docs">
      <div>
        <h3 className="guide-sub">Documents</h3>
        <ul className="sale-doc-list">
          {saleDocsFor(guideKey, state).map((d) => <li key={d.name}><strong>{d.name}</strong> <span>{d.check}</span></li>)}
        </ul>
        <p className="muted">Start with the official notice and your contract. Confirm applicable forms, amounts, deadlines and any missing details with the official seller and your own team.</p>
      </div>
      <div>
        <h3 className="guide-sub">What to say</h3>
        {blanks && <p className="fill-blank-note"><strong>Fill in the blanks:</strong> swap each <span className="fill-blank">highlighted word</span> for the detail from the sale notice or listing.</p>}
        {scripts.map((x) => (
          <div key={x.to}>
            <h4>{x.to}</h4>
            <blockquote className="roadmap-script">{withBlanks(x.script)}</blockquote>
          </div>
        ))}
        <p className="muted">Talk only with the official seller and your own team. Never contact the owner or anyone living in the property.</p>
      </div>
    </div>
  );
}
