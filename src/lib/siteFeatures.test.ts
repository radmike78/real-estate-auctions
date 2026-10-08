import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetModules(); });
describe('service availability', () => {
  it('recovers after a failed request, instead of caching a permanent coming-soon state', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, json: async () => ({ email: true, payments: true }) });
    vi.stubGlobal('fetch', fetcher);
    const { loadSiteFeatures, advertisingOpen } = await import('./siteFeatures');
    const failed = await loadSiteFeatures();
    expect(failed.unavailable).toBe(true);
    expect(advertisingOpen(failed)).toBe(false);
    expect(advertisingOpen(await loadSiteFeatures())).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('shares requests and times out a server that never responds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('timeout'))))));
    const { loadSiteFeatures } = await import('./siteFeatures');
    const request = loadSiteFeatures();
    expect(loadSiteFeatures()).toBe(request);
    await vi.advanceTimersByTimeAsync(8000);
    expect((await request).unavailable).toBe(true);
  });
  it('distinguishes a valid unconfigured server from a malformed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ email: false, payments: false }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'bad gateway' }) }));
    const { loadSiteFeatures } = await import('./siteFeatures');
    expect(await loadSiteFeatures()).toEqual({ email: false, payments: false });
    expect((await loadSiteFeatures()).unavailable).toBe(true);
  });
});
