import { SALE_SCRIPTS, saleDocsFor, saleKindOf } from '../lib/saleDocs';

/** Documents to have, check or sign for a kind of sale, and words to use with the official seller or your own team. */
export default function SaleDocsPanel({ guideKey, state }: { guideKey: string; state: string }) {
  return (
    <div className="roadmap-cols sale-docs">
      <div>
        <h3>Documents</h3>
        <ul className="sale-doc-list">
          {saleDocsFor(guideKey, state).map((d) => <li key={d.name}><strong>{d.name}</strong> <span>{d.check}</span></li>)}
        </ul>
        <p className="muted">The official notice and your contract always have the exact forms, amounts and deadlines.</p>
      </div>
      <div>
        <h3>What to say</h3>
        {SALE_SCRIPTS[saleKindOf(guideKey)].map((x) => (
          <div key={x.to}>
            <h4>{x.to}</h4>
            <blockquote className="roadmap-script">{x.script}</blockquote>
          </div>
        ))}
        <p className="muted">Talk only with the official seller and your own team. Never contact the owner or anyone living in the property.</p>
      </div>
    </div>
  );
}
