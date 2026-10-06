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
  if (state === 'AZ') return { per500: 0, hint: 'Arizona has no transfer tax; recording fees apply.', more: 'Arizona’s constitution bars new taxes on transferring real property. You’ll still pay the county recorder’s recording fee (about $30 a document), which includes a $2 fee for the affidavit of property value (A.R.S. 11-475 and 11-1132).' };
  if (state === 'TX') return { per500: 0, hint: 'Texas has no transfer tax; recording fees apply.', more: 'Texas doesn’t tax real property transfers, and its constitution bars new transfer taxes (article VIII, section 29). You’ll still pay the county clerk’s recording fees and the title insurance premium, which the state sets (Texas Department of Insurance).' };
  if (state === 'UT') return { per500: 0, hint: 'Utah has no transfer tax; recording fees apply.', more: 'Utah doesn’t tax real property transfers. You’ll still pay the county recorder’s recording fees.' };
  const per500 = !county || county === 'Clark' ? 2.55 : county === 'Washoe' || county === 'Churchill' ? 2.05 : 1.95;
  const name = county === 'Carson City' ? 'Carson City' : `${county} County`;
  return {
    per500,
    // No county picked: Clark County's rate, the highest in Nevada, so the estimate errs on the safe side.
    hint: county ? `${name}: $${per500.toFixed(2)} per $500.` : 'No county picked: using Clark County’s $2.55 per $500, Nevada’s highest. Pick the county for its rate.',
    more: `Nevada’s real property transfer tax is charged for each $500 of value or fraction of $500 (NRS 375.020 and 375.023): $2.55 in Clark County, $1.95 in most other counties, and $2.05 in Washoe and Churchill, which add a local tax (confirm with the county recorder). Some transfers are exempt; ask the county recorder or your title company.`,
  };
}

/** What a buyer's property tax will be, which is often not the seller's bill. */
/**
 * Starting property tax and insurance for a rental in each state, before the user enters a quote: rough effective
 * rates for a rental (no owner-occupant exemption) applied to the calculator's example value. They only replace the
 * flat example numbers; anything the user types is kept.
 */
const RENTAL_TAX_RATE: Record<StateCode, number> = { NV: 0.006, CA: 0.0115, AZ: 0.0065, UT: 0.0055, TX: 0.02 };
const RENTAL_INSURANCE: Record<StateCode, number> = { NV: 1_300, CA: 1_600, AZ: 1_500, UT: 1_100, TX: 2_700 };
export function rentalStartFor(state: StateCode, value: number): { propertyTaxYear: number; insuranceYear: number } {
  return { propertyTaxYear: Math.round((value * RENTAL_TAX_RATE[state]) / 50) * 50, insuranceYear: RENTAL_INSURANCE[state] };
}

export function propertyTaxHint(state: StateCode): { hint: string; more: string } {
  if (state === 'CA')
    return {
      hint: 'Use about 1% of your price plus local charges, not the seller’s bill.',
      more: 'In California, buying resets the taxable value to what you paid (Proposition 13), so a long-time owner’s bill doesn’t predict yours. The county also sends a separate “supplemental” bill for the rest of the tax year. It goes to you, and your loan’s impound account usually doesn’t pay it.',
    };
  if (state === 'AZ')
    return {
      hint: 'Rentals lose the homeowner rebate (up to $600 a year).',
      more: 'In Arizona, owner-occupied homes get a rebate on part of the school tax, up to $600 a year (A.R.S. 15-972). A rental doesn’t, so expect a higher bill than an owner-occupant paid. You must also register a rental with the county assessor (A.R.S. 33-1902).',
    };
  if (state === 'TX')
    return {
      hint: 'A rental gets no homestead exemption, so expect a higher bill. The example uses about 2% of value: replace it with the appraisal district’s numbers.',
      more: 'In Texas, the appraisal district values the property and each local taxing unit (county, city, school district and special districts like MUDs) sets its own rate. A home you live in can get the homestead exemption, including $140,000 off the school district value (Tax Code 11.13). A rental or second home can’t, so its bill can be much higher than the seller’s. You can protest the value by May 15, or 30 days after the notice was mailed if that’s later (Tax Code 41.44).',
    };
  if (state === 'UT')
    return {
      hint: 'A second home or short-term rental pays about 80% more.',
      more: 'In Utah, a home that is someone’s main home is taxed on 55% of its value. A long-term rental counts when it’s the tenant’s main home. A second home or short-term rental is taxed on its full value, so its bill is about 80% higher.',
    };
  return {
    hint: 'A rental’s bill can rise up to 8% a year, not 3%.',
    more: 'In Nevada, the yearly increase in a tax bill is capped at 3% for an owner’s main home. For a rental it’s up to 8%, unless the rent is at or below HUD’s Fair Market Rent and you file a claim with the assessor (NRS 361.4722–361.4724). A home you buy to rent usually moves to the higher cap. Ask the assessor what next year’s bill will be.',
  };
}

