import type { AcquisitionStatus, SaleType } from '../types';
import type { Filters } from '../lib/search';
import { STATUS } from '../lib/status';
import { SALE_TYPE_LABEL } from '../lib/rules';
import { typesFor } from '../lib/propertyClass';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

// Nevada sells tax deeds, not lien certificates, so that type is hidden while only Clark County is loaded.
const SALE_TYPES = (Object.keys(SALE_TYPE_LABEL) as SaleType[]).filter((t) => t !== 'TAX_LIEN_CERTIFICATE');
const STATUSES = (Object.keys(STATUS) as AcquisitionStatus[]).filter((s) => s !== 'LIEN_CERTIFICATE_ONLY');

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const num = (v: string) => (v === '' ? null : Number(v));

export default function FiltersPanel({ filters: f, onChange, onReset }: Props) {
  return (
    <aside className="filters" aria-label="Filters">
      <div className="filters-head">
        <h2>Filters</h2>
        <button className="linkish" onClick={onReset}>Reset</button>
      </div>

      <label className="check strong">
        <input type="checkbox" checked={f.purchasableOnly} onChange={(e) => onChange({ purchasableOnly: e.target.checked })} />
        Only properties I can buy now
      </label>

      <fieldset>
        <legend>Bidding</legend>
        {(['any', 'online', 'in_person'] as const).map((b) => (
          <label key={b} className="check">
            <input type="radio" name="bidding" checked={f.bidding === b} onChange={() => onChange({ bidding: b })} />
            {b === 'any' ? 'Any' : b === 'online' ? 'Online bidding' : 'In person / sealed bid'}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Sale status</legend>
        {STATUSES.map((s) => (
          <label key={s} className="check">
            <input type="checkbox" checked={f.statuses.includes(s)} onChange={() => onChange({ statuses: toggle(f.statuses, s) })} />
            <span className={`dot tone-${STATUS[s].tone}`} aria-hidden />
            {STATUS[s].label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Sale / lien type</legend>
        {SALE_TYPES.map((t) => (
          <label key={t} className="check">
            <input type="checkbox" checked={f.saleTypes.includes(t)} onChange={() => onChange({ saleTypes: toggle(f.saleTypes, t) })} />
            {SALE_TYPE_LABEL[t]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Auction date</legend>
        <select
          value={f.auctionWithinDays ?? ''}
          onChange={(e) => onChange({ auctionWithinDays: num(e.target.value) })}
          aria-label="Auction date"
        >
          <option value="">Any time</option>
          <option value="7">Next 7 days</option>
          <option value="14">Next 14 days</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
        </select>
      </fieldset>

      <fieldset className="grid2">
        <legend>Money</legend>
        <label>
          Max minimum bid
          <input type="number" min={0} step={1000} placeholder="Any" value={f.maxMinimumBid ?? ''} onChange={(e) => onChange({ maxMinimumBid: num(e.target.value) })} />
        </label>
        <label>
          Min est. equity
          <input type="number" step={5000} placeholder="Any" value={f.minEquity ?? ''} onChange={(e) => onChange({ minEquity: num(e.target.value) })} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Property type</legend>
        {typesFor(f.propertyClass).map((t) => (
          <label key={t} className="check">
            <input type="checkbox" checked={f.propertyTypes.includes(t)} onChange={() => onChange({ propertyTypes: toggle(f.propertyTypes, t) })} />
            {t}
          </label>
        ))}
      </fieldset>

      <fieldset className="grid2">
        <legend>Occupancy &amp; redemption</legend>
        <label>
          Occupancy
          <select value={f.occupancy} onChange={(e) => onChange({ occupancy: e.target.value as Filters['occupancy'] })}>
            <option value="any">Any</option>
            <option>Vacant</option>
            <option>Owner-occupied</option>
            <option>Tenant-occupied</option>
            <option>Unknown</option>
          </select>
        </label>
        <label>
          Redemption period
          <select value={f.redemption} onChange={(e) => onChange({ redemption: e.target.value as Filters['redemption'] })}>
            <option value="any">Any</option>
            <option value="none">None after sale</option>
            <option value="has">Has redemption</option>
          </select>
        </label>
      </fieldset>
    </aside>
  );
}
