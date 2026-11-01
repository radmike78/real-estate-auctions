// State and county costs the deal calculators need: transfer tax and what a redemption repays. From each state's
// statutes (see src/content/sources.ts); Nevada is the default, matching Clark County.
import type { StateCode } from './regions';
import { COUNTY_TAX_RATES, type CountyTaxRate, type StateTaxRates } from './countyTaxRates';

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
  if (state === 'AZ') return { per500: 0, hint: 'Arizona has no transfer tax; recording fees apply.', more: 'Arizona’s constitution bars new taxes on transferring real property. You’ll still pay the county recorder’s recording fee (about $30 a document), which includes Arizona’s $2 state transfer fee, which existed before the ban (A.R.S. 11-475 and 11-1132).' };
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
/** The county's published rate for a rental (% a year), or null when the county isn't one we have. */
export function countyTaxRate(state: StateCode, county?: string): CountyTaxRate | null {
  return (county && COUNTY_TAX_RATES[state]?.counties[county]) || null;
}

/** A yearly tax from a value and a rate in % (rounded to $50), one rule for the starting figure and the hint alike. */
export const taxAt = (value: number, pct: number) => Math.round(Math.round(value * pct) / 100 / 50) * 50; // inner round: float noise (2.15 × 350,000)

export function rentalStartFor(state: StateCode, value: number, county?: string): { propertyTaxYear: number; insuranceYear: number } {
  // The county's own published rate when we have it, else the state's rough rate.
  const c = countyTaxRate(state, county);
  return { propertyTaxYear: taxAt(value, c ? c.pct : RENTAL_TAX_RATE[state] * 100), insuranceYear: RENTAL_INSURANCE[state] };
}

const OF_SHORT: Record<StateTaxRates['of'], string> = { price: 'price', market: 'value', fcv: 'full cash value', taxable: 'taxable value' };
const pctWord = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;


/**
 * Where the starting property tax comes from: a short line (the county's published rate and year) and the detail
 * (what the rate is, its source and its range inside the county).
 */
export function countyTaxLine(state: StateCode, county?: string): { short: string; detail: string } | null {
  const c = countyTaxRate(state, county);
  if (!c || !county) return null;
  const s = COUNTY_TAX_RATES[state];
  // Carson City is a consolidated city, not a county by that name.
  const place = /\bCity$/.test(county) ? county : `${county} County`;
  const range = c.low !== null && c.high !== null ? ` Inside the county it runs about ${pctWord(c.low)} to ${pctWord(c.high)}, depending on the city, school district and special districts at the address.` : ' The rate at a given address can differ from the county’s average.';
  return {
    short: `${place}: about ${pctWord(c.pct)} of ${OF_SHORT[s.of]} a year (${s.year} rental rate${s.of === 'taxable' || s.of === 'fcv' ? '; on a price it errs high' : ''}).`,
    detail: `The starting figure here is this rate on the calculator’s example value; once you enter your price, the hint works out the rate on it for you to enter (at an auction, on the value instead wherever the county taxes its own value, not the price you pay). Use the county’s figure for your property when you have it. For a first estimate, multiply your ${s.of === 'price' ? 'price' : 'price or value'} by ${pctWord(c.pct)}. That rate is ${s.how}, from the ${s.source}.${range}`,
  };
}

/**
 * What changes when you live in the home instead of renting it out, by state (each state's own program, not a
 * general "homestead exemption"). Ends with an asterisk: whether a home qualifies is the county's decision.
 */
export function ownerOccupiedTaxNote(state: StateCode): string {
  switch (state) {
    case 'TX': return 'That’s a rental’s figure: a home you live in can get the homestead exemption, which lowers the value it’s taxed on; apply with the appraisal district.*';
    case 'NV': return 'In Nevada a home you live in pays the same rate as a rental, but its yearly tax increase is capped at 3% (a rental’s cap can be up to 8%); ask the county assessor.*';
    case 'CA': return 'That’s a rental’s figure: a home you live in can get the homeowners’ exemption, which takes a little off the assessed value; ask the county assessor.*';
    case 'AZ': return 'That’s a rental’s figure: a home you live in can get the homeowner rebate on part of the school tax (up to $600 a year); ask the county assessor.*';
    case 'UT': return 'A home you live in gets the same main-home exemption a long-term rental gets once you, the owner, file the assessor’s declaration that it’s a tenant’s main home; ask the county assessor.*';
  }
}

