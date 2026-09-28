import type { AcquisitionStatus, Property, SaleType } from '../types';

interface StatusInfo {
  label: string;
  tone: 'go' | 'wait' | 'stop' | 'info';
  // "Is the property actually heading to sale?"
  explanation: string;
  purchasable: boolean;
}

export const STATUS: Record<AcquisitionStatus, StatusInfo> = {
  ONLINE_BIDDING: {
    label: 'Online bidding',
    tone: 'go',
    purchasable: true,
    explanation: 'A sale is scheduled and bids are accepted online through the seller’s official auction site.',
  },
  IN_PERSON_AUCTION: {
    label: 'In-person auction',
    tone: 'go',
    purchasable: true,
    explanation: 'A sale is scheduled. You must attend in person and bid at the posted location.',
  },
  SEALED_BID: {
    label: 'Sealed bid',
    tone: 'go',
    purchasable: true,
    explanation: 'Written sealed bids are accepted until the deadline and opened at the posted time.',
  },
  BROKER_OFFER: {
    label: 'Bank-owned: make an offer',
    tone: 'go',
    purchasable: true,
    explanation: 'The lender already owns the property and accepts offers through a listing broker.',
  },
  COURT_CONFIRMATION_REQUIRED: {
    label: 'Redemption period applies',
    tone: 'wait',
    purchasable: true,
    explanation: 'You can bid, but the owner can redeem for up to 1 year after this court-ordered sale, and the deed comes only after that.',
  },
  LIEN_CERTIFICATE_ONLY: {
    label: 'Lien certificate only',
    tone: 'info',
    purchasable: false,
    explanation: 'Only an unpaid special assessment (SID) lien is sold. Buying it does not give you ownership of the property.',
  },
  PRE_FORECLOSURE_NOT_YET_PURCHASABLE: {
    label: 'Pre-foreclosure',
    tone: 'wait',
    purchasable: false,
    explanation: 'A default is recorded but no sale date is set yet. Nothing is for sale. If the owner decides to sell, it will usually be listed through an agent.',
  },
  SALE_CANCELLED_OR_POSTPONED: {
    label: 'Cancelled / postponed',
    tone: 'stop',
    purchasable: false,
    explanation: 'The sale was postponed or cancelled, often because the owner paid or filed bankruptcy. Watch for a new date.',
  },
  STATUS_REQUIRES_CONFIRMATION: {
    label: 'Needs confirmation',
    tone: 'info',
    purchasable: false,
    explanation: 'Our sources disagree or are stale. Confirm directly with the conducting agency.',
  },
  NOT_FOR_SALE_LIEN_ONLY: {
    label: 'Lien only, not for sale',
    tone: 'stop',
    purchasable: false,
    explanation:
      'Liens are recorded, but there is no enforcement event (notice of sale, levy or tax-sale listing). A lien by itself does not mean the property is for sale.',
  },
};

/** What happens with the deed after you win, which differs by type of sale. */
function deedStep(saleType: SaleType | undefined): string {
  switch (saleType) {
    case 'TAX_DEED':
      return 'The Treasurer records the quitclaim deed (usually within 30 days) and mails it to you.';
    case 'TRUSTEE_SALE':
      return 'The trustee records the trustee’s deed within 30 days, or gives it to you within 20 days for you to record within 10 (NRS 107.080).';
    case 'HOA_FORECLOSURE':
      return 'You receive a certificate of sale. The deed comes after the 60-day redemption period, if no one redeems (NRS 116.31166).';
    case 'FEDERAL_TAX_SEIZURE':
      return 'You receive a certificate of sale. The IRS deed comes after the 180-day redemption period, if no one redeems (26 U.S.C. §§ 6337–6338).';
    case 'SHERIFF_EXECUTION':
    case 'JUDICIAL_FORECLOSURE':
      return 'You receive a certificate of sale. The deed comes after the redemption period (up to 1 year), if no one redeems (NRS 21.190–21.210).';
    default:
      return 'Get the deed, and make sure it is recorded with the Clark County Recorder.';
  }
}

