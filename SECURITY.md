# Security: how fake or stale listings are kept out

The main threat to this site is a **spoofed or outdated listing**: someone gets a fake property, a changed minimum bid, or a phishing "pay here" link onto a page that people trust, or the site shows a parcel that has already been redeemed. Every layer below exists to stop that. Each layer **fails closed**: when anything is in doubt, the listing is hidden. It is never shown on a guess.

## 1. Only genuine official sites (anti-clone, anti-spoofing)

**Clones and look-alike sites can't reach the pipeline.**
- Sources are hard-coded in `ingest/sources/registry.ts`. The system never finds sources through search, links or user submissions.
- Every host must be an exact **`.gov`** name, enforced by `validateRegistry()` at startup and in tests. `.gov` registration is limited to verified U.S. government organizations, so a clone site (`clarkcounty-treasurer.com`, `treasurer.clarkcountynv.gov.evil.com`, `treasurer-clarkcountynv.gov`) can never be contacted.

**Every connection that returns data is checked** (`secureFetch` + `siteIdentity.ts`):

| Check | What it enforces |
| --- | --- |
| Address | HTTPS only, exact host match, no embedded credentials, no non-standard ports |
| Redirects | Every hop is re-checked; a redirect to any other host is refused |
| Certificate | Must be valid and chain to a trusted certificate authority (CA), the company that issues it |
| Name | Must cover the exact hostname |
| Validity dates | Must be current |
| Same connection | These checks run on **the same connection that returns the data**, so a different server can't answer the data request |
| Issuing CA | Recorded per host. A routine renewal from the same CA is accepted. A certificate from a **different CA** quarantines the source, because that is what a DNS or domain hijacker with a mis-issued certificate looks like. After confirming with the agency, an operator approves it with `--approve-cert <fingerprint>`. |
| DNS | Without a proxy, the name is resolved once, private/internal answers are refused (DNS rebinding), and the connection goes to exactly that address |

**Other rules:**
- A source cannot be collected automatically until a person records `termsReviewedAt` (terms of use and robots rules reviewed).
- Only plain `GET` requests at a polite pace (one request per second), identified by a descriptive User-Agent.

## 1b. Independent confirmation from a second county system

Every parcel the Treasurer lists must also exist in the **Clark County Assessor's parcel records**. These come from a separate county server (`maps.clarkcountynv.gov`, ArcGIS parcel layer). An attacker who compromised or impersonated one system would have to forge the same parcel in both. Parcels the Assessor doesn't return are marked `UNCONFIRMED` and never published. If the Assessor can't be reached, the check fails and nothing new is published.

## 2. Strict parsing

`ingest/connectors/clarkTaxSale.ts` reads the Treasurer's own data endpoints (`Event_Read` and `Parcel_Read`). It checked them against the live site on 2026-09-24.

**Whole-snapshot checks** (any failure rejects the snapshot, `SchemaDriftError`):
- The Auction List page must advertise exactly one auction ID.
- Each response must be JSON with a full, unpaged `Data` array and no `Errors`. A firewall or error page is rejected.
- If more than 5% of rows fail, the entire snapshot is rejected and nothing changes.

**Row checks:**
- The parcel must belong to the advertised auction.
- The parcel number must be valid and consistent, with no duplicates.
- The minimum bid must be a positive number.
- The line-out flag must be a real true/false value.
- The winning bid and deed date must be valid.

**Plain text only.** The county's data itself contains HTML (grouped parcels arrive as a `<button onclick=…>`, and addresses include `<br/>`). All values are reduced to plain text, never rendered as HTML, and escaped again by React.

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
- The browser also re-validates each listing. It must have a valid parcel number and amounts, an auction date, an Assessor confirmation, and links only to allowlisted official HTTPS hosts. A signed listing that fails any of these is dropped.

## 5. Freshness: never show a parcel that is no longer for sale

