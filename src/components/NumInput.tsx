import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { calculatorInputError, parseCalcInput } from './CalcFields';

/**
 * A number field that keeps exactly what you type ("3.", "1,2") while you type, and passes on a number only once the
 * text is a valid one, so a decimal point or a comma never disappears mid-typing. Shows commas when you leave it.
 * Text that can't be read stays, with a message under the field saying the last valid number is in use (as in the
 * calculators); a change from outside replaces it.
 * `blank`: show an empty field for 0 (or for no value). `onValidity`: told when the text turns unreadable or readable.
 */
export default function NumInput({ value, onValue, blank = false, max, percent = false, onValidity, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'max'> & {
  value: number | undefined;
  onValue: (n: number | undefined) => void;
  blank?: boolean;
  max?: number;
  percent?: boolean;
  onValidity?: (ok: boolean) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const sent = useRef(value);
  const focused = useRef(false);
  const errId = useId();
  // A change from outside (an example, a reset, another field) replaces whatever is half-typed here.
  useEffect(() => {
    if (value !== sent.current && !focused.current) setDraft(null);
    sent.current = value;
  }, [value]);
  const shown = draft ?? (value === undefined || (blank && !value) ? '' : value.toLocaleString('en-US', { maximumFractionDigits: 4 }));
  const error = draft !== null && draft.trim() !== '' ? calculatorInputError(draft, percent ? '%' : '$') : null;
  useEffect(() => { onValidity?.(!error); }, [!error]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = (n: number | undefined) => { sent.current = n; onValue(n); };
  return (
    <>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={[rest['aria-describedby'], error ? errId : ''].filter(Boolean).join(' ') || undefined}
        value={shown}
        onFocus={(e) => { focused.current = true; rest.onFocus?.(e); }}
        onChange={(e) => {
          const t = e.target.value;
          setDraft(t);
          if (t.trim() === '') return send(blank ? undefined : 0);
          if (calculatorInputError(t, percent ? '%' : '$')) return;
          const n = Math.max(0, parseCalcInput(t));
          send(max !== undefined ? Math.min(n, max) : n);
        }}
        onBlur={(e) => { focused.current = false; if (!error) setDraft(null); rest.onBlur?.(e); }}
      />
      {error && <small className="deal-urgent num-error" role="status" id={errId}>{error}</small>}
    </>
  );
}