// "What must the buyer do next?"
export function purchaseSteps(p: Property): string[] {
  const s = p.sale;
  switch (p.status) {
    case 'ONLINE_BIDDING':
      return [
        `Create a bidder account on the official auction site${s?.registrationDeadline ? ` before ${fmtDate(s.registrationDeadline)}` : ''}.`,
        `Submit the required deposit${s?.deposit ? ` (${s.deposit})` : ''} using an accepted method: ${s?.paymentMethods.join(', ') || 'see official terms'}.`,
        'Read the official terms of sale, including the deed type, buyer premium and what liens are not satisfied.',
        s?.startsAt && s?.endsAt ? `Bid online between ${fmtDateTime(s.startsAt)} and ${fmtDateTime(s.endsAt)}.` : 'Bid online during the window in the sale notice (the dates aren’t posted yet).',
        `If you win, pay the balance by ${s?.finalPaymentDeadline ? fmtDate(s.finalPaymentDeadline) : 'the posted deadline'}.`,
        deedStep(s?.saleType),
        'Order a title search, and a quiet-title action if needed, before you rely on title or resell.',
        'Take possession lawfully. If it is occupied, the process depends on who lives there and how you bought it: after a foreclosure sale, removing a former owner or their tenant follows NRS 40.255, not a regular summary eviction. Talk to an attorney before acting.',
      ];
    case 'IN_PERSON_AUCTION':
    case 'SEALED_BID':
    case 'COURT_CONFIRMATION_REQUIRED':
      return [
        `Confirm the sale is still on with ${s?.conductedBy ?? 'the conducting agency'} the day before. Sales are often postponed at the last minute.`,
        'Bring government ID and complete any required bidder affidavit.',
        `Bring certified funds: ${s?.deposit ?? 'check the posted requirements'}.${s?.saleType === 'TRUSTEE_SALE' ? " Trustee sales in Nevada usually require cashier's checks." : ''}`,
        p.status === 'SEALED_BID'
          ? `Deliver your sealed bid to ${s?.location} before the deadline.`
          : `Attend the auction at ${s?.location} on ${s?.startsAt ? fmtDateTime(s.startsAt) : 'the posted date'}.`,
        'Bid under the auctioneer or trustee procedures announced at the sale.',
        `Pay any remaining balance by ${s?.finalPaymentDeadline ? fmtDate(s.finalPaymentDeadline) : 'the posted deadline'}.`,
        p.status === 'COURT_CONFIRMATION_REQUIRED'
          ? 'You receive a certificate of sale. Wait for the redemption period to end before the deed is issued.'
          : deedStep(s?.saleType),
        'Order title work and resolve any surviving liens, then handle possession and any quiet-title work.',
      ];
    case 'BROKER_OFFER':
      return [
        "Contact the listing broker and get the lender's offer requirements.",
        'Get pre-approval or proof of funds.',
        'Submit an offer and negotiate inspection and title contingencies where the lender allows them.',
        'Close through escrow with title insurance.',
      ];
    case 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE':
      return [
        'There is no auction yet. Track this property in the Pre-foreclosure tracker. If it proceeds, a Notice of Sale will be recorded and an auction date set.',
        'Do not contact the homeowner. Nevada licenses foreclosure consultants, buyers who use fraud or deceit on owners in foreclosure face criminal penalties, and the owner can undo such a sale for up to 2 years (NRS 645F).',
        'If the owner decides to sell, the home will be listed through a licensed agent, often as a short sale. Ask a short-sale agent to watch for it.',
      ];
    case 'LIEN_CERTIFICATE_ONLY':
      return [
        'Understand that you are buying a debt, not the property.',
        'Review the redemption period (2 years with a building, 120 days without) and interest of 1% a month on the price (NRS 271.610).',
        'If the owner never redeems, plan for serving notice (in person or by publication), paying the delinquent taxes and assessments, and asking for the deed before the certificate expires 3 years after redemption ends (NRS 271.595).',
      ];
    default:
      return [
        'This property cannot be bought through a forced sale right now.',
        'Set an alert to be notified if a notice of sale, levy or tax-sale listing is recorded.',
      ];
  }
}

export const fmtMoney = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Sales happen at the county's wall-clock time, so always display Las Vegas (Pacific) time
// regardless of where the viewer is.
const TZ = 'America/Los_Angeles';

// A date-only value (YYYY-MM-DD, e.g. a recording date) is a calendar date, not an instant:
// format it as-is. Full timestamps are shown in Las Vegas time.
export const fmtDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' });
