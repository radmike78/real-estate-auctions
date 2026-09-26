import { useEffect, useState } from 'react';
import type { Property } from '../types';
import { isSaved, onDealsChange, toggleDeal } from '../lib/deals';
import { trackAction } from '../lib/track';

/** Adds or removes a property from My deals. */
export default function SaveDealButton({ p }: { p: Property }) {
  const [saved, setSaved] = useState(() => isSaved(p.id));
  useEffect(() => onDealsChange(() => setSaved(isSaved(p.id))), [p.id]);
  return (
    <button className={`hero-btn save-btn${saved ? ' on' : ''}`} onClick={() => {
      if (!saved) trackAction('deal_saved');
      toggleDeal(p.id, p.status, p.sale?.postponements ?? 0);
    }}>
      {saved ? '★ In My deals' : '☆ Save to My deals'}
    </button>
  );
}
