// "My deals": properties a buyer is working on, kept in this browser (a synced, alerting version
// can come with the paid plan). Stores what the status was when saved, so changes stand out.

import type { AcquisitionStatus } from '../types';

export interface SavedDeal {
  id: string;
  savedAt: string;
  statusAtSave: AcquisitionStatus;
  postponementsAtSave: number;
  notes: string;
}

const KEY = 'fsf.deals.v1';
const listeners = new Set<() => void>();

export function loadDeals(): SavedDeal[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((d) => d && typeof d.id === 'string') : [];
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

export function updateDeal(id: string, patch: Partial<Omit<SavedDeal, 'id'>>) {
  save(loadDeals().map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

/** Re-render when the saved list changes (e.g. the header count). */
export function onDealsChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
