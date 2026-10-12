import { afterEach, expect, it, vi } from 'vitest';
const {effects}=vi.hoisted(()=>({effects:[] as (()=>void|(()=>void))[]}));
vi.mock('react',()=>({useEffect:(fn:()=>void|(()=>void))=>{effects.push(fn);},useState:(initial:unknown)=>[initial,()=>{}]}));
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();effects.length=0;});
it('keeps focus/session checks available after a guest opts into an account during the same visit',async()=>{
  vi.useFakeTimers();
  const handlers=new Map<string,()=>void>();
  vi.stubGlobal('window',{addEventListener:(k:string,fn:()=>void)=>handlers.set(k,fn),removeEventListener:(k:string)=>handlers.delete(k)});
  vi.stubGlobal('document',{visibilityState:'visible'});
  const fetcher=vi.fn().mockResolvedValue({ok:false,status:401,json:async()=>({error:'Expired'})}); vi.stubGlobal('fetch',fetcher);
  const a=await import('./account');
  a.continueAsGuest(); a.useAccountRuntime(true);
  const cleanups=effects.map(fn=>fn());
  expect(fetcher).not.toHaveBeenCalled(); expect(handlers.has('focus')).toBe(true);
  handlers.get('focus')!(); await vi.advanceTimersByTimeAsync(0); expect(fetcher).not.toHaveBeenCalled();
  await a.refreshAccount(true); expect(fetcher).toHaveBeenCalledTimes(1); // explicit account open ends guest-only choice
  handlers.get('focus')!(); await vi.advanceTimersByTimeAsync(0); expect(fetcher).toHaveBeenCalledTimes(2);
  for(const fn of cleanups) fn?.(); expect(handlers.has('focus')).toBe(false);
});
