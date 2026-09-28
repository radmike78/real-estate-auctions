import { useState } from 'react';
import type { ClassFilter } from '../lib/propertyClass';
import { searchLabel, searchTarget, type SavedSearch } from '../lib/savedSearch';
import { AlertDialog } from './TrackButton';
import { useSiteFeatures } from '../lib/siteFeatures';

const INTRO = 'Once a day, we’ll email you new parcels on the Treasurer’s tax-sale list that match. No email on days with nothing new.';

/** "Email me new matches": save a search of the verified tax-sale list for a daily digest. */
export default function SearchAlertButton({ cls }: { cls: ClassFilter }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<SavedSearch>({ source: 'tax', cls, maxBid: null });
  const [max, setMax] = useState('');
  const features = useSiteFeatures();
  const openIt = () => {
    setS({ source: 'tax', cls, maxBid: null });
    setMax('');
    setOpen(true);
  };
  const setMaxBid = (v: string) => {
    // Whole dollars, with or without "$", commas or cents; anything else (like a minus sign) isn't taken.
    const clean = v.replace(/[$,\s]/g, '');
    if (!/^\d{0,9}(\.\d{0,2})?$/.test(clean)) return;
    setMax(v);
    const n = Math.floor(Number(clean));
    setS((x) => ({ ...x, maxBid: clean && n > 0 ? n : null }));
  };
  if (!features?.email) return null; // email alerts aren't set up on this server yet
  return (
    <>
      <button className="btn btn-secondary" onClick={openIt}>✉ Email me new matches</button>
      {open && (
        <AlertDialog
          title="Email me new matches"
          intro={INTRO}
          target={searchTarget(s)}
          label={searchLabel(s)}
          onClose={() => setOpen(false)}
          extra={
            <div className="search-alert-fields">
              <label className="field">
                <span>Type</span>
                <select value={s.cls} onChange={(e) => setS({ ...s, cls: e.target.value as ClassFilter })}>
                  <option value="all">All parcels</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </label>
              <label className="field">
                <span>Highest minimum bid (optional)</span>
                <input inputMode="decimal" placeholder="Any" value={max} onChange={(e) => setMaxBid(e.target.value)} />
              </label>
            </div>
          }
        />
      )}
    </>
  );
}
