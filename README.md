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

The first real connector reads the **Clark County Treasurer's delinquent-property (trustee) auction list** at <https://treasurer.clarkcountynv.gov/auction>. The Treasurer says the list is updated daily as payments come in, and paid parcels are lined out. See [SECURITY.md](SECURITY.md) for how listings are verified, kept current and protected against spoofing.

### Enabling it

1. **Review the Treasurer site's terms of use and robots rules.** If automated access is allowed, set `termsReviewedAt` in `ingest/sources/registry.ts`. Until then, scheduled runs will not fetch anything.
2. **Validate the parser against the live page.** It was written against the Treasurer's published description of the list, and tested on a synthetic copy (`ingest/fixtures/`). Run:
   ```bash
   npm run ingest -- --dry-run
   ```
   You can also save the page from your browser and run `npm run ingest -- --file saved.html`. If the layout differs, the parser rejects the page instead of guessing. In that case, update `HEADER_ALIASES` and the fixture.
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
- **Removes parcels right away.** A parcel is withdrawn as soon as the official list lines it out or drops it.
- **Hides anything not re-checked recently.** If the county site is down or the service stops, listings disappear from the site instead of going stale.

## Features

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

## Roadmap

1. **Clark County tax-deed sales.** Build a connector for the Treasurer's delinquent and auction lists.
2. **Nevada trustee, HOA and judicial sales.** Pull notices of default and sale from Recorder filings, with OCR.
3. **Federal and commercial auctions.** Add IRS/Treasury, HUD, GSA and licensed commercial feeds.
4. **More high-volume counties.** Add a jurisdiction rules module for each state.
5. **Paid features.** Due-diligence reports, ZIP and auction alerts, and investor workflow tools.

Before any source is ingested automatically, review its terms of use, robots rules and state public-records law (tracked in `data_source.terms_reviewed_at`). A real-estate attorney should review the lien-survival rules and the disclaimers.
