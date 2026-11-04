import { planNow, practiceLienDeal, roadmapNextStep } from '../lib/planNext';
import { lienDealFor, planPath } from '../lib/roadmapState';
import PathNext from './PathNext';
import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useRef, useState } from 'react';
import { readConfirmed } from '../lib/calcConfirmation';
import { useLastActivity } from '../lib/journey';
import { replaceAddress } from '../lib/nav';
import PageHero from './PageHero';
import { Calculators } from './CalculatorPage';
import { SellerFinanceCalculator } from './HoldCalculators';
import { CalcRegion } from './calcRegion';
import { useMarkStep, stepEyebrow } from '../lib/path';
import { dropStateLead, useMyState, setMyState } from '../lib/myState';
import { STATES, countyName, stateByCode, type StateCode } from '../lib/regions';
import { CURRENT_KEY, KEPT_NOTE_KEY, OPENED_KEY, clearLienDraftNumbers, keepUnsavedDraft, movedFrom, noteStateMove, savingPractice, PLANS, calcTabFor, checklistFor, carryDraftNumbers, clearDraftNumbers, cleanDeal, forgetDeal, nextStamp, restoreDraftNumbers, kindLabel, kindsFor, loadDeals, plansFor, saveDeals, withPlan, type Deal, type Plan, type Prefill, type SaleKind } from '../lib/analyze';
import CheckFold from './CheckFold';
import { linkLabel } from '../lib/linkLabel';
import { worksheetDownPct, investorProfile, commercialLoanStart } from '../lib/myPlan';
import { fmtMoney } from '../lib/status';
import { getMyArea } from '../lib/myArea';
import { analyzeAdCategories, analyzeAllowsAds } from '../lib/contextAds';
import { FixedAds, useAdShows } from './AdBoxes';
import { useSpotCategories } from './AdSpot';
import { useDirectory } from './ProDirectory';

const DEFAULT_COUNTY: Record<StateCode, string> = { NV: 'Clark', CA: 'Los Angeles', AZ: 'Maricopa', UT: 'Salt Lake', TX: 'Harris' };
/** A new deal's county: the visitor's chosen county in that state (myArea.ts), else the state's largest. */
const startCounty = (st: StateCode) => { const a = getMyArea(); return a?.state === st && a.county ? a.county : DEFAULT_COUNTY[st]; };
const CURRENT = CURRENT_KEY;

/** The plan a new deal starts on: from the strategy in your buy box (rentals open Keep and rent). */
function planFromBuyBox(): Plan {
  try {
    const box = JSON.parse(localStorage.getItem('deedowl.buybox.v1') ?? 'null') as { strategy?: unknown; types?: unknown } | null;
    const s = box?.strategy;
    if (s === 'Apartments and commercial property') return 'commercial';
    if (typeof s === 'string' && /rental|rent the others|BRRRR/.test(s)) return 'rent';
    if (s === 'Fix and flip') return 'flip';
    // Only income property types ticked (commercial, mixed-use, 5+ apartments): Commercial income.
    const types = Array.isArray(box?.types) ? box!.types.filter((t): t is string => typeof t === 'string') : [];
    if (types.length && types.every((t) => /Commercial|Mixed-use|Apartment building/.test(t))) return 'commercial';
    // Decide's market answer: commercial.
    const market = (JSON.parse(localStorage.getItem('deedowl.decide.v1') ?? 'null') as { answers?: { market?: unknown } } | null)?.answers?.market;
    if (market === 'com') return 'commercial';
    // No strategy, or one that doesn't say rent or flip (auctions, bank-owned homes, still deciding): the goal from
    // Decide (rent or long-run growth opens Keep and rent).
    const goal = (JSON.parse(localStorage.getItem('deedowl.decide.v1') ?? 'null') as { answers?: { goal?: unknown } } | null)?.answers?.goal;
    if (goal === 'income' || goal === 'growth') return 'rent';
  } catch {
    /* storage unavailable */
  }
  return 'flip';
}

// A new deal starts on the kind of sale your roadmap route is about, so saving a practice analysis keeps the route.
// On the auction route, the kind of auction you last saved in this state (a Texas tax-sale buyer keeps tax sales),
// else a trustee's sale.
const lastAuctionKind = (st: StateCode): SaleKind => {
  // A real deal's kind first, else the kind you practiced (a practice analysis), else a trustee's sale.
  const auctions = loadDeals().filter((d) => d.state === st && d.kind !== 'lien' && d.kind !== 'listing' && d.kind !== 'reo' && d.kind !== 'short').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const k = (auctions.find((d) => !d.practice) ?? auctions[0])?.kind;
  return k && kindsFor(st).some((x) => x.key === k) ? k : 'trustee';
};
// A lien route in a state without lien sales starts the new deal as an auction there (as My plan follows).
// The route My plan shows (planPath): a property in focus, else the route you picked or Decide's auctions pick.
const kindForRoute = (st: StateCode): SaleKind => { const r0 = planPath(); const r = r0 === 'certificate' && st !== 'NV' && st !== 'AZ' ? 'auction' : r0; return r === 'auction' ? lastAuctionKind(st) : r === 'certificate' && (st === 'NV' || st === 'AZ') ? 'lien' : 'listing'; };

/**
 * A new, unsaved lien certificate in the state and county of the Nevada or Arizona lien deal your plan is built around
 * (for a reader whose own state sells no liens): the lien calculator link and "Price another … lien certificate".
 * A started draft is kept in My deals first, the lien deal stays My plan's property, and the lien calculator starts
 * clean. Returns the new draft and the kept-draft note, if any.
 */
