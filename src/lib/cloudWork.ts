// Cloud saves accept structured property work and learning progress only, on both client and server.
// Never send a browser backup, notes, contacts, cash worksheets, uploads or arbitrary JSON.
import { cleanDeal, checklistFor } from './analyze';
import { ROADMAP } from './roadmap';
import { cleanDealSteps } from './roadmapDeals';
import { LESSONS } from './lessons';
import { CHAPTERS, cleanJourney, SPECIALTIES, taskKey } from '../practice/dealJourney';
import { CASE_KEYS } from '../practice/caseProgress';
import { caseFor, tasksFor } from '../practice/rentalCase';
import { RENT_DEFAULTS, COMMERCIAL_DEFAULTS, LIEN_DEFAULTS, SELLER_FINANCE_DEFAULTS, HOLD_SELL_DEFAULTS, STR_DEFAULTS } from './holdCalc';
import { allScenarios } from '../practice/scenarios';
import { DRILLS } from '../practice/drills';
import { DD_STEPS } from './ddFunnel';
import { STATUS } from './status';
import { CHECKLISTS } from './buyerChecklists';
import { INCOME_DEFAULTS } from './incomeValue';
import { STATES } from './regions';

export type CloudWork = Record<string, unknown>;
export const CLOUD_LIMIT = 120_000; // bytes; HTTP limit has room for the envelope
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const ids = (v: unknown, allowed?: string[]) => Array.isArray(v) ? [...new Set(v.filter((s): s is string => typeof s === 'string' && (allowed ? allowed.includes(s) : ID.test(s))))].slice(0, 200) : [];
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e10;
const stamp = (v: unknown) => typeof v === 'string' && /^\d{4}-\d\d-\d\dT[0-9:.]+Z$/.test(v) && Number.isFinite(Date.parse(v));
// A property label is plain text, not HTML, a contact field or a document. Common formatted identifiers are refused.
const label = (v: unknown) => typeof v === 'string' && v.length <= 120 && !/[<>\u0000-\u001f\u007f]/.test(v) && !/\b\d{3}-\d{2}-\d{4}\b|\b(?:\d{4}[ -]){3}\d{4}\b/.test(v);
const BID_FIELDS = 'exitValue repairs contingencyPct buyerPremiumPct transferTaxPer500 survivingLiens titleLegal possession redemptionMonths redemptionRatePct redemptionDaily redemptionFlat redemptionFlat2Pct redemptionChecked holdingMonths monthlyCarry financedPct loanAtClosing interestRatePct pointsPct sellingCostPct targetProfitPct targetProfitMin profitInDollars proposedPrice cashAvailable'.split(' ');
const numericKeys = [...new Set([...BID_FIELDS, ...Object.keys(RENT_DEFAULTS), ...Object.keys(COMMERCIAL_DEFAULTS), ...Object.keys(LIEN_DEFAULTS), ...Object.keys(SELLER_FINANCE_DEFAULTS), ...Object.keys(HOLD_SELL_DEFAULTS), ...Object.keys(STR_DEFAULTS), ...Object.keys(INCOME_DEFAULTS)])];
const CALC = /^fsf\.(bid\.[A-Za-z0-9_-]{1,64}|income\.[A-Za-z0-9_-]{1,64}|calc\.(rent|commercial)(\.[A-Za-z0-9_-]{1,64})?|calc\.lien(\.az)?|calc\.sellerfinance|calc\.strategy)\.v1$/;
const TYPED = /^fsf\.(bid|calc\.(rent|commercial|lien|sellerfinance|strategy))(\.[A-Za-z0-9_-]{1,64})?(\.v1)?\.typed\.v1$/;
function deal(v: unknown): unknown {
  if (!record(v) || !ID.test(String(v.id)) || !label(v.name) || !stamp(v.updatedAt)) return null;
  const d = cleanDeal(v);
  if (!d || d.state !== v.state || d.county !== v.county || d.kind !== v.kind || d.plan !== v.plan) return null;
  const { notes: _notes, ...safe } = d;
  safe.done = ids(d.done, checklistFor(d).flatMap(g => g.items.map(i => i.id)));
  return safe;
}
function progress(v: unknown, key: string): unknown {
  if (!record(v)) return null;
  if (key === 'deedowl.practice-deal.v1') {
    const j = cleanJourney(v);
    const answers: Record<string, unknown> = {};
    for (const c of CHAPTERS) for (const t of c.tasks) {
      const k = taskKey(c, t); const a = j.answers[k];
      if (t.kind === 'choice' && typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < (t.options?.length ?? 0)) answers[k] = a;
      if (t.kind === 'number' && number(a)) answers[k] = a;
      if (t.kind === 'check' && Array.isArray(a)) answers[k] = a.filter(x => [...t.checks ?? [], ...t.distractors ?? []].includes(x));
    }
    // Completion is rechecked by the exercise on load; reflection text is never sent.
    return { answers, completed: ids(j.completed, CHAPTERS.map(c => c.id)), lab: j.lab, reflectionDone: j.reflectionDone ?? [],
      ...(j.specialty ? { specialty: j.specialty } : {}), specialtyDone: ids(j.specialtyDone, SPECIALTIES.map(s => s.id)) };
  }
  const state = STATES.find(s => CASE_KEYS[s.code] === key)?.code;
  if (!state) return null;
  const c = caseFor(state);
  const rawAnswers = record(v.answers) ? v.answers : {};
  const answers: Record<string, unknown> = {};
  const known = c.stages.flatMap(st => tasksFor(st, rawAnswers as never).map(t => ({ key: `${st.key}/${t.id}`, t })));
  
  for (const { key: k, t } of known) {
    const a = rawAnswers[k];
    if (t.kind === 'write') continue;
    if (number(a)) answers[k] = a;
    else if (Array.isArray(a) && a.length <= 20 && a.every(x => Number.isInteger(x) && number(x))) answers[k] = a;
  }
  const first: Record<string, unknown> = {};
  if (record(v.first)) for (const [k, a] of Object.entries(v.first)) if (known.some(x => x.key === k) && ['best','ok','poor','right','wrong'].includes(String(a))) first[k] = a;
  return { done: ids(v.done, known.map(x => x.key)), answers, first,
    ...(typeof v.walked === 'string' && c.stages.some(s => s.key === v.walked) ? { walked: v.walked } : {}) };
}
function drills(v: unknown) {
  const out: Record<string, unknown> = {};
  if (!record(v)) return out;
  for (const d of DRILLS) {
    const saved=v[d.id]; if (!record(saved)) continue;
    const answers: Record<string, unknown> = {};
    if (record(saved.answers)) for (const m of d.missions) {
      const a=saved.answers[m.id]; if (!record(a)) continue;
      answers[m.id] = { ...(m.kind==='pick' && Array.isArray(a.picks) ? {picks:a.picks.filter(p=>m.options.some(o=>o.label===p))} : {}),
        ...(m.kind==='estimate' && number(a.estimate) ? {estimate:a.estimate} : {}), done:a.done===true };
    }
    out[d.id]={answers,...(d.verdict.choices.some(c=>c.label===saved.verdict) ? {verdict:saved.verdict} : {})};
  }
  return out;
}
function auctionPractice(v: unknown) {
  const out: Record<string, unknown> = {};
  if (!record(v)) return out;
  for (const s of allScenarios()) {
    const p=v[s.id]; if(!record(p)) continue;
    const keys=s.stages.flatMap(st=>st.tasks.map(t=>`${st.key}/${t.id}`));
    const values=(value:unknown,check:(a:unknown)=>boolean)=>record(value) ? Object.fromEntries(Object.entries(value).filter(([k,a])=>keys.includes(k)&&check(a))) : {};
    out[s.id]={done:ids(p.done,keys),answers:values(p.answers,a=>number(a)&&Number.isInteger(a)),firstTry:values(p.firstTry,a=>typeof a==='boolean'),sent:values(p.sent,a=>Array.isArray(a)&&a.length<=20&&a.every(n=>number(n)&&Number.isInteger(n)))};
  }
  return out;
}
export function projectCloudWork(input: unknown): CloudWork {
  const out: CloudWork = {};
  if (!record(input)) return out;
  for (const [k, v] of Object.entries(input).slice(0, 500)) {
    if (k === 'deedowl.read.v1') out[k] = ids(v, LESSONS.map(l => l.key));
    else if (k === 'deedowl.mode.v1' && ['guided','explore'].includes(String(v))) out[k] = v;
    else if (['deedowl.path.v1','deedowl.roadmap.path.v1'].includes(k) && ['listing','auction','certificate'].includes(String(v))) out[k] = v;
    else if (k === 'deedowl.roadmap.v1') out[k] = ids(v, ROADMAP.map(s => s.id));
    else if (k === 'deedowl.roadmap.status.v1' && record(v)) out[k] = Object.fromEntries(Object.entries(v).filter(([s, a]) => ROADMAP.some(x => x.id === s) && ['doing','waiting','stopped','na'].includes(String(a))));
    else if (k === 'deedowl.roadmap.deals.v1') out[k] = cleanDealSteps(v);
    else if (k === 'deedowl.roadmap.deal.v1' && typeof v === 'string' && /^(|none|analyzed:[A-Za-z0-9_-]{1,64})$/.test(v)) out[k] = v;
    else if (k === 'fsf.practice.v1') out[k] = auctionPractice(v);
    else if (k === 'deedowl.drills.v1') out[k] = drills(v);
    else if (/^fsf\.dd\.[A-Za-z0-9_-]{1,64}\.v1$/.test(k)) out[k] = ids(v, DD_STEPS.map(s=>s.key));
    else if (/^fsf\.checklist\.[A-Za-z0-9_-]{1,64}\.v1$/.test(k) && Array.isArray(v)) {
      const check = Object.values(CHECKLISTS).find(x=>`fsf.checklist.${x.key}.v1`===k);
      out[k] = [...new Set(v.filter(n=>Number.isInteger(n) && n>=0 && n<(check?.items.length ?? 100)))];
    }
    else if (k === 'fsf.deals.v1' && Array.isArray(v)) out[k] = v.slice(0,200).filter(x=>record(x) && ID.test(String(x.id)) && stamp(x.savedAt)).map(x=>({id:x.id,savedAt:x.savedAt,statusAtSave:Object.prototype.hasOwnProperty.call(STATUS,String(x.statusAtSave)) ? x.statusAtSave : null,postponementsAtSave:number(x.postponementsAtSave) && x.postponementsAtSave>=0 ? x.postponementsAtSave : 0}));
    else if (/^fsf\.calc\.(rent|commercial)\.offer\.v1$/.test(k) && number(v)) out[k] = v;
    else if (/^fsf\.(bid|calc\.(rent|commercial))(\.[A-Za-z0-9_-]{1,64})?\.v1\.region$/.test(k) && number(v)) out[k]=v;
    else if (k === 'fsf.calc.strategy.v1' && ['flip','rent','commercial','lien','sellerfinance','str'].includes(String(v))) out[k]=v;
    else if (k === 'deedowl.analyze.v1' && Array.isArray(v)) out[k] = v.slice(0, 50).map(deal).filter(Boolean);
    else if (k === 'deedowl.analyze.current.v1' && deal(v)) out[k] = deal(v);
    else if (CALC.test(k) && record(v)) out[k] = Object.fromEntries(Object.entries(v).filter(([n, a]) => numericKeys.includes(n) && number(a)));
    else if (TYPED.test(k)) out[k] = ids(v, numericKeys);
    else if (k === 'fsf.bid.mode.v1' && ['quick','detailed'].includes(String(v))) out[k] = v;
    else if (k === 'deedowl.practice-deal.v1' || Object.values(CASE_KEYS).includes(k as never)) { const p = progress(v, k); if (p) out[k] = p; }
  }
  return out;
}
function same(a: unknown, b: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length===b.length && a.every((v,i)=>same(v,b[i],depth+1));
  if (record(a)) return record(b) && Object.keys(a).length===Object.keys(b).length && Object.keys(a).every(k=>Object.prototype.hasOwnProperty.call(b,k) && same(a[k],b[k],depth+1));
  return a===b;
}
export function validCloudWork(v: unknown): v is CloudWork {
  if (!record(v)) return false;
  const projected=projectCloudWork(v);
  // Reject unexpected structures before serializing: deeply nested hostile JSON must not overflow the stack.
  return same(v,projected) && new TextEncoder().encode(JSON.stringify(projected)).length <= CLOUD_LIMIT;
}
export function cloudFromStorage(storage: Storage): CloudWork {
  const raw: Record<string, unknown> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i); if (!k) continue;
    try { raw[k] = JSON.parse(storage.getItem(k) ?? 'null'); } catch { if (['fsf.bid.mode.v1','fsf.calc.strategy.v1'].includes(k)) raw[k]=storage.getItem(k); }
  }
  const out=projectCloudWork(raw);
  const before=raw['deedowl.analyze.v1'];
  if (Array.isArray(before) && Array.isArray(out['deedowl.analyze.v1']) && before.length!==out['deedowl.analyze.v1'].length) throw new Error('One or more property labels cannot be saved, or you have more than 50 analyzed deals. Use plain property labels up to 120 characters, without personal identifiers, or download your full progress.');
  return out;
}
