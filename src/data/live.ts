// The verified live listings, loaded once and shared by every page (Live tax sales, search, property
// pages, My deals). The browser verifies the signed feed before anything is shown, re-checks it every
// 5 minutes, and drops it the moment it expires, so a stalled update can never leave old parcels up.

import { useSyncExternalStore } from 'react';
import { FEED_PUBLIC_KEY_SPKI_B64 } from '../feed/publicKey';
import { loadVerifiedFeed, type VerifyResult } from '../feed/verify';
import { listingToProperty } from '../feed/toProperty';
import type { Property } from '../types';
import { PROPERTIES } from './index';

const REVERIFY_MS = 5 * 60_000;

interface LiveState {
  result: VerifyResult | null; // null until the first check finishes
  properties: Property[]; // verified, unexpired listings as property records
  checkedAt: number;
}

let state: LiveState = { result: null, properties: [], checkedAt: 0 };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function set(next: LiveState) {
  state = next;
  for (const l of listeners) l();
}

async function load() {
  const result = await loadVerifiedFeed(FEED_PUBLIC_KEY_SPKI_B64).catch((e: Error): VerifyResult => ({ ok: false, reason: 'MISSING', detail: e.message }));
  const agency = result.ok ? (result.feed.sources[0]?.agency ?? 'Clark County Treasurer') : '';
  set({ result, properties: result.ok ? result.feed.listings.map((l) => listingToProperty(l, agency)) : [], checkedAt: Date.now() });
}

/** Drops listings once the feed expires, without waiting for the next check. */
function expireIfNeeded() {
  if (state.result?.ok && Date.parse(state.result.feed.expiresAt) <= Date.now() && state.properties.length) set({ ...state, properties: [] });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!timer) {
    void load();
    timer = setInterval(() => {
      expireIfNeeded();
      void load();
    }, REVERIFY_MS);
  }
  return () => {
    listeners.delete(fn);
  };
}

/** The raw verification result (for the Live page's source status) and the live properties. */
export function useLiveFeed(): LiveState {
  return useSyncExternalStore(subscribe, () => state);
}

/** Everything searchable: sample records (development builds only) plus verified live listings. */
let combined: { live: Property[]; all: Property[] } = { live: [], all: PROPERTIES };
export function useProperties(): { properties: Property[]; loading: boolean } {
  const live = useLiveFeed();
  // Same array until the live list changes, so pages don't redo work on every render.
  if (combined.live !== live.properties) combined = { live: live.properties, all: live.properties.length ? [...PROPERTIES, ...live.properties] : PROPERTIES };
  return { properties: combined.all, loading: live.result === null };
}
