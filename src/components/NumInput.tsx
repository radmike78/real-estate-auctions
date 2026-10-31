import { useState, type InputHTMLAttributes } from 'react';
import { calculatorInputError, parseCalcInput } from './CalcFields';

/**
 * A number field that keeps exactly what you type ("3.", "1,2") while you type, and passes on a number only once the
 * text is a valid one, so a decimal point or a comma never disappears mid-typing. Shows commas when you leave it.
 * `blank`: show an empty field for 0 (or for no value).
 */
export default function NumInput({ value, onValue, blank = false, max, percent = false, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'max'> & {
  value: number | undefined;
  onValue: (n: number | undefined) => void;
  blank?: boolean;
  max?: number;
  percent?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined || (blank && !value) ? '' : value.toLocaleString('en-US', { maximumFractionDigits: 4 }));
  const bad = draft !== null && draft.trim() !== '' && !!calculatorInputError(draft, percent ? '%' : '$');
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={bad || undefined}
      value={shown}
      onChange={(e) => {
        const t = e.target.value;
        setDraft(t);
        if (t.trim() === '') return onValue(blank ? undefined : 0);
        if (calculatorInputError(t, percent ? '%' : '$')) return;
        const n = Math.max(0, parseCalcInput(t));
        onValue(max !== undefined ? Math.min(n, max) : n);
      }}
      onBlur={() => { if (!bad) setDraft(null); }}
    />
  );
}
