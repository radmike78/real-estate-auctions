import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
class Memory implements Storage {
  data=new Map<string,string>(); get length(){return this.data.size;} key(i:number){return [...this.data.keys()][i]??null;}
  getItem(k:string){return this.data.get(k)??null;} setItem(k:string,v:string){this.data.set(k,v);} removeItem(k:string){this.data.delete(k);} clear(){this.data.clear();}
}
const owner='a'.repeat(32), other='b'.repeat(32);
const learner={id:owner,firstName:'Taylor',email:'a@example.com',revision:0,updatedAt:'2026-10-12T18:00:00.000Z'};
let fetcher: ReturnType<typeof vi.fn>;
const response=(body:unknown,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
beforeEach(()=>{
  vi.resetModules(); vi.stubGlobal('localStorage',new Memory()); fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher);
});
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
async function setup() {
  const account=await import('./account'); const storage=await import('./workStorage');
  function Status(){return <span>{JSON.stringify(account.useAccount())}</span>;}
  const state=()=>JSON.parse(parse(renderToStaticMarkup(<Status/>)).text);
  fetcher.mockResolvedValueOnce(response({account:learner})).mockResolvedValueOnce(response({owner,revision:0,updatedAt:learner.updatedAt,data:{'deedowl.read.v1':['financing']}}));
  await account.refreshAccount(true);
  return {account,storage,state};
}
it('guards pending responses so a closed workspace cannot reopen from a late account response',async()=>{
  const a=await import('./account'); const s=await import('./workStorage');
  let answer!:(v:unknown)=>void;
  fetcher.mockReturnValueOnce(new Promise(resolve=>{answer=resolve;}));
  const pending=a.refreshAccount(true); a.returnToGuest();
  answer(response({account:learner})); await pending;
  expect(s.workspaceOwner()).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(1);
});
it('keeps unsaved work on expiry and renewed sign-in, without replacing it with older cloud data',async()=>{
  const {account,storage,state}=await setup();
  storage.workStorage.setItem('fsf.calc.rent.v1','{"monthlyRent":2700}');
  fetcher.mockResolvedValueOnce(response({error:'Expired'},401)); await account.refreshAccount();
  expect(state().status).toBe('locked'); expect(storage.workStorage.getItem('fsf.calc.rent.v1')).toContain('2700');
  fetcher.mockResolvedValueOnce(response({account:learner})); await account.refreshAccount(true);
  expect(state().status).toBe('signed'); expect(state().dirty).toBe(true); expect(storage.workStorage.getItem('fsf.calc.rent.v1')).toContain('2700');
});
it('refuses client-side account switching and locks rather than exposing a different owner workspace',async()=>{
  const {account,storage,state}=await setup();
  fetcher.mockResolvedValueOnce(response({account:{...learner,id:other,email:'b@example.com'}}));
  await account.refreshAccount();
  expect(state().status).toBe('locked'); expect(storage.workspaceOwner()).toBe(owner);
  expect(storage.workStorage.getItem('deedowl.read.v1')).toBe('["financing"]'); expect(fetcher).toHaveBeenCalledTimes(3);
});
it('sends owner/revision with a projected save, preserves concurrent edits and locks on a conflict',async()=>{
  const {account,storage,state}=await setup();
  storage.workStorage.setItem('deedowl.teamlist.v1','{"agent":{"name":"Do not sync"}}');
  storage.workStorage.setItem('fsf.calc.rent.v1','{"monthlyRent":2700}');
  let answer!:(v:unknown)=>void; fetcher.mockReturnValueOnce(new Promise(resolve=>{answer=resolve;}));
  const pending=account.saveAccountWork();
  const opts=fetcher.mock.calls[2][1]; const body=JSON.parse(opts.body);
  expect(body).toEqual({owner,revision:0,data:{'deedowl.read.v1':['financing'],'fsf.calc.rent.v1':{monthlyRent:2700}}});
  expect(opts.headers['x-fsf-request']).toBe('1'); expect(opts.credentials).toBe('same-origin');
  storage.workStorage.setItem('fsf.calc.rent.v1','{"monthlyRent":2800}'); answer(response({revision:1,updatedAt:learner.updatedAt})); await pending;
  expect(state().dirty).toBe(true); expect(state().account.revision).toBe(1);
  fetcher.mockResolvedValueOnce(response({error:'A newer save exists'},409)); await account.saveAccountWork();
  expect(state().status).toBe('locked'); expect(storage.workStorage.getItem('fsf.calc.rent.v1')).toContain('2800');
});
it('keeps work when logout fails, then clears account memory and restores the untouched guest workspace on success',async()=>{
  localStorage.setItem('deedowl.read.v1','["markets"]');
  const {account,storage,state}=await setup();
  fetcher.mockRejectedValueOnce(new Error('offline')); await expect(account.signOutAccount()).rejects.toThrow();
  expect(storage.workspaceOwner()).toBe(owner); expect(state().account.id).toBe(owner);
  fetcher.mockResolvedValueOnce(response({ok:true})); await account.signOutAccount();
  expect(storage.workspaceOwner()).toBeNull(); expect(state().account).toBeNull(); expect(storage.workStorage.getItem('deedowl.read.v1')).toBe('["markets"]');
});
it('keeps a deliberate guest choice until the learner explicitly opens an account again',async()=>{
  const {account,storage}=await setup();
  account.continueAsGuest(); const calls=fetcher.mock.calls.length;
  await account.refreshAccount(); expect(fetcher).toHaveBeenCalledTimes(calls); expect(storage.workspaceOwner()).toBeNull();
  fetcher.mockResolvedValueOnce(response({account:learner})).mockResolvedValueOnce(response({owner,revision:0,updatedAt:learner.updatedAt,data:{}}));
  await account.refreshAccount(true); expect(storage.workspaceOwner()).toBe(owner);
});
