# Forced-Sale Finder

A distressed-property and forced-sale discovery platform. It finds properties that are actually heading to a forced sale (tax-deed, trustee, HOA, sheriff, judicial, IRS or REO), not just properties with liens. It then answers four questions for each one:

1. **Is it actually heading to sale?** A lien alone never makes a property "buyable". There must be a recorded enforcement event.
2. **What exactly would I be buying?** For example, a tax deed, a trustee's deed, a sheriff's certificate with redemption rights, or only a lien certificate.
3. **What liens and risks may remain?** The Nevada rules engine estimates which liens likely survive the sale.
4. **What must I do next?** The site shows online bidding details or step-by-step in-person instructions, and always links to the official sale.

> **Status:** search results use fictional sample data for Clark County, NV. The **Live tax sales** page shows only verified listings from the Clark County Treasurer connector (see [Live data](#live-data)).
> Nothing here is legal advice or a title determination. The site never claims title is "clear" and never takes bids or money.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # rules engine, search, connector, freshness and security tests
npm run build      # static site in dist/
```


## Live data

The first real connector reads the **Clark County Treasurer's delinquent-property (trustee) auction** at <https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList>. It uses the county's own data endpoints for auction sessions and parcels. Each parcel is cross-checked against the Assessor's parcel records on a separate county server. See [SECURITY.md](SECURITY.md) for how sources are authenticated, kept current and protected against spoofing.

**Verified against the live site on 2026-09-24:**
- The latest auction (#21) was held **May 7, 2026** in person at the Clark County Government Center. It had 142 parcels, 95 lined out and 63 sold.
- No new auction is scheduled; the Treasurer holds one "only if necessary."
- So the Live page correctly shows **no available parcels** today. It will list parcels automatically once the Treasurer publishes the next auction.

### Enabling it

1. **Record the terms-of-use review.** Review the county sites' terms of use, then set `termsReviewedAt` in `ingest/sources/registry.ts`. Scheduled runs don't fetch until this is set. On 2026-09-24:
   - `www.clarkcountynv.gov/robots.txt` allows all automated access.
   - `treasurer.clarkcountynv.gov` has no `robots.txt`.
   - No site terms prohibiting automated access were found.
2. **Check the pipeline without saving anything:**
   ```bash
   npm run ingest -- --dry-run
   ```
   This verifies the sites' identity, then fetches, parses and cross-checks the data. To test offline from saved responses, run `npm run ingest -- --from-dir ingest/fixtures/clark-2026-05`.
3. **Create the signing key:**
   ```bash
   npm run keys:generate
   ```
   This writes the private key to `ingest/.keys/` (gitignored) and the public key into the site. Rebuild the site afterwards.
4. **Run it:**
   ```bash
   npm run ingest -- --watch
   ```
   This long-running service checks each source when it is due and writes the signed feed to `public/data/`. Deploy that folder alongside the built site.

### How it stays current

- **Learns the real update rate.** It watches when the official list actually changes and checks about 4 times per update interval. For the Treasurer's daily list, that starts at every 6 hours.
- **Speeds up near the sale.** It checks hourly in the last 3 days before the auction, and every 15 minutes on the final day.
- **Removes parcels right away.** A parcel is withdrawn as soon as the Treasurer lines it out, it sells, or it drops off the list.
- **Hides anything not re-checked recently.** If the county site is down or the service stops, listings disappear from the site instead of going stale.

## Advertisers: signup, verification, billing (server)

Real estate agents, loan officers, mortgage companies, banks, credit unions, hard-money and private lenders, title and escrow companies, insurance agents and contractors can advertise. Each gets a dedicated profile page (`#/pros/:id`). Profiles appear in:
- **Find an agent** (`#/agents`)
- **Financing** (`#/financing`), filterable by loan type and credit situation
- **Title, insurance & repairs** (`#/pros`)

The advertiser landing page is `#/advertise`, the application form is `#/advertise/apply`, and the admin review is at `#/admin`.

**How a profile goes live** (the server enforces every step):
1. **Apply.** One form for every category, with category-specific rules: license format, the services or loan types offered, and credit situations (lenders only). All text is plain text only. Anti-spam: a hidden honeypot field and 5 applications per network per hour.
2. **Confirm email.** A single-use link, valid for 48 hours.
3. **Verify.** An admin checks the license on the official lookup for that category:

   | Category | Official lookup |
   | --- | --- |
   | Agents | NRED |
   | Loan officers, mortgage companies, private lenders | NMLS Consumer Access |
   | Banks | FDIC BankFind |
   | Credit unions | NCUA |
   | Title and insurance | Nevada Division of Insurance |
   | Contractors | Nevada State Contractors Board |

   The admin then **confirms identity through the company, using contact details from the regulator or the company, never from the application**. Approval is blocked until status, expiration (where licenses expire), name, type, company and identity are all recorded.
4. **Bill.** The admin records the plan and a paid-through date after payment. A profile is live only while it is verified within the last 90 days **and** paid through today.
5. **Publish.** Live profiles go into `public/data/pros.json`, an Ed25519-signed file that expires after 7 days and is republished hourly. The browser verifies it and re-checks every listing rule.

**Fair placement.** Results are filtered by what the user needs, then shown in a daily rotating order that is the same for everyone. Payment never buys a higher position. The CFPB's 2023 RESPA advisory opinion says steering consumers based on payments violates RESPA section 8 for real estate and mortgage services. Every profile is labeled "Advertisement."

**Proving the value of an advertising fee:**
- **Every profile page has a contact form.** The buyer explicitly agrees to share their details with that one professional only. The lead is emailed to the professional right away, and the buyer gets a receipt with due-diligence reminders.
- **Advertisers sign in at `#/advertiser`** with a one-time email link; there is no password. They see results for the last 30 days, the last 90 days or last month:
  - leads (the headline number)
  - appearances in search results
  - profile views (unique visitors)
  - phone, email and website clicks
  - the share of visitors who reached out
  - daily charts, a table view, and all their leads with a **CSV download**
- **A monthly report is emailed automatically** on the 1st. An admin can also trigger it with `POST /api/admin/reports`.
- **Counting is privacy-preserving.**
  - Only daily totals are stored.
  - Unique visitors are counted with a salted hash that exists only in memory and changes daily.
  - Bots and rapid repeat clicks are ignored.
  - No visitor is tracked across days, and nothing identifying is stored.

**Run it:**
```bash
npm run keys:generate                  # once: signing key (rebuild the site after)
npm run -s admin:hash-password         # type a 12+ character password; copy the output
export ADMIN_USERNAME=you ADMIN_PASSWORD_HASH='scrypt$...'
export BASE_URL=https://your-site.example   # used in emails
npm run build && npm run server        # serves the site and API on :8080
```
During development, run `npm run server` and `npm run dev` together; the dev server forwards `/api` to the server. Emails are printed to the server log until you connect an email provider (`server/mailer.ts`). Data is stored in SQLite at `server/data/app.db`. Back it up.

## Features

**Sections**

| Page | What it does |
| --- | --- |
| Search (`#/`) | Forced-sale search, filters, map and property pages (sample data) |
| Live tax sales (`#/live`) | Verified Clark County Treasurer listings (signed, expiring feed) |
| Pre-foreclosures (`#/pre-foreclosures`) | Follows Nevada non-judicial foreclosures: default, then notice of sale (at least 3 months later, NRS 107.080), then auction, then outcome. Per-browser watchlist that flags stage changes. **Do-not-contact warning; no owner names or contact details are shown.** Sample data until a data-use agreement with the Clark County Recorder is in place. |
| Short sales (`#/short-sales`) | What a short sale is, how to find one (through a licensed agent and the MLS), the steps, risks, and a comparison with auctions and bank-owned homes |
| Find an agent (`#/agents`) | Verified agents, searchable by city, ZIP, specialty and language |
| Financing (`#/financing`) | Financing options explained, plus lenders filtered by type, loan product and credit situation. **We don't offer financing.** |
| Title, insurance & repairs (`#/pros`) | Title and escrow, insurance, and licensed contractors |
| Profiles (`#/pros/:id`) | Each advertiser's own page, with a verified-license card and a link to check it on the official lookup |
| Advertise (`#/advertise`) | What advertisers get, who can advertise, how listing works, and the application |
| Advertiser dashboard (`#/advertiser`) | Sign in with an email link; results, daily charts, leads and CSV export |

**Search and property pages**


- **Search** by city and state (`Henderson, NV`), ZIP code, street address, APN or county, and by map area ("Search this area").
- **Filters:** "only properties I can buy now", online vs. in-person bidding, sale status, sale/lien type, auction date window, maximum minimum bid, minimum estimated equity, property type, occupancy and redemption period.
- **Acquisition status** on every record: `ONLINE_BIDDING`, `IN_PERSON_AUCTION`, `SEALED_BID`, `BROKER_OFFER`, `COURT_CONFIRMATION_REQUIRED`, `LIEN_CERTIFICATE_ONLY`, `PRE_FORECLOSURE_NOT_YET_PURCHASABLE`, `SALE_CANCELLED_OR_POSTPONED`, `STATUS_REQUIRES_CONFIRMATION`, `NOT_FOR_SALE_LIEN_ONLY`.
- **Property page:**
  - a four-question summary
  - online auction terms (registration deadline, deposit, payment, start and end times, final payment, deed type, redemption, buyer premium, eligibility)
  - a liens table showing whether each lien likely survives and why
  - step-by-step purchase instructions
  - a 22-point due-diligence (title-risk) report
  - the property record and a timeline of events
  - a source tag on every fact showing agency, document number, recorded date, last-verified time and confidence
  - a printable report

## Code map

| Path | What it is |
| --- | --- |
| `src/types.ts` | Domain model (mirrors `db/schema.sql`) |
| `src/lib/rules.ts` | Nevada lien-survival rules engine + "what you're buying" |
| `src/lib/status.ts` | Acquisition-status definitions and purchase-step generator |
| `src/lib/diligence.ts` | Due-diligence report checks |
| `src/lib/search.ts` | Location parsing and filtering |
| `src/data/sampleProperties.ts` | Seeded fictional Clark County data (swap for real connectors) |
| `src/components/` | React UI (Leaflet map, results, property page) |
| `db/schema.sql` | Production PostgreSQL/PostGIS schema with per-fact provenance |
| `ingest/` | Live connectors: source registry, secure fetch, Clark tax-sale parser, cadence, anomaly quarantine, feed signing |
| `src/feed/` | Browser-side signature/expiry verification of the live feed |
| `src/components/LivePage.tsx` | Verified live listings page |
| `server/` | Advertiser API (node:http + node:sqlite): signup, admin approval and billing, leads, metrics, reports, signed directory |
| `src/lib/pros.ts` | Professional categories, regulators, listing rules, neutral rotation |
| `src/lib/proApplication.ts` | Shared signup validation and approval rules |

## Roadmap

1. **Clark County tax-deed sales.** Build a connector for the Treasurer's delinquent and auction lists.
2. **Nevada trustee, HOA and judicial sales.** Pull notices of default and sale from Recorder filings, with OCR.
3. **Federal and commercial auctions.** Add IRS/Treasury, HUD, GSA and licensed commercial feeds.
4. **More high-volume counties.** Add a jurisdiction rules module for each state.
5. **Paid features.** Due-diligence reports, ZIP and auction alerts, and investor workflow tools.

Before any source is ingested automatically, review its terms of use, robots rules and state public-records law (tracked in `data_source.terms_reviewed_at`). A real-estate attorney should review the lien-survival rules and the disclaimers.
