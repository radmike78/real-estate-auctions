# Data access requests

Official sources the site needs permission or a subscription for before it can ingest their data. Each section has the background and an email you can send. The emails are written for DeedOwl (<https://deedowl.com>), run by MRAD Software Solutions LLC; fill in the bracketed parts (title, phone, email) first.

The site's rule stays the same for all of them: no automated collection until a person has confirmed in writing that it's allowed. When permission arrives, record the date in `termsReviewedAt` in `ingest/sources/registry.ts` and keep a copy of the permission with the project records.

---

## 1. HUD Home Store (HUD-owned homes)

**Why a request is needed.** hudhomestore.gov is HUD's official site for HUD-owned (FHA-foreclosed) homes, operated for HUD by Yardi Systems. Its `robots.txt` is `Disallow: /` for all automated agents, and it offers no public API or download. So the site links to HUD's own search on HUD Home Store (on the Bank-owned page and checklist) instead of copying listings. That link stays even if a feed is approved.

**Who to contact.** HUD's Office of Single Family Asset Management, which runs the sale of HUD-owned homes. Call the HUD number listed on HUD Home Store (800-225-5342) or use hud.gov/contact, and ask to be routed to whoever manages HUD Home Store listing data or data-sharing requests. The Asset Manager for each state, listed on HUD Home Store under Property Contacts, can also point you to the right office.

**Email**

> Subject: Request for permission or a data feed for HUD Home Store listings (Nevada, California, Arizona and Utah)
>
> Hello,
>
> I run DeedOwl (https://deedowl.com), a free public website that helps buyers and investors in Nevada, California, Arizona and Utah understand properties heading to a forced sale: tax sales, foreclosures, bank-owned and government-owned homes, and short sales. We explain what a buyer would receive, which liens may survive, and how to buy through the official process. Buyers pay nothing to use the site.
>
> We'd like to show HUD-owned homes in those four states, but HUD Home Store's robots.txt disallows automated access and we will not collect data without permission. We are asking whether HUD can provide one of the following:
>
> 1. An approved data feed or export of active HUD Home Store listings for Nevada, California, Arizona and Utah (for example daily), or
> 2. Written permission to retrieve the public listing data for those four states on a limited schedule (for example once or twice a day), identifying ourselves in the user agent.
>
> How we would use it:
> - Show only public listing information: address, case number, list price, listing period, bid deadline and status, with a link to the listing on HUD Home Store for every property.
> - Make clear that bids must go through a HUD-registered broker on HUD Home Store. We never take bids, offers or money, and we don't present ourselves as affiliated with HUD.
> - Remove listings promptly when they go under contract or are withdrawn, and never show a stale listing as available.
> - Never show former owners' names or contact details, and never help anyone contact them.
> - Credit HUD Home Store as the source and follow any attribution, frequency or usage terms you set.
>
> If there is a standard agreement or contact for data access, I'd be grateful to be pointed to it.
>
> Thank you,
> Mike Radecker
> [Title], MRAD Software Solutions LLC (DeedOwl)
> [Phone] · [Email]
> https://deedowl.com

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
> The data will be used for DeedOwl (https://deedowl.com), a free public website that helps people follow Clark County properties through the foreclosure process. We show only the document type, recording date and parcel for properties in foreclosure; we don't display homeowner names or contact details, and we tell users not to contact homeowners.
>
> Thank you,
> Mike Radecker
> [Title], MRAD Software Solutions LLC (DeedOwl)
> [Phone] · [Email]
> https://deedowl.com

---

## 3. Assessment Management Group (SID lien-certificate lists)

**Why a request is needed.** Clark County and the cities (Las Vegas, Henderson, North Las Vegas) sell lien certificates for unpaid special improvement district (SID) assessments. The Treasurer's certificate-sale page sends buyers to Assessment Management Group (AMG), which posts the notices and lists at <https://www.amgnv.com/notice-of-sale.asp>. AMG's Terms of Use (<https://www.amgnv.com/copyright.asp>) prohibit copying, downloading or republishing its material without prior written consent. The site's SID connector is built but stays off, and the SID playbook links to AMG's page instead.

**Who to contact.** Assessment Management Group, Las Vegas: office 702-796-0082 (listed on its website). The county or a city's SID administrator can also say whether the lists may be shared directly.

**Email**

> Subject: Permission to show SID certificate-sale lists (Clark County)
>
> Hello,
>
> I run DeedOwl (https://deedowl.com), a free public website that helps buyers and investors in Nevada, including Clark County, understand forced sales and how to buy through the official process.
>
> We'd like to show the special improvement district (SID) lien-certificate sale lists that AMG posts on its notice-of-sale page for Clark County and the cities. Your Terms of Use require written consent, so we are asking for it before collecting anything.
>
> What we would do:
> - Read the notice-of-sale page at most a few times a day, identified in our user agent.
> - Show only the parcel number, street address, district number, amount due and sale date, clearly marked "Lien certificate sale, not a property sale". We would never show owner names or contact details, and never help anyone contact owners.
> - Link to your notice-of-sale page for every sale, credit AMG as the publisher for the county and the cities, and remove certificates as soon as they drop off your list.
> - Follow any attribution, frequency or usage terms you set.
>
> If you prefer, a file or feed you send us would also work. Thank you for considering it.
>
> Mike Radecker
> [Title], MRAD Software Solutions LLC (DeedOwl)
> [Phone] · [Email]
> https://deedowl.com

---

## 4. Los Angeles County Treasurer and Tax Collector (tax-defaulted property auctions)

**Why ask.** The Treasurer and Tax Collector publishes each auction's property list as a PDF on <https://ttc.lacounty.gov> (for example the 2026B auction book, about 1,250 parcels with AIN, minimum bid and address; no owner names). Its `robots.txt` allows crawling with a 10-second delay, but the site says "all rights reserved" and has no clear statement on reuse. A DeedOwl connector can read the PDF and check each parcel against the county's public parcel map, but it stays off until the site owner has reviewed the terms or the county confirms in writing. Bidding happens on the county's auction platform, which DeedOwl only links to.

**Who to contact.** The Treasurer and Tax Collector's tax sale section, through the contact details on ttc.lacounty.gov (Property Tax Auction pages).

**Email**

> Subject: Permission to show the tax-defaulted property auction list (Los Angeles County)
>
> Hello,
>
> I run DeedOwl (https://deedowl.com), a free public website that helps buyers and investors in Nevada, California, Arizona and Utah understand tax sales and buy through the official process.
>
> We'd like to show the parcels in your public auction book (the PDF posted on ttc.lacounty.gov for each sale). Before collecting anything, we'd like to confirm that this is allowed and follow any terms you set.
>
> What we would do:
> - Read the posted auction book at most once or twice a day, identified in our user agent, and respect your robots.txt.
> - Show only the item number, AIN, minimum bid, property type and situs address, with a link to your auction page for every sale. We would never show owner names or contact details, and never help anyone contact owners.
> - Make clear that registration and bidding happen only through the county's official auction, remove parcels that are withdrawn or redeemed as soon as your list changes, and credit the Treasurer and Tax Collector as the source.
>
> Is this permitted, and is there a preferred format (a data file or feed) or any conditions we should follow?
>
> Thank you,
> Mike Radecker
> [Title], MRAD Software Solutions LLC (DeedOwl)
> [Phone] · [Email]
> https://deedowl.com

---

## 5. Salt Lake County Auditor (May tax sale list)

**Why a request is needed.** Salt Lake County's copyright page prohibits commercial republication of its material without written permission. The county's tax sale is held each May (the 2027 sale is May 26–27, with the list posted in April 2027). DeedOwl won't collect the list until the county grants written permission.

**Who to contact.** Salt Lake County Auditor's Office, tax sale: 385-468-7242.

**Email**

> Subject: Permission to show the May tax sale property list (Salt Lake County)
>
> Hello,
>
> I run DeedOwl (https://deedowl.com), a free public website that helps buyers and investors in Nevada, California, Arizona and Utah understand tax sales and buy through the official process.
>
> We'd like to show the properties on Salt Lake County's tax sale list. The county's copyright page requires written permission to republish its material, so we are asking before collecting anything.
>
> What we would do:
> - Read the published list only after it is posted (about once a day until the sale), identified in our user agent.
> - Show only the parcel number, property address, minimum bid and sale date, with a link to the county's tax sale page. We would never show owner names or contact details, and never help anyone contact owners.
> - Make clear that registration and bidding happen only through the county, remove parcels that are redeemed or withdrawn, and credit the Salt Lake County Auditor as the source.
>
> May we have written permission to do this, and is there a preferred format or any conditions we should follow?
>
> Thank you,
> Mike Radecker
> [Title], MRAD Software Solutions LLC (DeedOwl)
> [Phone] · [Email]
> https://deedowl.com

---

## Not requested

- **Maricopa County (Arizona).** The yearly tax sale sells tax liens, not property, and runs only on a commercial auction platform, so DeedOwl doesn't list it. The county's small deeded-land list includes previous owners' names, and its Assessor API needs a token; neither is worth a request for now.
