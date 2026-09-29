// State and county costs the deal calculators need: transfer tax and what a redemption repays. From each state's
// statutes (see src/content/sources.ts); Nevada is the default, matching Clark County.
import type { StateCode } from './regions';

export interface TransferTax {
  per500: number;
  hint: string;
  more: string;
}

/** Real property transfer tax for a county, per $500 of value (rounded up to the next $500). */
export function transferTaxFor(state: StateCode, county: string): TransferTax {
  if (state === 'CA')
    return {
      per500: 0.55,
      hint: 'County tax: $0.55 per $500. Some cities add their own.',
      more: 'California counties charge $0.55 for each $500 of value (Revenue and Taxation Code 11911), not counting liens that stay with the property. Cities can add their own tax, and some charter cities such as Los Angeles, San Francisco and Oakland charge much more; ask your title company for the total.',
    };
  if (state === 'AZ') return { per500: 0, hint: 'Arizona has no transfer tax; a $2 recording fee applies.', more: 'Arizona’s constitution bars new taxes on transferring real property; the recorder charges a $2 fee with the affidavit of property value (A.R.S. 11-1132).' };
  if (state === 'UT') return { per500: 0, hint: 'Utah has no transfer tax; recording fees apply.', more: 'Utah doesn’t tax real property transfers. You’ll still pay the county recorder’s recording fees.' };
  const per500 = county === 'Clark' ? 2.55 : county === 'Washoe' || county === 'Churchill' ? 2.05 : 1.95;
  const name = county === 'Carson City' ? 'Carson City' : `${county} County`;
  return {
    per500,
    hint: `${name}: $${per500.toFixed(2)} per $500.`,
    more: `Nevada’s real property transfer tax is charged for each $500 of value or fraction of $500 (NRS 375.020 and 375.023): $2.55 in Clark County, $2.05 in Washoe and Churchill, and $1.95 elsewhere. Some transfers are exempt; ask the county recorder or your title company.`,
  };
}

export interface RedemptionPreset {
  label: string;
  months: number;
  /** Simple yearly rate that repays what the law allows at the end of the wait (flat percentages converted). */
  ratePct: number;
  daily: 0 | 1;
}

const NONE: RedemptionPreset = { label: 'No redemption', months: 0, ratePct: 0, daily: 0 };
const IRS: RedemptionPreset = { label: 'IRS seizure sale: 180 days, +20% a year', months: 6, ratePct: 20, daily: 1 };

/** Redemption rules after each kind of sale in a state, for the calculator's "Kind of sale" menu. */
export function redemptionPresetsFor(state: StateCode): Record<string, RedemptionPreset> {
  if (state === 'CA')
    return {
      none: NONE,
      caJudicialPaid: { label: 'Judicial foreclosure, debt paid: 3 months, +10% a year', months: 3, ratePct: 10, daily: 0 },
      caJudicialShort: { label: 'Judicial foreclosure, debt not paid: 1 year, +10% a year', months: 12, ratePct: 10, daily: 0 },
      irs: IRS,
    };
  if (state === 'AZ')
    return {
      none: NONE,
      // A.R.S. 12-1285: the price plus 8%, a flat amount; shown as the yearly rate that repays it at the end of the wait.
      azJudicialAbandoned: { label: 'Judicial foreclosure, abandoned: 30 days, +8% of the price', months: 1, ratePct: 96, daily: 0 },
      azJudicial: { label: 'Judicial foreclosure: 6 months, +8% of the price', months: 6, ratePct: 16, daily: 0 },
      irs: IRS,
    };
  if (state === 'UT')
    return {
      none: NONE,
      // Utah R. Civ. P. 69C(e): the sale price plus 6%, flat.
      utSheriff: { label: 'Sheriff’s sale: 180 days, +6% of the price', months: 6, ratePct: 12, daily: 0 },
      irs: IRS,
    };
  return {
    none: NONE,
    hoa: { label: 'HOA foreclosure: 60 days, +1% a month', months: 2, ratePct: 12, daily: 0 },
    sheriff: { label: 'Sheriff’s sale: 1 year, +1% a month', months: 12, ratePct: 12, daily: 0 },
    irs: IRS,
  };
}

/** After a tax sale, why resale can wait (for the "months to fix and sell" help). */
export function taxSaleWait(state: StateCode): string {
  if (state === 'NV') return 'After a tax sale, resale may wait for a quiet title action or the 2-year window after the Treasurer’s deed (NRS 361.600).';
  if (state === 'CA') return 'After a tax sale, the former owner has a year to ask the county to rescind the deed, so title insurance and resale may wait.';
  return 'After a forced sale, resale may wait until a title company will insure the title; ask one before you plan your timeline.';
}
