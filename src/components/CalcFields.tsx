import { useId, useState } from 'react';

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
export function calculatorInputError(text: string, unit: Unit): string | null {
  const n = Number(text);
  if (!text.trim() || !Number.isFinite(n)) return 'Enter a number. Results use the last valid value.';
  const max = unit === '%' ? 100 : 1e10;
  if (n < 0 || n > max) return `Enter a number from 0 to ${max.toLocaleString('en-US')}. Results use the last valid value.`;
  return null;
}

/** Groups of number inputs in the calculators' shared layout: title inside the box, label / input / one-line hint. */
export default function CalcFields<T extends object>({ groups, values, onChange }: { groups: CalcGroup<T>[]; values: T; onChange: (k: keyof T & string, v: number) => void }) {
  const uid = useId();
  const [draft, setDraft] = useState<Record<string, string | undefined>>({});
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
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={f.unit === '%' ? 100 : 1e10}
                      step="any"
                      value={draft[f.k] ?? String((values as Record<string, number>)[f.k])}
                      aria-invalid={draft[f.k] !== undefined && !!calculatorInputError(draft[f.k]!, f.unit)}
                      aria-describedby={[f.hint ? `${uid}-${f.k}-hint` : '', draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit) ? `${uid}-${f.k}-error` : ''].filter(Boolean).join(' ') || undefined}
                      onInput={(e) => {
                        const text = e.currentTarget.value;
                        setDraft((d) => ({ ...d, [f.k]: text }));
                        if (!calculatorInputError(text, f.unit)) onChange(f.k, Number(text));
                      }}
                      onBlur={() => {
                        if (draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit)) return;
                        setDraft((d) => ({ ...d, [f.k]: undefined }));
                      }}
                    />
                    {f.unit !== '$' && <i aria-hidden>{unitText(f.unit)}</i>}
                  </span>
                  {draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit) && <small className="deal-urgent" role="status" id={`${uid}-${f.k}-error`}>{calculatorInputError(draft[f.k]!, f.unit)}</small>}
                  <span className="calc-hint">
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
