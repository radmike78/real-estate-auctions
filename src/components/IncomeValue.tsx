import { useId, useState } from 'react';
import { incomeValue, sanitizeIncome, type IncomeInputs } from '../lib/incomeValue';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';

const KEY = (id: string) => `fsf.income.${id}.v1`;
const FIELDS: { k: keyof IncomeInputs; label: string; unit: '$' | '%'; hint: string }[] = [
  { k: 'monthlyRent', label: 'Monthly rent, fully leased', unit: '$', hint: 'From the rent roll, or market rent per square foot × the building’s size.' },
  { k: 'otherMonthly', label: 'Other monthly income', unit: '$', hint: 'Parking, signs, laundry, expense reimbursements.' },
  { k: 'vacancyPct', label: 'Vacancy and bad debt', unit: '%', hint: 'Rent you expect to lose. Higher if it’s empty now.' },
  { k: 'expensePct', label: 'Operating costs', unit: '%', hint: 'Taxes, insurance, repairs, management, as a share of rent collected.' },
  { k: 'capRatePct', label: 'Cap rate', unit: '%', hint: 'Ask a local commercial broker for this property type. Higher means a lower value.' },
];

function load(id: string): IncomeInputs {
  try {
    return sanitizeIncome(JSON.parse(localStorage.getItem(KEY(id)) ?? 'null'));
  } catch {
    return sanitizeIncome(null);
  }
}

/** Value a commercial property by its income, and hand that value to the bid calculator. */
export default function IncomeValue({ propertyId, onUse }: { propertyId: string; onUse: (value: number) => void }) {
  const uid = useId();
  const [i, setI] = useState<IncomeInputs>(() => load(propertyId));
  const [draft, setDraft] = useState<Partial<Record<keyof IncomeInputs, string>>>({});
  const r = incomeValue(i);
  const set = (k: keyof IncomeInputs, text: string) => {
    trackAction('calculator_used', true);
    setDraft((d) => ({ ...d, [k]: text }));
    const n = Number(text);
    const next = { ...i, [k]: Number.isFinite(n) && n > 0 ? n : 0 };
    setI(next);
    try {
      localStorage.setItem(KEY(propertyId), JSON.stringify(next));
    } catch {
      /* storage unavailable: values last for this visit */
    }
  };
  return (
    <div className="income-calc" role="group" aria-labelledby={`${uid}-h`}>
      <h3 id={`${uid}-h`}>Value by income</h3>
      <p className="muted">Commercial property is valued by what it earns. Enter the rents, then use the result as the resale value below.</p>
      <div className="income-grid">
        <fieldset className="calc-group">
          <legend>Income and costs</legend>
          {FIELDS.map((f) => (
            <label key={f.k} className="calc-field" htmlFor={`${uid}-${f.k}`}>
              <span className="calc-label">{f.label}</span>
              <span className="calc-input">
                {f.unit === '$' && <i aria-hidden>$</i>}
                <input id={`${uid}-${f.k}`} type="number" inputMode="decimal" min={0} step="any" value={draft[f.k] ?? String(i[f.k])} onChange={(e) => set(f.k, e.target.value)} />
                {f.unit === '%' && <i aria-hidden>%</i>}
              </span>
              <span className="small muted">{f.hint}</span>
            </label>
          ))}
        </fieldset>
        <div className="income-result" aria-live="polite">
          <dl className="mini">
            <div><dt>Gross rent a year</dt><dd>{fmtMoney(r.grossAnnual)}</dd></div>
            <div><dt>Collected after vacancy</dt><dd>{fmtMoney(r.collected)}</dd></div>
            <div><dt>Operating costs</dt><dd>−{fmtMoney(r.expenses)}</dd></div>
            <div className="total"><dt>Net operating income</dt><dd>{fmtMoney(r.noi)}</dd></div>
          </dl>
          <div className="income-value">
            <span>Value at a {i.capRatePct || 0}% cap rate</span>
            <strong>{r.value ? fmtMoney(r.value) : '—'}</strong>
          </div>
          <button className="btn" disabled={!r.value} onClick={() => onUse(r.value)}>Use as resale value below</button>
          {!r.value && <p className="small muted">Enter the monthly rent and a cap rate to see a value.</p>}
        </div>
      </div>
    </div>
  );
}
