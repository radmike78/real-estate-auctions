# Source terms review

Before the ingester collects from a website on a schedule, the site owner reviews that website's rules for automated access and reuse. This file records what each source says, in its own words, and the decision. The date goes into `termsReviewedAt` in `ingest/sources/registry.ts`; scheduled runs skip any source without it.

**Reviewed:** 2026-09-26. The quotes were gathered from the live sites that day, and the site owner checked them and accepted the first two sources.

| Source | Hosts contacted | Decision |
|---|---|---|
| Clark County Treasurer tax sale, plus the County Assessor check | `treasurer.clarkcountynv.gov`, `maps.clarkcountynv.gov` | **Allowed**, as long as collection doesn't slow the county's servers. Enabled 2026-09-26. |
| IRS auctions | `www.irsauctions.gov` | **Allowed.** Enabled 2026-09-26. |
| SID lien certificates (Assessment Management Group) | `www.amgnv.com` | **Prohibited** without AMG's written consent. Stays off. |

Re-check a source if its site changes its terms, and whenever a new host is added.

---

## 1. Clark County Treasurer and County Assessor

The Treasurer's auction list and the Assessor's parcel records are subsites of clarkcountynv.gov. Neither has its own terms page, so the county's website policy applies.

**robots.txt**
- <https://www.clarkcountynv.gov/robots.txt>, in full:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://www.clarkcountynv.gov/sitemap.xml
  ```
- `https://treasurer.clarkcountynv.gov/robots.txt` and `https://maps.clarkcountynv.gov/robots.txt` return 404. There is no file, so these subsites set no rules.

**Website policy:** <https://www.clarkcountynv.gov/government/privacy-policy>

Section D, *Public Access to Information*:
> Nevada Revised Statute 239.010 states that, "All public books and public records of a governmental entity, the contents of which are not otherwise declared by law to be confidential, must be open at all times during office hours to inspection by any person …"
>
> Any data mining effort that impairs access to our website or negatively impacts our network infrastructure is prohibited. For example, techniques using site crawlers and spiders cannot degrade access to our website or impact the performance of our servers.

Section J, *Intellectual Property*:
> The content of Clark County's web pages is copyrighted, and may contain some third-party images/graphics that are used with permission. Users are notified, therefore, that one should presume the need to obtain permission from the copyright holder before reproducing or otherwise using images/graphics from this website.

**What we collect:** parcel numbers, addresses, minimum bids, auction dates and lined-out status (public records), plus each parcel's land-use code from the Assessor. We copy no images or graphics.

**How we stay within "cannot degrade access":**
- The Treasurer list is checked at most every 15 minutes (on auction day), and usually every few hours. Each check is 3 requests, 1 second apart.
- The Assessor is queried 50 parcels per request, 1 second apart. Land-use pages are read one per second, and only for parcels we haven't classified yet.
- Every request identifies the site in its user agent, and there are no retries in tight loops.

**Decision:** allowed with that condition. Enabled.

## 2. IRS auctions (Treasury Department)

**robots.txt:** <https://www.irsauctions.gov/robots.txt>, in full:
```
User-agent: *
Allow: /
Sitemap: https://irsauctions.gov/sitemap.xml
```

**Terms of use:** the site has none. Its footer links only to IRS pages such as privacy and accessibility. Neither the IRS privacy policy (<https://www.irs.gov/privacy-disclosure/irs-privacy-policy>) nor the FAQ (<https://www.irsauctions.gov/frequently-asked-questions/>) says anything about copying or automated access.

**Federal law:** 17 U.S.C. § 105 (<https://www.law.cornell.edu/uscode/text/17/105>):
> Copyright protection under this title is not available for any work of the United States Government …

**What we collect:** the site's own index (`/index.json`), about one request per hour at most. We keep only Clark County real-estate ads. The notice text names the taxpayer, so it is never stored or published.

**Decision:** allowed. Enabled.

## 3. Assessment Management Group (SID lien-certificate lists)

**robots.txt:** <https://www.amgnv.com/robots.txt> contains only comments that explain "content signals". It sets none, and it has no allow or disallow rules. By its own wording, it "neither grants nor restricts permission".

**Terms of Use:** <https://www.amgnv.com/copyright.asp>
> AMG maintains all copyrights in the text and graphic images and logos contained in this Website. This information is provided for the personal viewing of our visitors and may not be distributed, modified, or used without the prior written consent of AMG. UNAUTHORIZED COPYING, REPRODUCTION, REPUBLISHING, UPLOADING, DOWNLOADING, POSTING, TRANSMITTING OR DUPLICATING OF ANY OF THE MATERIAL IS PROHIBITED.

**Decision:** prohibited without AMG's written consent. The connector stays off (`termsReviewedAt: null`), and nothing has been collected; the only access was reading the page to build and test the connector. The site may still **link** to AMG's notice page (the SID playbook does). To enable the connector, get written permission from AMG (see `docs/data-access-requests.md`), keep a copy with the project records, and record the date.
