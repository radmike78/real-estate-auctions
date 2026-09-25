// Pre-foreclosure tracker: where a non-judicial (trustee or HOA) foreclosure stands.
//
// Nevada sequence (NRS 107.080 for deeds of trust; NRS 116.31162-.31164 for HOA liens):
//   1. Notice of Default and Election to Sell is recorded.
//   2. After at least 3 months, a Notice of Sale may be recorded. It must be posted for
//      20 days and published once a week for 3 weeks, so the sale is at least ~3 weeks later.
//      Owner-occupied homes may enter the Foreclosure Mediation Program, which adds time.
//   3. The auction is held, postponed, or cancelled (reinstatement, loan modification,
//      payoff, short sale, or a bankruptcy stay).
// Many notices of default never reach auction.

import type { Property } from '../types';
import { fmtDate } from './status';

export type ForeclosureStage =
  | 'DEFAULT_RECORDED'
  | 'SALE_SCHEDULED'
  | 'POSTPONED'
  | 'BANKRUPTCY_STAY'
  | 'AWAITING_RESULT'
  | 'CANCELLED'
  | 'SOLD_AT_AUCTION'
  | 'REVERTED_TO_LENDER';

export const STAGE_INFO: Record<ForeclosureStage, { label: string; step: 0 | 1 | 2 | 3; tone: 'wait' | 'go' | 'stop' | 'info'; ended: boolean }> = {
  DEFAULT_RECORDED: { label: 'Notice of default', step: 0, tone: 'wait', ended: false },
  SALE_SCHEDULED: { label: 'Sale scheduled', step: 1, tone: 'go', ended: false },
  POSTPONED: { label: 'Sale postponed', step: 1, tone: 'wait', ended: false },
  BANKRUPTCY_STAY: { label: 'Bankruptcy stay', step: 1, tone: 'stop', ended: false },
  AWAITING_RESULT: { label: 'Result not yet recorded', step: 2, tone: 'info', ended: false },
  CANCELLED: { label: 'Cancelled / reinstated', step: 3, tone: 'stop', ended: true },
  SOLD_AT_AUCTION: { label: 'Sold at auction', step: 3, tone: 'info', ended: true },
  REVERTED_TO_LENDER: { label: 'Bank-owned (REO)', step: 3, tone: 'info', ended: true },
};

export const PIPELINE = ['Notice of default', 'Notice of sale', 'Auction', 'Outcome'] as const;

export interface ForeclosureTrack {
  stage: ForeclosureStage;
  kind: 'Mortgage (trustee)' | 'HOA';
  defaultRecordedOn: string;
  earliestNoticeOfSale: string; // NOD + 3 months
  noticeOfSaleOn: string | null;
  saleAt: string | null;
  daysInForeclosure: number;
  next: string;
}

const DAY = 86_400_000;

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0); // clamp e.g. Nov 30 + 3 months -> Feb 28/29
  return d.toISOString().slice(0, 10);
}

/** Returns the foreclosure track for a property with a recorded notice of default, else null. */
export function foreclosureTrack(p: Property, now = new Date()): ForeclosureTrack | null {
  const nod = [...p.events].reverse().find((e) => e.type === 'NOTICE_OF_DEFAULT');
  if (!nod) return null;
  const after = p.events.filter((e) => e.date >= nod.date);
  const has = (t: string) => after.some((e) => e.type === t);
  const noticeOfSale = after.find((e) => e.type === 'NOTICE_OF_SALE') ?? null;
  const sold = after.find((e) => e.type === 'SOLD');
  const saleAt =
    p.sale && (p.sale.saleType === 'TRUSTEE_SALE' || p.sale.saleType === 'HOA_FORECLOSURE') ? p.sale.startsAt : null;

  let stage: ForeclosureStage;
  if (sold) stage = /lender|REO/i.test(sold.description) ? 'REVERTED_TO_LENDER' : 'SOLD_AT_AUCTION';
  else if (has('SALE_CANCELLED')) stage = 'CANCELLED';
  else if (has('BANKRUPTCY_FILED')) stage = 'BANKRUPTCY_STAY';
  else if (has('SALE_POSTPONED')) stage = 'POSTPONED';
  else if (saleAt && Date.parse(saleAt) < now.getTime()) stage = 'AWAITING_RESULT';
  else if (noticeOfSale) stage = 'SALE_SCHEDULED';
  else stage = 'DEFAULT_RECORDED';

  const earliest = addMonths(nod.date, 3);
  const nextByStage: Record<ForeclosureStage, string> = {
    DEFAULT_RECORDED:
      now.toISOString().slice(0, 10) < earliest
        ? `A notice of sale can't be recorded before ${fmtDate(earliest)} (3 months after the notice of default was recorded).`
        : 'A notice of sale may be recorded at any time. The sale would follow at least ~3 weeks later.',
    SALE_SCHEDULED: 'The auction is scheduled. Owners often reinstate, modify or sell before the date.',
    POSTPONED: 'Watch for a new sale date. Postponements are common and may repeat.',
    BANKRUPTCY_STAY: 'The sale is on hold until the bankruptcy court lifts the stay or the case is dismissed.',
    AWAITING_RESULT: "The sale date has passed. Check for a recorded trustee's deed, postponement or cancellation.",
    CANCELLED: 'The foreclosure was stopped. The property is not heading to auction.',
    SOLD_AT_AUCTION: "Sold to a third-party bidder at auction. A trustee's deed is recorded.",
    REVERTED_TO_LENDER: 'No bidder beat the lender. The lender now owns it and may list it as a bank-owned (REO) sale.',
  };

  return {
    stage,
    kind: p.sale?.saleType === 'HOA_FORECLOSURE' || /HOA/i.test(nod.description) ? 'HOA' : 'Mortgage (trustee)',
    defaultRecordedOn: nod.date,
    earliestNoticeOfSale: earliest,
    noticeOfSaleOn: noticeOfSale?.date ?? null,
    saleAt,
    daysInForeclosure: Math.max(0, Math.floor((now.getTime() - Date.parse(`${nod.date}T12:00:00Z`)) / DAY)),
    next: nextByStage[stage],
  };
}
