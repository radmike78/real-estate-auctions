import { cashShortAfter, noPriceAfter, owedWords, type SettledContext, noRedemptionWords, shortestRedemptionMonths, shortestRedemptionWords, shorterThanLaw, waitWords } from '../lib/dealPacket';
import { loadDeals, type Deal } from '../lib/analyze';
import { beforeDeed, savedStageOf } from '../lib/dealStage';
import { getMyArea } from '../lib/myArea';
import { calculatorInputError, parseCalcInput, shownInputError } from './CalcFields';
import { workStorage as localStorage } from '../lib/workStorage';
import { readConfirmed, saveConfirmed } from '../lib/calcConfirmation';
import { useEffect, useId, useReducer, useRef, useState } from 'react';
import { BLANK_INPUTS, START_INPUTS, maxBidSteps, clampInput, costsAtBid, GRID_REPAIR_STEPS, GRID_VALUE_STEPS, maxSafeBid, profitAtBid, redemptionOutcome, requiredProfit, ruleOf, sanitizeInputs, stressGrid, totalMonths, type BidInputs, offerInputs, cashNeededAtBid, DRAW_NOTE, unenteredCosts } from '../lib/bidCalc';
import { offeredRedemptionRules, redemptionChoicesFor, redemptionPresetsFor, taxSaleWait, transferTaxFor } from '../lib/stateCosts';
import { useCalcRegion } from './calcRegion';
import { fmtMoney } from '../lib/status';
import { investorProfile } from '../lib/myPlan';
import { trackAction } from '../lib/track';
import { ExampleInputs, ExampleResults, PriceHead, exampleLabels } from './CalcLabels';

/** Read from the listing or set by the county or the sale's rules: never listed as one of our examples. */
const nz = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
const NOT_EXAMPLES = new Set<string>(['minimumBid', 'transferTaxPer500', 'cashAvailable', 'redemptionMonths', 'redemptionRatePct', 'targetProfitMin']);

const KEY = (id: string) => `fsf.bid.${id}.v1`;
// The redemption rule picked from the menu, kept with the typed fields as "rulePick_<kind of sale>_<rule>" (so it
// travels, syncs and is deleted with the deal's numbers), and only for the state and kind of sale it was picked for.
// The state is part of it too: the same kind of sale has other rules in another state.
/** A typed redemption wait cleared on this load, for the notice (see waitCleared). */
let pendingWaitClear: { store: string; months: number } | null = null;
const rulePick = (state: string, kind: string | undefined, rule: string) => `rulePick_${state}_${kind ?? 'any'}_${rule}`;
// The fields you've typed in, and the region whose transfer tax the saved numbers carry: kept beside the numbers, so
// saving, clearing and forgetting a deal (analyze.ts) moves or removes them together.
const TYPED_KEY = (id: string) => `${KEY(id)}.typed.v1`;
const REGION_KEY = (id: string) => `${KEY(id)}.region`;

type Field = {
  k: keyof BidInputs;
  label: string;
  unit: '$' | '%' | 'mo' | '$/500' | '%/yr';
  /** One short line under the field. */
  hint?: string;
  /** Longer explanation, behind a "?" so every field stays the same height. */
  more?: string;
  /** Shown in Quick mode too. */
  quick?: boolean;
  /** Only shown when this returns true (e.g. loan terms once something is financed). */
  when?: (i: BidInputs) => boolean;
  /** The profit you want: switch between a % of the resale value and a dollar amount. */
  profitSwitch?: boolean;
};
// In the order a buyer meets them: buying it, fixing it, holding it, then selling it and the profit you want.
// The walk-away price still works back from the resale value, so every group counts.
const GROUPS: { title: string; fields: Field[]; redemption?: boolean }[] = [
  {
    title: 'The deal',
    fields: [
      { k: 'minimumBid', label: 'Opening (minimum) bid', unit: '$', hint: 'From the auction listing.', quick: true, more: 'The lowest bid the auction will accept, stated in the listing or notice of sale. Your maximum is worked out from the resale value and every cost; the results show how much room that leaves above the opening bid.' },
      { k: 'exitValue', label: 'Resale value after repairs', unit: '$', hint: 'Use recent sales of similar properties, not asking prices.', quick: true, more: 'This is your estimate. Value depends on the neighborhood, recent comparable sales, condition and the market, and a licensed or certified appraiser can provide a professional opinion of value. An appraisal is not a guaranteed sale price. Your real estate agent can also estimate value from recent comparable sales. Don’t add the cost of upgrades to the value: appraisers count what buyers in that market pay for a feature, which is often less than it cost.' },
      { k: 'targetProfitPct', label: 'Profit you want', unit: '%', hint: 'Of the resale value. Your choice: big enough to absorb surprises.', quick: true, profitSwitch: true },
      { k: 'targetProfitMin', label: 'And at least', unit: '$', hint: 'A dollar minimum. Leave 0 for none.', when: (i) => !i.profitInDollars },
      { k: 'cashAvailable', label: 'Cash you can bring', unit: '$', hint: 'All the cash you can put in. Leave 0 for no limit.', quick: true, more: 'Most auctions want full payment in certified funds the same day or the next business day (the official notice gives the exact deadline), and repairs and holding costs come out of your pocket too. Your walk-away price never needs more cash than this, counting the bid, any buyer’s premium, repairs and every cost until you sell.' },
    ],
  },
  {
    title: 'Buying it',
    fields: [
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.', more: 'Real property transfer tax is $2.55 for each $500 of value or fraction of $500 in Clark County. Some transfers are exempt; ask the Recorder or your title company.' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'Confirm with a title search.', quick: true },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$', hint: 'Quiet title: a court case that confirms you own it free of old claims; some title companies require one before they insure.' },
      { k: 'possession', label: 'Getting possession', unit: '$', hint: 'Eviction attorney, relocation, locks.' },
    ],
  },
  {
    title: 'Fixing it up',
    fields: [
      { k: 'repairs', label: 'Repairs', unit: '$', hint: 'Often no inside look before an auction.', quick: true },
      { k: 'contingencyPct', label: 'Extra room in the repair budget', unit: '%', hint: 'A cushion for surprises.' },
    ],
  },
  {
    title: 'Holding and financing',
    redemption: true,
    fields: [
      { k: 'redemptionMonths', label: 'Redemption wait', unit: 'mo', hint: 'Secure and maintain it; remodeling before it ends puts that money at risk if someone redeems.', more: 'After some sales the former owner (and sometimes lenders) can buy the property back by repaying your price plus what the law adds. What’s repaid depends on the rule. Some repay reasonable upkeep and repairs (Nevada’s HOA rule does; its sheriff-sale rule doesn’t). Optional remodeling usually isn’t repaid,* so most buyers only secure, insure and maintain the property while they wait. Ask an attorney what you may do and what is repaid. This is the legal wait; your own plan can be longer. A shorter number here is only a what-if: whoever holds the right can still redeem until the legal deadline.' },
      { k: 'redemptionRatePct', label: 'Interest a redemption pays you', unit: '%/yr', hint: 'Set by the kind of sale.', when: (i) => i.redemptionMonths > 0 },
      { k: 'holdingMonths', label: 'Months to fix and sell', unit: 'mo', hint: 'After any redemption wait.', more: 'After a tax sale, resale may wait for a quiet title action. In Nevada, that’s the 2-year window after the Treasurer’s deed (NRS 361.600); other states’ waits are in their sale guides.' },
      { k: 'monthlyCarry', label: 'Monthly holding costs', unit: '$', hint: 'Taxes, insurance, utilities and any HOA dues, each month you own it. A listed property’s estimate leaves out HOA dues: add them.' },
      { k: 'financedPct', label: 'Share financed after purchase', unit: '%', hint: 'Most auctions want full payment the same day or the next business day (the official notice gives the exact deadline), so any loan comes afterward.' },
      { k: 'interestRatePct', label: 'Interest rate (yearly)', unit: '%', when: (i) => i.financedPct > 0 },
      { k: 'pointsPct', label: 'Upfront lender fee (points)', unit: '%', hint: 'Each point is 1% of the loan amount.', when: (i) => i.financedPct > 0 },
    ],
  },
  {
    title: 'Selling it',
    fields: [{ k: 'sellingCostPct', label: 'Cost to sell', unit: '%', hint: 'Agent commission plus closing costs.' }],
  },
];

// A listed or bank-owned home: you make an offer instead of bidding. Auction-only fields (buyer's premium, cash on
// auction day, redemption) drop out and the words change; the math is the same.
/** A field's unit by key, for checking a typed value outside the field list. */
/** After an auction win: the sale's own figures are a record, not a plan. */
const WON_FIELDS: Partial<Record<string, Partial<Field>>> = { minimumBid: { label: 'Opening (minimum) bid at the sale', hint: 'For your records: the bid the sale opened at.' } };
const fieldUnit = (k: string) => GROUPS.flatMap((g) => g.fields).find((f) => f.k === k)?.unit;

