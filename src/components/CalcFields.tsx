import { useEffect, useId, useRef, useState } from 'react';

export type Unit = '$' | '%' | 'mo' | '$/500' | '%/yr' | '%/mo' | 'yr' | 'x';
export interface CalcField<T> {
  k: keyof T & string;
  label: string;
  unit: Unit;
  /** One short line under the field. */
  hint?: string;
  /** Longer explanation, behind a "?" so every field stays the same height. */
  more?: string;
  /** Only shown when this returns true. */
  when?: (v: T) => boolean;
}
export interface CalcGroup<T> {
  title: string;
  fields: CalcField<T>[];
}

const unitText = (u: Unit) => (u === '$/500' ? 'per $500' : u === 'mo' ? 'months' : u === '%/yr' ? '% a year' : u === '%/mo' ? '% a month' : u === 'yr' ? 'years' : u === 'x' ? '×' : '%');
/** A typed number, allowing thousands separators, a dollar sign and a percent sign ("$250,000", "7%"). */
export const parseCalcInput = (text: string) => Number(text.replace(/[,\s$]/g, '').replace(/%$/, ''));
/** How a value shows when you're not typing in it: dollar amounts with thousands separators. */
const shown = (n: number, unit: Unit) => (unit === '$' && Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(n));
export function calculatorInputError(text: string, unit: Unit): string | null {
  const n = parseCalcInput(text);
  // Commas only as thousands separators ("1,500" yes, "1,2,3" no), with an optional "$" in front and "%" after.
  const shape = /^\s*\$?\s*(?:\d{1,3}(?:,\d{3})+|\d*)(?:\.\d*)?\s*%?\s*$/;
  if (!text.trim() || !Number.isFinite(n) || !shape.test(text) || !/\d/.test(text)) return 'Enter a number. Results use the last valid value.';
  const max = unit === '%' ? 100 : 1e10;
  if (n < 0 || n > max) return `Enter a number from 0 to ${max.toLocaleString('en-US')}. Results use the last valid value.`;
  return null;
}

/** Text on its way to a valid number with thousands separators ("250," "250,0" while typing 250,000). */
export const midNumber = (text: string) => /^\s*\$?\s*\d{1,3}(?:,\d{3})*,\d{0,2}\s*$/.test(text);
/** The error to show for a box: none while its own text is still on its way to a valid number and it has focus. */
export function shownInputError(text: string, unit: Unit, id: string): string | null {
  if (midNumber(text) && typeof document !== 'undefined' && document.activeElement?.id === id) return null;
  return calculatorInputError(text, unit);
}

/** Groups of number inputs in the calculators' shared layout: title inside the box, label / input / one-line hint. */
export default function CalcFields<T extends object>({ groups, values, onChange }: { groups: CalcGroup<T>[]; values: T; onChange: (k: keyof T & string, v: number) => void }) {
  const uid = useId();
  const [draft, setDraft] = useState<Record<string, string | undefined>>({});
  // A number changed from outside this box (another box for the same number, an example, "Use the walk-away price")
  // replaces whatever unreadable text was left in it.
  const prev = useRef(values);
  useEffect(() => {
    const before = prev.current as Record<string, unknown>;
    const now = values as Record<string, unknown>;
    prev.current = values;
    const stale = Object.keys(draft).filter((k) => draft[k] !== undefined && before[k] !== now[k] && document.activeElement?.id !== `${uid}-${k}`);
    if (stale.length) setDraft((d) => { const n = { ...d }; for (const k of stale) n[k] = undefined; return n; });
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {groups.map((g) => {
        const fields = g.fields.filter((f) => !f.when || f.when(values));
        if (!fields.length) return null;
        return (
          <fieldset key={g.title} className="calc-group">
            <legend>{g.title}</legend>
            <div className="calc-grid">
              {fields.map((f) => (
                <div key={f.k} className="calc-field">
                  <label className="calc-label" htmlFor={`${uid}-${f.k}`}>{f.label}<span className="sr-only">{f.unit === '$' ? ', in dollars' : f.unit === 'x' ? ', times' : `, ${unitText(f.unit).replace('%', 'percent')}`}</span></label>
                  <span className="calc-input">
                    {f.unit === '$' && <i aria-hidden>$</i>}
                    <input
                      id={`${uid}-${f.k}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={draft[f.k] ?? shown((values as Record<string, number>)[f.k], f.unit)}
                      aria-invalid={draft[f.k] !== undefined && !!shownInputError(draft[f.k]!, f.unit, `${uid}-${f.k}`)}
                      aria-describedby={[f.hint ? `${uid}-${f.k}-hint` : '', draft[f.k] !== undefined && shownInputError(draft[f.k]!, f.unit, `${uid}-${f.k}`) ? `${uid}-${f.k}-error` : ''].filter(Boolean).join(' ') || undefined}
                      onInput={(e) => {
                        const text = e.currentTarget.value;
                        setDraft((d) => ({ ...d, [f.k]: text }));
                        if (!calculatorInputError(text, f.unit)) onChange(f.k, parseCalcInput(text));
                      }}
                      onBlur={() => {
                        if (draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit)) { setDraft((d) => ({ ...d })); return; } // shows the message now
                        setDraft((d) => ({ ...d, [f.k]: undefined }));
                      }}
                    />
                    {f.unit !== '$' && <i aria-hidden>{unitText(f.unit)}</i>}
                  </span>
                  <span className="calc-hint">
                    {draft[f.k] !== undefined && shownInputError(draft[f.k]!, f.unit, `${uid}-${f.k}`) && <small className="deal-urgent calc-error" role="status" id={`${uid}-${f.k}-error`}>{shownInputError(draft[f.k]!, f.unit, `${uid}-${f.k}`)}</small>}
                    {f.hint && <small className="muted" id={`${uid}-${f.k}-hint`}>{f.hint}</small>}
                    {f.more && (
                      <details className="calc-more">
                        <summary aria-label={`More about ${f.label}`}>?</summary>
                        <p className="small">{f.more}</p>
                      </details>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </fieldset>
        );
      })}
    </>
  );
}
