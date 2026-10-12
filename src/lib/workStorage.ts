// Guest work remains on this device. Signed-in work lives in memory, loaded from the verified account.
// Never leave a previous account's work in localStorage or fall back to guest keys while signed in.
import { backedUp } from './workKeys';

let owner: string | null = null;
let memory = new Map<string, string>();
let generation = 0;
const listeners = new Set<() => void>();
const privateKey = (k: string) => backedUp(k) && k !== 'deedowl.area.v1' && k !== 'deedowl.state.v1';
export const workspaceOwner = () => owner;
export const workspaceGeneration = () => generation;
export const onWorkspace = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
function changed() { for (const fn of listeners) fn(); }
export function openWorkspace(id: string | null, values: Record<string, unknown> = {}) {
  owner = id;
  memory = new Map(Object.entries(values).filter(([k]) => privateKey(k)).map(([k, v]) => [k, ['fsf.bid.mode.v1','fsf.calc.strategy.v1'].includes(k) ? String(v) : JSON.stringify(v)]));
  generation++;
  changed();
}
export const workspaceValues = () => Object.fromEntries(memory);
const device = () => globalThis.localStorage;
export const workStorage: Storage = {
  get length() { return owner ? memory.size : device().length; },
  key(i) { return owner ? [...memory.keys()][i] ?? null : device().key(i); },
  getItem(k) { return owner && privateKey(k) ? memory.get(k) ?? null : device().getItem(k); },
  setItem(k, v) {
    if (owner && privateKey(k)) { if (memory.get(k) !== String(v)) { memory.set(k, String(v)); changed(); } }
    else device().setItem(k, v);
  },
  removeItem(k) { if (owner && privateKey(k)) { if (memory.delete(k)) changed(); } else device().removeItem(k); },
  clear() { if (owner) { memory.clear(); changed(); } else device().clear(); },
};