const OFFER_FIELDS: Partial<Record<keyof BidInputs, Partial<Field>>> = {
  minimumBid: { label: 'Asking price', hint: 'From the listing.', more: 'What the seller is asking. Your maximum offer is worked out from the resale value and every cost; the results show how it compares with the asking price.' },
  survivingLiens: { label: 'Liens you’d have to pay', hint: 'Usually paid off at closing. Check the title report.' },
  titleLegal: { label: 'Title insurance, escrow and attorney', hint: undefined },
  possession: { hint: 'Only if a tenant or the owner stays after closing.' },
  repairs: { hint: 'Get a contractor’s bid after your inspection.' },
  financedPct: { label: 'Share of the price and repairs financed', hint: 'The part of the price and repairs your loan covers. Rehab loans often pay repairs in draws after the work, so you front that cash first.' },
  holdingMonths: { hint: 'From closing until the resale closes.', more: 'Repairs, time on the market and the buyer’s escrow. Count every month you pay the loan, taxes, insurance and utilities.' },
};
const OFFER_HIDDEN = new Set<keyof BidInputs>(['buyerPremiumPct', 'cashAvailable', 'redemptionMonths', 'redemptionRatePct']);

const MODE_KEY = 'fsf.bid.mode.v1';
const loadMode = (): 'quick' | 'detailed' => {
  try {
    return localStorage.getItem(MODE_KEY) === 'quick' ? 'quick' : 'detailed';
  } catch {
    return 'detailed';
  }
};

/** The fields an offer forces to zero (see offerInputs); kept from storage when an offer is edited. */
const auctionOnly = (v: BidInputs) => ({ cashAvailable: v.cashAvailable, buyerPremiumPct: v.buyerPremiumPct, redemptionMonths: v.redemptionMonths, redemptionRatePct: v.redemptionRatePct, redemptionDaily: v.redemptionDaily, redemptionFlat: v.redemptionFlat, redemptionFlat2Pct: v.redemptionFlat2Pct, loanAtClosing: v.loanAtClosing });

function load(id: string | undefined, defaults: BidInputs): BidInputs {
  if (!id) return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    const out = sanitizeInputs(saved, defaults);
    // Saved before the redemption wait had its own field: its months already include the wait.
    if (saved && typeof saved === 'object' && !('redemptionMonths' in saved)) return { ...out, redemptionMonths: 0, redemptionRatePct: 0, redemptionDaily: 0 };
    // Saved before flat premiums had their own setting: the old yearly rates that stood in for them.
    if (saved && typeof saved === 'object' && !('redemptionFlat' in saved)) {
      const m = out.redemptionMonths, rate = out.redemptionRatePct;
      const old: [number, number, number, number][] = [[1, 96, 8, 0], [6, 16, 8, 0], [6, 12, 6, 0], [24, 25, 25, 50], [6, 50, 25, 0]];
      const hit = out.redemptionDaily ? undefined : old.find(([om, or]) => om === m && or === rate);
      if (hit) return { ...out, redemptionRatePct: hit[2], redemptionFlat: 1, redemptionFlat2Pct: hit[3] };
    }
    return out;
  } catch {
    return defaults;
  }
}

/** Sets the calculator's resale value for a property (used by the commercial income calculator). */
export function setSavedExitValue(id: string, defaults: BidInputs, exitValue: number) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify({ ...load(id, defaults), exitValue }));
  } catch {
    /* storage unavailable: the value just isn't carried over */
  }
}

/** Saved max bid for a property (used by My deals), if the buyer has run the calculator. */
export function savedMaxBid(id: string): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY(id)) ?? 'null');
    if (!saved || typeof saved !== 'object') return null;
    const i = sanitizeInputs(saved, BLANK_INPUTS);
    // Without a resale value the calculator asks for one: there's no walk-away price yet.
    return i.exitValue > 0 ? maxSafeBid(i).maxBid : null;
  } catch {
    return null;
  }
}

