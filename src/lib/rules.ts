// Jurisdiction rules engine (Nevada / Clark County).
//
// This produces *apparent* lien outcomes for a pending sale so a buyer knows what to
// ask a title professional about. It deliberately never says title is "cleared" —
// every outcome is a screening signal, not a legal determination.

import type { Lien, LienType, Property, SaleType } from '../types';

export type SurvivalOutcome = 'FORECLOSING' | 'LIKELY_EXTINGUISHED' | 'LIKELY_SURVIVES' | 'UNCERTAIN';

export interface LienAssessment {
  lien: Lien;
  outcome: SurvivalOutcome;
  reason: string;
}

const isJunior = (lien: Lien, foreclosing: Lien | undefined) =>
  !!foreclosing && lien.recordedDate > foreclosing.recordedDate;

function assess(lien: Lien, saleType: SaleType, foreclosing: Lien | undefined): Omit<LienAssessment, 'lien'> {
  if (lien.foreclosing) {
    return { outcome: 'FORECLOSING', reason: 'This is the debt being enforced; it is paid from sale proceeds.' };
  }

  // Liens that commonly need specialist review regardless of sale type.
  const special: Partial<Record<LienType, Omit<LienAssessment, 'lien'>>> = {
    FEDERAL_TAX: {
      outcome: 'UNCERTAIN',
      reason:
        'Discharged by a non-judicial sale only if the IRS received proper notice at least 25 days before the sale; the U.S. may keep a 120-day redemption right (26 U.S.C. § 7425).',
    },
    MECHANICS: {
      outcome: 'UNCERTAIN',
      reason: "Mechanic's lien priority can relate back to when work began, not when the lien was recorded (NRS 108.225).",
    },
    CODE_ENFORCEMENT: {
      outcome: 'UNCERTAIN',
      reason: 'Some municipal abatement liens have statutory priority. Confirm with the city or county.',
    },
    MUNICIPAL_UTILITY: {
      outcome: 'UNCERTAIN',
      reason: 'Sewer, water and special-assessment liens may be collected like taxes and survive. Confirm with the issuing agency.',
    },
  };

  switch (saleType) {
    case 'TAX_DEED':
      if (lien.type in special && lien.type !== 'MECHANICS') return special[lien.type]!;
      return {
        outcome: 'LIKELY_EXTINGUISHED',
        reason:
          'A Nevada tax deed generally cuts off private liens, but Clark County warns not all liens are satisfied by its tax auction. Verify before bidding.',
      };

    case 'TAX_LIEN_CERTIFICATE':
      return {
        outcome: 'LIKELY_SURVIVES',
        reason: 'A lien certificate transfers the tax debt only, and every existing lien stays on the property.',
      };

    case 'REO':
      return {
        outcome: 'UNCERTAIN',
        reason: "The property has already been sold. Check whether the lender's foreclosure cleared this lien and require title insurance.",
      };

    case 'TRUSTEE_SALE':
    case 'JUDICIAL_FORECLOSURE':
    case 'SHERIFF_EXECUTION':
    case 'HOA_FORECLOSURE':
    case 'FEDERAL_TAX_SEIZURE': {
      if (lien.type === 'PROPERTY_TAX') {
        return { outcome: 'LIKELY_SURVIVES', reason: 'Property taxes are senior to private liens and stay with the property.' };
      }
      if (lien.type === 'HOA_SUPERPRIORITY' && saleType !== 'HOA_FORECLOSURE') {
        return {
          outcome: 'LIKELY_SURVIVES',
          reason: 'Under NRS 116.3116 the super-priority portion (about 9 months of assessments) ranks ahead of a first deed of trust.',
        };
      }
      if (lien.type === 'FIRST_DEED_OF_TRUST' && saleType === 'HOA_FORECLOSURE') {
        return {
          outcome: 'UNCERTAIN',
          reason:
            'A properly noticed HOA super-priority sale can extinguish a first deed of trust (SFR Investments v. U.S. Bank, 2014), but these sales are frequently litigated.',
        };
      }
      if (lien.type in special) return special[lien.type]!;
      if (!foreclosing) {
        return { outcome: 'UNCERTAIN', reason: 'No foreclosing lien is identified, so priority cannot be compared.' };
      }
      return isJunior(lien, foreclosing)
        ? { outcome: 'LIKELY_EXTINGUISHED', reason: 'Recorded after the foreclosing lien. Junior liens are generally wiped out by the sale.' }
        : { outcome: 'LIKELY_SURVIVES', reason: 'Recorded before the foreclosing lien. Senior liens generally stay with the property.' };
    }
  }
}

