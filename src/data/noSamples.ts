// Stand-in for sampleProperties.ts and samplePros.ts in production builds (VITE_SHOW_SAMPLE_DATA=0):
// vite.config.ts swaps it in so no fictional data is shipped at all. See src/data/index.ts.
import type { Pro } from '../lib/pros';
import type { Property } from '../types';

export const SAMPLE_PROPERTIES: Property[] = [];
export const SAMPLE_PROS: Pro[] = [];
