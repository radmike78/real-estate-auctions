import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { cloudFromStorage, excludedWork, validCloudWork, type CloudWork } from './cloudWork';
import { openWorkspace, onWorkspace, workStorage, workspaceOwner } from './workStorage';

export interface Learner { id: string; firstName: string; email: string; revision: number; updatedAt: string }
interface AccountState { status: 'off' | 'loading' | 'guest' | 'signed' | 'locked'; account: Learner | null; dirty: boolean; saving: boolean; message: string }
let state: AccountState = { status: 'off', account: null, dirty: false, saving: false, message: '' };
let sequence = 0;
let guestChosen = false;
// A device marker set once this browser has signed in: guests never wait on "Opening your workspace".
const HINT_KEY = 'deedowl.account.hint.v1';
const hint = {
  has: () => { try { return globalThis.localStorage?.getItem(HINT_KEY) === '1'; } catch { return false; } },
  set: () => { try { globalThis.localStorage?.setItem(HINT_KEY, '1'); } catch { /* private mode */ } },
  clear: () => { try { globalThis.localStorage?.removeItem(HINT_KEY); } catch { /* private mode */ } },
};
let workVersion = 0;
let muted = false;
const listeners = new Set<(s: AccountState) => void>();
const publish = (s: Partial<AccountState>) => { state = { ...state, ...s }; for (const fn of listeners) fn(state); };
onWorkspace(() => { if (!muted && workspaceOwner()) { workVersion++; publish({dirty:true}); } });
export function useAccount() {
  const [s, set] = useState(state);
  useEffect(() => { listeners.add(set); set(state); return () => { listeners.delete(set); }; }, []);
  return s;
}
export async function accountApi<T>(path: string, body?: unknown): Promise<T> {
  const c = new AbortController(); const timer = setTimeout(() => c.abort(), 15000);
  try { return await api<T>(`/api/account/${path}`, { ...(body === undefined ? {} : { body, auth:true }), signal:c.signal }); }
  finally { clearTimeout(timer); }
}
function workspace(id: string | null, data: CloudWork = {}) {
  muted = true; openWorkspace(id, data); muted = false; workVersion++;
}
function validAccount(a: Learner) { return a && /^[a-f0-9]{32}$/.test(a.id) && typeof a.firstName === 'string' && typeof a.email === 'string' && Number.isSafeInteger(a.revision); }
export async function refreshAccount(initial = false) {
  if (guestChosen && !initial) return;
  if (initial) guestChosen=false;
  const seq = ++sequence;
  if (initial) publish({status:'loading'});
  try {
    const { account } = await accountApi<{account:Learner}>('me');
    if (seq !== sequence) return;
    if (!validAccount(account)) throw new Error('Account response could not be checked.');
    hint.set();
    if (workspaceOwner() === account.id) { publish({status:'signed', account:{...account,revision:state.account?.revision ?? account.revision}}); return; }
    if (workspaceOwner()) { publish({status:'locked', message:'The account changed in another tab. Download any unsaved work before reloading.'}); return; }
    const saved = await accountApi<{owner:string;revision:number;updatedAt:string;data:CloudWork}>('work');
    if (seq !== sequence) return;
    if (saved.owner !== account.id || !validCloudWork(saved.data)) throw new Error('Saved work could not be checked.');
    workspace(account.id, saved.data);
    publish({status:'signed',account:{...account,revision:saved.revision,updatedAt:saved.updatedAt},dirty:false,message:''});
  } catch (e) {
    if (seq !== sequence) return;
    const expired = e instanceof ApiError && e.status===401;
    if (expired) hint.clear();
    if (!workspaceOwner()) { publish({status:'guest',account:null,message:expired ? '' : 'Account saving is unavailable. You can continue without an account.'}); return; }
    const unsaved = state.dirty || excludedWork(workStorage).length > 0;
    // Only unsaved work justifies locking every page: with nothing to lose, an expired sign-in just drops to guest.
    if (expired && !unsaved) { guestChosen=true; workspace(null); publish({status:'guest',account:null,dirty:false,saving:false,message:'Your sign-in expired; everything was already saved. Open your account to sign in again.'}); }
    else if (!unsaved) publish({message:'Account saving is unavailable right now. Your saved work is safe on the server.'});
    else publish({status:'locked',message:expired ? e.message : 'Account saving is paused. Download unsaved work before reloading or leaving.'});
  }
}
export function useAccountRuntime(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (!guestChosen && hint.has()) void refreshAccount(true);
    else if (state.status === 'off') publish({status:'guest'});
    const refresh = () => { if (document.visibilityState === 'visible') void refreshAccount(); };
    const interval = setInterval(refresh, 60000);
    window.addEventListener('focus',refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus',refresh); };
  }, [enabled]);
  const s=useAccount();
  useEffect(() => {
    // Excluded work (cash worksheet, contacts, evidence, packets) lives only in this visit: warn before it is lost.
    const protect = (e: BeforeUnloadEvent) => { if (workspaceOwner() && (s.dirty || excludedWork(workStorage).length)) { e.preventDefault(); e.returnValue=''; } };
    window.addEventListener('beforeunload',protect); return () => window.removeEventListener('beforeunload',protect);
  }, [s.dirty]);
  return s;
}
export async function saveAccountWork() {
  if (state.status !== 'signed' || !state.account || state.saving) return;
  // Tied to the workspace, not the refresh counter: a background session refresh must not strand this save.
  const owner=state.account.id; const version=workVersion;
  publish({saving:true,message:''});
  try {
    const data=cloudFromStorage(workStorage);
    if (!validCloudWork(data)) throw new Error('This workspace is too large or contains an unsupported property label. Download it and keep fewer deals in your account.');
    const r=await accountApi<{revision:number;updatedAt:string}>('work',{owner,revision:state.account.revision,data});
    if (workspaceOwner()!==owner || !state.account) return;
    publish({account:{...state.account,revision:r.revision,updatedAt:r.updatedAt},dirty:workVersion!==version,message:`Saved to your account. Not included: ${[...excludedWork(workStorage), 'notes and written answers'].join(', ')}.`});
  } catch (e) {
    if (workspaceOwner()!==owner) return;
    publish({message:(e as Error).message,...(e instanceof ApiError && [401,409].includes(e.status) ? {status:'locked' as const} : {})});
  } finally { publish({saving:false}); }
}
export async function signOutAccount(remove = false) {
  await accountApi(remove ? 'delete' : 'logout', remove ? {owner:state.account?.id,confirm:'DELETE'} : {});
  sequence++; guestChosen=true; workspace(null); hint.clear();
  publish({status:'guest',account:null,dirty:false,saving:false,message:remove ? 'Your account and its saved work were deleted.' : 'Signed out. Your guest work is still on this device.'});
}
export async function verifiedAccount(token: string) {
  await accountApi('verify',{token});
  await refreshAccount(true);
}
export function returnToGuest() {
  sequence++; workspace(null); publish({status:'guest',account:null,dirty:false,saving:false,message:''});
}

/** Keep the guest choice for this visit; only an explicit account open/sign-in resumes cloud access. */
export function continueAsGuest() { guestChosen=true; returnToGuest(); }
