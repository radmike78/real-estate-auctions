// One file for a real property you're working on: your goal and cash, the property's numbers at your price with a
// downside case, what you've verified and what's still open, who's doing what, where you are in the steps, and your
// decision. Built from what's already saved in this browser; nothing new is stored.
import { kindLabel, SALE_KINDS, type Deal } from './analyze';
import { EVIDENCE_AREAS, GATES, loadLog } from './evidence';
import { rentAtPrice, rentStress, RENT_DEFAULTS, sanitizeNumbers, type RentInputs } from './holdCalc';
import { cleanGoal, cleanTeamList, GOAL_KEY, investorProfile, TEAM_LIST_KEY, TEAM_ROLES } from './myPlan';
import { proGuideByKey } from './proGuide';
import { countyName } from './regions';
import { ROADMAP, STEP_STATUS_LABEL } from './roadmap';
import { cleanDealSteps, DEAL_STEPS_KEY } from './roadmapDeals';

const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
const pct = (n: number | null) => (n === null ? 'n/a' : `${(n * 100).toFixed(1)}%`);

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/** The rental numbers saved for a deal at the price you'd pay, or null until a price is entered in Keep and rent. */
export function dealNumbers(d: Deal): { price: number; monthly: number; cashOnCash: number | null; target: number; cashIn: number } | null {
  const offer = d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short';
  const raw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
  if (!raw) return null;
  const v = sanitizeNumbers(raw, RENT_DEFAULTS) as RentInputs;
  if (!(v.atPrice > 0)) return null;
  const a = rentAtPrice(v, v.atPrice, offer);
  return { price: v.atPrice, monthly: a.cashFlow / 12, cashOnCash: a.cashOnCash, target: v.targetCocPct, cashIn: a.cashIn };
}

export function propertyPacketText(d: Deal): string {
  const offer = d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short';
  const kind = SALE_KINDS.find((k) => k.key === d.kind);
  const lines: string[] = [`PROPERTY REVIEW PACKET: ${d.name}`, 'DeedOwl educational worksheet. Estimates are labeled; verify every number against its source.', ''];
  lines.push(`${kind ? kindLabel(kind, d.state) : d.kind} · ${countyName(d.county)}, ${d.state}`, '');

  const p = investorProfile();
  lines.push('YOUR GOAL AND CASH', `Goal: ${cleanGoal(read(GOAL_KEY)) || '(not written yet, in My plan)'}`, `Investable cash: ${p.investable > 0 ? money(p.investable) : '(not worked out yet, in My plan)'}`, '');

  const raw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
  lines.push('THE NUMBERS (estimates from your inputs)');
  if (raw) {
    const v = sanitizeNumbers(raw, RENT_DEFAULTS) as RentInputs;
    if (v.atPrice > 0) {
      const a = rentAtPrice(v, v.atPrice, offer);
      lines.push(
        `Price you'd pay: ${money(v.atPrice)}`,
        `Rent ${money(v.monthlyRent)} a month; vacancy ${v.vacancyPct}%; management ${v.managementPct}%; repairs ${v.maintenancePct}%; big-item reserves ${v.capexPct}%`,
        `Loan: ${a.loan > 0 ? `${money(a.loan)} at ${v.ratePct}%` : 'none (all cash)'}`,
        `Your cash in the deal: ${money(a.cashIn)}`,
        `Monthly cash flow: ${money(a.cashFlow / 12)}`,
        `Cash-on-cash return: ${pct(a.cashOnCash)} a year; your target ${v.targetCocPct}%${a.cashOnCash !== null && a.cashOnCash < v.targetCocPct / 100 ? ' (below target)' : ''}`,
        'Downside cases (monthly cash flow):',
        ...rentStress(v, v.atPrice, offer).map((s) => `  ${s.label}: ${money(s.monthly)}`),
      );
    } else lines.push('(Enter the price you’d pay under “At your price” in Analyze.)');
  } else lines.push('(Not run yet: open this deal in Analyze and use Keep and rent.)');
  lines.push('');

  const log = loadLog(`analyzed:${d.id}`);
  lines.push('WHAT YOU VERIFIED, AND WHAT’S STILL OPEN');
  for (const a of EVIDENCE_AREAS) {
    const r = log.rows[a.key];
    if (!r || (!r.finding && !r.open && !r.source)) {
      lines.push(`[ ] ${a.title}: not checked yet`);
      continue;
    }
    lines.push(`[${r.done ? 'x' : ' '}] ${a.title}: ${r.finding || '(no finding yet)'}${r.source ? ` (source: ${r.source}${r.checked ? `, ${r.checked}` : ''})` : ' (no source yet)'}`);
    if (r.open) lines.push(`    Still open: ${r.open}${r.owner ? `. Who/when: ${r.owner}` : ''}`);
  }
  const gate = GATES.find((g) => g.key === log.gate);
  lines.push('', `DECISION: ${gate ? gate.label : 'not decided yet'}`, '');

  const per = cleanDealSteps(read(DEAL_STEPS_KEY))[`analyzed:${d.id}`];
  lines.push('WHERE YOU ARE (steps 4 to 6 for this property)');
  const steps = ROADMAP.filter((s) => s.phase >= 4);
  const seen = new Set<string>();
  for (const s of steps) {
    if (seen.has(s.title)) continue;
    const st = per?.done?.includes(s.id) ? 'Done' : per?.status?.[s.id] ? STEP_STATUS_LABEL[per.status[s.id]] : null;
    if (st) {
      seen.add(s.title);
      lines.push(`${s.title}: ${st}`);
    }
  }
  if (!seen.size) lines.push('(Choose this property in My plan to track its steps.)');
  lines.push('');

  const team = cleanTeamList(read(TEAM_LIST_KEY));
  lines.push('YOUR TEAM');
  for (const k of TEAM_ROLES) lines.push(`${proGuideByKey(k)?.title ?? k}: ${team[k]?.name || '(not chosen yet)'}`);
  lines.push('');

  const nextOpen = EVIDENCE_AREAS.map((a) => log.rows[a.key]).find((r) => r && r.open && !r.done);
  const nextUnchecked = EVIDENCE_AREAS.find((a) => !log.rows[a.key]?.done);
  lines.push('NEXT ACTION', nextOpen ? `Get an answer to: ${nextOpen.open}${nextOpen.owner ? ` (${nextOpen.owner})` : ''}` : nextUnchecked ? `Check “${nextUnchecked.title}”: ${nextUnchecked.what}` : 'Every area is checked. Review your decision with your professionals.');
  return lines.join('\n');
}
