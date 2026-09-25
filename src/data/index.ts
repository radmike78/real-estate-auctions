// The one place pages get property and advertiser data from.
//
// SHOW_SAMPLE_DATA is a build-time switch. Development builds show the fictional Clark County sample
// data so every page can be tried out. Production builds (the container image) set
// VITE_SHOW_SAMPLE_DATA=0: then no fictional property or professional appears anywhere, and pages show
// honest "not connected yet" messages instead. Because the value is fixed at build time, the sample data
// is left out of a production bundle entirely.

import type { Pro } from '../lib/pros';
import type { Property } from '../types';
import { SAMPLE_PROPERTIES } from './sampleProperties';
import { SAMPLE_PROS } from './samplePros';

// Written as plain comparisons so the build replaces it with a constant and drops the unused sample data.
export const SHOW_SAMPLE_DATA = import.meta.env.VITE_SHOW_SAMPLE_DATA !== '0' && import.meta.env.VITE_SHOW_SAMPLE_DATA !== 'false';

/** Properties to search and show. Real connectors will add to this; today it's sample data or nothing. */
export const PROPERTIES: Property[] = SHOW_SAMPLE_DATA ? SAMPLE_PROPERTIES : [];

/** Fictional professionals shown only when no signed directory has been published yet. */
export const FALLBACK_PROS: Pro[] = SHOW_SAMPLE_DATA ? SAMPLE_PROS : [];
