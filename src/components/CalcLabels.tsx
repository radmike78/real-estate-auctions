import { fmtMoney } from '../lib/status';

/**
 * Which inputs still hold our starting example, by label: shown where the inputs start, so nobody reads a result built
 * on sample numbers as their own. A field counts as yours once you've typed in it or its value differs from the example.
 */
export function exampleLabels<T extends object>(
  fields: { k: string; label: string }[],
  values: T,
  examples: Partial<T>,
  typed: ReadonlySet<string>,
  skip: ReadonlySet<string> = new Set(),
): string[] {
  const v = values as Record<string, unknown>;
  const ex = examples as Record<string, unknown>;
  const seen = new Set<string>();
  return fields
    .filter((f) => !skip.has(f.k) && !typed.has(f.k) && typeof ex[f.k] === 'number' && ex[f.k] !== 0 && v[f.k] === ex[f.k])
    .map((f) => f.label)
    .filter((l) => (seen.has(l) ? false : (seen.add(l), true)));
}

/** The warning at the start of the inputs: which numbers are still our examples. */
export function ExampleInputs({ labels, all = false }: { labels: string[]; /** Nothing has been entered yet. */ all?: boolean }) {
  if (!labels.length) return null;
  return (
    <div className="calc-example-note" role="note">
      <strong>{all ? 'These are sample numbers, not your property.' : `${labels.length} ${labels.length === 1 ? 'input is' : 'inputs are'} still our example${labels.length === 1 ? '' : 's'}.`}</strong>{' '}
      Replace {labels.length === 1 ? 'it' : 'each one'} with a number you have checked against a quote, record or other reliable evidence before using the results to make a decision.
      <details><summary>Review the {labels.length} example {labels.length === 1 ? 'input' : 'inputs'}</summary><ul>{labels.map((l) => <li key={l}>{l}</li>)}</ul></details>
    </div>
  );
}

/** The short reminder beside the results when some inputs are still examples. */
export function ExampleResults({ count, all = false, what = 'walk-away price' }: { count: number; all?: boolean; what?: string }) {
  if (!count) return null;
  return all ? (
    <p className="notice small calc-example-results" role="note"><strong>Example numbers.</strong> These results come from sample inputs, not your property. Replace them with your own numbers to get your own {what}.</p>
  ) : (
    <p className="notice small calc-example-results" role="note"><strong>Partly example numbers.</strong> {count} {count === 1 ? 'input is' : 'inputs are'} still our starting example{count === 1 ? '' : 's'} (listed where the inputs start), so these results are only partly yours.</p>
  );
}

const money = (n: number) => (n < 0 ? `−${fmtMoney(Math.round(-n))}` : `+${fmtMoney(Math.round(n))}`);

/**
 * The heading bar on a result block: the price it evaluates and what that price gives. "Your offer: $280,000 → −$510 a
 * month" (blue, solid) reads differently from "Walk-away price: $123,205 → +$273 a month" (green, dashed), and the asking
 * price or opening bid gets a plain grey bar.
 */
export function PriceHead({ kind, label, price, result, unit = 'a month', note, id, tag }: { kind: 'yours' | 'target' | 'listed'; label: string; price: number | null; /** Monthly cash flow or profit at that price. */ result?: number | null; unit?: string; note?: string; id?: string; /** Replaces the small label above the line. */ tag?: string }) {
  const tagText = tag ?? (kind === 'yours' ? 'Your number' : kind === 'target' ? 'What-if: the price that meets your goal' : 'From the listing');
  return (
    <>
    <h4 className={`price-head price-head-${kind}`} id={id}>
      <span className="price-head-tag">{tagText}</span>
      <span className="price-head-line">
        <span className="price-head-label">{label}:</span>{' '}
        <strong className="price-head-price">{price === null ? '—' : fmtMoney(Math.round(price))}</strong>
        {result !== undefined && result !== null && Number.isFinite(result) && (
          <>
            <span className="price-head-arrow" aria-hidden> → </span>
            <span className="sr-only"> gives </span>
            <strong className={`price-head-result${result < 0 ? ' neg' : ''}`}>{money(result)} {unit} before income tax</strong>
          </>
        )}
      </span>
    </h4>
    {note && <p className={`price-head-note price-head-note-${kind}`}>{note}</p>}
    </>
  );
}
