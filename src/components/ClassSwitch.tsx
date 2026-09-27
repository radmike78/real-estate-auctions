import { CLASS_LABEL, type ClassFilter } from '../lib/propertyClass';

/** All | Residential | Commercial switch, used on the home page, property search, live tax sales and bank-owned pages. */
export default function ClassSwitch({ value, onChange, label = 'Property class' }: { value: ClassFilter; onChange: (c: ClassFilter) => void; label?: string }) {
  const opts: [ClassFilter, string][] = [['all', 'All'], ['residential', CLASS_LABEL.residential], ['commercial', CLASS_LABEL.commercial]];
  return (
    <div className="seg class-switch" role="group" aria-label={label}>
      {opts.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}
