// Property due-diligence (title-risk) report. Screening only. Never claims clear title.

import type { Property } from '../types';
import { assessLiens, moneySummary } from './rules';
import { fmtMoney } from './status';

export type CheckResult = 'ok' | 'flag' | 'review' | 'manual';

export interface Check {
  area: string;
  result: CheckResult;
  detail: string;
}

export function diligenceReport(p: Property): Check[] {
  const assessments = assessLiens(p);
  const surviving = assessments.filter((a) => a.outcome === 'LIKELY_SURVIVES');
  const uncertain = assessments.filter((a) => a.outcome === 'UNCERTAIN');
  const money = moneySummary(p);
  const has = (t: string) => p.liens.some((l) => l.type === t);
  const taxLien = p.liens.find((l) => l.type === 'PROPERTY_TAX');
  const lisPendens = p.events.some((e) => e.type === 'LIS_PENDENS');
  const stage = [...p.events].reverse().find((e) => ['NOTICE_OF_DEFAULT', 'NOTICE_OF_SALE', 'SALE_POSTPONED', 'SOLD', 'DEEDED_TO_TRUSTEE'].includes(e.type));

  return [
    { area: 'Chain of title', result: 'manual', detail: 'Requires a full recorder search (grantor/grantee index) by a title company.' },
    {
      area: 'Mortgages and assignments',
      result: has('FIRST_DEED_OF_TRUST') || has('SECOND_DEED_OF_TRUST') ? 'review' : 'ok',
      detail: `${p.liens.filter((l) => l.type.endsWith('DEED_OF_TRUST')).length} deed(s) of trust found. Check recorded assignments for the current beneficiary.`,
    },
    {
      area: 'Liens and apparent priority',
      result: surviving.length ? 'flag' : uncertain.length ? 'review' : 'ok',
      detail: `${surviving.length} likely survive (${fmtMoney(money.likelySurviving)}), and ${uncertain.length} are uncertain (${fmtMoney(money.uncertain)}).`,
    },
    { area: 'Releases / satisfactions', result: 'manual', detail: 'Check whether any lien listed above has a recorded release that has not been matched yet.' },
    {
      area: 'Federal tax liens',
      result: has('FEDERAL_TAX') ? 'flag' : 'ok',
      detail: has('FEDERAL_TAX') ? 'A federal tax lien is recorded. Confirm whether it ranks ahead of the lien being foreclosed, whether the IRS got 25 days’ notice, and the U.S. redemption right (120 days, or longer after a court or sheriff sale).' : 'None found in the sources checked.',
    },
    {
      area: 'Property-tax status',
      result: taxLien ? 'flag' : 'ok',
      detail: taxLien ? `${fmtMoney(taxLien.amount)} delinquent per the Treasurer.` : 'Current per the Treasurer.',
    },
    (() => {
      const hoaMuni = p.liens.some((l) => l.type.startsWith('HOA') || l.type === 'MUNICIPAL_UTILITY' || l.type === 'CODE_ENFORCEMENT');
      return {
        area: 'HOA and municipal liens',
        result: hoaMuni ? 'flag' : 'ok',
        detail: hoaMuni
          ? 'Nevada HOA super-priority liens can survive a mortgage foreclosure. Request a payoff/resale package from the HOA.'
          : 'None recorded. If the property is in an HOA, request a statement anyway, since assessments may be unpaid but not yet recorded.',
      } satisfies Check;
    })(),
    { area: 'Lis pendens', result: lisPendens ? 'flag' : 'ok', detail: lisPendens ? 'Pending litigation affecting title is recorded.' : 'None recorded.' },
    { area: 'Foreclosure stage', result: stage ? 'review' : 'ok', detail: stage ? stage.description : 'No foreclosure activity recorded.' },
    {
      area: 'Bankruptcy',
      result: p.flags.bankruptcy ? 'flag' : 'ok',
      detail: p.flags.bankruptcy ? 'A bankruptcy filing was detected. The automatic stay halts the sale until relief is granted.' : 'No filing matched to the owner (PACER check recommended).',
    },
    { area: 'Easements and restrictions', result: 'manual', detail: 'Review the recorded CC&Rs, plat and easements.' },
    {
      area: 'Code violations / demolition',
      result: p.flags.codeViolations ? 'flag' : 'ok',
      detail: p.flags.codeViolations ? `${p.flags.codeViolations} open code case(s).` : 'No open cases found.',
    },
    {
      area: 'Flood, wildfire, environmental',
      result: p.flags.floodZone.startsWith('A') || p.flags.wildfireRisk === 'High' ? 'flag' : 'ok',
      detail: `FEMA flood zone ${p.flags.floodZone}; wildfire risk ${p.flags.wildfireRisk}. Environmental records have not been checked.`,
    },
    { area: 'Zoning and land use', result: 'ok', detail: `Zoned ${p.flags.zoning}.` },
    {
      area: 'Building permits',
      result: p.flags.openPermits ? 'review' : 'ok',
      detail: p.flags.openPermits ? `${p.flags.openPermits} open/expired permit(s).` : 'No open permits.',
    },
    {
      area: 'Occupancy',
      result: p.occupancy === 'Vacant' ? 'ok' : 'review',
      detail: `${p.occupancy}. Occupied properties may require an eviction after purchase.`,
    },
    {
      area: 'Repair exposure',
      result: 'manual',
      detail: p.sqft ? `Interior access is rarely allowed before auction. Budget roughly ${fmtMoney(p.sqft * 25)}–${fmtMoney(p.sqft * 60)} (about $25–60 per sq ft).` : 'Vacant land: check utilities and access.',
    },
    { area: 'Comparable sales', result: 'manual', detail: `The estimated value of ${fmtMoney(p.estimatedMarketValue)} is a model estimate. Pull comps before bidding.` },
    {
      area: 'Estimated equity',
      result: money.estimatedEquity === null ? 'review' : money.estimatedEquity > 0 ? 'ok' : 'flag',
      detail:
        money.estimatedEquity === null
          ? 'No minimum bid is published.'
          : `${fmtMoney(money.estimatedEquity)} = value − minimum bid − likely surviving liens (excludes uncertain liens, repairs and costs).`,
    },
    {
      area: 'Redemption rights',
      result: p.sale?.redemptionPeriod && !/^none|expired/i.test(p.sale.redemptionPeriod) ? 'flag' : 'ok',
      detail: p.sale?.redemptionPeriod ?? 'Not applicable.',
    },
    { area: 'Deed type offered', result: 'review', detail: p.sale?.deedType ?? 'No sale pending.' },
    {
      area: 'Title insurance availability',
      result: p.sale?.saleType === 'REO' ? 'ok' : 'review',
      detail:
        p.sale?.saleType === 'REO'
          ? 'Typically available on a lender sale.'
          : 'Many insurers will not insure right after a tax, HOA or execution sale without a quiet-title action. Ask a title company.',
    },
  ];
}