export function assessLiens(p: Property): LienAssessment[] {
  if (!p.sale) {
    return p.liens.map((lien) => ({
      lien,
      outcome: 'UNCERTAIN' as const,
      reason: 'No sale is pending, so every lien remains attached to the property.',
    }));
  }
  const foreclosing = p.liens.find((l) => l.foreclosing);
  return p.liens.map((lien) => ({ lien, ...assess(lien, p.sale!.saleType, foreclosing) }));
}

export interface MoneySummary {
  minimumBid: number | null;
  likelySurviving: number;
  uncertain: number;
  estimatedEquity: number | null; // market value − min bid − likely surviving debt
}

export function moneySummary(p: Property): MoneySummary {
  const a = assessLiens(p);
  const sum = (o: SurvivalOutcome) => a.filter((x) => x.outcome === o).reduce((t, x) => t + x.lien.amount, 0);
  const likelySurviving = p.sale ? sum('LIKELY_SURVIVES') : p.liens.reduce((t, l) => t + l.amount, 0);
  const minimumBid = p.sale?.minimumBid ?? null;
  return {
    minimumBid,
    likelySurviving,
    uncertain: p.sale ? sum('UNCERTAIN') : 0,
    estimatedEquity: minimumBid === null ? null : p.estimatedMarketValue - minimumBid - likelySurviving,
  };
}

// "What exactly is the buyer purchasing?"
export const WHAT_YOU_BUY: Record<SaleType, string> = {
  TAX_DEED: "A tax deed from the County Treasurer. It is usually a quitclaim-style deed with no warranty of title, sold as-is, and the auction exists to recover delinquent taxes rather than to act as a traditional real-estate sale.",
  TAX_LIEN_CERTIFICATE: 'The right to collect the delinquent tax debt plus interest. You do NOT get ownership; foreclosure may come later if the owner never redeems.',
  TRUSTEE_SALE: "A trustee's deed (non-judicial foreclosure under NRS 107). There is no warranty, and the property is sold as-is, often without an interior inspection.",
  JUDICIAL_FORECLOSURE: "A sheriff's certificate of sale followed by a deed. Nevada gives the owner a redemption right for up to 1 year after a judicial sale.",
  HOA_FORECLOSURE: "A deed from the HOA's foreclosure agent under NRS 116. Whether the first mortgage survives depends on notice and how much was foreclosed. This is heavily litigated in Nevada.",
  SHERIFF_EXECUTION: "A sheriff's certificate of sale on a judgment execution (NRS 21). The debtor may redeem within 1 year, and you receive only the debtor's interest.",
  FEDERAL_TAX_SEIZURE: "A certificate of sale from the IRS, then an IRS deed after a 180-day redemption period (26 U.S.C. § 6337). You receive only the taxpayer's interest.",
  REO: 'A property the lender already owns. It is bought by offer through a broker or an online auction, usually with a special warranty deed and title insurance available.',
};

export const SALE_TYPE_LABEL: Record<SaleType, string> = {
  TAX_DEED: 'Tax-deed sale',
  TAX_LIEN_CERTIFICATE: 'Tax-lien certificate',
  TRUSTEE_SALE: 'Trustee sale (mortgage)',
  JUDICIAL_FORECLOSURE: 'Judicial foreclosure',
  HOA_FORECLOSURE: 'HOA foreclosure',
  SHERIFF_EXECUTION: 'Sheriff execution sale',
  FEDERAL_TAX_SEIZURE: 'IRS seizure sale',
  REO: 'REO / bank-owned',
};
