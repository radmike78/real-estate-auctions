import { calculatorInputError, parseCalcInput } from './CalcFields';
import { workStorage as localStorage } from '../lib/workStorage';
import { readConfirmed, saveConfirmed } from '../lib/calcConfirmation';
import { useEffect, useId, useState } from 'react';
import { BLANK_INPUTS, START_INPUTS, maxBidSteps, clampInput, costsAtBid, GRID_REPAIR_STEPS, GRID_VALUE_STEPS, maxSafeBid, profitAtBid, redemptionOutcome, requiredProfit, ruleOf, sanitizeInputs, stressGrid, totalMonths, type BidInputs, offerInputs, cashNeededAtBid, DRAW_NOTE } from '../lib/bidCalc';
import { offeredRedemptionRules, redemptionChoicesFor, redemptionPresetsFor, taxSaleWait, transferTaxFor } from '../lib/stateCosts';
import { useCalcRegion } from './calcRegion';
import { fmtMoney } from '../lib/status';
import { trackAction } from '../lib/track';
import { ExampleInputs, ExampleResults, PriceHead, exampleLabels } from './CalcLabels';

/** Read from the listing or set by the county or the sale's rules: never listed as one of our examples. */
const NOT_EXAMPLES = new Set<string>(['minimumBid', 'transferTaxPer500', 'cashAvailable', 'redemptionMonths', 'redemptionRatePct', 'targetProfitMin']);

