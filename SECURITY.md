# Security: how fake or stale listings are kept out

The main threat to this site is a **spoofed or outdated listing**: someone gets a fake property, a changed minimum bid, or a phishing "pay here" link onto a page that people trust, or the site shows a parcel that has already been redeemed. Every layer below exists to stop that. Each layer **fails closed**: when anything is in doubt, the listing is hidden. It is never shown on a guess.

## 1. Only official sources

- Sources are hard-coded in `ingest/sources/registry.ts`. There is no user-submitted listing path.
- Each source lists the exact hostnames it may be fetched from, with no wildcards. `secureFetch` enforces the following on every request **and every redirect hop**:
  - HTTPS only, with normal TLS certificate validation (never disabled)
  - no embedded credentials and no non-standard ports
  - an expected content type
  - a size limit and a timeout
- A source cannot be collected automatically until a person records `termsReviewedAt` (terms of use and robots rules reviewed).

## 2. Strict parsing

`ingest/connectors/clarkTaxSale.ts` finds the table by its column headers and validates every row.

**Row checks:**
- The parcel number must be 11 digits.
- The minimum bid must be a positive amount with at most 2 decimals and under $50M.
- Duplicate parcels are rejected.
- A row with an unrecognized status is rejected rather than guessed at.

**Whole-snapshot checks:**
- If the layout changes, or more than 5% of rows fail, the entire snapshot is rejected (`SchemaDriftError`) and nothing changes.
- Source text is stored as plain text and never rendered as HTML. React escapes it, and map popups escape it by hand.

## 3. Anomaly quarantine

A page that parses cleanly can still be wrong: a defaced page, a partial response, or an injected table. `detectAnomalies` compares each snapshot with the last accepted one. It quarantines the snapshot when, within the same auction cycle:

| Anomaly | Trigger |
| --- | --- |
| Mass removal | More than 50% of available parcels disappear |
| Mass addition | New parcels exceed 25% of the list |
| Bid shift | More than 10% of parcels change minimum bid by over 3x |

While a source is quarantined, **it publishes no listings**. An operator checks the official site, then accepts the snapshot by its SHA-256 hash: `npm run ingest -- --approve-snapshot <sha256>`.

## 4. Signed, expiring feed

- The ingester signs `public/data/listings.json` with an **Ed25519** private key. The key is kept in a secret manager (`FEED_SIGNING_KEY`), never in the repo.
- The site has the matching public key compiled in (`src/feed/publicKey.ts`). The browser **verifies the signature over the exact bytes before parsing anything**. A modified file, a file signed with another key, or a missing signature shows zero listings.
- Every feed carries an `expiresAt` derived from the source's update cadence. After it passes, the browser hides all listings. An open tab re-checks every 5 minutes. Replaying an old signed feed therefore stops working when it expires.
- The browser also re-validates each listing: parcel number format, amounts, and that links point only to allowlisted official HTTPS hosts. A signed listing that links anywhere else is dropped.

## 5. Freshness: never show a parcel that is no longer for sale

| Rule | Where |
| --- | --- |
| A parcel that is lined out, marked redeemed/paid/withdrawn, or missing from the latest official list is withdrawn at once | `reconcile.ts` |
| Polling runs about 4 times per observed update interval (learned from content hashes, starting from the agency's stated cadence), within 15 min to 6 h | `cadence.ts` |
| Polling tightens to hourly within 72 h of the auction and every 15 min within 24 h | `cadence.ts` |
| A listing is published only while its last verification is younger than `2 × poll interval + 30 min`, capped at the stated cadence | `cadence.ts`, `publish.ts` |
| A source that is stale, erroring, quarantined or not yet terms-reviewed publishes nothing | `publish.ts` |
| Parcels are hidden 10 h after the auction starts | `cadence.ts` |
| A `304 Not Modified` response counts as re-verification | `reconcile.ts` |

## 6. Browser hardening

The production build adds a Content-Security-Policy. It allows only same-origin scripts and data, no inline scripts, no plugins, and map tiles only from OpenStreetMap. Configure your host to also send these headers:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

The site never accepts bids, payments or account credentials. Every "Confirm" link goes to the official agency page.

## Operations checklist

- Store the signing key in a secret manager and rotate it with `npm run keys:generate -- --rotate`. Rebuild and redeploy the site in the same release.
- Deploy the site and the feed from CI with restricted write access to the hosting bucket.
- Alert on source health `error`, `quarantined` or `stale`, and on any `SchemaDriftError`.
- Keep the `ingest/state` snapshots, including their hashes, for audit.

## Reporting a vulnerability

Please report security issues privately to the repository owner rather than opening a public issue.
