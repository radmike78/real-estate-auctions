# Data access requests

Two official sources the site needs permission or a subscription for before it can ingest their data. Each section has the background and an email you can send. Fill in the bracketed parts first.

The site's rule stays the same for both: no automated collection until a person has confirmed in writing that it's allowed. When permission arrives, record the date in `termsReviewedAt` in `ingest/sources/registry.ts` and keep a copy of the permission with the project records.

---

## 1. HUD Home Store (HUD-owned homes)

**Why a request is needed.** hudhomestore.gov is HUD's official site for HUD-owned (FHA-foreclosed) homes, operated for HUD by Yardi Systems. Its `robots.txt` is `Disallow: /` for all automated agents, and it offers no public API or download. So the site links to HUD's own Nevada search (on the Bank-owned checklist) instead of copying listings. That link stays even if a feed is approved.

**Who to contact.** HUD's Office of Single Family Asset Management, which runs the sale of HUD-owned homes. Call the HUD number listed on HUD Home Store (800-225-5342) or use hud.gov/contact, and ask to be routed to whoever manages HUD Home Store listing data or data-sharing requests. The Asset Manager for Nevada, listed on HUD Home Store under Property Contacts, can also point you to the right office.

**Email**

> Subject: Request for permission or a data feed for HUD Home Store listings (Clark County, Nevada)
>
> Hello,
>
> I operate [site name, URL], a free public website that helps people in Clark County, Nevada understand properties heading to a forced sale: tax sales, foreclosures, bank-owned homes and short sales. We explain what a buyer would receive, which liens may survive, and how to buy through the official process.
>
> We'd like to show HUD-owned homes in Clark County, but HUD Home Store's robots.txt disallows automated access and we will not collect data without permission. We are asking whether HUD can provide one of the following:
>
> 1. An approved data feed or export of active HUD Home Store listings (for example daily), or
> 2. Written permission to retrieve the public listing data for Nevada on a limited schedule (for example once or twice a day), identifying ourselves in the user agent.
>
> How we would use it:
> - Show only public listing information: address, case number, list price, listing period, bid deadline and status, with a link to the listing on HUD Home Store for every property.
> - Make clear that bids must go through a HUD-registered broker on HUD Home Store. We never take bids, offers or money, and we don't present ourselves as affiliated with HUD.
> - Remove listings promptly when they go under contract or are withdrawn, and never show a stale listing as available.
> - Credit HUD Home Store as the source and follow any attribution, frequency or usage terms you set.
>
> If there is a standard agreement or contact for data access, I'd be grateful to be pointed to it.
>
> Thank you,
> [Your name]
> [Title, company]
> [Phone] · [Email]
> [Site URL]

---

## 2. Clark County Recorder (pre-foreclosure notices and bank-owned homes)

**What it's for.**
- **Pre-foreclosure tracker (real data).** Recorded notices of default and notices of trustee sale.
- **Bank-owned detection.** Recorded trustee's deeds upon sale where the lender (the beneficiary) is the new owner, meaning the home reverted to the bank.

**What the Recorder offers.** The Recorder's fee schedule (AO Form 11, effective January 1, 2020, under NRS 239.052) lists official bulk data products delivered by FTP:

| Product | Daily | Monthly subscription |
|---|---|---|
| Official Record **Indexes**, pushed to you | $19 | $394 |
| Official Record **Indexes**, you pull | $22 | $457 |
| Official Record Images, pushed | $18 | $374 |
| Official Record Images, pulled | $21 | $436 |

The **index** feed is what the site needs: document type, recording date, document number, parties and parcel details. Images, the scanned documents, are optional; they're useful for reading sale dates and amounts from notices. Fees may have changed since 2020, so confirm current pricing.

**How to set it up**
1. Email or call the Recorder's Office (below) and ask for the **Official Record Indexes (FTP) subscription**. Ask for a sample file, the file format or field layout, the delivery time each day, and the subscription agreement.
2. Read the agreement for how you may use and redistribute the data. The site will show only what the tracker needs (document type, recording date, parcel, stage), and it never shows homeowner names or contact details for properties that aren't for sale. Confirm that's allowed.
3. Sign up, pay, and get the FTP login details. Store them as a secret; never commit them.
4. Tell me when you have the sample file and field layout, and I'll build the connector: parse the daily index, match notices to parcels, update the pre-foreclosure tracker, and flag trustee's deeds to lenders as newly bank-owned.

**Contact.** Clark County Recorder's Office, 500 S. Grand Central Pkwy, 2nd Floor, Las Vegas, NV 89155-1510 · (702) 455-4336 · RecWeb@ClarkCountyNV.gov

**Email**

> Subject: Official Record Indexes (FTP) subscription: information and agreement
>
> Hello,
>
> I'd like to subscribe to the Official Record Indexes (FTP) data product listed on the Recorder's fee schedule, and would appreciate the following:
>
> 1. Current pricing for the daily and monthly options (pushed and pulled).
> 2. The subscription agreement or terms of use, including any rules on how the data may be displayed or redistributed.
> 3. The file format and field layout, and a sample file if available.
> 4. What time each day's file becomes available, and how far back the data goes.
> 5. Whether document types such as notices of default, notices of trustee's sale and trustee's deeds upon sale can be filtered or are identified by a document-type code.
>
> The data will be used for [site name, URL], a public website that helps people follow Clark County properties through the foreclosure process. We show only the document type, recording date and parcel for properties in foreclosure; we don't display homeowner names or contact details, and we tell users not to contact homeowners.
>
> Thank you,
> [Your name]
> [Title, company]
> [Phone] · [Email]