const KEY = (id: string) => `fsf.bid.${id}.v1`;
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
      { k: 'cashAvailable', label: 'Cash you can bring', unit: '$', hint: 'All the cash you can put in. Leave 0 for no limit.', quick: true, more: 'Most auctions want the full price in certified funds within hours or a few days (the notice of sale says exactly when), and repairs and holding costs come out of your pocket too. Your walk-away price never needs more cash than this, counting the bid, any buyer’s premium, repairs and every cost until you sell.' },
    ],
  },
  {
    title: 'Buying it',
    fields: [
      { k: 'buyerPremiumPct', label: "Buyer's premium", unit: '%', hint: 'Auction fee on top of your bid, if any.' },
      { k: 'transferTaxPer500', label: 'Transfer tax', unit: '$/500', hint: 'Clark County: $2.55 per $500.', more: 'Real property transfer tax is $2.55 for each $500 of value or fraction of $500 in Clark County. Some transfers are exempt; ask the Recorder or your title company.' },
      { k: 'survivingLiens', label: 'Liens that stay with the property', unit: '$', hint: 'Confirm with a title search.', quick: true },
      { k: 'titleLegal', label: 'Title search, attorney, quiet title', unit: '$' },
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
      { k: 'redemptionMonths', label: 'Redemption wait', unit: 'mo', hint: 'Secure and maintain it; hold off on remodeling until it ends.', more: 'After some sales the former owner (and sometimes lenders) can buy the property back by repaying your price plus what the law adds. What’s repaid depends on the rule. Some repay reasonable upkeep and repairs. Optional remodeling usually isn’t repaid,* so most buyers only secure, insure and maintain the property while they wait. Ask an attorney what you may do and what is repaid. This is the legal wait; your own plan can be longer. A shorter number here is only a what-if: the owner can still redeem until the legal deadline.' },
      { k: 'redemptionRatePct', label: 'Interest a redemption pays you', unit: '%/yr', hint: 'Set by the kind of sale.', when: (i) => i.redemptionMonths > 0 },
      { k: 'holdingMonths', label: 'Months to fix and sell', unit: 'mo', hint: 'After any redemption wait.', more: 'After a tax sale, resale may wait for a quiet title action. In Nevada, that’s the 2-year window after the Treasurer’s deed (NRS 361.600); other states’ waits are in their sale guides.' },
      { k: 'monthlyCarry', label: 'Monthly holding costs', unit: '$', hint: 'Taxes, insurance, utilities and any HOA dues, each month you own it. A listed property’s estimate leaves out HOA dues: add them.' },
      { k: 'financedPct', label: 'Share financed after purchase', unit: '%', hint: 'Auctions need cash on the day.' },
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
// Costs that start at $0 rather than at an estimate, so a $0 here may just mean nobody entered it yet.
const ZERO_CHECK: [keyof BidInputs, string][] = [
  ['repairs', 'repairs'],
  ['titleLegal', 'title search, attorney and quiet title'],
  ['possession', 'getting possession'],
  ['monthlyCarry', 'monthly holding costs'],
];
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
  // Words for an auction bid, or an offer on a listed home.
  const w = offer
    ? { bid: 'offer', Bid: 'Offer', opening: 'asking price', Opening: 'Asking price', max: 'Your maximum offer', day: 'at closing' }
    : { bid: 'bid', Bid: 'Bid', opening: 'opening bid', Opening: 'Opening bid', max: 'Your maximum bid', day: 'on auction day' };
  const region = useCalcRegion();
  const tax = transferTaxFor(region.state, region.county);
  const rules = redemptionPresetsFor(region.state);
  const choices = saleKind ? redemptionChoicesFor(region.state, saleKind) : null;
  // Only the rules offered for this kind of sale. Some rules share the same numbers (a Texas property tax loan
  // foreclosure repays like a tax sale), so the rule in use is matched among these, never a rule the menu doesn't offer.
  const offered = offeredRedemptionRules(region.state, saleKind);
  const hintFor = (f: Field) => (commercial && f.k === 'exitValue' ? 'Use the value by income above.' : f.k === 'transferTaxPer500' ? (offer && tax.per500 > 0 ? `${tax.hint} Your contract says who pays: enter 0 if the seller pays it.` : tax.hint) : f.hint);
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
  const moreForField = (f: Field) =>
    f.k === 'redemptionMonths' && f.more && region.state === 'TX' ? f.more.replace('Optional remodeling', `${txRepaid()} Optional remodeling`) : moreFor(f);
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
  // The listing's opening bid is the starting point (older saved inputs didn't have it).
  const [i, setI] = useState<BidInputs>(() => {
    let v0 = load(storeId, propertyId ? defaults : { ...defaults, transferTaxPer500: tax.per500 });
    const stamped = regionOf();
    if (stamped !== regionSig) {
      if (stamped !== null && !typedKeys.has('transferTaxPer500')) v0 = { ...v0, transferTaxPer500: tax.per500 };
      stampRegion();
    }
    // An offer has no auction cash limit, buyer's premium or redemption wait.
    let v = offer ? offerInputs(v0) : v0;
    // A redemption rule left over from another kind of sale (IRS interest on an HOA sale, say) is replaced with the
    // one that fits, and has to be confirmed again.
    if (!offer && choices) {
      const cur = ruleOf(v, offered);
      if (!choices.keys.includes(cur)) {
        const r0 = rules[choices.start];
        v = { ...v, redemptionMonths: r0.months, redemptionRatePct: r0.ratePct, redemptionDaily: r0.daily, redemptionFlat: r0.flat, redemptionFlat2Pct: r0.flat2Pct, redemptionChecked: 0 };
        save(v);
      }
    }
    return !v.minimumBid && openingBid ? { ...v, minimumBid: openingBid } : v;
  });
  useEffect(() => {
    if (regionOf() === regionSig) return;
    stampRegion();
    if (!typedKeys.has('transferTaxPer500')) update({ transferTaxPer500: tax.per500 });
  }, [regionSig]); // eslint-disable-line react-hooks/exhaustive-deps
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
  const bid = Math.min(toNum(bidText), 1e10);
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
  const set = (k: keyof BidInputs, text: string, unit?: string) => {
    trackAction('calculator_used', true);
    markTyped(k);
    setDraft((d) => ({ ...d, [k]: text }));
    // Something that isn't a number keeps the last valid value (and shows why) instead of quietly becoming 0.
    if (calculatorInputError(text, (unit ?? '$') as never)) return;
    // Changing the redemption numbers by hand means the rule you confirmed may no longer be the one used.
    update({ [k]: clampInput(k, toNum(text)), ...(k.startsWith('redemption') && k !== 'redemptionChecked' ? { redemptionChecked: 0 } : {}) });
  };
  const pickRule = (rule: string) => {
    const r = rules[rule];
    setPicked(rule);
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
  const unconfirmed = !offer && !!choices?.confirm && !i.redemptionChecked;
  const r = maxSafeBid(i);
  const grid = stressGrid(i);
  const slower = maxSafeBid({ ...i, holdingMonths: i.holdingMonths + 3 }).profitBid;
  const redeemed = redemptionOutcome(i, bid > 0 ? bid : r.maxBid);
  // No resale value yet (e.g. a listing with no estimate): ask for one instead of saying "no bid works".
  const needsValue = !(i.exitValue > 0);
  const atBid = bid > 0 ? costsAtBid(i, bid) : null;
  const profit = bid > 0 ? profitAtBid(i, bid) : null;
  const over = bid > 0 && bid > r.maxBid;
  const target = requiredProfit(i);
  const steps = maxBidSteps(i);
  const atOpening = i.minimumBid > 0 ? profitAtBid(i, i.minimumBid) : 0;
  // The deal itself fails at the opening bid, or only the cash you entered falls short of it.
  const dealFails = i.minimumBid > 0 && r.profitBid < i.minimumBid;
  // Cash for the opening bid counts everything until you sell (repairs, holding, fees), the same way the cash limit does.
  const openingCash = i.minimumBid > 0 ? cashNeededAtBid(i, i.minimumBid) : 0;
  const cashShort = !dealFails && i.minimumBid > 0 && i.cashAvailable > 0 && r.limitedBy === 'cash' && r.maxBid < i.minimumBid;
  // Where the state has no transfer tax (and none was entered), the field is left out instead of sitting at $0.
  const noTransferTax = tax.per500 === 0 && !i.transferTaxPer500;
  const shown = (f: Field) => (mode === 'detailed' || f.quick) && (!f.when || f.when(i)) && !(offer && OFFER_HIDDEN.has(f.k)) && !(noTransferTax && f.k === 'transferTaxPer500');
  // Which inputs on screen still hold our starting estimates (the listing's own numbers don't count).
  const still = exampleLabels(GROUPS.flatMap((g) => g.fields.filter(shown).map((f) => (offer && OFFER_FIELDS[f.k] ? { ...f, ...OFFER_FIELDS[f.k] } : f))), i, offer ? offerInputs(defaults) : defaults, typedKeys, NOT_EXAMPLES);
  const yours = offer ? 'Your offer' : 'Your bid';
  // Costs still at $0 that nobody entered: unknown, not confirmed zero. Typing 0 confirms there's none.
  const unentered = ZERO_CHECK.filter(([k]) => !((i[k] ?? 0) > 0) && !typedKeys.has(k) && !(offer && k === 'possession')).map(([k, l]) => (offer && k === 'titleLegal' ? 'title insurance, escrow and attorney' : l));
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
          const fields = g.fields.filter(shown).map((f) => (offer && OFFER_FIELDS[f.k] ? { ...f, ...OFFER_FIELDS[f.k] } : f)).map((f) =>
            f.k === 'redemptionRatePct' && i.redemptionFlat
              ? { ...f, label: i.redemptionFlat2Pct ? 'Premium a redemption pays you (first year)' : 'Premium a redemption pays you', unit: '%' as const, hint: i.redemptionFlat2Pct ? `A flat % of your price set by law, not a yearly rate; ${i.redemptionFlat2Pct}% in the second year.` : 'A flat % of your price set by law, not a yearly rate. It’s the most the law allows.' }
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
                          <button type="button" aria-pressed={!i.profitInDollars} onClick={() => { setDraft((d) => ({ ...d, targetProfitMin: undefined })); update({ profitInDollars: 0 }); }}>%</button>
                          <button type="button" aria-pressed={!!i.profitInDollars} onClick={() => { setDraft((d) => ({ ...d, targetProfitMin: undefined })); update({ profitInDollars: 1 }); }}>$</button>
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
                        aria-invalid={draft[f.k] !== undefined && !!calculatorInputError(draft[f.k]!, f.unit as never)}
                        onChange={(e) => set(f.k, e.target.value, f.unit)} onInput={() => markTyped(f.k)}
                        onBlur={() => { if (draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit as never)) return; setDraft((d) => ({ ...d, [f.k]: undefined })); }}
                      />
                      {f.unit !== '$' && <i aria-hidden>{unitText(f.unit)}</i>}
                    </span>
                    <span className="calc-hint">
                      {draft[f.k] !== undefined && calculatorInputError(draft[f.k]!, f.unit as never) && <small className="deal-urgent calc-error" role="status">{calculatorInputError(draft[f.k]!, f.unit as never)}</small>}
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
        {unconfirmed && (
          <div className="caution calc-unconfirmed">
            <strong>Redemption rule not confirmed.</strong> {choices?.confirm} Your walk-away price now uses{' '}
            {ruleNow === 'custom'
              ? <>your own numbers: a {Math.round(i.redemptionMonths)}-month wait. That’s a what-if for holding costs, not the legal deadline: the owner can still redeem until the period the law sets ends.</>
              : <>{offered[ruleNow]?.label}.</>}{' '}
            Pick the rule under Holding and financing (Detailed), then confirm it here.
            <label className="calc-check">
              <input type="checkbox" checked={false} onChange={() => update({ redemptionChecked: 1 })} />
              <span>I’ve checked the records, and the redemption rule set in this calculator is the one that applies.</span>
            </label>
          </div>
        )}
        {!offer && choices?.confirm && !!i.redemptionChecked && (
          <p className="small muted">Redemption rule confirmed by you: {ruleNow === 'custom' ? `your own numbers, a ${Math.round(i.redemptionMonths)}-month wait` : offered[ruleNow]?.label}. <button type="button" className="linkish" onClick={() => update({ redemptionChecked: 0 })}>Undo</button></p>
        )}
        <ExampleResults count={needsValue ? 0 : still.length} />
        {!needsValue && <PriceHead kind="target" label="Walk-away price" price={r.noBidWorks || cashShort ? null : r.maxBid} result={r.noBidWorks || cashShort ? null : r.profit} unit="profit" note={r.noBidWorks || cashShort ? undefined : `Not the result at ${yours.toLowerCase()}: this is the most you could pay and still meet your goal.`} />}
        {needsValue ? (
          <div className="calc-max" role="status">
            <span>Walk-away price</span>
            <strong>Enter a resale value</strong>
            <small>{propertyId ? 'We don’t estimate values for listings from the official list. ' : `Start with the ${w.opening} from the listing, then the costs. `}The resale value comes from recent sold prices of similar nearby properties, as they’d be after repairs.</small>
          </div>
        ) : (
          cashShort ? (
          <div className="calc-max bad" role="status">
            <span>Walk-away price</span>
            <strong>Not enough cash</strong>
            <small>At the {w.opening} you’d need about {fmtMoney(Math.round(openingCash))}: the {w.bid} plus repairs and every cost until you sell. The deal itself allows {w.bid}s up to {fmtMoney(r.profitBid)}.</small>
          </div>
          ) : (
          <div className={`calc-max${r.noBidWorks ? ' bad' : ''}`} role="status">
            <span>{offer ? 'Walk-away price: your highest offer' : 'Walk-away price: stop bidding here'}</span>
            <strong>{r.noBidWorks ? `No ${w.bid} works` : fmtMoney(r.maxBid)}</strong>
            <small>
              {r.noBidWorks
                ? r.limitedBy === 'cash' && r.profitBid > 0
                  ? `Your cash doesn’t cover the repairs and costs until you sell, even before a ${w.bid}. Your profit target alone would allow ${fmtMoney(r.profitBid)}.`
                  : 'Even at $0, costs leave less than your profit target. Walk away or change your plan.'
                : r.limitedBy === 'cash'
                  ? `Set by the cash you can bring: the ${w.bid} plus every cost until you sell (repairs, holding, fees). Your profit target alone would allow ${fmtMoney(r.profitBid)}.`
                  : `Leaves your ${fmtMoney(Math.round(target))} profit target after every cost, based on your numbers. Not a guarantee.`}
              {!r.noBidWorks && !(i.minimumBid > 0) && unenteredNote}
            </small>
          </div>
          )
        )}
        {!needsValue && i.minimumBid > 0 && <PriceHead kind="listed" tag={offer ? 'From the listing' : 'From the sale notice'} label={w.Opening} price={i.minimumBid} result={atOpening} unit="profit" note={`Estimated cash you’d put in at this price, under these assumptions (through repairs and holding until it sells): ${fmtMoney(Math.round(openingCash))}.`} />}
        {!needsValue && i.minimumBid > 0 && (
          <div className={`calc-verdict ${dealFails || cashShort ? 'bad' : 'good'}`}>
            {dealFails ? (
              offer ? (
                <><strong>Misses your target at the {w.opening}.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, below your {fmtMoney(Math.round(target))} target. {r.maxBid > 0 ? <>Offer no more than {fmtMoney(r.maxBid)}, or pass.</> : 'Pass, or change your plan.'}</>
              ) : (
                <><strong>Doesn’t work at the {w.opening}.</strong> At {fmtMoney(i.minimumBid)} your profit would be {fmtMoney(Math.round(atOpening))}, below your {fmtMoney(Math.round(target))} target. Skip this one or change your plan.</>
              )
            ) : cashShort ? (
              <><strong>Your cash doesn’t cover the {w.opening}.</strong> The deal works (about {fmtMoney(Math.round(atOpening))} profit at {fmtMoney(i.minimumBid)}), but with repairs and every cost until you sell you’d need about {fmtMoney(Math.round(openingCash))}, and you entered {fmtMoney(i.cashAvailable)}.</>
            ) : (
              offer ? (
                <><strong>Meets your profit target at the {w.opening}, with the numbers entered.</strong> Your most is {fmtMoney(r.maxBid)}, but you don’t have to offer more than {fmtMoney(i.minimumBid)}: start lower if the market allows. Going past {fmtMoney(r.maxBid)} means accepting less than the profit you asked for. At the {w.opening} your profit would be about {fmtMoney(Math.round(atOpening))}.{unenteredNote}</>
              ) : (
                <><strong>{fmtMoney(r.maxBid - i.minimumBid)} of room above the {w.opening}.</strong> Bidding starts at {fmtMoney(i.minimumBid)}; stop at {fmtMoney(r.maxBid)}. At the {w.opening} your profit would be about {fmtMoney(Math.round(atOpening))}.{unenteredNote}</>
              )
            )}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <div className="calc-steps">
            <strong>How we got your walk-away price</strong>
            <dl className="calc-kv">
              {steps.map((st, n) => <div key={st.label} className={n === 0 ? 'first' : ''}><dt>{st.label}</dt><dd>{n === 0 ? fmtMoney(st.amount) : `− ${fmtMoney(-st.amount)}`}</dd></div>)}
              <div className="total"><dt>{r.limitedBy === 'cash' ? 'Most the deal allows' : w.max}</dt><dd>{fmtMoney(r.profitBid)}</dd></div>
            </dl>
            {r.limitedBy === 'cash' && <p className="small muted">The cash you can bring sets your walk-away price lower than this.</p>}
          </div>
        )}
        {!r.noBidWorks && !needsValue && (
          <dl className="calc-kv">
            {!offer && <div><dt>Cash needed on auction day, at the walk-away price</dt><dd>{fmtMoney(r.cashAtAuction)}</dd></div>}
            <div><dt>Estimated cash you’d put in, at the walk-away price, under these assumptions</dt><dd>{fmtMoney(r.cashPeak)}</dd></div>
            {i.financedPct > 0 && r.cashToStabilize < r.cashPeak && <div><dt>Cash left in after the loan funds, at the walk-away price</dt><dd>{fmtMoney(r.cashToStabilize)}</dd></div>}
            <div><dt>Profit at the walk-away price</dt><dd>{fmtMoney(Math.round(r.profit))}</dd></div>
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
        {redeemed && !needsValue && (
          <div className="calc-note">
            <strong>If {ruleNow === 'usFederal' || ruleNow === 'usCourt' ? 'the United States' : 'the owner'} redeems: an illustration of your bid and what the law adds</strong>
            <p className="small">
              {i.redemptionFlat ? <>If the owner redeems {i.redemptionFlat2Pct ? 'in the first year' : 'at any time in the wait'}, the law adds {i.redemptionRatePct}% of your price{i.redemptionFlat2Pct ? `, or ${i.redemptionFlat2Pct}% in the second year` : ''}, no matter how early. </> : null}At the end of the {Math.round(i.redemptionMonths)}-month wait you’d get back about {fmtMoney(Math.round(redeemed.repaid))} on a {fmtMoney(bid > 0 ? bid : r.maxBid)} bid. By then you’d have spent about {fmtMoney(Math.round(redeemed.spent))}, so you’d {redeemed.net >= 0 ? `come out about ${fmtMoney(Math.round(redeemed.net))} ahead` : `be about ${fmtMoney(Math.round(-redeemed.net))} short`}.{' '}
              {region.state === 'TX' && taxLoanRule
                ? 'This isn’t the full Texas payoff: the law also repays the costs you reasonably spent on the property, plus interest on them at the legal judgment rate: property insurance, repairs required by a building code, an ordinance or a lease in effect at the sale, city health-and-safety liens, HOA dues and certain fees (Tax Code 32.06(k)(2), 34.21(g)). Optional remodeling isn’t on that list. Keep every receipt and ask an attorney which of your costs qualify.'
                : region.state === 'TX' && saleKind === 'taxSale'
                ? 'This isn’t the full Texas payoff: it leaves out the deed recording fee, the taxes, penalties and interest you paid, and eligible costs, which the law also repays: property insurance, repairs required by a building code, an ordinance or a lease in effect at the sale, city health-and-safety liens, HOA dues and certain fees (Tax Code 34.21(a), (g)). Optional remodeling isn’t on that list. Keep every receipt and ask an attorney which of your costs qualify.'
                : 'This leaves out other amounts some rules also repay, such as taxes, assessments or costs the law lists; optional remodeling usually isn’t repaid. Ask an attorney what your sale’s rule repays.'}
            </p>
          </div>
        )}

        {!needsValue && (
        <>
        <div className="calc-field calc-bid">
          <label className="calc-label" htmlFor={`${uid}-bid`}>Check {offer ? 'an offer' : 'a bid'}</label>
          <span className="calc-input"><i aria-hidden>$</i><input id={`${uid}-bid`} type="text" inputMode="decimal" autoComplete="off" value={bidText} placeholder={offer ? 'e.g. the offer you plan to make' : 'e.g. a bid you expect to beat'} onChange={(e) => { trackAction('calculator_used', true); setBidText(e.target.value); update({ proposedPrice: clampInput('proposedPrice', toNum(e.target.value)) }); }} /></span>
        </div>
        {atBid && profit !== null && <PriceHead kind="yours" label={yours} price={bid} result={profit} unit="profit" note={`Estimated cash you’d put in at this price, under these assumptions (through repairs and holding until it sells): ${fmtMoney(Math.round(cashNeededAtBid(i, bid)))}.${saveAs && !propertyId ? ' Saved with this deal as your price; its deal packet uses it.' : propertyId ? ' Saved for this property in this browser.' : ''}`} />}
        {atBid && profit !== null && !needsValue && (
          <div className={`calc-verdict ${over ? 'bad' : 'good'}`} role="status">
            {over ? (
              <><strong>Above your walk-away price.</strong> At {fmtMoney(bid)} this deal no longer meets your {r.limitedBy === 'cash' && bid <= r.profitBid ? 'cash limit' : 'target'}. Profit would be {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}. Past your walk-away price, this deal no longer meets your own numbers.</>
            ) : (
              <><strong>Within your walk-away price.</strong> Estimated profit {fmtMoney(Math.round(profit))}{pct(profit, i.exitValue)}.</>
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
        <p className="small muted calc-grid-note">Highest {w.bid} that still meets your profit target if the resale value (rows) or repairs (columns) come in differently{i.cashAvailable > 0 ? ', before your cash limit' : ''}.</p>
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
        <p className="muted small">An estimate to help you set a limit before you {offer ? 'make an offer' : 'bid'}, not advice. Replace every starting number with your own comps, bids and quotes.</p>
      </div>

      {/* On phones the results sit below every input, so keep the answer in view while typing. */}
      <button type="button" hidden={resultsVisible || !calcInView} className={`calc-sticky${r.noBidWorks && !needsValue ? ' bad' : ''}`} onClick={() => document.getElementById(`${uid}-results`)?.scrollIntoView({ behavior: 'smooth' })}>
        <span>Walk-away price</span>
        <strong>{Object.entries(draft).some(([k, t]) => t !== undefined && calculatorInputError(t, (fieldUnit(k) ?? '$') as never)) ? 'Fix the highlighted number' : needsValue ? 'Add resale value' : cashShort ? 'Not enough cash' : r.noBidWorks ? `No ${w.bid} works` : fmtMoney(r.maxBid)}</strong>
        <span className="calc-sticky-go">See details&nbsp;↓</span>
      </button>
    </div>
  );
}
