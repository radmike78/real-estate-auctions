import { createContext, useContext } from 'react';
import type { StateCode } from '../lib/regions';

/** The state and county a calculator is working in (Analyze a deal); null means Clark County, Nevada. */
export const CalcRegion = createContext<{ state: StateCode; county: string } | null>(null);
export const useCalcRegion = () => useContext(CalcRegion) ?? { state: 'NV' as StateCode, county: 'Clark' };