const pct = (profit: number, exit: number) => (exit > 0 ? ` (${Math.round((profit / exit) * 100)}% of resale value)` : '');
// Typed text becomes a number: empty or invalid counts as 0, negatives are not allowed.
const toNum = (v: string) => {
  const n = parseCalcInput(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const yr = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}% a year`);
const unitText = (u: Field['unit']) => (u === '$/500' ? 'per $500' : u === 'mo' ? 'months' : u === '%/yr' ? '% a year' : '%');

export default function BidCalculator({ propertyId, saveAs, defaults = START_INPUTS, openingBid, headingLevel = 3, commercial = false, offer = false, saleKind }: { propertyId?: string; /** Keep the numbers under this id (a deal saved in Analyze) when there's no listing. */ saveAs?: string; defaults?: BidInputs; openingBid?: number | null; headingLevel?: 2 | 3; commercial?: boolean; offer?: boolean; /** The kind of sale chosen in Analyze: picks the redemption rules that fit it. */ saleKind?: string }) {
  const storeId = propertyId ?? saveAs;
  // (A saved auction deal you've already won: its price is the winning bid, not a planned one.)
  const boughtOffer = offer && !!saveAs && saveAs.startsWith('analyzed-') && ['closed', 'owned'].includes(savedStageOf(saveAs.slice('analyzed-'.length)) ?? '');
  const agreed = offer && !!saveAs && saveAs.startsWith('analyzed-') && savedStageOf(saveAs.slice('analyzed-'.length)) === 'contract';
  const wonBid = !offer && !!saveAs && saveAs.startsWith('analyzed-') && ['contract', 'closed', 'owned'].includes(savedStageOf(saveAs.slice('analyzed-'.length)) ?? '');
  // Words for an auction bid, or an offer on a listed home.
  // (Once the price is fixed, agreed, won or paid, the figures are about prices, not a bid or offer to make.)
  const fixedPrice = agreed || wonBid || boughtOffer;
  const ownDeal = saveAs?.startsWith('analyzed-') ? loadDeals().find((x) => `analyzed-${x.id}` === saveAs) : undefined;
  const phase: 'agreed' | 'owed' | 'paid' | null = agreed ? 'agreed' : boughtOffer ? 'paid' : wonBid ? (savedStageOf(saveAs!.slice('analyzed-'.length)) === 'contract' ? 'owed' : 'paid') : null;
  const w = fixedPrice
    ? { bid: 'price', Bid: 'Price', opening: offer ? 'asking price' : 'opening bid', Opening: offer ? 'Asking price' : 'Opening bid', max: wonBid || boughtOffer ? 'The most this plan could have paid' : 'The most this plan could pay', day: offer ? 'at closing' : 'on auction day' }
    : offer
    ? { bid: 'offer', Bid: 'Offer', opening: 'asking price', Opening: 'Asking price', max: 'Your maximum offer', day: 'at closing' }
    : { bid: 'bid', Bid: 'Bid', opening: 'opening bid', Opening: 'Opening bid', max: 'Your maximum bid', day: 'on auction day' };
  const region = useCalcRegion();
  // What a winner who doesn't pay faces, and whether the deed is still ahead, for the after-price advice.
  const sctx: SettledContext = { kind: saleKind, state: region.state ?? undefined, noDeed: !!ownDeal && wonBid && !!beforeDeed(ownDeal) };
  // Your area's city, when it's in this deal's county (a city rate, such as the City of Riverside's).
  const myArea = getMyArea();
  const tax = transferTaxFor(region.state, region.county, myArea && myArea.state === region.state && myArea.county === region.county ? myArea.city : null);
  const rules = redemptionPresetsFor(region.state);
  const choices = saleKind ? redemptionChoicesFor(region.state, saleKind) : null;
  // Only the rules offered for this kind of sale. Some rules share the same numbers (a Texas property tax loan
  // foreclosure repays like a tax sale), so the rule in use is matched among these, never a rule the menu doesn't offer.
  const offered = offeredRedemptionRules(region.state, saleKind);
  const hintFor = (f: Field) => (f.k === 'redemptionMonths' && choices?.start === 'none' && saleKind && (pickOf() === 'custom' || pickOf() === 'none') ? (pickOf() === 'custom' && i.redemptionMonths > 0 ? 'A what-if on this kind of sale (the note under the result says what it means).' : 'A what-if on this kind of sale: it only adds holding costs.') : commercial && f.k === 'exitValue' ? 'Use the value by income above.' : f.k === 'holdingMonths' && !offer && saleKind === 'taxSale' && region.state === 'NV' ? 'Title companies may not insure for 2 years after the Treasurer’s deed (the window to sue, NRS 361.600). A quiet title action, or (Douglas County’s FAQ says) the former owner claiming the excess proceeds, can shorten that: ask a title company before you count the time.' : f.k === 'transferTaxPer500' ? (offer && tax.per500 > 0 ? `${tax.hint} Your contract says who pays: enter 0 if the seller pays it.` : tax.hint) : f.hint);
  const moreFor = (f: Field) => (f.k === 'transferTaxPer500' ? tax.more : f.k === 'holdingMonths' ? (offer ? undefined : !saleKind || saleKind === 'taxSale' ? taxSaleWait(region.state) : 'How long repairs and the resale take. If this sale has no redemption period, count from the day you get the deed; ask a title company early when it will insure the title for your buyer.') : f.more);
  // What a Texas redemption repays, for the kind of sale chosen (every Texas rule when the kind isn't known).
  const txRepaid = (): string => {
    const taxSale = 'A Texas tax sale repays only repairs a code, an ordinance or an existing lease requires (Tax Code 34.21(g)(2)(A)(ii)).';
    const loan = 'A Texas mortgage foreclosure has no redemption; a Texas property tax loan foreclosure repays the same costs a tax sale does, plus interest on them at the legal judgment rate (Tax Code 32.06(k)(2), 34.21(g)).';
    const hoa = 'A Texas subdivision HOA sale repays no repairs (Property Code 209.011(e)(2)); a Texas condominium sale repays reasonable maintenance and leasing costs (Property Code 82.113(g)).';
    // Tax Code 32.06(k)(2): after a property tax loan foreclosure, the costs are repaid with interest at the judgment rate.
    if (taxLoanRule) return 'A Texas property tax loan foreclosure repays the same costs a tax sale does, plus interest on them at the legal judgment rate (Tax Code 32.06(k)(2), 34.21(g)).';
    if (saleKind === 'taxSale') return taxSale;
    if (saleKind === 'trustee') return loan;
    if (saleKind === 'hoa') return hoa;
    return `${taxSale} ${hoa}`;
  };
  // The rule in use, read when the field renders (ruleNow is worked out further down).
  const pickOf = () => ruleNow;
  const moreForField = (f: Field) =>
    // A sale that usually has no redemption (a trustee's mortgage foreclosure): the help says a wait is your what-if.
    f.k === 'redemptionMonths' && f.more && choices?.start === 'none' && (ruleNow === 'custom' || ruleNow === 'none') && saleKind ? `${noRedemptionWords({ state: region.state, kind: saleKind as Deal['kind'] })} A wait here is your own what-if: it only adds holding costs. The exceptions are the rules in the menu (for example a junior federal tax lien wiped out by the sale, which gives the United States 120 days). Ask an attorney which applies.`
      : f.k === 'redemptionMonths' && f.more && region.state === 'TX' && pickOf() !== 'usFederal' && pickOf() !== 'usCourt' ? f.more.replace('Optional remodeling', `${txRepaid()} Optional remodeling`) : moreFor(f);
  const uid = useId();
  function save(next: BidInputs) {
    if (!storeId) return;
    try {
      // An offer shows no cash limit, buyer's premium or redemption wait, but the deal's auction numbers are kept:
      // switching the kind of sale back to an auction must not find them wiped.
      const out = offer ? { ...next, ...auctionOnly(load(storeId, next)) } : next;
      localStorage.setItem(KEY(storeId), JSON.stringify(out));
    } catch {
      /* storage unavailable */
    }
  }
  // The pinned walk-away bar (phones) steps aside once the full results are on screen, so it never covers them.
  const [resultsVisible, setResultsVisible] = useState(false);
  // It also waits until the calculator itself is on screen, so it never covers the fields above it.
  const [calcInView, setCalcInView] = useState(false);
  useEffect(() => {
    const el = document.getElementById(`${uid}-results`);
    const calc = document.getElementById(`${uid}-calc`);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const ioCalc = calc ? new IntersectionObserver(([e]) => setCalcInView(e.isIntersecting), { threshold: 0 }) : null;
    if (calc) ioCalc?.observe(calc);
    return () => { io.disconnect(); ioCalc?.disconnect(); };
  }, [uid]);
  // Fields you've typed in are yours, even when the number matches our starting estimate or is $0. Kept with a saved
  // deal, so a $0 you entered on purpose isn't flagged again on your next visit.
  const [typedKeys, setTypedKeys] = useState<ReadonlySet<string>>(() => storeId ? readConfirmed(KEY(storeId)) : new Set());
  // The region (state and county) whose transfer tax the saved numbers carry. When the deal moves to another state,
  // the rate follows it unless you typed your own.
  const regionSig = String(tax.per500);
  const regionOf = (): string | null => {
    try {
      return storeId ? localStorage.getItem(REGION_KEY(storeId)) : null;
    } catch {
      return null;
    }
  };
  const stampRegion = () => {
    try {
      if (storeId) localStorage.setItem(REGION_KEY(storeId), regionSig);
    } catch {
      /* storage unavailable */
    }
  };
  const dropTypedWait = useRef(false);
  const [waitCleared, setWaitCleared] = useState<number | null>(null);
  // The listing's opening bid is the starting point (older saved inputs didn't have it).
  const [i, setI] = useState<BidInputs>(() => {
    let v0 = load(storeId, propertyId ? defaults : { ...defaults, transferTaxPer500: tax.per500 });
    const stamped = regionOf();
    // The region's transfer tax replaces the old one (unless you typed it), and is saved with the stamp: otherwise a
    // later save of other numbers, or the next load, would carry the old region's rate under the new stamp.
    let taxMoved = false;
    if (stamped !== regionSig) {
      if (stamped !== null && !typedKeys.has('transferTaxPer500')) { v0 = { ...v0, transferTaxPer500: tax.per500 }; taxMoved = true; }
      stampRegion();
    }
    // An offer has no auction cash limit, buyer's premium or redemption wait.
    let v = offer ? offerInputs(v0) : v0;
    // A redemption rule left over from another kind of sale (IRS interest on an HOA sale, say) is replaced with the
    // one that fits, and has to be confirmed again.
    if (!offer && choices) {
      const cur = ruleOf(v, offered);
      // Your own typed wait counts only for the kind of sale you typed it for (marked rulePick_<kind>_custom).
      const typedWait = typedKeys.has(rulePick(region.state, saleKind, 'custom'));
      // A fresh deal (no rule typed or confirmed yet) starts with the rule you last picked for this kind of sale, else
      // the rule the caution names, not "No redemption", even where "No redemption" is one of the choices (a court sale).
      // The rule you last picked for this kind of sale, if any (it comes back when the deal returns to that kind).
      const pickedHere = choices.keys.find((k) => typedKeys.has(rulePick(region.state, saleKind, k)));
      const fresh = cur === 'none' && !v.redemptionChecked && !typedWait && (pickedHere ? pickedHere !== 'none' : choices.start !== 'none');
      // Your own typed numbers stay yours (the caution calls them a what-if until you confirm the rule).
      const own = cur === 'custom' && typedWait;
      if ((!choices.keys.includes(cur) && !own) || fresh) {
        const r0 = rules[pickedHere ?? choices.start];
        // Only numbers you typed (a redemption field or a "custom" pick in the typed list): a rule's own numbers that
        // don't match this kind of sale's rules aren't yours to be told about.
        const youTyped = typedKeys.has('redemptionMonths') || typedKeys.has('redemptionRatePct') || [...typedKeys].some((x) => /^rulePick_.*_custom$/.test(x));
        if (cur === 'custom' && youTyped) {
          // Kept outside the component too: a first-paint remount runs this again on the already-reset numbers, and
          // the notice and the "typed" cleanup below would be lost with the first instance.
          pendingWaitClear = { store: storeId ?? '', months: Math.round(nz(v.redemptionMonths) * 10) / 10 };
          try {
            if (storeId) saveConfirmed(KEY(storeId), new Set([...typedKeys].filter((x) => x !== 'redemptionMonths' && x !== 'redemptionRatePct' && !/^rulePick_.*_custom$/.test(x))));
          } catch {
            /* storage unavailable */
          }
        }
        v = { ...v, redemptionMonths: r0.months, redemptionRatePct: r0.ratePct, redemptionDaily: r0.daily, redemptionFlat: r0.flat, redemptionFlat2Pct: r0.flat2Pct, redemptionChecked: 0 };
        save(v);
        // The numbers you typed for another kind of sale are gone now: so is their "typed" mark (after mount, below).
        if (cur === 'custom' && youTyped) dropTypedWait.current = true;
      }
    }
    if (taxMoved) save(offer ? v0 : v); // an offer's view zeroes the auction-only fields: keep them as stored
    return !v.minimumBid && openingBid ? { ...v, minimumBid: openingBid } : v;
  });
  useEffect(() => {
    if (regionOf() === regionSig) return;
    stampRegion();
    if (!typedKeys.has('transferTaxPer500')) update({ transferTaxPer500: tax.per500 });
  }, [regionSig]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const pending = pendingWaitClear && pendingWaitClear.store === (storeId ?? '') ? pendingWaitClear : null;
    if (!dropTypedWait.current && !pending) return;
    dropTypedWait.current = false;
    setWaitCleared(pending ? pending.months : null);
    // Shown on this load only.
    setTimeout(() => { pendingWaitClear = null; }, 1500);
    setTypedKeys((t) => {
      const next = new Set([...t].filter((x) => x !== 'redemptionMonths' && x !== 'redemptionRatePct' && !/^rulePick_.*_custom$/.test(x)));
      try {
        if (storeId) saveConfirmed(KEY(storeId), next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [mode, setModeState] = useState<'quick' | 'detailed'>(loadMode);
  const setMode = (m: 'quick' | 'detailed') => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage unavailable */
    }
  };
  // What the person typed, so a field can be cleared while editing.
  const [draft, setDraft] = useState<Partial<Record<keyof BidInputs, string>>>({});
  // Your own offer or bid is kept with a saved deal, so its packet shows the result at your price.
  const [bidText, setBidText] = useState<string>(() => (i.proposedPrice ? String(i.proposedPrice) : ''));
  const [, rerender] = useReducer((n: number) => n + 1, 0); // shows a held-back message once you leave the box
  const bidInvalid = bidText.trim() !== '' && !!calculatorInputError(bidText, '$');
  const bidBad = bidText.trim() !== '' && !!shownInputError(bidText, '$', `${uid}-bid`);
  const bid = Math.min(bidInvalid ? i.proposedPrice ?? 0 : toNum(bidText), 1e10); // a misplaced comma keeps the last valid price
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const update = (patch: Partial<BidInputs>) =>
    setI((cur) => {
      const next = { ...cur, ...patch };
      save(next);
      return next;
    });
  const markTyped = (k: keyof BidInputs) =>
    setTypedKeys((t) => {
      if (t.has(k)) return t;
      const next = new Set([...t, k]);
      try {
        if (storeId) saveConfirmed(KEY(storeId), next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  const unmarkTyped = (k: keyof BidInputs) =>
    setTypedKeys((t) => {
      if (!t.has(k)) return t;
      const next = new Set([...t].filter((x) => x !== k));
      try {
        if (storeId) saveConfirmed(KEY(storeId), next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  const set = (k: keyof BidInputs, text: string, unit?: string) => {
    trackAction('calculator_used', true);
    markTyped(k);
    // Typing the redemption numbers makes them your own rule for this kind of sale.
    if ((k === 'redemptionMonths' || k === 'redemptionRatePct') && !offer) setPick('custom');
    setDraft((d) => ({ ...d, [k]: text }));
    // Something that isn't a number keeps the last valid value (and shows why) instead of quietly becoming 0.
    if (calculatorInputError(text, (unit ?? '$') as never)) return;
    // Changing the redemption numbers by hand means the rule you confirmed may no longer be the one used.
    update({ [k]: clampInput(k, toNum(text)), ...(k.startsWith('redemption') && k !== 'redemptionChecked' ? { redemptionChecked: 0 } : {}) });
  };
  // The redemption rule chosen for this kind of sale: one picked from the menu, or "custom" for numbers you typed.
  // One per kind of sale (it replaces the last one for the same kind). A menu pick also ends your typed wait.
  const setPick = (rule: string) =>
    setTypedKeys((t) => {
      const next = new Set([...t].filter((x) => !x.startsWith(rulePick(region.state, saleKind, '')) && (rule === 'custom' || (x !== 'redemptionMonths' && x !== 'redemptionRatePct'))));
      next.add(rulePick(region.state, saleKind, rule));
      try {
        if (storeId) saveConfirmed(KEY(storeId), next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  const pickRule = (rule: string) => {
    const r = rules[rule];
    setPicked(rule);
    // A rule picked from the menu is the reader's choice for this kind of sale: kept on the next visit (No redemption
    // included), but not after the deal moves to another kind of sale.
    setPick(rule);
    setDraft((d) => ({ ...d, redemptionMonths: undefined, redemptionRatePct: undefined }));
    update({ redemptionMonths: r.months, redemptionRatePct: r.ratePct, redemptionDaily: r.daily, redemptionFlat: r.flat, redemptionFlat2Pct: r.flat2Pct, redemptionChecked: 0 });
  };
  // Rules that fit this kind of sale (all of the state's when the kind isn't known), and whether the buyer still has
  // to confirm in the records which one applies.
  const ruleKeys = choices ? choices.keys : Object.keys(rules);
  // The rule picked from the menu this visit wins over another rule with the same numbers.
  const [picked, setPicked] = useState<string | null>(null);
  const pr = picked ? offered[picked] : undefined;
  const same = (a: number | undefined, b: number | undefined) => (a ?? 0) === (b ?? 0);
  const ruleNow = picked && pr && same(i.redemptionMonths, pr.months) && same(i.redemptionRatePct, pr.ratePct) && same(i.redemptionDaily, pr.daily) && same(i.redemptionFlat, pr.flat) && same(i.redemptionFlat2Pct, pr.flat2Pct) ? picked : ruleOf(i, offered);
  const taxLoanRule = ruleNow === 'txTaxLoanLong' || ruleNow === 'txTaxLoanOther';
  // The shortest owner redemption period the law sets for this sale (0: none, or the law may set none), for your own
  // shorter wait; the packet and My deals use the same.
  const shortestOwner = saleKind ? shortestRedemptionMonths({ state: region.state, kind: saleKind as Deal['kind'] }) : 0;
  // Your own wait under it: one note under the price says so (the caution above then points to it).
  const shortNote = ruleNow === 'custom' && !!choices && choices.start !== 'none' && shorterThanLaw(i.redemptionMonths, shortestOwner);
  const unconfirmed = !offer && !!choices?.confirm && !i.redemptionChecked;
  const r = maxSafeBid(i);
  const grid = stressGrid(i);
  const slower = maxSafeBid({ ...i, holdingMonths: i.holdingMonths + 3 }).profitBid;
  // At your bid, else the walk-away price; none when that's below the opening bid (no bid there can be placed), as My
  // deals and the packet say.
  // (No illustration for a wait that shows as 0 months, as the packet and My deals say none.)
  const redeemed = Math.round(i.redemptionMonths * 10) === 0 ? null : bid > 0 ? redemptionOutcome(i, bid) : i.minimumBid > 0 && r.maxBid < i.minimumBid ? null : redemptionOutcome(i, r.maxBid);
  // No resale value yet (e.g. a listing with no estimate): ask for one instead of saying "no bid works".
  const needsValue = !(i.exitValue > 0);
  const atBid = bid > 0 ? costsAtBid(i, bid) : null;
  const profit = bid > 0 ? profitAtBid(i, bid) : null;
  const over = bid > 0 && bid > r.maxBid;
  const target = requiredProfit(i);
  // The profit target is still our starting 15%: say it's ours, not yours.
  // Our example 15% still sets the target: you haven't set the percent (or switched to dollars), and any minimum you
  // typed is below it.
  const pctShare = (nz(i.exitValue) * nz(i.targetProfitPct)) / 100;
  const targetIsExample = !typedKeys.has('targetProfitPct') && !typedKeys.has('profitInDollars') && !i.profitInDollars && (!typedKeys.has('targetProfitMin') || pctShare >= nz(i.targetProfitMin));
  const minBelowExample = targetIsExample && typedKeys.has('targetProfitMin') && nz(i.targetProfitMin) > 0;
  // One wording for the target everywhere on this calculator (My deals and the packet use the same test).
  // A dollar target left at $0: no target yet (the walk-away price is then break-even).
  const noTarget0 = !!i.profitInDollars && !(nz(i.targetProfitMin) > 0);
  const tw = noTarget0 ? 'break-even (no profit target set yet)' : targetIsExample ? 'our example profit target' : 'your profit target';
  const gw = tw === 'your profit target' ? 'your goal' : tw;
  const twCap = tw.charAt(0).toUpperCase() + tw.slice(1);
  // A dollar target left at $0: no target yet, not a $0 goal.
  const noDollarTarget = !!i.profitInDollars && !(i.targetProfitMin > 0);
  // An offer on a listed home has no quiet title: its line reads as the field does.
  const steps0 = maxBidSteps(i).map((x) => (offer && x.label === 'Title, attorney, quiet title' ? { ...x, label: 'Title, escrow, attorney' } : x));
  const steps = targetIsExample || (!!i.profitInDollars && !(nz(i.targetProfitMin) > 0)) ? steps0.map((x) => ({ ...x, label: !!i.profitInDollars && !(nz(i.targetProfitMin) > 0) ? x.label.replace(/^Profit (left|you want).*$/, 'Profit left (no profit target set yet)') : x.label.replace('your target:', 'our example target:') })) : steps0;
  const atOpening = i.minimumBid > 0 ? profitAtBid(i, i.minimumBid) : 0;
  // The deal itself fails at the opening bid, or only the cash you entered falls short of it.
  const dealFails = i.minimumBid > 0 && r.profitBid < i.minimumBid;
  // Cash for the opening bid counts everything until you sell (repairs, holding, fees), the same way the cash limit does.
  const openingCash = i.minimumBid > 0 ? cashNeededAtBid(i, i.minimumBid) : 0;
  const cashShort = !dealFails && i.minimumBid > 0 && i.cashAvailable > 0 && r.limitedBy === 'cash' && r.maxBid < i.minimumBid;
  // Where the state has no transfer tax (and none was entered), the field is left out instead of sitting at $0.
  const noTransferTax = tax.per500 === 0 && !i.transferTaxPer500;
  const shown = (f: Field) => (mode === 'detailed' || f.quick) && (!f.when || f.when(i)) && !(f.k === 'redemptionRatePct' && choices?.start === 'none' && (pickOf() === 'custom' || pickOf() === 'none') && !(i.redemptionRatePct > 0) && draft.redemptionRatePct === undefined) && !(offer && OFFER_HIDDEN.has(f.k)) && !(noTransferTax && f.k === 'transferTaxPer500');
  // Which inputs on screen still hold our starting estimates (the listing's own numbers don't count).
  // Only boxes on screen (Quick hides some): a typo left in a hidden box doesn't pause the results.
  const visibleKeys = new Set(GROUPS.flatMap((g) => g.fields.filter(shown)).map((f) => f.k as string));
  const stickyBad = Object.entries(draft).some(([k, t]) => t !== undefined && visibleKeys.has(k) && !!shownInputError(t, (fieldUnit(k) ?? '$') as never, `${uid}-${k}`));
  const still = exampleLabels(GROUPS.flatMap((g) => g.fields.filter(shown).map((f) => (offer && OFFER_FIELDS[f.k] ? { ...f, ...OFFER_FIELDS[f.k] } : f))), i, offer ? offerInputs(defaults) : defaults, typedKeys, NOT_EXAMPLES);
  const yours = boughtOffer ? 'The price you paid' : wonBid ? 'Your winning bid' : agreed ? 'The agreed price' : offer ? 'Your offer' : 'Your bid';
  const planCash = investorProfile().investable;
  // A cash figure typed here (a typed 0 is no limit). An offer hides the field, so a figure typed while this was an
  // auction doesn't count there.
  const cashTyped = !offer && typedKeys.has('cashAvailable');
  // No cash entered here, and My plan's cash doesn't cover the opening bid with every cost (the packet says the same).
  const planShort = !offer && !dealFails && !cashShort && i.minimumBid > 0 && !(i.cashAvailable > 0) && !cashTyped && planCash > 0 && openingCash > planCash;
  // Your own bid's cash against your limit: the cash entered here, else My plan's (a typed 0 is no limit).
  const bidCashLimit = i.cashAvailable > 0 ? i.cashAvailable : cashTyped ? 0 : planCash;
  const bidCash = bid > 0 ? cashNeededAtBid(i, bid) : 0;
  const bidShort = bid > 0 && bidCashLimit > 0 && bidCash > bidCashLimit;
  // Costs still at $0 that nobody entered: unknown, not confirmed zero. Typing 0 confirms there's none.
  const unentered = unenteredCosts(i, typedKeys, offer);
  const unenteredNote = unentered.length > 0 && (
    <><br /><strong>Still at $0 because nothing was entered: {unentered.join('; ')}.</strong> Enter each cost (switch to Detailed for the ones not shown), or type 0 if there truly is none, before you rely on this.</>
  );

  return (
    <div className="calc" id={`${uid}-calc`}>
      <div className="calc-inputs">
        <ExampleInputs labels={still} />
        <div className="calc-mode" role="group" aria-label="How many numbers to enter">
          <button type="button" aria-pressed={mode === 'quick'} className={mode === 'quick' ? 'on' : ''} onClick={() => setMode('quick')}>Quick</button>
          <button type="button" aria-pressed={mode === 'detailed'} className={mode === 'detailed' ? 'on' : ''} onClick={() => setMode('detailed')}>Detailed</button>
          <span className="small muted">{mode === 'quick' ? 'The deal, repairs and liens. This quick view hides some costs. Hidden ones use our starting estimates, except holding, title and possession, which stay at $0 until you add them in Detailed.' : 'The deal first, then every cost in the order you’d meet it.'}</span>
        </div>
        {GROUPS.map((g) => {
          const fields = g.fields.filter(shown).map((f) => (offer && OFFER_FIELDS[f.k] ? { ...f, ...OFFER_FIELDS[f.k] } : wonBid && WON_FIELDS[f.k] ? { ...f, ...WON_FIELDS[f.k] } as Field : f)).map((f) =>
            f.k === 'redemptionRatePct' && i.redemptionFlat
              ? { ...f, label: i.redemptionFlat2Pct ? 'Premium a redemption pays you (first year)' : 'Premium a redemption pays you', unit: '%' as const, hint: i.redemptionFlat2Pct ? `A flat % of your price set by law, not a yearly rate; ${i.redemptionFlat2Pct}% in the second year.` : ruleNow === 'txTaxOther' ? 'A % of your price plus the costs the law repays, not a yearly rate. Texas law caps it at 25% (Tax Code 34.21(e)); this calculator applies the full 25% to your price only.' : 'A flat % of your price set by law, not a yearly rate.' }
              : f);
          if (!fields.length) return null;
          return (
            <fieldset key={g.title} className="calc-group">
              <legend>{g.title}</legend>
              {g.redemption && mode === 'detailed' && !offer && (
                <label className="calc-rule">
                  <span className="calc-label">Redemption period</span>
                  <select value={ruleNow} onChange={(e) => e.target.value !== 'custom' && pickRule(e.target.value)}>
                    {Object.entries(rules).filter(([k]) => ruleKeys.includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    {ruleNow === 'custom' && <option value="custom">Your own numbers</option>}
                  </select>
                  <small className="muted">Fills in the redemption wait and what a redemption pays. Confirm them in the sale’s official notice.</small>
                </label>
              )}

              <div className="calc-grid">
                {fields.map((f0) => {
                  const f: Field = f0.profitSwitch && i.profitInDollars ? { ...f0, k: 'targetProfitMin', unit: '$', hint: 'The dollar profit you want from this deal.' } : f0;
                  return (
                  <div key={f0.k} className="calc-field">
                    <span className="calc-label-row">
                      <label className="calc-label" htmlFor={`${uid}-${f.k}`}>{f.label}<span className="sr-only">{f.unit === '$' ? ', in dollars' : `, ${unitText(f.unit).replace('%', 'percent')}`}</span></label>
                      {f0.profitSwitch && (
                        <span className="calc-unit-switch" role="group" aria-label="Profit as a percent or dollars">
                          <button type="button" aria-pressed={!i.profitInDollars} onClick={() => { setDraft((d) => ({ ...d, targetProfitMin: undefined })); if (i.profitInDollars) { update({ profitInDollars: 0 }); if (typedKeys.has('targetProfitPct')) markTyped('profitInDollars'); else unmarkTyped('profitInDollars'); } }}>%</button>
                          <button type="button" aria-pressed={!!i.profitInDollars} onClick={() => { setDraft((d) => ({ ...d, targetProfitMin: undefined })); if (!i.profitInDollars) { update({ profitInDollars: 1 }); markTyped('profitInDollars'); } }}>$</button>
                        </span>
                      )}
                    </span>
                    <span className="calc-input">
                      {f.unit === '$' && <i aria-hidden>$</i>}
                      <input
                        id={`${uid}-${f.k}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={draft[f.k] ?? (f.unit === '$' ? (i[f.k] ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(i[f.k]))}
                        aria-describedby={hintFor(f) ? `${uid}-${f.k}-hint` : undefined}
                        aria-invalid={draft[f.k] !== undefined && !!shownInputError(draft[f.k]!, f.unit as never, `${uid}-${f.k}`)}
                        onChange={(e) => set(f.k, e.target.value, f.unit)} onInput={() => markTyped(f.k)}
                        onBlur={() => { if (draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit as never)) { setDraft((d) => ({ ...d })); return; } setDraft((d) => ({ ...d, [f.k]: undefined })); }}
                      />
                      {f.unit !== '$' && <i aria-hidden>{unitText(f.unit)}</i>}
                    </span>
                    <span className="calc-hint">
                      {draft[f.k] !== undefined && shownInputError(draft[f.k]!, f.unit as never, `${uid}-${f.k}`) && <small className="deal-urgent calc-error" role="status">{shownInputError(draft[f.k]!, f.unit as never, `${uid}-${f.k}`)}</small>}
                      {hintFor(f) && <small className="muted" id={`${uid}-${f.k}-hint`}>{hintFor(f)}</small>}
                      {moreForField(f) && (
                        <details className="calc-more">
                          <summary aria-label={`More about ${f.label}`}>?</summary>
                          <p className="small">{moreForField(f)}</p>
                        </details>
                      )}
                    </span>
                  </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {propertyId && (
          <button type="button" className="linkish" onClick={() => { try { localStorage.removeItem(KEY(propertyId)); localStorage.removeItem(TYPED_KEY(propertyId)); localStorage.removeItem(KEY(propertyId).replace(/\.v1$/, '.typed.v1')); } catch { /* ignore */ } setI(defaults); setTypedKeys(new Set()); setDraft({}); setBidText(''); }}>
            Reset to our starting estimates
          </button>
        )}
      </div>

      <div className="calc-results" id={`${uid}-results`}>
        <p className="small muted">Profit estimates are before income tax. Review taxes on a sale with your tax adviser.</p>
        {/* Your own typed wait was for another kind of sale: it's cleared, and you're told (it changes the walk-away). */}
        {waitCleared !== null && <p className="note" role="status">Your typed redemption wait{waitCleared > 0 ? ` (${waitCleared} month${waitCleared === 1 ? '' : 's'})` : ''} was for another kind of sale or state, so it was cleared and this sale’s rule is used. Type it again under Holding and financing (Detailed) if it applies here. <button type="button" className="linkish" onClick={() => setWaitCleared(null)}>Dismiss</button></p>}
        {unconfirmed && (
          <div className="caution calc-unconfirmed">
            <strong>Redemption rule not confirmed.</strong> {ruleNow === choices?.start ? choices?.confirm : (choices?.confirm ?? '').replace(/ ?This calculator starts with [^.]*\. ?/, ' ').trim()} Your walk-away price now uses{' '}
            {ruleNow === 'custom'
              ? choices?.start === 'none' && saleKind
                ? <>your own numbers: a {Math.round(i.redemptionMonths * 10) / 10}-month what-if wait (the note below says what it means).</>
                : shortNote && !needsValue
                  ? <>your own numbers: {waitWords(Math.round(i.redemptionMonths * 10) / 10)} (the note under the price says what it means).</>
                  : <>your own numbers: {waitWords(Math.round(i.redemptionMonths * 10) / 10)}. That’s a what-if for holding costs, not the legal deadline: the owner can still redeem until the period the law sets ends.</>
              : <>{offered[ruleNow]?.label}.</>}{' '}
            {ruleNow === 'custom' && choices?.start === 'none' ? 'Once you’ve checked the records, confirm below that no redemption rule applies, or pick the one that does under Holding and financing (Detailed).' : ruleNow === choices?.start ? 'Pick the rule under Holding and financing (Detailed), then confirm it here.' : ruleNow === 'custom' ? 'Once the records show which rule applies, pick it under Holding and financing (Detailed) and confirm it here.' : 'Once the records show this rule applies, confirm it here (or pick another under Holding and financing, Detailed).'}
            <label className="calc-check calc-check-block">
              <input type="checkbox" checked={false} onChange={() => { update({ redemptionChecked: 1 }); setTimeout(() => document.getElementById(`${uid}-rule-confirmed`)?.focus(), 0); }} />
              <span>{ruleNow === 'custom' && choices?.start === 'none' ? 'I’ve checked the records: no redemption rule applies to this sale.' : 'I’ve checked the records, and the redemption rule set in this calculator is the one that applies.'}</span>
            </label>
          </div>
        )}
        {!offer && choices?.confirm && !!i.redemptionChecked && (
          <p className="small muted" id={`${uid}-rule-confirmed`} tabIndex={-1}>{ruleNow === 'custom' && choices?.start === 'none' ? <>Confirmed by you: no redemption rule applies to this sale (your {Math.round(i.redemptionMonths * 10) / 10}-month wait is a what-if).</> : <>Redemption rule confirmed by you: {ruleNow === 'custom' ? `your own numbers, ${waitWords(Math.round(i.redemptionMonths * 10) / 10)}` : offered[ruleNow]?.label}.</>} <button type="button" className="linkish" onClick={() => { update({ redemptionChecked: 0 }); setTimeout(() => document.querySelector<HTMLInputElement>('.calc-unconfirmed input[type="checkbox"]')?.focus(), 0); }}>Undo</button></p>
        )}
        <ExampleResults count={needsValue ? 0 : still.length} />
        {!needsValue && !r.noBidWorks && !cashShort && <PriceHead level={3} kind="target" label="Walk-away price" price={r.noBidWorks || cashShort ? null : r.maxBid} result={r.noBidWorks || cashShort ? null : r.profit} unit="profit" note={r.noBidWorks || cashShort ? undefined : `Not the result at ${yours.toLowerCase()}: this is the most you could ${wonBid || boughtOffer ? 'have paid' : 'pay'} and still meet ${gw}.`} />}
        {needsValue ? (
          <div className="calc-max">
            <span>Walk-away price</span>
            <strong>Enter a resale value</strong>
            <small>{propertyId ? 'We don’t estimate values for listings from the official list. ' : `Start with the ${w.opening} from the listing, then the costs. `}The resale value comes from recent sold prices of similar nearby properties, as they’d be after repairs.</small>
          </div>
        ) : (
          cashShort ? (
          <div className="calc-max bad">
            <span>{phase === 'owed' || phase === 'paid' ? 'The most this plan could have paid' : 'Walk-away price'}</span>
            <strong>{phase ? `At the ${w.opening}, this needs more cash than you have` : <>No {w.bid} at the {w.opening} fits your cash</>}</strong>
            <small>At the {w.opening} you’d need about {fmtMoney(Math.round(openingCash))}: the {w.bid} plus repairs and every cost until you sell. The deal itself allows {w.bid}s up to {fmtMoney(r.profitBid)}.</small>
          </div>
          ) : (
          <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`}>
            <span>{boughtOffer ? 'Walk-away price: the most this plan could have paid' : agreed ? 'Walk-away price: the most this plan could pay' : offer ? 'Walk-away price: your highest offer' : wonBid ? 'Walk-away price: the most this plan could have paid' : 'Walk-away price: stop bidding here'}</span>
            <strong>{r.noBidWorks ? `No ${w.bid} works` : fmtMoney(r.maxBid)}</strong>
            <small>
              {r.noBidWorks
                ? r.limitedBy === 'cash' && r.profitBid > 0
                  ? `Your cash doesn’t cover the repairs and costs until you sell, even before a ${w.bid}. ${twCap} alone would allow ${fmtMoney(r.profitBid)}.`
                  : `Even at $0, costs leave less than ${tw}. ${phase ? `At ${yours.toLowerCase()} this plan loses money. ${noPriceAfter(phase, sctx)}` : 'Walk away or change your plan.'}`
                : r.limitedBy === 'cash'
                  ? `Set by the cash you can bring: the ${w.bid} plus every cost until you sell (repairs, holding, fees). ${twCap} alone would allow ${fmtMoney(r.profitBid)}.`
                  : noDollarTarget ? 'No profit target set yet: enter the dollar profit you want under “Profit you want”.' : targetIsExample ? `Leaves our example profit target, ${i.targetProfitPct}% of the resale value (${fmtMoney(Math.round(target))})${minBelowExample ? `, which is more than your ${fmtMoney(nz(i.targetProfitMin))} minimum` : ''}, after every cost. Set your own percent under “Profit you want”. Not a guarantee.` : `Leaves your ${fmtMoney(Math.round(target))} profit target after every cost, based on your numbers. Not a guarantee.`}
              {!r.noBidWorks && !(i.minimumBid > 0) && unenteredNote}
            </small>
          </div>
          )
        )}
        {/* No cash limit entered here, but My plan has your investable cash and this needs more: say so by the price. */}
        {!needsValue && !r.noBidWorks && !planShort && !(i.cashAvailable > 0) && !cashTyped && planCash > 0 && r.cashPeak > planCash && !fixedPrice && (
          <p className="calc-verdict bad" role="note"><strong>This needs about {fmtMoney(Math.round(r.cashPeak))} of your cash at the walk-away price; My plan shows {fmtMoney(Math.round(planCash))} of investable cash.</strong> {offer ? 'Offer only what fits your cash (with any loan your lender approves), or compare a loan with a lender.' : <>Enter the cash you can bring (an auction wants the full amount by its payment deadline) to cap the {w.bid} at what you have, or compare a loan with a lender. <button type="button" className="linkish" onClick={() => { const f = document.getElementById(`${uid}-cashAvailable`); f?.scrollIntoView({ block: 'center' }); f?.focus({ preventScroll: true }); }}>Enter your cash</button></>}</p>
        )}
        {!needsValue && i.minimumBid > 0 && <PriceHead level={3} kind="listed" tag={offer ? 'From the listing' : 'From the sale notice'} label={w.Opening} price={i.minimumBid} result={atOpening} unit="profit" note={`Estimated cash you’d put in at this price, under these assumptions (through repairs and holding until it sells): ${fmtMoney(Math.round(openingCash))}.`} />}
        {!needsValue && i.minimumBid > 0 && (
          <div className={`calc-verdict ${dealFails || cashShort || planShort ? 'bad' : 'good'}`}>
            {/* Under contract, won or bought: the price is fixed, so no advice on what to offer or bid; the result at that price follows below. */}
            {fixedPrice ? (
              dealFails ? (
                <><strong>{noTarget0 ? 'Doesn’t break even' : `Misses ${targetIsExample ? 'our example target' : 'your target'}`} at the {w.opening}.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, {noTarget0 ? 'below break-even.' : <>below {targetIsExample ? 'our example' : 'your'} {fmtMoney(Math.round(target))} target.</>} {agreed ? 'Check your result at the agreed price below.' : `Your result at ${wonBid ? 'your winning bid' : 'the price you paid'} is below.`}</>
              ) : (
                <><strong>{planShort || cashShort ? `At the ${w.opening}, this needs more cash than ${planShort ? 'My plan shows' : 'you entered'}.` : `Meets ${tw} at the ${w.opening}, with the numbers entered.`}</strong> At the {w.opening} your profit would be about {fmtMoney(Math.round(atOpening))}{planShort || cashShort ? <>, with about {fmtMoney(Math.round(openingCash))} of cash needed through repairs and holding</> : null}. Your result at {agreed ? 'the agreed price' : wonBid ? 'your winning bid' : 'the price you paid'} is below.{agreed && (planShort || cashShort) ? ' Talk to your lender before you close.' : ''}{unenteredNote}</>
              )
            ) : dealFails ? (
              offer ? (
                <><strong>{noTarget0 ? 'Doesn’t break even' : `Misses ${targetIsExample ? 'our example target' : 'your target'}`} at the {w.opening}.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, {noTarget0 ? 'below break-even.' : <>below {targetIsExample ? 'our example' : 'your'} {fmtMoney(Math.round(target))} target.</>} {r.maxBid > 0 ? <>Offer no more than {fmtMoney(r.maxBid)}, or pass.</> : 'Pass, or change your plan.'}</>
              ) : (
                <><strong>Doesn’t work at the {w.opening}.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, {noTarget0 ? 'below break-even.' : <>below {targetIsExample ? 'our example' : 'your'} {fmtMoney(Math.round(target))} target.</>} Skip this one or change your plan.</>
              )
            ) : planShort ? (
              <><strong>The cash in My plan doesn’t cover this deal at the {w.opening}.</strong> The deal works (about {fmtMoney(Math.round(atOpening))} profit at {fmtMoney(i.minimumBid)}), but with repairs and every cost until you sell you’d need about {fmtMoney(Math.round(openingCash))}, and My plan shows {fmtMoney(Math.round(planCash))}. Enter the cash you can bring to see the most you could bid, or skip this one. <button type="button" className="linkish" onClick={() => { const f = document.getElementById(`${uid}-cashAvailable`); f?.scrollIntoView({ block: 'center' }); f?.focus({ preventScroll: true }); }}>Enter your cash</button></>
            ) : cashShort ? (
              <><strong>Your cash doesn’t cover this deal at the {w.opening}.</strong> The deal works (about {fmtMoney(Math.round(atOpening))} profit at {fmtMoney(i.minimumBid)}), but with repairs and every cost until you sell you’d need about {fmtMoney(Math.round(openingCash))}, and you entered {fmtMoney(i.cashAvailable)}.</>
            ) : (
              offer ? (
                <><strong>Meets {tw} at the {w.opening}, with the numbers entered.</strong> Your most is {fmtMoney(r.maxBid)}, but you don’t have to offer more than {fmtMoney(i.minimumBid)}: start lower if the market allows. Going past {fmtMoney(r.maxBid)} means accepting less than {tw}. At the {w.opening} your profit would be about {fmtMoney(Math.round(atOpening))}.{unenteredNote}</>
              ) : (
                <><strong>{fmtMoney(r.maxBid - i.minimumBid)} of room above the {w.opening}.</strong> Bidding starts at {fmtMoney(i.minimumBid)}; stop at {fmtMoney(r.maxBid)}. At the {w.opening} your profit would be about {fmtMoney(Math.round(atOpening))}.{unenteredNote}</>
              )
            )}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <div className="calc-steps">
            <strong>{phase === 'owed' || phase === 'paid' ? 'How we got the most this plan could have paid' : 'How we got your walk-away price'}</strong>
            <dl className="calc-kv">
              {steps.map((st, n) => <div key={st.label} className={n === 0 ? 'first' : ''}><dt>{st.label}</dt><dd>{n === 0 ? fmtMoney(st.amount) : `− ${fmtMoney(-st.amount)}`}</dd></div>)}
              <div className="total"><dt>{r.limitedBy === 'cash' ? 'Most the deal allows' : w.max}</dt><dd>{fmtMoney(r.profitBid)}</dd></div>
            </dl>
            {r.limitedBy === 'cash' && <p className="small muted">The cash you can bring sets your walk-away price lower than this.</p>}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <dl className="calc-kv">
            {!offer && <div><dt>{wonBid ? 'Cash needed at the most this plan could have paid' : 'Cash needed on auction day, at the walk-away price'}</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>}
            <div><dt>Estimated cash you’d put in, at the walk-away price, under these assumptions</dt><dd>{fmtMoney(r.cashPeak)}</dd></div>
            {i.financedPct > 0 && r.cashToStabilize < r.cashPeak && <div><dt>Cash left in after the loan funds, at the walk-away price</dt><dd>{fmtMoney(r.cashToStabilize)}</dd></div>}
            <div><dt>Profit at {phase === 'owed' || phase === 'paid' ? 'the most this plan could have paid' : 'the walk-away price'}{Math.round(r.profit) !== Math.round(target) ? (noTarget0 ? ' (no profit target set yet)' : ` (${targetIsExample ? 'our example target' : 'your target'}: ${fmtMoney(Math.round(target))})`) : ''}</dt><dd>{fmtMoney(Math.round(r.profit))}</dd></div>
            <div><dt>Return on your cash, per year, if it sells on schedule</dt><dd>{yr(r.yearlyReturn)}</dd></div>
            <div><dt>Break-even {w.bid} (zero profit)</dt><dd>{fmtMoney(r.breakEvenBid)}</dd></div>
          </dl>
        )}
        {!r.noBidWorks && !needsValue && i.financedPct > 0 && <p className="calc-note small">{DRAW_NOTE}</p>}
        {!r.noBidWorks && !needsValue && !offer && i.financedPct > 0 && i.redemptionMonths > 0 && (
          <p className="calc-note small">Lenders rarely lend on a property while the owner can still redeem it, so plan to pay the full {w.bid} in cash and carry it until the redemption period ends. The calculator still charges loan costs for the whole wait, as a cautious assumption. The return above is figured on the estimated cash you’d put in.</p>
        )}
        {!r.noBidWorks && !needsValue && r.yearlyReturn !== null && totalMonths(i) > 12 && (
          <p className="calc-note small">This deal ties up your cash for {Math.round(totalMonths(i))} months, so compare the return per year with your other options, not just the profit.</p>
        )}
        {/* Your own wait on a sale with no owner redemption: a what-if, said so, with no payout worked out (nobody would
            repay you at its end); the packet and My deals say the same. */}
        {i.redemptionMonths > 0 && !needsValue && ruleNow === 'custom' && choices?.start === 'none' && saleKind && (
          <p className="calc-note small"><strong>Your what-if wait.</strong> {noRedemptionWords({ state: region.state, kind: saleKind as Deal['kind'] })} The {Math.round(i.redemptionMonths * 10) / 10} months count only in your holding costs; nobody would repay you at their end.</p>
        )}
        {/* Your own wait, shorter than the period this sale usually carries: said here, not only in the "?" help. */}
        {shortNote && !needsValue && (
          <p className="calc-note small" role="note"><strong>Shorter than the law’s shortest redemption period for this sale.</strong> The shortest is {shortestRedemptionWords({ state: region.state, kind: saleKind as Deal['kind'] })},* and the owner can redeem until it ends. These numbers count only {Math.round(i.redemptionMonths * 10) === 0 ? 'no wait' : <>your {Math.round(i.redemptionMonths * 10) / 10}-month wait</>}: type at least {shortestOwner} months, or pick the rule under Holding and financing, to count the full wait.</p>
        )}
        {redeemed && !needsValue && !(ruleNow === 'custom' && choices?.start === 'none') && (
          <div className="calc-note">
            <strong>If {ruleNow === 'usFederal' || ruleNow === 'usCourt' ? 'the United States' : 'the owner'} redeems: an illustration of your price and what the law adds</strong>
            <p className="small">
              {i.redemptionFlat ? <>If the owner redeems {i.redemptionFlat2Pct ? 'in the first year' : 'at any time in the wait'}, {ruleNow === 'txTaxOther' ? <>the law adds a premium of up to {i.redemptionRatePct}% of your price plus the costs the law repays (Tax Code 34.21(e)). This illustration applies the full {i.redemptionRatePct}% to your price only. </> : <>the law adds {i.redemptionRatePct}% of your price{i.redemptionFlat2Pct ? `, or ${i.redemptionFlat2Pct}% in the second year` : ''}, no matter how early. </>}</> : null}At the end of the {Math.round(i.redemptionMonths * 10) / 10}-month wait you’d get back about {fmtMoney(Math.round(redeemed.repaid))}* on {bid > 0 ? <>a {fmtMoney(bid)} {w.bid}</> : <>your walk-away price, {fmtMoney(r.maxBid)}</>}. By then you’d have spent about {fmtMoney(Math.round(redeemed.spent))}, so you’d {redeemed.net >= 0 ? `come out about ${fmtMoney(Math.round(redeemed.net))} ahead` : `be about ${fmtMoney(Math.round(-redeemed.net))} short`}.{' '}
              {region.state === 'TX' && taxLoanRule
                ? 'This isn’t the full Texas payoff: the law also repays the costs you reasonably spent on the property, plus interest on them at the legal judgment rate: property insurance, repairs required by a building code, an ordinance or a lease in effect at the sale, city health-and-safety liens, HOA dues and certain fees (Tax Code 32.06(k)(2), 34.21(g)). Optional remodeling isn’t on that list. Keep every receipt and ask an attorney which of your costs qualify.'
                : region.state === 'TX' && saleKind === 'taxSale'
                ? 'This isn’t the full Texas payoff: it leaves out the deed recording fee, the taxes, penalties and interest you paid, and eligible costs, which the law also repays: property insurance, repairs required by a building code, an ordinance or a lease in effect at the sale, city health-and-safety liens, HOA dues and certain fees (Tax Code 34.21(a), (g)). Optional remodeling isn’t on that list. Keep every receipt and ask an attorney which of your costs qualify.'
                : region.state === 'NV' && saleKind === 'hoa' && ruleNow !== 'usFederal' && ruleNow !== 'usCourt'
                ? 'This leaves out what Nevada law also has the person who redeems pay you: the taxes, assessments and payments on earlier liens you paid, with interest, and needed upkeep to the HOA’s standards (NRS 116.31166(3)). Upgrades aren’t repaid.'
                : region.state === 'NV' && saleKind === 'court' && ruleNow !== 'usFederal' && ruleNow !== 'usCourt'
                ? 'This leaves out what Nevada law also has the person who redeems pay you: the taxes, assessments and payments on earlier liens you paid, with interest (NRS 21.210). Repairs aren’t repaid, and rent you collected, or were entitled to collect, comes off the payoff (NRS 21.250).'
                : 'This leaves out other amounts some rules also repay, such as taxes, assessments or costs the law lists; optional remodeling usually isn’t repaid.* Ask an attorney what your sale’s rule repays.'}
            </p>
          </div>
        )}

        {!needsValue && (
        <>
        <div className="calc-field calc-bid">
          <label className="calc-label" htmlFor={`${uid}-bid`}>{wonBid ? 'Your winning bid' : boughtOffer ? 'The price you paid' : agreed ? 'The agreed price' : <>Check {offer ? 'an offer' : 'a bid'}</>}</label>
          <span className="calc-input"><i aria-hidden>$</i><input id={`${uid}-bid`} type="text" inputMode="decimal" autoComplete="off" value={bidText} placeholder={boughtOffer ? 'the price you paid' : agreed ? 'e.g. the agreed price' : offer ? 'e.g. the offer you plan to make' : wonBid ? 'the bid you won with' : 'e.g. a bid you expect to beat'} aria-invalid={bidBad || undefined} aria-describedby={bidBad ? `${uid}-bid-err` : undefined} onBlur={rerender} onChange={(e) => { trackAction('calculator_used', true); setBidText(e.target.value); if (e.target.value.trim() !== '' && calculatorInputError(e.target.value, '$')) return; update({ proposedPrice: clampInput('proposedPrice', toNum(e.target.value)) }); }} /></span>
          {bidBad && <small className="deal-urgent" role="status" id={`${uid}-bid-err`}>{calculatorInputError(bidText, '$')}</small>}
        </div>
        {atBid && profit !== null && <PriceHead level={3} kind="yours" label={yours} price={bid} result={profit} unit="profit" note={`Estimated cash you’d put in at this price, under these assumptions (through repairs and holding until it sells): ${fmtMoney(Math.round(cashNeededAtBid(i, bid)))}.${saveAs && !propertyId ? ' Saved with this deal as your price; its deal packet uses it.' : propertyId ? ' Saved for this property in this browser.' : ''}`} />}
        {atBid && profit !== null && !needsValue && (
          <div className={`calc-verdict ${over || bidShort ? 'bad' : 'good'}`}>
            {over ? (
              <><strong>{phase === 'owed' || phase === 'paid' ? 'Above what this plan could have paid.' : 'Above your walk-away price.'}</strong> At {fmtMoney(bid)} this deal no longer meets {r.limitedBy === 'cash' && bid <= r.profitBid ? 'your cash limit' : tw}. Profit would be {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}.{phase && bidShort ? ` It needs about ${fmtMoney(Math.round(bidCash))} of your cash, more than ${i.cashAvailable > 0 ? 'the cash you entered' : 'My plan shows'}. ${phase === 'paid' && i.cashAvailable > 0 ? 'Update the cash you entered with what you actually put in.' : phase === 'owed' ? owedWords(bid, bidCashLimit, i.cashAvailable > 0 ? 'the cash you entered' : 'My plan’s cash', sctx) : cashShortAfter(phase, sctx)}` : phase === 'agreed' ? ' If the numbers no longer work, ask your agent or attorney what your contract’s contingencies allow, before their deadlines.*' : phase ? '' : ' Past your walk-away price, this deal no longer meets your own numbers.'}</>
            ) : bidShort ? (
              <><strong>Within {phase === 'owed' || phase === 'paid' ? 'what this plan could have paid' : 'your walk-away price'}, but it needs more cash than {i.cashAvailable > 0 ? 'you entered' : 'My plan shows'}.</strong> Estimated profit {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}. At {fmtMoney(bid)} you’d put in about {fmtMoney(Math.round(bidCash))} of your cash; {i.cashAvailable > 0 ? `you entered ${fmtMoney(i.cashAvailable)}` : `My plan shows ${fmtMoney(Math.round(planCash))} of investable cash`}.{phase ? ` ${phase === 'paid' && i.cashAvailable > 0 ? 'Update the cash you entered with what you actually put in.' : phase === 'owed' ? owedWords(bid, bidCashLimit, i.cashAvailable > 0 ? 'the cash you entered' : 'My plan’s cash', sctx) : cashShortAfter(phase, sctx)}` : i.cashAvailable > 0 ? null : offer ? ' Offer only what fits your cash (with any loan your lender approves), or compare a loan with a lender.' : <> <button type="button" className="linkish" onClick={() => { const f = document.getElementById(`${uid}-cashAvailable`); f?.scrollIntoView({ block: 'center' }); f?.focus({ preventScroll: true }); }}>Enter your cash</button></>}</>
            ) : (
              <><strong>Within {phase === 'owed' || phase === 'paid' ? 'what this plan could have paid' : 'your walk-away price'}.</strong> Estimated profit {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}.</>
            )}
          </div>
        )}
        {atBid && (
          <details className="calc-breakdown">
            <summary>Every cost at {fmtMoney(bid)}</summary>
            <dl className="calc-kv">
              {([
                [w.Bid, atBid.bid], ...(offer ? [] : [["Buyer's premium", atBid.premium] as const]), ['Transfer tax', atBid.transferTax], ['Liens that stay', atBid.survivingLiens],
                [offer ? 'Title, escrow, attorney' : 'Title, attorney, quiet title', atBid.titleLegal], ['Getting possession', atBid.possession], ['Repairs + contingency', atBid.repairs],
                ['Holding costs', atBid.holding], ['Financing', atBid.financing], ['Selling costs', atBid.selling],
              ] as const).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{fmtMoney(Math.round(v))}</dd></div>)}
              <div className="total"><dt>Total</dt><dd>{fmtMoney(Math.round(atBid.total))}</dd></div>
            </dl>
          </details>
        )}

        <H>If things go differently</H>
        <p className="small muted calc-grid-note">Highest {w.bid} that {phase === 'owed' || phase === 'paid' ? 'could have met' : 'still meets'} {tw} if the resale value (rows) or repairs (columns) come in differently{i.cashAvailable > 0 ? ', before your cash limit' : ''}.</p>
        <p className="table-swipe-hint" aria-hidden>Swipe the table to see every column&nbsp;→</p>
        <div className="table-wrap">
          <table className="calc-stress calc-grid-table">
            <thead>
              <tr><th scope="col">Value \ Repairs</th>{GRID_REPAIR_STEPS.map((c) => <th key={c} scope="col" className="num">{c === 0 ? 'As entered' : `+${c}%`}</th>)}</tr>
            </thead>
            <tbody>
              {GRID_VALUE_STEPS.map((v, row) => (
                <tr key={v}>
                  <th scope="row">{v === 0 ? 'As entered' : v > 0 ? `+${v}%` : `−${-v}%`}</th>
                  {grid[row].map((m, col) => <td key={col} className={`num${v === 0 && GRID_REPAIR_STEPS[col] === 0 ? ' here' : ''}`}>{needsValue ? '—' : m > 0 ? fmtMoney(m) : 'None'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!needsValue && <p className="small">If it takes 3 months longer: <strong>{slower > 0 ? fmtMoney(slower) : `no ${w.bid} works`}</strong>.</p>}
        </>
        )}
        <p className="muted small">{wonBid || boughtOffer ? 'An estimate from the numbers on this page (examples until you type your own)' : <>An estimate to help you {agreed ? 'check the agreed price before you close' : `set a limit before you ${offer ? 'make an offer' : 'bid'}`}</>}, not advice. Replace every starting number with your own comps, bids and quotes.</p>
      </div>

      {/* On phones the results sit below every input, so keep the answer in view while typing. */}
      <button type="button" hidden={resultsVisible || !calcInView} className={`calc-sticky${(r.noBidWorks && !needsValue) || stickyBad ? ' bad' : ''}`} onClick={() => (stickyBad ? document.querySelector<HTMLElement>(`.calc input[aria-invalid="true"]`) : document.getElementById(`${uid}-results`))?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        <span>{stickyBad ? 'Results paused' : 'Walk-away price'}</span>
        <strong>{stickyBad ? 'Fix the red box' : needsValue ? 'Add resale value' : cashShort ? 'Not enough cash' : r.noBidWorks ? `No ${w.bid} works` : fmtMoney(r.maxBid)}</strong>
        <span className="calc-sticky-go">{stickyBad ? 'Go to it' : 'See details'}&nbsp;↓</span>
      </button>
    </div>
  );
}