function startLienDraft(ld: Deal): { draft: Deal; kept: string | null } {
  const keptDeal = keepUnsavedDraft();
  let kept: string | null = null;
  if (keptDeal) {
    // As when opening a deal from My deals: the lien deal stays the one you're working on (the kept draft is newer
    // otherwise, and would take My plan's focus and its route). Not one you passed on.
    if (ld.stage !== 'passed') {
      const now = nextStamp([ld.updatedAt, keptDeal.updatedAt].sort().pop() ?? ld.updatedAt);
      saveDeals(loadDeals().map((x) => (x.id === ld.id ? { ...x, updatedAt: now } : x)));
    }
    kept = `Your unsaved ${stateByCode(keptDeal.state)?.name ?? ''} deal “${keptDeal.name}” was saved to My deals.`;
  }
  clearLienDraftNumbers();
  // There's no property to check the location of: the calculator opens at once.
  const draft: Deal = { ...blank(ld.state), county: ld.county, countyChosen: true, kind: 'lien', plan: 'lien', locationConfirmed: true };
  try { localStorage.setItem(CURRENT_KEY, JSON.stringify(draft)); localStorage.removeItem(OPENED_KEY); } catch { /* storage unavailable */ }
  return { draft, kept };
}

function blank(st: StateCode): Deal {
  const kind = kindForRoute(st);
  return { id: '', name: '', state: st, county: startCounty(st), kind, plan: kind === 'lien' ? 'lien' : plansFor(kind).includes(planFromBuyBox()) ? planFromBuyBox() : plansFor(kind)[0], notes: '', done: [], updatedAt: new Date().toISOString() };
}

const DELETED_NOTE = 'This deal was deleted (perhaps in another tab). What you typed is still here, unsaved: save it again to keep it.';
const DELETED_NO_NUMBERS_NOTE = 'This deal was deleted (perhaps in another tab). Its name, county, checklist and notes are still here, unsaved; its numbers were deleted with it. Save it again to keep it.';
let deletedNote = DELETED_NOTE;

