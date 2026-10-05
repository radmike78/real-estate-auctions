# Market research and product direction

Last updated 2026-09-25. Covers the competitor review, user complaints, what investors say they would pay for, and a crosscheck against an independent (ChatGPT) review of the same question.

## 1. Who else does this, and where they fall short

| Site type | Examples | What they do well | Common complaints |
|---|---|---|---|
| National foreclosure lists | RealtyTrac, Foreclosure.com, PropertyShark | Big inventory, alerts | Stale or already-sold listings, paywalled basics, hard-to-cancel trials, "estimated equity" nobody can check |
| Auction platforms | Auction.com, Xome, Hubzu, Bid4Assets | Online bidding | Buyer's premiums and fees revealed late, postponed or cancelled sales, no interior access, reserve prices that aren't shown |
| Tax-sale data services | Tax Sale Resources, courses and "systems" | County calendars | Get-rich-quick marketing, expensive courses, lien-state advice applied to deed states like Nevada |
| Pre-foreclosure / skip-trace tools | PropStream, BatchLeads | Owner data and outreach | Built around contacting distressed homeowners; accuracy and ethics concerns |
| Official county sites | Treasurer, Recorder, Assessor, trustee notices | Authoritative | Scattered across many sites, PDFs, no explanation for beginners |

The gap: nobody combines **accurate, current, local data** with **an honest explanation of how each sale really works and what it will cost**, without selling hype.

## 2. What users say they would pay for (time saved or money saved)

1. Knowing a sale is still on (status, postponements, cancellations) without calling around.
2. A true all-in cost and a walk-away number before auction day.
3. Knowing which liens survive the sale.
4. A clear, step-by-step process for each type of sale in their county.
5. Alerts when something changes on a property they are watching.
6. Trusted local professionals (title, attorney, lender, agent, eviction).

## 3. Crosscheck with the ChatGPT review

### Adopted (and built in this release)

| Recommendation | Where it lives |
|---|---|
| Maximum safe bid, counting every cost | `#/calculator` and the **Max bid** section on each property (`src/lib/bidCalc.ts`) |
| Stress tests (value drops, repairs overrun, longer hold) | Same calculator, "If things go worse than planned" |
| Due-diligence funnel with reasons, no hidden score | **Due diligence** section on each property (`src/lib/ddFunnel.ts`): 12 steps, checkboxes saved per property |
| Data provenance ("where did this number come from") | Property record labels: County Assessor, County Recorder, Estimate, Drive by to confirm; "Record checked X ago" |
| State the asset clearly ("what you'd buy") | Property hero line and playbook "What you get" |
| Jurisdiction playbooks | `#/playbooks`: tax deed, SID certificates, trustee foreclosure, HOA, sheriff, IRS, REO, short sale |
| What survives the sale | Each playbook's "What the sale wipes out, and what stays" |
| Deal room / watchlist with change alerts | `#/deals` (My deals): status and postponement alerts, countdowns, notes, max bid vs minimum bid |
| Team by sale type | Playbook and property **Your team** section |
| Walk-away examples | Illustrative example in each playbook's mistakes section, clearly labelled as not a real property |
| Brand promise | Kept in the playbooks ("Many good decisions are the deals you walk away from"); the homepage line was removed to keep the hero short |

### Changed or rejected

| ChatGPT suggestion | Decision | Why |
|---|---|---|
| Treat Nevada tax sales as tax-lien investing | Corrected | Nevada property-tax sales convey a **deed**. Clark County separately sells special-assessment (SID) lien certificates under NRS 271. |
| Owner outreach lists / direct mail to pre-foreclosure owners | Rejected | Conflicts with the site's do-not-contact-homeowners policy and NRS 645F foreclosure-consultant rules. Added a homeowner help page instead. |
| Expand to other counties and states now | Deferred | Depth in Clark County first; accuracy is the main differentiator. |
| A single AI "deal score" | Rejected | Unexplained scores are a top complaint. Every finding shows its reason instead. |
| "10% buyer's premium" at the Clark tax sale (from a secondary source) | Corrected | The official Treasurer notice and FAQ show no buyer's premium. |

### Added from our own research

- **Homeowner help page** (`#/homeowner-help`): mediation, HUD/CFPB counselors, legal aid, scam warnings, tenant rights, excess proceeds.
- Verified Clark County tax-sale rules in checklists: $5,000 deposit, registration closes about 8 days before, deed issued to the name on the Trustee Auction Registration Form (Treasurer FAQ, checked Sept 2026), full payment by 1:00 p.m., no redemption but a 2-year protest window.
- HOA lender-tender rule and 60-day redemption (NRS 116.31166); tenant notices (90 days under the federal Protecting Tenants at Foreclosure Act; NRS 40.255 for the change-of-ownership notice); sheriff-sale 1-year redemption (NRS 21.210).
- A legal fact-check against statute text corrected: special-assessment certificate rules (no deposit, day-of registration, next-morning payment, certificate expiry, deed clears other liens under NRS 271.600), the federal Foreclosure Bar for Fannie Mae / Freddie Mac loans at HOA sales, the U.S. 120-day redemption right after trustee sales, and the scope of NRS 645F.

## 4. Pricing decision: free for users

**Decision (owner, 2026-09-25): everything for buyers and investors is free.** The site exists to help people invest and make money, so there is no paid investor plan for now. That includes listings and status, playbooks, checklists, the max safe bid calculator, due diligence, My deals and homeowner help.

**How the site is funded:** licensed professionals (agents, lenders, title, insurance, contractors) pay a monthly fee to be listed in the directories, on one of three plans (Rotating, Spotlight with a labeled Featured ad box, Mentor Connect with a labeled ad beside one Learn or Practice topic). Everyone listed keeps the same fair rotating place in the directory list, and every ad is labeled. No referral fees and no pay-for-position in the list.

**Features to build later, free:**

1. Email alerts on status changes, postponements and new listings matching saved searches.
2. My deals synced across devices, with exportable deal files (PDF).
3. Recorded-document pulls and a lien summary per property (where data licensing allows).
4. Auction-day calendar exports and registration-deadline reminders.
5. Historical results (opening bid vs sold price) for Clark County sales.

Features that cost money to run (alerts, document pulls) could come back as optional paid extras later if the owner decides; nothing on the site depends on that.

Avoid: income promises, courses, and anything that sells distressed-homeowner contact data.

## 5. Sources

- Clark County Treasurer: tax sale notice and FAQ (clarkcountynv.gov)
- Nevada Revised Statutes 21.210, 40.255, 107, 116.31166, 271, 361, 645F (leg.state.nv.us)
- Clark County Recorder (AcclaimWeb) and Assessor
- irsauctions.gov, hudhomestore.gov, homepath.fanniemae.com
- Public reviews and forum complaints about national foreclosure and auction sites (summarised, not quoted)
