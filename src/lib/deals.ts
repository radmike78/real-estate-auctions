// "My deals": properties a buyer is working on, kept in this browser (a synced, alerting version
// can come with the paid plan). Stores what the status was when saved, so changes stand out.

import type { AcquisitionStatus } from '../types';
import { STATUS } from './status';

export interface SavedDeal {
  id: string;
  savedAt: string;
  statusAtSave: AcquisitionStatus | null; // null when the stored value was unreadable
  postponementsAtSave: number;
  notes: string;
}

const KEY = 'fsf.deals.v1';
const listeners = new Set<() => void>();

export function loadDeals(): SavedDeal[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(v)) return [];
    // Browser storage can be old or hand-edited: keep only well-formed entries and fill safe defaults.
    return v
      .filter((d) => d && typeof d.id === 'string' && d.id.length <= 64)
      .map((d) => ({
        id: d.id,
        savedAt: typeof d.savedAt === 'string' && !Number.isNaN(Date.parse(d.savedAt)) ? d.savedAt : new Date().toISOString(),
        statusAtSave: typeof d.statusAtSave === 'string' && Object.prototype.hasOwnProperty.call(STATUS, d.statusAtSave) ? d.statusAtSave : null,
        postponementsAtSave: Number.isFinite(d.postponementsAtSave) ? d.postponementsAtSave : 0,
        notes: typeof d.notes === 'string' ? d.notes.slice(0, 2000) : '',
      }));
  } catch {
    return [];
  }
}

function save(list: SavedDeal[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the list lasts for this visit */
  }
  listeners.forEach((f) => f());
}

export const isSaved = (id: string) => loadDeals().some((d) => d.id === id);

export function toggleDeal(id: string, status: AcquisitionStatus, postponements: number) {
  const list = loadDeals();
  save(list.some((d) => d.id === id) ? list.filter((d) => d.id !== id) : [...list, { id, savedAt: new Date().toISOString(), statusAtSave: status, postponementsAtSave: postponements, notes: '' }]);
}

export function removeDeal(id: string) {
  save(loadDeals().filter((d) => d.id !== id));
}

export function updateDeal(id: string, patch: Partial<Omit<SavedDeal, 'id'>>) {
  save(loadDeals().map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

/** Re-render when the saved list changes (e.g. the header count). */
export function onDealsChange(f: () => void): () => void {
  listeners.add(f);
  // Also pick up changes made in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) f();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener('storage', onStorage);
  };
}