/** A saved deal deleted elsewhere, as a new unsaved deal: numbers still stored under its id move to the draft. */
function asDraft(d: Deal): Deal {
  deletedNote = restoreDraftNumbers(d.id, d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short') ? DELETED_NOTE : DELETED_NO_NUMBERS_NOTE;
  const { stage: _stage, practice: _practice, ...rest } = d;
  return { ...rest, id: '' };
}

/** False only when the saved list can be read and no longer holds this deal (deleted elsewhere). */
function stillSaved(id: string): boolean {
  try {
    if (localStorage.getItem('deedowl.analyze.v1') === null) return true;
  } catch {
    return true;
  }
  return loadDeals().some((d) => d.id === id);
}

let deletedOnLoad = false;


/** The stage stored with a saved deal (it's changed in My deals, My plan or the packet, not here). */
function storedStage(id: string) {
  return loadDeals().find((d) => d.id === id)?.stage;
}

function loadCurrent(st: StateCode): Deal {
  try {
    const v = cleanDeal(JSON.parse(localStorage.getItem(CURRENT) ?? 'null'));
    // Paper practice is over (or you moved on): the practice analysis left open isn't where the real property goes.
    let opened: unknown = null;
    try { opened = JSON.parse(localStorage.getItem(OPENED_KEY) ?? 'null'); } catch { /* storage unavailable */ }
    if (v && v.practice && !savingPractice() && opened !== v.id) return blank(st || v.state);
    // A property you passed on stays in My deals; the next one starts fresh instead of renaming it.
    if (v && v.id && opened !== v.id && storedStage(v.id) === 'passed') return blank(st || v.state);
    // An untouched blank left on a regular listing from before you chose an auction or lien route starts again, on the
    // kind of sale that route is about.
    if (v && !v.id && !v.name.trim() && !v.notes.trim() && v.done.length === 0 && !v.locationConfirmed && v.kind === 'listing' && (v.county === startCounty(v.state) || (!v.countyChosen && v.county === DEFAULT_COUNTY[v.state])) && v.plan === planFromBuyBox() && kindForRoute(st || v.state) !== 'listing') return blank(st || v.state);
    // A deal you opened (My deals, the packet) opens in its own state, even when your state is another.
    // (Or an unsaved lien certificate in the state of the lien deal your plan is built around: see the lien link below.)
    if (v && (!st || v.state === st || (!!v.id && opened === v.id) || (!v.id && v.kind === 'lien' && practiceLienDeal()?.state === v.state))) {
      // Deleted from My deals since: keep what was typed as a new, unsaved deal (the note says so).
      if (v.id && !stillSaved(v.id)) {
        deletedOnLoad = true;
        return asDraft(v);
      }
      // An untouched unsaved draft still on the state's default county, from before you chose your area: use your area's.
      if (!v.id && !v.name.trim() && !v.notes.trim() && v.done.length === 0 && !v.locationConfirmed && !v.countyChosen && v.county === DEFAULT_COUNTY[v.state] && startCounty(v.state) !== v.county) return { ...v, county: startCounty(v.state) };
      return v;
    }
  } catch {
    /* start fresh */
  }
  return blank(st);
}

/** A property sent from a listing page: a new, unsaved deal with its address, state, county and kind of sale. */
function fromListing(f: Prefill): Deal {
  // A kind of sale this state doesn't have falls back to an auction (court sale), never to a regular listing.
  const kinds = kindsFor(f.state);
  const kind = kinds.some((k) => k.key === f.kind) ? f.kind : (kinds.find((k) => k.key === 'court') ?? kinds[0]).key;
  // The plan your buy box or Decide points to, when this kind of sale offers it (else the kind's first).
  const want = planFromBuyBox();
  return { ...blank(f.state), name: f.name, county: f.county, kind, plan: plansFor(kind).includes(want) ? want : plansFor(kind)[0] };
}

/** A link that names a calculator ("#/analyze?plan=commercial") opens that one. A saved deal is left as it was. */
function forLink(d: Deal, plan?: Plan): Deal {
  if (!plan) return d;
  return withPlan(d.id ? blank(d.state) : d, plan);
}

/**
 * Step 6 of the path: describe a real deal, get the checklist for that sale in that state, and run the numbers.
 * `plan` comes from a link that promises a particular calculator.
 */
/** A guide's link can name the plan too (keep and rent, fix and sell), when that plan fits the kind of sale. */
const linkPlan = (d: Deal, plan?: Plan): Deal => (plan && plansFor(d.kind).includes(plan) ? { ...d, plan } : d);

/** The kept-draft note read this page load (see keptNote below). */
let keptNoteOnce = '';

export default function AnalyzePage({ plan, prefill }: { plan?: Plan; prefill?: Prefill } = {}) {
  useMarkStep('analyze');
  useLastActivity('#/analyze', 'Analyze a deal');
  const [mine] = useMyState();
  // The investing state before the State field below changed it, for the notice.
  const [stateMoved, setStateMoved] = useState<StateCode | null>(null);
  // The practice lien certificate's note, focused when the button opens one (it replaces the button).
  const lienNoteRef = useRef<HTMLParagraphElement>(null);
  // Your own state, from before the State field first moved you (kept across visits until you're back in it).
  const homeState = stateMoved ? (movedFrom() as StateCode | null) : null;
  // (A Nevada or Arizona lien deal priced after the State field moved you from a state without lien sales saves as a
  // real deal: savingPractice reads where you moved from.)
  const practiceSave = (d: Deal) => savingPractice(d);
  // Nothing typed is ever wiped: a started, unsaved deal is saved to My deals, with its numbers, before a listing
  // or a change of state replaces it. Returns the deal's state when one was saved, for the notice.
  // The "just opened" marker is read once, when the page first loads its deal.
  // The kept-draft note shows once. (The "opened on purpose" marker stays while that deal is the one open.)
  // Read into keptNoteOnce, so a second mount during the first paint (the prerendered /analyze page) still shows it.
  useEffect(() => { try { localStorage.removeItem(KEPT_NOTE_KEY); } catch { /* storage unavailable */ } }, []);
  const [keptNote, setKeptNote] = useState(() => {
    // Left by openDeal when a started deal was saved before another was opened elsewhere on the site.
    try {
      const v: unknown = JSON.parse(localStorage.getItem(KEPT_NOTE_KEY) ?? 'null');
      if (typeof v === 'string') keptNoteOnce = v;
    } catch {
      /* storage unavailable */
    }
    const note = keptNoteOnce;
    // Shown on this load only: the next visit to Analyze starts without it.
    setTimeout(() => { keptNoteOnce = ''; }, 1500);
    return note;
  });
  const keepUnsaved = (): string | null => {
    const d = keepUnsavedDraft();
    return d ? `Your unsaved ${stateByCode(d.state)?.name ?? ''} deal “${d.name}” was saved to My deals.` : null;
  };
  const [deal, setDeal] = useState<Deal>(() => {
    if (!prefill) {
      deletedOnLoad = false;
      // A link to the lien calculator ("Open the lien calculator", a practice step's) from a state without lien sales
      // opens a new, unsaved lien certificate in the state and county of the Nevada or Arizona lien deal your plan is
      // built around, where the lien calculator is, instead of a blank listing. Your saved deal isn't touched, so
      // practice payoffs don't change its numbers. (A started draft is kept in My deals first.)
      // (Also for a reader Analyze's State field moved into that deal's state from one without lien sales.)
      const moved = movedFrom();
      const own = moved && moved !== 'NV' && moved !== 'AZ' ? lienDealFor() : null;
      const ld0 = plan !== 'lien' ? null : !kindsFor(mine ?? 'NV').some((k) => k.key === 'lien') ? practiceLienDeal() : own && own.state === mine ? own : null;
      // (Not again on a reload of the same link: an unsaved certificate already open there stays as you left it.)
      let open: Deal | null = null;
      try { open = cleanDeal(JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null')); } catch { /* storage unavailable */ }
      // Only the same one: that deal's state and county, with its calculator open (a stale draft elsewhere is replaced).
      // Or one in that state with numbers you typed in its lien calculator (another county you chose): kept as it is.
      const typedLien = readConfirmed('fsf.calc.lien.v1').size > 0 || readConfirmed('fsf.calc.lien.az.v1').size > 0;
      const already = !!open && !open.id && open.kind === 'lien' && open.state === ld0?.state && ((open.county === ld0?.county && !!open.locationConfirmed) || typedLien);
      if (ld0 && !already) {
        const { kept } = startLienDraft(ld0);
        if (kept) { keptNoteOnce = kept; setTimeout(() => { keptNoteOnce = ''; }, 1500); setTimeout(() => setKeptNote(kept), 0); }
      }
      const cur = loadCurrent(mine ?? 'NV');
      if (deletedOnLoad) { const n = deletedNote; setTimeout(() => setKeptNote(n), 0); }
      // The working deal is in another state than the one now chosen: keep it in My deals before starting fresh.
      if (!cur.id && !cur.name && !cur.notes && cur.done.length === 0) {
        const kept = keepUnsaved();
        // Also into keptNoteOnce: the first-paint remount reads it there, after this instance is thrown away.
        if (kept) { keptNoteOnce = kept; setTimeout(() => { keptNoteOnce = ''; }, 1500); setTimeout(() => setKeptNote(kept), 0); }
      }
      return forLink(cur, plan);
    }
    keepUnsaved();
    return linkPlan(fromListing(prefill), plan);
  });
  // A property opened from a DeedOwl listing arrives filled in; the address then goes back to plain /analyze.
  useEffect(() => {
    if (!prefill) return;
    setSaved(loadDeals());
    setDeal(linkPlan(fromListing(prefill), plan));
    setMyState(prefill.state);
    replaceAddress('/analyze');
  }, [prefill]);
  const numbersRef = useRef<HTMLHeadingElement>(null);
  // A link to a named calculator goes straight to it, set up for that plan.
  useEffect(() => {
    if (!plan) return;
    setDeal((d) => (d.plan === plan && (plan !== 'lien' || d.kind === 'lien') ? d : forLink(d, plan)));
    numbersRef.current?.scrollIntoView({ block: 'start' });
    // Done with the link's request: a reload then reopens the deal as it is now, not a fresh one.
    replaceAddress('/analyze');
  }, [plan]);
  const [saved, setSaved] = useState<Deal[]>(loadDeals);
  // The saved deals as stored (another tab or page may have changed them), or this page's copy when storage can't be
  // read at all (blocked storage).
  const storedDeals = (): Deal[] => {
    const list = loadDeals();
    let readable = true;
    try { readable = localStorage.getItem('deedowl.analyze.v1') !== null; } catch { readable = false; }
    return list.length === 0 && !readable ? saved : list;
  };

  // Keep the working deal between visits, and in the saved list once it has been saved.
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT, JSON.stringify(deal));
    } catch {
      /* private mode */
    }
    if (deal.id && !stillSaved(deal.id)) {
      // Deleted elsewhere while open here: don't bring it back or report it saved.
      const draft = asDraft(deal);
      setKeptNote(deletedNote);
      setSaved(loadDeals());
      setDeal(draft);
      return;
    }
    if (deal.id) {
      // The stored copy is newer (another tab typed since): don't write this older copy over it; show the newer one.
      const there = loadDeals().find((x) => x.id === deal.id);
      if (there && there.updatedAt > deal.updatedAt) {
        setDeal(there);
        return;
      }
      setSaved(() => {
        // Built from what's stored, not this page's copy, so a deal saved elsewhere meanwhile (a kept draft) stays.
        // The stage is changed in My plan or the deal packet, not here: keep the one stored with the deal.
        const list = storedDeals();
        const stage = list.find((d) => d.id === deal.id)?.stage ?? deal.stage;
        const next = list.map((d) => (d.id === deal.id ? { ...deal, ...(stage ? { stage } : {}) } : d));
        saveDeals(next);
        return next;
      });
    }
  }, [deal]);
  // Another tab changed the saved deals (deleted this one): check now, not only when a field here changes.
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== null && e.key !== 'deedowl.analyze.v1') return;
      setSaved(storedDeals());
      setDeal((d) => {
        if (!d.id) return d;
        if (!stillSaved(d.id)) return { ...d }; // deleted there: the save effect turns it into a draft
        // Changed in the other tab since: show that version, so this tab doesn't save its older copy over it.
        const there = loadDeals().find((x) => x.id === d.id);
        return there && there.updatedAt > d.updatedAt ? there : d;
      });
    };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Choosing a state elsewhere on the site moves a new, unsaved deal to it (not a lien certificate in the state of the
  // lien deal your plan is built around: the lien calculator link opens one there).
  useEffect(() => {
    if (mine && !deal.id && mine !== deal.state && !(deal.kind === 'lien' && practiceLienDeal()?.state === deal.state)) {
      const kept = keepUnsaved();
      if (kept) {
        setKeptNote(kept);
        setSaved(loadDeals());
      }
      setDeal(blank(mine));
    }
  }, [mine]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Deal>) => setDeal((d) => ({ ...d, ...patch, updatedAt: nextStamp(d.updatedAt) }));
  // A new, unsaved lien certificate in the state of the lien deal your plan is built around (not your own state).
  // Back to a lien certificate in the lien deal's state and county (no property there): it opens ready again.
  const certTarget = practiceLienDeal() ?? (movedFrom() && !['NV', 'AZ'].includes(movedFrom()!) ? lienDealFor() : null);
  const certSpot = !deal.id && !!certTarget && certTarget.state === deal.state && certTarget.county === deal.county;
  const practiceCert = !deal.id && deal.kind === 'lien' && !!mine && ((deal.state !== mine && practiceLienDeal()?.state === deal.state) || (!!movedFrom() && !['NV', 'AZ'].includes(movedFrom()!) && lienDealFor()?.state === deal.state && lienDealFor()?.county === deal.county));
  const st = stateByCode(deal.state)!;
  const kinds = kindsFor(deal.state);
  const plans = PLANS.filter((p) => plansFor(deal.kind).includes(p.key));
  const groups = checklistFor(deal);
  const all = groups.flatMap((g) => g.items);
  const doneCount = all.filter((i) => deal.done.includes(i.id)).length;
  const toggle = (id: string) => set({ done: deal.done.includes(id) ? deal.done.filter((x) => x !== id) : [...deal.done, id] });

  const saveNew = () => {
    if (!deal.locationConfirmed) return;
    // Saved while the roadmap is on paper practice (or finding a property): a practice analysis.
    const practicing = practiceSave(deal);
    const d: Deal = { ...deal, id: `d${Date.now().toString(36)}`, name: deal.name.trim() || `${countyName(deal.county)} deal`, stage: 'researching', ...(practicing ? { practice: true } : {}) };
    carryDraftNumbers(d.id, d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short');
    const next = [d, ...storedDeals()];
    saveDeals(next);
    setSaved(next);
    setKeptNote(''); // a note about the last deal (deleted elsewhere, kept) is done once this one is saved
    setDeal(d);
    // The button is replaced by the saved line: focus (and the screen reader) go there.
    setTimeout(() => document.getElementById('deal-saved-line')?.focus(), 0);
  };
  const remove = (id: string) => {
    // One click used to wipe the packet, numbers and evidence; My deals asks first, so this does too.
    if (!window.confirm('Delete this deal, with its numbers, deal packet and evidence log?')) return;
    const next = storedDeals().filter((d) => d.id !== id);
    saveDeals(next);
    forgetDeal(id);
    setSaved(next);
    if (deal.id === id) setDeal(blank(mine ?? deal.state));
  };

  // The Mentor Connect spot beside What's next (Admin → Ad spots); automatic: by plan, listings and bank-owned only.
  const { pros } = useDirectory();
  // Even an owner's fixed list never shows on forced sales or lien certificates (contextAds.ts).
  const spotCats = useSpotCategories('analyze', analyzeAdCategories(deal.kind, deal.plan));
  const adCats = analyzeAllowsAds(deal.kind) ? spotCats : [];
  const adShows = useAdShows(adCats, pros, { state: deal.state, county: deal.county, city: null });

  return (
    <main className="page analyze">
      <PageHero
        eyebrow={<span className="eyebrow">{stepEyebrow('analyze')}</span>}
        title={<>Analyze <span className="grad">a deal</span></>}
        sub="Found one you like? Tell us about it, get the checklist for that kind of sale in your state, and know your number before you offer or bid."
      />
      {keptNote && <p className="note" role="status">{keptNote} <a href="#/deals">Open My deals&nbsp;→</a></p>}

      <section className="deal-setup" aria-labelledby="setup-head">
        <h2 id="setup-head">1. Tell us about the property you found</h2>
        {deal.id && saved.find((d) => d.id === deal.id)?.stage === 'passed' && (
          <p className="note" role="status">You passed on “{deal.name}”. Changes here update it in My deals. Looking at a different property? <button type="button" className="linkish" onClick={() => { clearDraftNumbers(); setDeal(blank(mine ?? deal.state)); }}>Start a new deal</button></p>
        )}
        {deal.id && deal.practice && !savingPractice() && saved.find((d) => d.id === deal.id)?.stage !== 'passed' && (
          <p className="note" role="status">This is your practice analysis “{deal.name}”. Changes here update it in My deals, and it stays a practice analysis. Found a real property? <button type="button" className="linkish" onClick={() => { clearDraftNumbers(); setDeal(blank(mine ?? deal.state)); }}>Start a new deal</button></p>
        )}
        <p className="muted">Found a property on an official list, a listing site or from your agent? Enter it here. You’ll get the checklist for that kind of sale in that county, and the calculator for your plan. Save it to come back to it in My deals.</p>
        {(() => {
          // On a lien route kept by a Nevada or Arizona lien deal while your own state sells no liens.
          const mv = movedFrom();
          const movedIn = !!mv && mv !== 'NV' && mv !== 'AZ';
          const ld = !deal.id ? practiceLienDeal() ?? (movedIn ? lienDealFor() : null) : null;
          if (!ld) return null;
          const nm = stateByCode(ld.state)?.name ?? ld.state;
          // The new certificate opened in that deal's state (the lien calculator link, or the button below).
          if (deal.kind === 'lien' && deal.state === ld.state && (deal.state !== mine || (movedIn && deal.county === ld.county && !!deal.locationConfirmed))) return <p className="note" role="status" tabIndex={-1} ref={lienNoteRef}>A new, unsaved lien certificate in {nm}, where your saved lien deal is.{savingPractice(deal) ? ` For the practice step, enter the “${deal.state === 'AZ' ? 'Lien amount you pay' : 'Certificate price'}” and “Interest” below, then try “Months until the owner pays” at 6 and at 24.` : ' Saved, it becomes a real deal in My deals.'} Your saved deal “{ld.name}” isn’t changed. <button type="button" className="linkish" onClick={() => {
            // A named or noted certificate is kept in My deals first, as every other way of replacing the draft does.
            // ...and, as with "Price another", the lien deal stays My plan's property (the kept one is newer otherwise).
            const keptDeal = keepUnsavedDraft();
            if (keptDeal) {
              if (ld.stage !== 'passed') {
                const now = nextStamp([ld.updatedAt, keptDeal.updatedAt].sort().pop() ?? ld.updatedAt);
                saveDeals(loadDeals().map((x) => (x.id === ld.id ? { ...x, updatedAt: now } : x)));
              }
              setKeptNote(`Your unsaved ${stateByCode(keptDeal.state)?.name ?? ''} deal “${keptDeal.name}” was saved to My deals.`);
              setSaved(loadDeals());
            }
            clearLienDraftNumbers();
            // Moved here by the State field: the new deal is in your own state again (and so is the site).
            const home = movedIn ? (mv as StateCode) : null;
            if (home && mine) { noteStateMove(mine, home); setMyState(home); }
            setDeal(blank(home ?? mine ?? deal.state));
            setTimeout(() => document.querySelector<HTMLInputElement>('.deal-fields input')?.focus(), 0);
          }}>{movedIn ? `Start a new ${stateByCode(mv ?? '')?.name ?? ''} deal instead (sets your state back to ${stateByCode(mv ?? '')?.name ?? ''})` : `Start a new ${stateByCode(mine ?? '')?.name ?? ''} deal instead`}</button></p>;
          // A new deal in your own state: how to price another lien there, without changing your state for the site.
          if (deal.kind !== 'lien' && deal.state !== ld.state) return <p className="note" role="note">Your saved lien deal is in {nm}. <button type="button" className="linkish" onClick={() => { const { draft, kept } = startLienDraft(ld); if (kept) setKeptNote(kept); setSaved(loadDeals()); setDeal(draft); setTimeout(() => lienNoteRef.current?.focus(), 0); }}>Price another {nm} lien certificate</button></p>;
          return null;
        })()}
        {/* The State here is also your investing state for the whole site: say so when it changes it. */}
        {stateMoved && mine && homeState && homeState !== mine && <p className="notice" role="status">Your investing state for the whole site is now {stateByCode(mine)?.name ?? mine}, so guides, practice and Find deals follow {stateByCode(mine)?.name ?? mine}. (The State here sets it.) Choosing {stateByCode(homeState)?.name ?? homeState} here again changes it back.</p>}
        <div className="deal-fields">
          <label className="field wide">
            <span>Address or nickname</span>
            <input value={deal.name} maxLength={80} placeholder="e.g. 123 Main St" onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="field">
            <span>State</span>
            <select value={deal.state} onChange={(e) => { const s = e.target.value as StateCode; if (mine && s !== mine) setStateMoved(mine); noteStateMove(mine, s); setMyState(s); /* first, so the starting county is your area's in that state */ const k = kindsFor(s).some((x) => x.key === deal.kind) ? deal.kind : 'listing'; set({ state: s, county: startCounty(s), countyChosen: false, locationConfirmed: false, kind: k, plan: plansFor(k).includes(deal.plan) ? deal.plan : plansFor(k)[0] }); }}>
              {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>County</span>
            <select value={deal.county} onChange={(e) => set({ county: e.target.value, locationConfirmed: false, countyChosen: true })}>
              {st.counties.map((c) => <option key={c} value={c}>{countyName(c)}</option>)}
            </select>
          </label>
          <label className="field kind-field">
            <span>Kind of sale</span>
            <select value={deal.kind} aria-describedby={deal.state === 'TX' && deal.kind === 'court' ? 'tx-court-note' : deal.state === 'AZ' && deal.kind === 'lien' ? 'az-land-note' : undefined} onChange={(e) => { const k = e.target.value as SaleKind; set({ kind: k, plan: plansFor(k).includes(deal.plan) ? deal.plan : plansFor(k)[0], ...(practiceCert ? { locationConfirmed: false } : k === 'lien' && certSpot ? { locationConfirmed: true } : {}) }); /* a new lien certificate starts confirmed (no property); another kind of sale is a property to check */ }}>
              {kinds.map((k) => <option key={k.key} value={k.key}>{kindLabel(k, deal.state)}</option>)}
            </select>
          </label>
          <label className="field kind-field">
            <span>Your plan</span>
            <select value={deal.plan} onChange={(e) => set({ plan: e.target.value as Plan })}>
              {plans.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>
        </div>
        {/* Texas tax sales are held by the sheriff or a constable: picking the sheriff's sale would drop the owner's buy-back. */}
        {/* A saved deal opened from another state keeps its own state's rules: say so, since the header shows yours. */}
        {deal.id && mine && mine !== deal.state && <p className="notice" role="note">This saved deal is in {stateByCode(deal.state)?.name ?? deal.state}; your chosen state is {stateByCode(mine)?.name ?? mine}. Its numbers and checklist follow {stateByCode(deal.state)?.name ?? deal.state}’s rules.</p>}
        {deal.state === 'AZ' && deal.kind === 'lien' && <p className="muted small" id="az-land-note">Buying land the county already took by tax deed, at the board of supervisors’ auction? That’s the property, not a lien, and this list has no checklist for it yet: follow the county’s own sale terms (A.R.S. 42-18301 to 42-18303) and ask a title company before you bid.</p>}
        {deal.state === 'TX' && deal.kind === 'court' && <p className="muted small" id="tx-court-note">Buying at a Texas tax sale? The sheriff or a constable holds those too: choose “County tax sale (the property)” so the owner’s right to buy it back is counted.</p>}
        {/* Not for a new lien certificate in the lien deal's state (the lien calculator link): there's no property yet. */}
        {!(practiceCert && deal.locationConfirmed) && <label className="check">
          <input type="checkbox" checked={!!deal.locationConfirmed} onChange={(e) => set({ locationConfirmed: e.target.checked })} />
          I checked that this property is in {countyName(deal.county)}, {st.name}.
        </label>}
        {!deal.locationConfirmed && <p className="muted" role="status">Choose the property’s county, kind of sale and your plan, then tick the box above to confirm the location. Starting choices are placeholders, not recommendations.</p>}
        <div className="deal-actions">
          {deal.id ? (
            <>
              <span className="muted" role="status" tabIndex={-1} id="deal-saved-line">Saved as {deal.practice ? 'the practice analysis ' : ''}“{deal.name}”. Changes save as you go.</span>
              <a className="btn" href={`#/deals/packet/${deal.id}`}>Deal packet&nbsp;→</a>
              <button type="button" className="btn btn-secondary" onClick={() => { clearDraftNumbers(); setDeal(blank(mine ?? deal.state)); }}>Start a new deal</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => { if (!deal.locationConfirmed) set({ locationConfirmed: true }); else saveNew(); }}>{deal.locationConfirmed ? (practiceSave(deal) ? 'Save as a practice analysis' : 'Save this deal') : 'Confirm location and open my analysis'}</button>
          )}
        </div>
        {/* Said before the save: while My plan is on a practice step, what's saved stays a practice analysis. */}
        {!deal.id && deal.locationConfirmed && practiceSave(deal) && (() => {
          // The practice step that makes this a practice analysis: the roadmap's, else My plan's (practice part 2).
          const st = roadmapNextStep();
          // The link opens the practice itself (the step's own action), not the roadmap.
          const pt = planNow().task;
          const t = st && ['paper', 'c-paper', 'a-practice', 'c-practice'].includes(st.id) ? { href: st.href ?? '#/toolkit/roadmap', label: st.title } : { href: pt.support[0]?.href ?? pt.href, label: pt.label };
          return <p className="muted" role="note">My plan is on the practice step <a href={t.href}>{t.label}</a>, so a deal saved now is a practice analysis: it won’t become the property you’re working on. Finish that step first to save a real property.</p>; })()}
        {saved.length > 0 && (
          <div className="saved-deals">
            <strong>Your deals</strong>
            <ul>
              {saved.map((d) => (
                <li key={d.id} className={d.id === deal.id ? 'on' : ''}>
                  <button type="button" className="linkish" onClick={() => { try { localStorage.setItem(OPENED_KEY, JSON.stringify(d.id)); } catch { /* storage unavailable */ } const kept = keepUnsaved(); if (kept) { setKeptNote(kept); setSaved(loadDeals()); setDeal({ ...d, updatedAt: nextStamp(d.updatedAt) }); } else setDeal(d); }}>{d.name}{d.practice ? ' (practice)' : ''}{d.stage === 'passed' ? ' (passed)' : ''}</button>
                  <span className="muted"> · {countyName(d.county)}, {d.state}</span>
                  <button type="button" className="linkish danger" aria-label={`Delete ${d.name}`} onClick={() => remove(d.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {deal.locationConfirmed && <>
      <section className="deal-checklist" aria-labelledby="check-head">
        <h2 id="check-head">2. Your checklist <span className="muted">({doneCount} of {all.length} done)</span></h2>
        <p className="muted">For a {kindLabel(kinds.find((k) => k.key === deal.kind) ?? kinds[0], deal.state).replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())} in {countyName(deal.county)}, {st.name}.</p>
        {groups.map((g) => (
          <CheckFold key={g.title} title={g.title} done={g.items.filter((c) => deal.done.includes(c.id)).length} total={g.items.length}>
            <ul className="decide-checklist">
              {g.items.map((c) => (
                <li key={c.id}>
                  <label>
                    <input type="checkbox" checked={deal.done.includes(c.id)} onChange={() => toggle(c.id)} />
                    <span>{dropStateLead(c.text, deal.state)}</span>
                  </label>
                  {c.href && (c.href.startsWith('https://') ? <a href={c.href} target="_blank" rel="noopener noreferrer">Open&nbsp;↗</a> : <a href={c.href}>{linkLabel(c.href)}&nbsp;→</a>)}
                </li>
              ))}
            </ul>
          </CheckFold>
        ))}
        <label className="field deal-notes">
          <span>Notes</span>
          <textarea rows={3} maxLength={2000} value={deal.notes} placeholder="Questions for the title company, repair quotes, dates…" onChange={(e) => set({ notes: e.target.value })} />
        </label>
      </section>

      <section className="deal-numbers" aria-labelledby="numbers">
      <h2 id="numbers" ref={numbersRef}>3. Run the numbers</h2>
      <ProfileNote deal={deal} />
      <CalcRegion.Provider value={{ state: deal.state, county: deal.county }}>
        <Calculators key={`${deal.id}-${deal.state}-${deal.county}-${deal.kind}`} dealId={deal.id || undefined} onAnalyze initial={calcTabFor(deal.plan)} onTab={(k) => { const p = PLANS.find((x) => calcTabFor(x.key) === k)?.key; if (p && p !== deal.plan && plans.some((x) => x.key === p)) set({ plan: p }); }} state={deal.state} saleKind={deal.kind} offer={deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short'} lien={deal.kind === 'lien'} />
        {/* For a listed, bank-owned or short-sale home, the seller may offer to carry the loan. */}
        {(deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short') && (
          <details className="plan-section" id="seller-financing">
            <summary>If the seller offers financing</summary>
            <p>The payment, the balloon you’d owe, and the cash it saves against a bank loan.</p>
            <SellerFinanceCalculator sticky={false} />
          </details>
        )}
      </CalcRegion.Provider>
      </section>

      {/* One clear next step once the numbers are in: keep the deal, then follow the buying steps for this kind of sale. */}
      <div className={adShows ? 'next-with-ad' : undefined}>
      <section className="analyze-next" aria-labelledby="analyze-next-head">
        <h2 id="analyze-next-head">4. What’s next</h2>
        <p>{!deal.id && practiceSave(deal) ? 'Practicing without buying? Save this as a practice analysis so you can compare it with the next ones, and mark the practice step done in My plan when you’ve finished it.' : ['paper', 'c-paper'].includes(roadmapNextStep()?.id ?? '') ? 'Practicing without buying? Save this analysis so you can compare it with the next ones, and mark the task done in My plan when you’ve analyzed enough.' : 'Numbers work, and every checklist item above has an answer? Save the deal so you can come back to it, then follow the “Buy it” steps for this kind of sale in My plan.'}</p>
        <p><strong>Reasons to pause, revise or pass:</strong> {calcTabFor(deal.plan) === 'flip' ? 'the price you’d have to pay leaves no profit after repairs, holding and selling costs, or the profit is smaller than your goal' : calcTabFor(deal.plan) === 'lien' ? 'the interest you’d earn, after the wait to be paid, misses your goal' : deal.plan === 'rent' && investorProfile().ownerOccupant && (deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short') ? 'the monthly cost of living there (after any rent you collect) is more than you can comfortably pay alongside your other bills, or it leaves too little cash for repairs and emergencies' : 'the monthly cash flow is negative after reserves, or the long-term return misses your goal'}. Compare the tradeoffs with your goals and risk tolerance, and record your reasoning. Get appropriate professional guidance before committing. <a href="#/learn/walk-away">When to walk away</a></p>
        <div className="row">
          {!deal.id ? <button type="button" className="btn" onClick={saveNew}>{practiceSave(deal) ? 'Save as a practice analysis' : 'Save this deal'}</button> : <a className="btn" href="#/deals">Open My deals</a>}
          <a href="#/toolkit">Your buying steps in My plan&nbsp;→</a>
        </div>
      </section>
      {/* One labeled ad from the kind of professional this plan needs (listings and bank-owned homes only). */}
      {adShows && <FixedAds spot="analyze" pros={pros} categories={adCats} area={{ state: deal.state, county: deal.county, city: null }} />}
      </div>
      </>}
      {/* Guided: the plan's next step, or that this page is it (practice analyses, real costs). */}
      <PathNext step="analyze" />
    </main>
  );
}

/** What a new deal's starting numbers take from your plan, said once, so nothing changes silently. */
function ProfileNote({ deal }: { deal: Deal }) {
  // Commercial income on a listed building starts its loan from your plan (cash stays its own field there).
  if (deal.plan === 'commercial') {
    const p = investorProfile();
    const loan = commercialLoanStart(p, deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short');
    if (loan === null) return null;
    const wd = worksheetDownPct();
    const text = loan === 0 ? 'paying cash (no loan)' : `a loan for ${loan}% of the price (${wd !== null && 100 - wd <= 75 ? `the ${wd}% down payment in your cash worksheet` : `a common commercial figure until your lender quotes; commercial lenders often want 25% or more down${wd !== null ? `, more than the ${wd}% in your cash worksheet` : ''}`})`;
    return <p className="muted analyze-profile">From your plan: {text}{p.investable > 0 ? `; ${fmtMoney(p.investable)} of investable cash, which the results check this deal’s cash against until you enter your own` : ''}. This fills in a new deal’s starting loan. Change it below; it’s a starting figure, not loan terms anyone approved. <a href="#/toolkit">Edit your plan</a></p>;
  }
  // Only Keep and rent starts from your plan's cash, loan and management.
  if (deal.plan !== 'rent') return null;
  const listed = deal.kind === 'listing' || deal.kind === 'reo' || deal.kind === 'short';
  const p = investorProfile();
  const parts: string[] = [];
  if (listed && p.investable > 0) parts.push(`${fmtMoney(p.investable)} of investable cash (your limit for a listed home)`);
  if (listed && p.loan === 'cash') parts.push('paying cash');
  else if (listed && p.loan === 'yes' && worksheetDownPct() !== null) parts.push(`a loan for ${Math.round((100 - worksheetDownPct()!) * 100) / 100}% of the price (the ${worksheetDownPct()}% down payment in your cash worksheet; replace it with your lender’s figure)${p.ownerOccupant ? '; no property manager, since you’d live there' : ''}`);
  else if (listed && p.loan === 'yes' && p.ownerOccupant) parts.push('a home loan you’d live in (the loan field starts at the 75% investor example; owner-occupant loans can need less down, so replace it with your lender’s figure); no property manager, since you’d live there');
  else if (listed && p.loan === 'yes') parts.push('a loan (a common 75% of the price for a listed rental, until your lender quotes)');
  if (!p.ownerOccupant && p.manager === true) parts.push('a property manager (8% of rent)');
  else if (!p.ownerOccupant && p.manager === false) parts.push('managing it yourself');
  if (listed && p.loan === 'cash' && !(p.investable > 0)) parts.push('your investable cash isn’t worked out yet in My plan, so the price that meets your target has no cash limit (work it out to cap it at what you have)');
  if (!parts.length) return null;
  return <p className="muted analyze-profile">From your plan: {parts.join('; ')}. These fill in a new deal’s starting numbers. Change any of them below; they aren’t loan terms anyone approved. <a href="#/toolkit">Edit your plan</a></p>;
}
