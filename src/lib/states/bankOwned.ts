// Buying a bank-owned (REO) home, state by state: disclosures, as-is terms and contract deadlines. Every line names its state.
// Sources: each line's citation, read on the state's official code site or the state-approved form (checked 2026-10-04).
// Listing sources stay in src/lib/reoSources.ts (official sellers only); nothing here is a listing source.
import type { ByStateLines } from '../../components/ByState';
import type { StateCode } from '../regions';
import { TX_REO_BUYING } from './texas';

export const BUYING: ByStateLines = {
  NV: [
    { text: 'In Nevada, DeedOwl doesn’t list bank-owned homes itself yet. The source cards (under Fannie Mae & Freddie Mac, Government agencies, and Banks & credit unions) link to each official seller’s own site, and each card says how often it has Clark County homes.' },
    { text: 'In Nevada, Fannie Mae and Freddie Mac give buyers who will live in the home a first look before investors can buy. The rules for each are on its card under Fannie Mae & Freddie Mac.', links: [['Fannie Mae & Freddie Mac', '#/bank-owned/fannie-freddie']] },
    { text: 'In Nevada, a bank reselling a home it took back isn’t covered by the foreclosure exemption, so ask for the Seller’s Real Property Disclosure form at least 10 days before closing (NRS 113.130).* Expect the bank to know little about the home; your inspection is your main protection.', links: [['NRS chapter 113', 'https://www.leg.state.nv.us/NRS/NRS-113.html']] },
  ],
  CA: [
    { text: 'In California, a lender that got the home at a foreclosure sale, or by a deed in lieu of foreclosure, doesn’t have to give the Transfer Disclosure Statement when it resells (Civil Code 1102.2(c)).' },
    { text: 'In California, the same lender resale is exempt from the Natural Hazard Disclosure Statement (Civil Code 1103.1(a)(2)). But the law says exempt sales may still need other disclosures: flood hazard and fire hazard zones (Government Code 8589.3, 8589.4, 51183.5) and earthquake fault, seismic hazard and state fire responsibility areas (Public Resources Code 2621.9, 2694, 4136) (Civil Code 1103.1(b)). Ask the listing agent for these, and order your own natural hazard report.' },
    { text: 'In California, the agents in a sale of a 1 to 4 unit home must still do a visual inspection and disclose what they find. The law has no exemption for bank-owned homes (Civil Code 2079).' },
    { text: 'In California, as in every state, federal rules exempt only sales “at foreclosure” from the lead paint disclosure for homes built before 1978. For a bank’s later resale, expect the lead disclosure form and pamphlet, and ask for them if they’re missing (40 CFR 745.101(a)).', links: [['40 CFR 745.101 (eCFR)', 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-R/part-745/subpart-F/section-745.101']] },
    { text: 'In California, as elsewhere, REO sellers use their own addendum. It usually sells the home as-is, limits what the seller promises, and overrides parts of the standard California purchase contract. Read it with your agent before you sign.' },
    { text: 'In California, whoever buys a vacant home at a foreclosure sale, or a lender that takes it back through foreclosure, must keep up its outside and keep out squatters, and cities and counties can fine them (Civil Code 2929.3). After you buy a vacant bank-owned home, local nuisance and vacant-property rules still apply.' },
  ],
  AZ: [
    { text: 'In Arizona, a home becomes bank-owned (REO) when no one outbids the lender at the trustee’s sale. The trustee then records a trustee’s deed to the lender (A.R.S. 33-811). The lender sells it later through a listing agent, like a normal sale with an offer and escrow.' },
    { text: 'In Arizona, a trustee’s sale clears liens junior to the foreclosed deed of trust. Senior liens stay (A.R.S. 33-811). If the sale wiped out a junior federal tax lien, the IRS can still redeem the home within 120 days after the sale; if the IRS didn’t get the required notice, its lien isn’t wiped out and stays on the home (26 U.S.C. 7425). The lender usually clears title before resale, but order a title report anyway.', links: [['A.R.S. 33-811', 'https://www.azleg.gov/ars/33/00811.htm']] },
    { text: 'In Arizona, no state law requires a general seller disclosure form for most home sales, though a few specific disclosures are required (below). Bank sellers usually don’t fill out the REALTOR® Seller’s Property Disclosure Statement (SPDS). Instead, they add their own addendum saying the home is sold as-is. The addendum overrides parts of the standard contract: repairs, deadlines and sometimes per-day late fees. Read it with your agent.' },
    { text: 'In Arizona, the seller and agents can’t be sued for not telling you that a death or a felony happened at the home, or that a sex offender lives nearby. Ask and research these yourself if they matter to you (A.R.S. 32-2156).', links: [['A.R.S. 32-2156', 'https://www.azleg.gov/ars/32/02156.htm']] },
    { text: 'In Arizona, if the home is in an HOA, you get the HOA’s documents and fees owed within about 10 days after your offer is accepted (in communities of 50 or more homes, 10 days after the HOA gets the seller’s notice) (A.R.S. 33-1806; condominiums, A.R.S. 33-1260).', links: [['A.R.S. 33-1806', 'https://www.azleg.gov/ars/33/01806.htm'], ['A.R.S. 33-1260', 'https://www.azleg.gov/ars/33/01260.htm']] },
    { text: 'In Arizona, if the home or land isn’t in a recorded subdivision and is in an unincorporated area, the seller (of up to five parcels) must give you an affidavit of disclosure at least 7 days before closing, and you can cancel within 5 days after you get it (A.R.S. 33-422). This doesn’t apply at the trustee’s sale itself, but it does apply when the bank resells (A.R.S. 33-422(G)).', links: [['A.R.S. 33-422', 'https://www.azleg.gov/ars/33/00422.htm']] },
    { text: 'In Arizona, use your inspection period. Bank sellers rarely make repairs.' },
    { text: 'In Arizona, a bona fide tenant generally gets at least 90 days’ notice under federal law, and one with a lease may be able to stay until it ends unless the home is sold to a buyer who will live in it. Anyone else has to be removed through a forcible detainer (eviction) case. Ask the seller whether the home will be vacant at closing (A.R.S. 12-1173.01).' },
    { text: 'In Arizona, HUD, Fannie Mae (HomePath) and Freddie Mac (HomeSteps) sell their homes the same way they do nationwide, so their source cards (under Fannie Mae & Freddie Mac, and Government agencies) apply. HUD homes need a HUD-registered broker to bid for you.' },
  ],
  UT: [
    { text: 'In Utah, the state-approved Real Estate Purchase Contract (REPC), which licensed agents must use, lists the “Seller Disclosures.” They include a written seller property condition disclosure, a title commitment, HOA documents and any known environmental or code problems (REPC section 7).', links: [['Utah REPC (Division of Real Estate)', 'https://commerce.utah.gov/wp-content/uploads/2023/03/purchase-contract.pdf'], ['State-approved forms', 'https://commerce.utah.gov/realestate/real-estate/forms/state-approved/']] },
    { text: 'In Utah, under the REPC, the buyer buys the home “As-Is,” with no warranties, and relies on their own inspections during the due diligence period (REPC section 10.2). The seller still agrees to disclose known defects that a reasonable inspection wouldn’t find (REPC section 10.3). Banks often replace or narrow these terms with their own addendum, so read every addendum before you sign.' },
    { text: 'In Utah, the parties can agree to change the REPC or use a different form, and bank-owned sellers often do (REPC preamble).' },
    { text: 'In Utah, your due diligence deadline in the REPC is your exit. If you don’t cancel or resolve your objections in writing by then, your earnest money can become non-refundable (REPC section 8.1).' },
    { text: 'In Utah, an owner who actually knows a property is currently contaminated from meth use, storage or manufacture must disclose it (Utah Code 57-27-201). A seller doesn’t have to disclose that a home is “stigmatized,” for example as the site of a homicide, other felony or suicide (Utah Code 57-1-1, 57-1-37).', links: [['Utah Code 57-27-201', 'https://le.utah.gov/xcode/Title57/Chapter27/57-27-S201.html'], ['Utah Code 57-1-37', 'https://le.utah.gov/xcode/Title57/Chapter1/57-1-S37.html']] },
    { text: 'In Utah, homes built before 1978 come with the federal lead-based paint disclosure (REPC section 7(b)).' },
    { text: 'In Utah, HUD homes (a HUD-registered broker bids for you) and Fannie Mae HomePath and Freddie Mac HomeSteps listings work the same as nationwide, through a listing agent.' },
  ],
  TX: TX_REO_BUYING,
};

/** The step-by-step bank-owned guide for each state. */
export const REO_GUIDE: Record<StateCode, string> = {
  NV: '#/playbooks/reo',
  CA: '#/playbooks/careo',
  AZ: '#/playbooks/azreo',
  UT: '#/playbooks/utreo',
  TX: '#/playbooks/txreo',
};