export interface RedemptionPreset {
  label: string;
  months: number;
  /** Yearly interest, or with flat: 1 the flat % of the price the law adds. */
  ratePct: number;
  daily: 0 | 1;
  /** 1 when the law adds a flat % of the price, whenever in the wait the owner redeems. */
  flat: 0 | 1;
  /** The flat % for a redemption after 12 months, when it steps up (Texas homestead tax sales); else 0. */
  flat2Pct: number;
}

const NONE: RedemptionPreset = { label: 'No redemption', months: 0, ratePct: 0, daily: 0, flat: 0, flat2Pct: 0 };
const IRS: RedemptionPreset = { label: 'IRS seizure sale: 180 days, +20% a year', months: 6, ratePct: 20, daily: 1, flat: 0, flat2Pct: 0 };
// 26 USC 7425(d): a nonjudicial sale (trustee or HOA) that wipes out a junior federal tax lien leaves the United States
// 120 days to redeem, paying the price plus 6% a year and certain expenses.
const US_FEDERAL: RedemptionPreset = { label: 'Federal tax lien was on title: the United States can redeem for 120 days, +6% a year', months: 4, ratePct: 6, daily: 0, flat: 0, flat2Pct: 0 };

/** Redemption rules after each kind of sale in a state, for the calculator's "Kind of sale" menu. */
export function redemptionPresetsFor(state: StateCode): Record<string, RedemptionPreset> {
  if (state === 'CA')
    return {
      none: NONE,
      caJudicialPaid: { label: 'Judicial foreclosure, debt paid: 3 months, +10% a year', months: 3, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      caJudicialShort: { label: 'Judicial foreclosure, debt not paid: 1 year, +10% a year', months: 12, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      // Civil Code 5715 and CCP 729.035: a nonjudicial HOA foreclosure can be redeemed for 90 days, at the price plus
      // taxes and assessments with interest at the judgment rate (CCP 729.060).
      hoa: { label: 'HOA foreclosure: 90 days, +10% a year', months: 3, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
    };
  if (state === 'AZ')
    return {
      none: NONE,
      // A.R.S. 12-1285: the price plus 8%, a flat amount.
      azJudicialAbandoned: { label: 'Judicial foreclosure, abandoned: 30 days, +8% of the price', months: 1, ratePct: 8, daily: 0, flat: 1, flat2Pct: 0 },
      azJudicial: { label: 'Judicial foreclosure: 6 months, +8% of the price', months: 6, ratePct: 8, daily: 0, flat: 1, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
    };
  if (state === 'TX')
    return {
      none: NONE,
      // Tax Code 34.21(a), (e): a flat 25% (first year) or 50% (second year) of the price and costs; 180 days and at
      // most 25% for other property. Measured from the day the deed is filed for record.
      txTaxHomestead: { label: 'Tax sale, homestead, agricultural land or mineral interest: 2 years, +25% (first year) or +50% (second)', months: 24, ratePct: 25, daily: 0, flat: 1, flat2Pct: 50 },
      txTaxOther: { label: 'Tax sale, other property: 180 days, up to +25% of the price', months: 6, ratePct: 25, daily: 0, flat: 1, flat2Pct: 0 },
      // Property Code 209.010-.011: 180 days after the HOA mails notice of the sale, which it must do within 30 days;
      // a buyer other than the HOA is repaid the price and costs, with no interest.
      txHoaSubdivision: { label: 'HOA sale, subdivision: about 7 months (180 days after the notice), no interest', months: 7, ratePct: 0, daily: 0, flat: 0, flat2Pct: 0 },
      // Property Code 82.113(g): 90 days after the sale; the bid plus 6% a year.
      txHoaCondo: { label: 'Condominium association sale: 90 days, +6% a year', months: 3, ratePct: 6, daily: 0, flat: 0, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
    };
  if (state === 'UT')
    return {
      none: NONE,
      // Utah R. Civ. P. 69C(e): the sale price plus 6%, flat.
      utSheriff: { label: 'Sheriff’s sale: 180 days, +6% of the price', months: 6, ratePct: 6, daily: 0, flat: 1, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
    };
  return {
    none: NONE,
    hoa: { label: 'HOA foreclosure: 60 days, +1% a month', months: 2, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
    sheriff: { label: 'Sheriff’s sale: 1 year, +1% a month', months: 12, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
    irs: IRS,
    usFederal: US_FEDERAL,
  };
}

/**
 * The redemption rules that fit a kind of sale in a state, the one to start with, and what the buyer must confirm in
 * the records when more than one could apply. Switching the kind of sale replaces a rule that doesn't fit.
 */
export function redemptionChoicesFor(state: StateCode, kind: string): { keys: string[]; start: string; confirm?: string } {
  const has = (k: string) => k in redemptionPresetsFor(state);
  if (kind === 'irs') return { keys: ['irs'], start: 'irs' };
  if (kind === 'taxSale' && state === 'TX')
    return {
      keys: ['txTaxHomestead', 'txTaxOther'],
      start: 'txTaxHomestead',
      confirm: 'Which Texas redemption rule applies isn’t confirmed yet. Check the court judgment and the appraisal district record: was it the owner’s homestead, land designated for agricultural use, or a mineral interest when the suit was filed? If so, the owner has 2 years; if none of them, 180 days, either way counted from the day your deed is filed (Tax Code 34.21). The calculator starts on the longer rule.',
    };
  if (kind === 'hoa' && state === 'TX')
    return {
      keys: ['txHoaSubdivision', 'txHoaCondo', 'usFederal'],
      start: 'txHoaSubdivision',
      confirm: 'Whether this is a subdivision HOA (Property Code 209: 180 days after the HOA mails notice of the sale) or a condominium association (82: 90 days after the sale) isn’t confirmed yet. The longer subdivision wait is assumed until you read the recorded declaration: a townhome can be either.',
    };
  if (kind === 'hoa') return { keys: has('hoa') ? ['hoa', 'usFederal'] : ['none', 'usFederal'], start: has('hoa') ? 'hoa' : 'none' };
  // A trustee sale has no owner redemption in these states, but a junior federal tax lien gives the United States 120 days.
  if (kind === 'trustee') return { keys: ['none', 'usFederal'], start: 'none' };
  if (kind === 'court') {
    if (state === 'NV') return { keys: ['sheriff'], start: 'sheriff' };
    if (state === 'UT') return { keys: ['utSheriff'], start: 'utSheriff' };
    if (state === 'CA')
      return { keys: ['none', 'caJudicialPaid', 'caJudicialShort'], start: 'caJudicialShort', confirm: 'Whether this California court sale has a redemption period isn’t confirmed yet. The longest one is assumed until the notice of sale or your attorney tells you which applies.' };
    if (state === 'AZ')
      return { keys: ['none', 'azJudicial', 'azJudicialAbandoned'], start: 'azJudicial', confirm: 'Whether this Arizona court sale has a redemption period isn’t confirmed yet. The 6-month one is assumed until the notice of sale or your attorney tells you which applies.' };
    return { keys: ['none'], start: 'none' };
  }
  return { keys: ['none'], start: 'none' };
}

/** After a tax sale, why resale can wait (for the "months to fix and sell" help). */
export function taxSaleWait(state: StateCode): string {
  if (state === 'NV') return 'After a tax sale, resale may wait for a quiet title action or the 2-year window after the Treasurer’s deed (NRS 361.600).';
  if (state === 'CA') return 'After a tax sale, the former owner has a year to ask the county to rescind the deed, so title insurance and resale may wait.';
  if (state === 'TX') return 'After a Texas tax sale, the owner can redeem for 180 days, or 2 years for a homestead, land designated for agricultural use or a mineral interest, counted from the day the deed is filed (Tax Code 34.21). Resale may wait until that ends and a title company will insure the title.';
  return 'After a forced sale, resale may wait until a title company will insure the title; ask one before you plan your timeline.';
}