export function propertyTaxHint(state: StateCode, county?: string): { hint: string; more: string } {
  const h = propertyTaxRules(state);
  const line = countyTaxLine(state, county);
  // With a county rate, the hint is one short line; the state's rules move into the details.
  return line ? { hint: line.short, more: `${line.detail} ${h.hint} ${h.more}` } : h;
}

function propertyTaxRules(state: StateCode): { hint: string; more: string } {
  if (state === 'CA')
    return {
      hint: 'Use about 1% of your price plus local charges, not the seller’s bill.',
      more: 'In California, a reassessable change in ownership generally resets the taxable value to current fair market value (Proposition 13), often the purchase price. Some transfers qualify for exclusions. A long-time owner’s bill doesn’t predict yours; confirm the assessment with the county assessor. The county also sends a separate “supplemental” bill for the rest of the tax year. It goes to you, and your loan’s impound account usually doesn’t pay it.',
    };
  if (state === 'AZ')
    return {
      hint: 'Rentals lose the homeowner rebate (up to $600 a year).',
      more: 'In Arizona, owner-occupied homes get a rebate on part of the school tax, up to $600 a year (A.R.S. 15-972). A rental doesn’t, so expect a higher bill than an owner-occupant paid. You must also register a rental with the county assessor (A.R.S. 33-1902).',
    };
  if (state === 'TX')
    return {
      hint: 'A rental gets no homestead exemption, so expect a higher bill than the seller’s. Check the appraisal district’s numbers for the property.',
      more: 'In Texas, the appraisal district values the property and each local taxing unit (county, city, school district and special districts like MUDs) sets its own rate. A home you live in can get the homestead exemption, including $140,000 off the school district value (Tax Code 11.13). A rental or second home can’t, so its bill can be much higher than the seller’s. You can protest the value by May 15, or 30 days after the notice was delivered if that’s later (Tax Code 41.44).',
    };
  if (state === 'UT')
    return {
      hint: 'A second home or short-term rental pays about 80% more. A long-term rental gets the lower main-home rate only if you file the county assessor’s declaration that it’s a tenant’s main home.',
      more: 'In Utah, a home that is someone’s main home is taxed on 55% of its value. A long-term rental counts when it’s the tenant’s main home, if you file the county assessor’s declaration that it’s a tenant’s main home (Utah Code 59-2-103.5). A second home or short-term rental is taxed on its full value, so its bill is about 80% higher.',
    };
  return {
    hint: 'Rentals generally have a cap of up to 8%; qualifying rentals can receive the 3% cap.',
    more: 'In Nevada, the yearly increase in a tax bill is capped at 3% for an owner’s main home. For a rental it’s up to 8%, unless the rent is at or below HUD’s Fair Market Rent and you file a claim with the assessor (NRS 361.4722–361.4724). The applicable cap depends on eligibility, rent and the required claim. New construction and changes in use can fall outside the cap. Ask the assessor which cap applies and what next year’s bill will be.',
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
const US_FEDERAL: RedemptionPreset = { label: 'The sale wiped out a junior federal tax lien: the United States can redeem for 120 days (or the state’s period, if longer), +6% a year', months: 4, ratePct: 6, daily: 0, flat: 0, flat2Pct: 0 };
// 28 USC 2410(c), (d): a court sale that pays a lien ahead of a junior federal lien, in a case that named the United
// States, leaves it 1 year to redeem (for a federal tax lien, 120 days or the state's period if longer), paying the
// price plus 6% a year and certain expenses. If it wasn't named, its lien isn't wiped out.
const US_COURT: RedemptionPreset = { label: 'The United States was named in the case for a junior lien: it can redeem for up to 1 year (a federal tax lien: 120 days, or the state’s period if longer), +6% a year*', months: 12, ratePct: 6, daily: 0, flat: 0, flat2Pct: 0 };

/** Redemption rules after each kind of sale in a state, for the calculator's "Kind of sale" menu. */
export function redemptionPresetsFor(state: StateCode): Record<string, RedemptionPreset> {
  if (state === 'CA')
    return {
      none: NONE,
      caJudicialPaid: { label: 'Judicial foreclosure, debt paid: 3 months, +10% a year', months: 3, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      caJudicialShort: { label: 'Judicial foreclosure, debt not paid: 1 year, +10% a year', months: 12, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      // Civil Code 5715 and CCP 729.035: a nonjudicial HOA foreclosure can be redeemed for 90 days, at the price plus
      // taxes and assessments with interest at the judgment rate (CCP 729.060).
      hoa: { label: 'HOA foreclosure: 90 days, about +10% a year*', months: 3, ratePct: 10, daily: 0, flat: 0, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
      usCourt: US_COURT,
    };
  if (state === 'AZ')
    return {
      none: NONE,
      // A.R.S. 12-1285: the price plus 8%, a flat amount.
      azJudicialAbandoned: { label: 'Judicial foreclosure, judgment found it abandoned (not farm or grazing land): 30 days, +8% of the price', months: 1, ratePct: 8, daily: 0, flat: 1, flat2Pct: 0 },
      azJudicial: { label: 'Judicial foreclosure: 6 months, +8% of the price', months: 6, ratePct: 8, daily: 0, flat: 1, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
      usCourt: US_COURT,
    };
  if (state === 'TX')
    return {
      none: NONE,
      // Tax Code 34.21(a), (e): 25% (first year) or 50% (second year) of the price and costs; 180 days and at
      // most 25% for other property. Measured from the day the deed is filed for record.
      txTaxHomestead: { label: 'Tax sale, homestead, agricultural land or mineral interest: 2 years, +25% (first year) or +50% (second)', months: 24, ratePct: 25, daily: 0, flat: 1, flat2Pct: 50 },
      txTaxOther: { label: 'Tax sale, other property: 180 days, up to +25% of your price and costs', months: 6, ratePct: 25, daily: 0, flat: 1, flat2Pct: 0 },
      // Tax Code 32.06(k), (k-1): after a trustee sale foreclosing a transferred property tax lien, the owner or an earlier
      // mortgage's servicer can redeem by paying 125% of the price (first year) or 150% (second year), plus costs.
      txTaxLoanLong: { label: 'Property tax loan foreclosure, homestead, agricultural land or mineral interest: 2 years, +25% (first year) or +50% (second)', months: 24, ratePct: 25, daily: 0, flat: 1, flat2Pct: 50 },
      txTaxLoanOther: { label: 'Property tax loan foreclosure, other property: 180 days, +25% of the price', months: 6, ratePct: 25, daily: 0, flat: 1, flat2Pct: 0 },
      // Property Code 209.010-.011: 180 days after the HOA mails notice of the sale, which it must do within 30 days;
      // a buyer other than the HOA is repaid the price and costs, with no interest.
      txHoaSubdivision: { label: 'HOA sale, subdivision: about 7 months (180 days after the notice), no interest', months: 7, ratePct: 0, daily: 0, flat: 0, flat2Pct: 0 },
      // Property Code 82.113(g): 90 days after the sale; the bid plus 6% a year.
      txHoaCondo: { label: 'Condominium association sale: 90 days, +6% a year', months: 3, ratePct: 6, daily: 0, flat: 0, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
      usCourt: US_COURT,
    };
  if (state === 'UT')
    return {
      none: NONE,
      // Utah R. Civ. P. 69C(e): the sale price plus 6%, flat.
      utSheriff: { label: 'Sheriff’s sale: 180 days, +6% of the price', months: 6, ratePct: 6, daily: 0, flat: 1, flat2Pct: 0 },
      irs: IRS,
      usFederal: US_FEDERAL,
      usCourt: US_COURT,
    };
  return {
    none: NONE,
    hoa: { label: 'HOA foreclosure: 60 days, +1% a month', months: 2, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
    sheriff: { label: 'Sheriff’s sale: 1 year, +1% a month', months: 12, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
    irs: IRS,
    usFederal: US_FEDERAL,
    usCourt: US_COURT,
  };
}

/**
 * The redemption rules that fit a kind of sale in a state, the one to start with, and what the buyer must confirm in
 * the records when more than one could apply. Switching the kind of sale replaces a rule that doesn't fit.
 */
export function redemptionChoicesFor(state: StateCode, kind: string): { keys: string[]; start: string; confirm?: string } {
  const has = (k: string) => k in redemptionPresetsFor(state);
  if (kind === 'irs')
    return {
      keys: ['irs', 'none'],
      start: 'irs',
      confirm: 'An IRS administrative (seizure) sale has a 180-day redemption at 20% a year (26 U.S.C. 6337). A court-ordered sale follows its court order instead, which may allow no redemption*. Check the notice of sale.',
    };
  if (kind === 'taxSale' && state === 'TX')
    return {
      keys: ['txTaxHomestead', 'txTaxOther'],
      start: 'txTaxHomestead',
      confirm: 'We assumed the longer 2-year wait. Check the court judgment and the appraisal district record. If the property was the owner’s home, land designated for agricultural use, or a mineral interest when the suit was filed, the owner has 2 years; otherwise 180 days. Both count from the day your deed is recorded (Tax Code 34.21).',
    };
  if (kind === 'hoa' && state === 'TX')
    return {
      keys: ['txHoaSubdivision', 'txHoaCondo', 'usFederal'],
      start: 'txHoaSubdivision',
      confirm: 'Whether this is a subdivision HOA (Property Code 209: 180 days after the HOA mails notice of the sale) or a condominium association (82: 90 days after the sale) isn’t confirmed yet. The longer subdivision wait is assumed until you read the recorded declaration: a townhome can be either.',
    };
  if (kind === 'hoa') return { keys: has('hoa') ? ['hoa', 'usFederal'] : ['none', 'usFederal'], start: has('hoa') ? 'hoa' : 'none' };
  // A trustee sale has no owner redemption in these states, but if it wipes out a junior federal tax lien, the United States
  // can still redeem for 120 days (26 USC 7425(d)). A lien the sale doesn't wipe out simply stays on title (7425(b)).
  if (kind === 'trustee' && state === 'TX')
    return {
      keys: ['none', 'txTaxLoanLong', 'txTaxLoanOther', 'usFederal'],
      start: 'none',
      confirm: 'A mortgage foreclosure has no redemption, so none is assumed. The property tax loan choices apply only if the lien foreclosed is a transferred property tax lien (Tax Code 32.06).',
    };
  if (kind === 'trustee') return { keys: ['none', 'usFederal'], start: 'none' };
  // A tax sale has no owner redemption in Nevada, Utah, California or Arizona (Texas has its own, always longer than 120
  // days), but if it wipes out a junior federal tax lien the United States can redeem for 120 days, since a property tax
  // sale is a sale under a statutory lien (26 USC 7425(b), (d)(1)). Utah County waits 120 days to ratify those bids.
  if (kind === 'taxSale' && state !== 'TX') return { keys: ['none', 'usFederal'], start: 'none' };
  if (kind === 'court') {
    // Every court sale can also leave the United States its own redemption, if it was named in the case (28 USC 2410(c)).
    if (state === 'NV') return { keys: ['sheriff', 'usCourt'], start: 'sheriff' };
    if (state === 'UT') return { keys: ['utSheriff', 'usCourt'], start: 'utSheriff' };
    if (state === 'CA')
      return { keys: ['none', 'caJudicialPaid', 'caJudicialShort', 'usCourt'], start: 'caJudicialShort', confirm: 'Whether this California court sale has a redemption period isn’t confirmed yet. The longest one is assumed until the notice of sale or your attorney tells you which applies.' };
    if (state === 'AZ')
      return { keys: ['none', 'azJudicial', 'azJudicialAbandoned', 'usCourt'], start: 'azJudicial', confirm: 'Whether this Arizona court sale has a redemption period isn’t confirmed yet. The 6-month one is assumed until the notice of sale or your attorney tells you which applies.' };
    return { keys: ['none', 'usCourt'], start: 'none' };
  }
  return { keys: ['none'], start: 'none' };
}

/**
 * The redemption rules offered for a kind of sale (all of the state's when the kind isn't known). Some rules share the
 * same numbers (a Texas property tax loan foreclosure repays like a tax sale), so the rule in use must be matched among
 * these, never against a rule the menu doesn't offer.
 */
export function offeredRedemptionRules(state: StateCode, kind?: string): Record<string, RedemptionPreset> {
  const all = redemptionPresetsFor(state);
  if (!kind) return all;
  const keys = redemptionChoicesFor(state, kind).keys;
  return Object.fromEntries(Object.entries(all).filter(([k]) => keys.includes(k)));
}

/** After a tax sale, why resale can wait (for the "months to fix and sell" help). */
export function taxSaleWait(state: StateCode): string {
  if (state === 'NV') return 'After a tax sale, resale may wait for a quiet title action or the 2-year window after the Treasurer’s deed (NRS 361.600).';
  if (state === 'CA') return 'After a tax sale, anyone challenging it has a year to petition the board of supervisors, and another year to sue if it refuses (R&T 3725), so title insurance and resale may wait.';
  if (state === 'TX') return 'After a Texas tax sale, the owner can redeem for 180 days, or 2 years for a homestead, land designated for agricultural use or a mineral interest, counted from the day the deed is filed (Tax Code 34.21). Resale may wait until that ends and a title company will insure the title.';
  return 'After a forced sale, resale may wait until a title company will insure the title; ask one before you plan your timeline.';
}
