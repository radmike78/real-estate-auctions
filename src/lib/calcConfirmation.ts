import { workStorage as localStorage } from './workStorage';
// A deliberate zero and a deliberate match to an example remain confirmed across devices.
export const confirmationKey = (key: string) => `${key}.typed.v1`;

export function readConfirmed(key: string, storage: Storage = localStorage): ReadonlySet<string> {
  try {
    const v: unknown = JSON.parse(storage.getItem(confirmationKey(key)) ?? storage.getItem(key.replace(/\.v1$/, '.typed.v1')) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(x)) : []);
  } catch { return new Set(); }
}

export function saveConfirmed(key: string, fields: ReadonlySet<string>, storage: Storage = localStorage) {
  try { storage.setItem(confirmationKey(key), JSON.stringify([...fields])); storage.removeItem(key.replace(/\.v1$/, '.typed.v1')); } catch { /* storage unavailable */ }
}