| Rule | Where |
| --- | --- |
| A parcel that is lined out (`IsLineOut`), sold (winning bid or recorded deed), or missing from the latest official list is withdrawn at once | `reconcile.ts` |
| With no upcoming auction session, nothing is published. The Treasurer holds a new auction "only if necessary." | `cadence.ts` |
| Polling runs about 4 times per observed update interval (learned from content hashes, starting from the agency's stated cadence), within 15 min to 6 h | `cadence.ts` |
| Polling tightens to hourly within 72 h of the auction and every 15 min within 24 h | `cadence.ts` |
| A listing is published only while its last verification is younger than `2 × poll interval + 30 min`, capped at the stated cadence | `cadence.ts`, `publish.ts` |
| A source that is stale, erroring, quarantined or not yet terms-reviewed publishes nothing | `publish.ts` |
| Parcels are hidden 10 h after the auction starts | `cadence.ts` |

## 5b. Agent directory and homeowner privacy

- **Verified partner agents only.** An agent profile is shown only while:
  - the Nevada license is **Active** and unexpired;
  - a person confirmed it on the official Nevada Real Estate Division lookup within the last **90 days** (the lookup blocks automated checks);
  - every contact link is safe (`tel:` with a +1 number, a plain `mailto:` with no injected parameters, or an `https://` website).

  Anything else hides the profile automatically (`src/lib/agents.ts`). Users get the official lookup link to check the license themselves.
- **No solicitation of distressed owners.** The pre-foreclosure tracker and property pages never show owner names or contact details for homes that aren't for sale. Every pre-foreclosure view carries a do-not-contact warning referencing NRS Chapter 645F, and the purchase guidance tells users not to contact homeowners.

## 5c. Advertiser signup and admin approval

The main risk is a **fake professional profile**, for example a real agent's or lender's license number paired with a scammer's phone number, used to phish buyers or steal loan deposits.

- **Identity, not just license.** The regulator lookup (NRED, NMLS, FDIC, NCUA, Division of Insurance or NSCB) proves a license exists, not that the applicant owns it. Approval requires confirming identity through the **company, using contact details from the regulator or the company**. It never uses the phone number or email on the application. The server enforces every verification step (`approvalBlockers`). Profiles are also hidden when advertising lapses.
- **Impersonation signals.** Any other application using the same license number or email is flagged in the admin view. A license can't be approved twice.
- **Email ownership.** A single-use token, valid for 48 hours. Only its SHA-256 hash is stored.
- **Signed directory.** `pros.json` is Ed25519-signed and expires after 7 days. The browser verifies it and re-applies every listing rule to each profile. If a published directory fails verification, no profiles are shown; the site never falls back to other data. An HTML fallback page from a static host counts as "not published," not as a valid or tampered file.
- **Admin authentication.**
  - Password stored as scrypt only.
  - Session token in an `HttpOnly; SameSite=Strict` cookie. Only its hash is stored.
  - Sessions last at most 8 hours, with a 1-hour idle timeout.
  - Sign-in is throttled: 5 failures per IP and 10 per username per 15 minutes.
  - Failed sign-ins are audited.
- **CSRF.** Every admin write needs the `x-fsf-admin` header, which a cross-site page can't send without a CORS preflight, and CORS is never enabled. It also needs a same-origin `Origin` and a SameSite=Strict cookie.
- **Input handling.**
  - JSON only, 32 KB maximum.
  - Strict validation, with all text reduced to plain text.
  - Static files are served with path-traversal protection.
  - Security headers on every response: `nosniff`, `frame-ancestors 'none'`, HSTS on HTTPS.
- **Privacy.** The individual admin's name is never published; profiles say "verified by staff." Emails are sent only to the applicant.

## 5d. Leads, metrics and advertiser accounts

- **Leads.**
  - A lead is sent only after the buyer explicitly agrees to share their details with that one professional, and acknowledges the site's role.
  - Leads are validated and stored as plain text, rate-limited (5 per network per hour), and protected by a honeypot field.
  - Leads are kept for 13 months, then deleted.
  - CSV exports neutralize spreadsheet-formula injection.
- **Metrics.**
  - Only daily aggregate counts per advertiser are stored.
  - Unique visitors come from a SHA-256 of IP and user agent, salted with a random value that exists only in memory and rotates every day. These hashes can't be reversed or linked across days, and they are deleted after 2 days.
  - Bots are filtered by user agent, and each visitor is limited to 60 events a minute. Only currently listed profiles can be counted, so a competitor can't meaningfully inflate or drain the numbers.
  - Leads can only be counted through the real contact form.
- **Advertiser sign-in.**
  - A one-time link, valid for 15 minutes, is sent only to the email on an approved profile. Only its hash is stored.
  - The response is identical whether or not an account exists, so accounts can't be enumerated.
  - Sign-in requests are rate-limited per IP and per email.
  - Sessions use a separate `fsf_pro` cookie scoped to `/api/pro` (`HttpOnly; SameSite=Strict`). Admin and advertiser cookies can't be used for each other's endpoints.

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
