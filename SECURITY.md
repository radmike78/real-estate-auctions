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
| DNS | Without a proxy, the name is resolved once, answers in any private, reserved or IPv6-transition range are refused (DNS rebinding), and the connection goes to exactly that address. Every request also has a 2-minute total deadline, so a slow-drip server can't hang an import. |

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
- **Signed directory.** `pros.json` is Ed25519-signed, marked `"type": "pros"` (so no other signed file can pass as a directory), republished hourly and expires after 24 hours. The browser verifies it, refuses copies dated in the future or older than one it has already seen (replay of a pre-suspension copy), and re-applies every listing rule to each profile. If a published directory fails verification, no profiles are shown; the site never falls back to other data. An HTML fallback page from a static host counts as "not published," not as a valid or tampered file.
- **Admin authentication.**
  - Password stored as scrypt only.
  - Session token in an `HttpOnly; SameSite=Strict` cookie. Only its hash is stored.
  - Sessions last at most 8 hours, with a 1-hour idle timeout.
  - Sign-in is throttled: 5 failures per IP and 10 per username per 15 minutes. The per-username limit doesn't apply to networks the admin signed in from in the last 30 days, so an attacker can't lock the admin out by failing on purpose.
  - The password hash is always checked (asynchronously), so response time doesn't reveal whether a username exists.
  - Failed sign-ins are audited without storing unknown usernames (they are sometimes mistyped passwords). Sign-outs and lead exports are audited too.
  - Malformed `Origin` (including `null`) and cookie headers are refused cleanly.
- **CSRF.** Every signed-in write (admin or advertiser) needs the `x-fsf-request: 1` header, which a cross-site page can't send without a CORS preflight, and CORS is never enabled. It also needs a same-origin `Origin` and a SameSite=Strict cookie.
- **Input handling.**
  - JSON only, 32 KB maximum.
  - Strict validation, with all text reduced to plain text.
  - Static files are served with path-traversal protection.
  - Security headers on every response: `nosniff`, `frame-ancestors 'none'`, HSTS on HTTPS.
- **Privacy.** The individual admin's name is never published; profiles say "verified by staff." Emails are sent only to the applicant, and never repeat text typed by an unconfirmed applicant or lead sender, so the site can't be used to send an attacker's words to someone else. Confirmation emails are capped per recipient.

## 5d. Leads, metrics and advertiser accounts

- **Leads.**
  - A lead is sent only after the buyer explicitly agrees to share their details with that one professional, and acknowledges the site's role.
  - Leads are validated and stored as plain text, rate-limited (5 per network per hour), and protected by a honeypot field.
  - Leads are kept for 13 months, then deleted.
  - CSV exports neutralize spreadsheet-formula injection.
- **Metrics.**
  - Only daily aggregate counts per advertiser are stored.
  - Unique visitors come from a SHA-256 of the network address, salted with a random value that exists only in memory and rotates every day. These hashes can't be reversed or linked across days, and they are deleted after 2 days. The user agent is deliberately not part of it, so rotating browser strings can't inflate an advertiser's numbers.
  - Bots are filtered by user agent, and each network is limited to 120 events a minute. Only currently listed profiles can be counted, so a competitor can't meaningfully inflate or drain the numbers.
  - Leads can only be counted through the real contact form.
- **Advertiser sign-in.**
  - A one-time link, valid for 15 minutes, is sent only to the email on an approved profile. Only its hash is stored.
  - The response is identical whether or not an account exists, so accounts can't be enumerated.
  - Sign-in requests are rate-limited per IP and per email.
  - Sessions use a separate `fsf_pro` cookie scoped to `/api/pro` (`HttpOnly; SameSite=Strict`). Admin and advertiser cookies can't be used for each other's endpoints.
  - Opening a sign-in link doesn't sign you in until you click a button, so nobody can sign you into their account by sending you their link.
  - Suspending an advertiser ends their sessions and cancels unused sign-in links immediately.

## 5d-2. Online payments (Stripe)

- **No card data here.** Advertisers pay on Stripe-hosted Checkout and manage billing on Stripe's portal, so card numbers never reach this server (the lightest PCI scope, SAQ A). No card data is stored; the database keeps only the Stripe customer ID, subscription ID and status.
- **The server sets the price.** It's chosen from the advertiser's category (`STRIPE_PLANS`); anything the browser sends about price or plan is ignored. Only signed-in, approved and verified advertisers can start checkout, rate-limited to 10 attempts an hour, with the app header and same-origin checks against CSRF.
- **Only a signed webhook grants time.** Listings are extended only by `invoice.paid` events verified with the webhook signing secret: HMAC-SHA256 over the exact raw body, a 5-minute timestamp window, and a constant-time compare, with secret rotation supported. Coming back from Checkout grants nothing. Each event ID is processed once, so replays and redeliveries have no effect. Events for customers that aren't ours are ignored. A failure releases the event, so Stripe retries it.
- **Safe redirects.** The server and the browser both check that payment links go to `https://checkout.stripe.com/` or `https://billing.stripe.com/` before sending anyone there. API calls go only to `https://api.stripe.com`, follow no redirects, time out after 20 seconds, and use idempotency keys. Stripe errors are logged by type only, never with customer details.
- **Keys.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are read from the environment and never logged or committed. A restricted key (`rk_...`) limited to Customers, Checkout Sessions and Billing Portal (write) is recommended. The server refuses to start with only some of the settings.
- **Audit.** Checkout started or completed, payments received or failed, scheduled cancellations and ended subscriptions are all recorded in the audit trail.

## 5e. Running behind a reverse proxy

Set `TRUST_PROXY=1` only when the server sits behind your own proxy that **appends** the client address to `X-Forwarded-For` (nginx `$proxy_add_x_forwarded_for`, most load balancers). The server uses the **last** entry, the one your proxy added; anything earlier was sent by the client and can be forged. Without `TRUST_PROXY`, the socket address is used.

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
