import { useEffect, useState } from 'react';
import { stateByCode } from '../lib/regions';
import { isCertificateSourceUrl, isOfficialUrl } from '../feed/verify';
import SidCertificates from './SidCertificates';
import IrsSales from './IrsSales';
import CountySales from './CountySales';
import { upcomingCountySales } from '../lib/countySales';
import { useMyState } from '../lib/myState';
import { guideKey } from '../lib/narrow';
import { useLiveFeed } from '../data/live';
import { liveId } from '../feed/toProperty';
import { fmtDateTime, fmtMoney } from '../lib/status';
import PageHero from './PageHero';
import { Tile } from './DrillDown';
import { IconBank, IconLayers, IconSearch } from './Icons';
import Disclaimer from './Disclaimer';
import { SHOW_SAMPLE_DATA } from '../data';
import { propertyViews } from '../lib/propertyViews';
import ClassSwitch from './ClassSwitch';
import TrackButton from './TrackButton';
import SearchAlertButton from './SearchAlertButton';
import EmptyState from './EmptyState';
import OwlNote from './OwlNote';
import { useSiteFeatures } from '../lib/siteFeatures';
import { CLASS_LABEL, classOfLandUse, type ClassFilter } from '../lib/propertyClass';
import ScriptBox from './ScriptBox';
import { SALE_SCRIPTS } from '../lib/saleDocs';

function ago(iso: string, now: number) {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

const HEALTH_LABEL = {
  ok: 'Verified',
  stale: 'Stale, listings hidden',
  quarantined: 'Suspicious update, listings hidden pending review',
  error: 'Source unreachable, listings hidden',
  terms_not_reviewed: 'Not shown here',
} as const;

export default function LivePage() {
  // The shared loader verifies the signed feed and re-checks it every 5 minutes.
  const { result } = useLiveFeed();
  const [now, setNow] = useState(Date.now());
  const [cls, setCls] = useState<ClassFilter>('all');
  // County sales: the visitor's state only, until they ask for every state.
  const [myState] = useMyState();

  // Keep "x min ago" and the expiry check current in an open tab.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const expired = result?.ok && Date.parse(result.feed.expiresAt) <= now;
  const listings = result?.ok && !expired ? result.feed.listings.filter(() => myState === 'NV') : [];
  const certificates = result?.ok && !expired ? (result.feed.certificates ?? []).filter(() => myState === 'NV') : [];
  const federalSales = result?.ok && !expired ? (result.feed.federalSales ?? []).filter((sale) => (sale.usState ?? 'NV') === myState) : [];
  const nothingLive = listings.length + certificates.length + federalSales.length === 0;
  const blocked = !!result && !result.ok && result.reason !== 'NOT_CONFIGURED' && result.reason !== 'MISSING';
  const features = useSiteFeatures();
  const shown = cls === 'all' ? listings : listings.filter((l) => classOfLandUse(l.landUse?.code) === cls);

  const allUpcoming = upcomingCountySales(new Date(now), { state: myState });
  const countySales = allUpcoming.filter((s) => s.state === myState);
  // The live feed covers Clark County, Nevada and IRS sales. A visitor from another state sees their own county sales first.
  const stateName = myState ? stateByCode(myState)?.name : null;
  const otherState = !!myState && myState !== 'NV';
  const countySection = allUpcoming.length > 0 && (
    <section aria-labelledby="county-sales-head">
      <h2 id="county-sales-head">{otherState ? `Upcoming ${stateName} county tax sales` : 'Upcoming county tax sales'}</h2>
      <p>
        Counties post their own property lists for these sales. Open the list on the county’s site to see every property, its parcel number
        and minimum bid. Lists change up to the sale as owners pay their taxes, so check the county’s latest list before you bid.
      </p>
      {countySales.length > 0 ? <CountySales sales={countySales} /> : <OwlNote>No upcoming county tax sales listed for {stateName} yet.</OwlNote>}

    </section>
  );
  return (
    <main className="page">
      <PageHero
        title={<>Live <span className="grad">tax sales</span></>}
        sub={`Upcoming ${stateName ?? 'local'} county tax sales and verified IRS sales in your selected state. Read each official sale notice before bidding.`}
      />
      {!result && <p>Verifying listings…</p>}
      {result && nothingLive && otherState && !blocked && !expired && (
        <section aria-labelledby="live-feed-head">
          <h2 id="live-feed-head">DeedOwl’s verified live feed</h2>
          <OwlNote>
            The live feed covers Clark County, Nevada tax sales and IRS sales. For {stateName}, the county lists below are the official source: open each county’s page for its properties and minimum bids.{' '}
            <a href="#/find-deals">Every county’s offices&nbsp;→</a>
          </OwlNote>
        </section>
      )}
      {otherState && countySection}

      {result && nothingLive && !(otherState && !blocked && !expired) && (
        <EmptyState title={blocked ? 'No live listings shown' : expired ? 'Listings are being re-verified' : 'No verified listings in your selected state right now'}>
          <p>
            {blocked
              ? "The latest data didn't pass our security checks, so for your safety nothing is shown until verified data is published."
              : expired
                ? 'The last verification has expired, so listings are hidden until fresh data is published.'
                : 'No property sales are verified for your selected state right now. Check your county’s official lists through Find Deals.'}
          </p>
          <p>
            Meanwhile, check the{' '}
            <a href={myState === 'NV' ? 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList' : '#/find-deals'}>
              {myState === 'NV' ? 'Clark County Treasurer’s official sale list ↗' : 'Your county’s official sale lists →'}
            </a>{' '}
            and the{' '}
            <a href="https://www.irsauctions.gov/" target="_blank" rel="noreferrer noopener">
              IRS auction site ↗
            </a>
            .
          </p>
          <p className="empty-next"><strong>Buying your first rental?</strong> You don’t have to wait for an auction. Most first rentals are bought from a listing: <a href="#/toolkit/buy-box">write your buy box</a>, ask a buyer’s agent for listings that match it, look at <a href="#/bank-owned">bank-owned homes</a>, or <a href="#/practice/case">practice a purchase</a> first.</p>
          {features?.email && (
            <>
              <p>Get an email when the next list comes out.</p>
              <SearchAlertButton cls={cls} />
            </>
          )}
        </EmptyState>
      )}

      {!nothingLive && <p className="muted">
        Listings are re-checked on a schedule that follows how often each official list is updated. Parcels that are paid off (lined out), sold,
        removed, unconfirmed, or not re-verified recently are hidden automatically. When no auction is scheduled, nothing is listed.
      </p>}
      {features?.email && !nothingLive && (
        <div className="row live-alerts">
          <SearchAlertButton cls={cls} />
          <span className="muted">A daily email when new parcels match, including when the next auction list comes out.</span>
        </div>
      )}

      {!otherState && nothingLive && countySection}

      {result && nothingLive && (
        <section className="live-wait" aria-labelledby="wait-head">
          <h2 id="wait-head">While you wait</h2>
          <div className="drill-tiles">
            {SHOW_SAMPLE_DATA && <Tile href="#/search?type=TAX_DEED" icon={<IconSearch />} title="Sample tax-sale listings" summary="See how a tax-sale listing looks, with liens and equity worked out" />}
            <Tile href="#/about/sale-types" icon={<IconLayers />} title="How tax sales work" summary="What you receive at a tax sale compared with other forced sales" />
            <Tile href="#/learn/financing" icon={<IconBank />} title="Know how you’ll pay" tone="go" summary="Tax sales need certified funds on a short deadline. Plan where the money will come from" />
          </div>
        </section>
      )}

      {otherState ? (
        <section aria-labelledby="treasurer-head">
          <h2 id="treasurer-head">Before you register: ask the county</h2>
          <ScriptBox to="the county’s tax sale office" heading="What to say to the county’s tax sale office" script={SALE_SCRIPTS.deed[0].script} note={`Call or email the office named on the county’s sale page${myState === 'TX' ? ' (in Texas, often the county tax office, or the sheriff or constable holding the sale)' : myState === 'UT' ? ' (in Utah, the county auditor; in Davis County, the Controller)' : ''}. Then read the full checklist in the tax sale guide.`} />
          <p><a className="btn" href={`#/playbooks/${guideKey(myState ?? 'NV', 'tax')}/documents`}>Documents for a tax sale&nbsp;→</a></p>
        </section>
      ) : (
        <section aria-labelledby="treasurer-head">
          <h2 id="treasurer-head">Before you register: ask the Treasurer</h2>
          <ScriptBox to={SALE_SCRIPTS.deed[0].to} script={SALE_SCRIPTS.deed[0].script} note="Call or email the Clark County Treasurer’s tax sale office using the contact on the official notice. Then read the full checklist in the tax sale guide." />
          <p><a className="btn" href="#/playbooks/tax/documents">Documents for a tax sale&nbsp;→</a></p>
        </section>
      )}

      {listings.length > 0 && (
        <section>
          <div className="verify" role="alert">
            <strong>Verify before bidding.</strong> Owners can pay until close of business 3 business days before the sale. The Treasurer’s sale
            does not satisfy all liens: a federal tax lien can survive, and even when the sale wipes it out, the IRS can buy the property back within 120 days of the sale. Registration, deposit and sale format are set in each auction's official notice.
          </div>
          <div className="row" style={{ justifyContent: 'space-between', margin: '0 0 12px' }}>
            <ClassSwitch value={cls} onChange={setCls} />
            <span className="small muted">
              {shown.length} of {listings.length} parcels{cls !== 'all' && ' · type from the County Assessor’s land-use code; unclassified parcels show under All'}
            </span>
          </div>
          {shown.length === 0 && <OwlNote>No {cls} parcels on the current list. Try All.</OwlNote>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Parcel (APN)</th><th>Address &amp; type</th><th className="num">Minimum bid</th><th>Auction</th><th>Verified</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.apn}>
                    <td>
                      <a href={`#/property/${liveId(l.apn)}`}>{l.apn}</a>
                      {l.groupApn && <div className="small warn">Sold together with group {l.groupApn} (one bid)</div>}
                      {l.personalPropertyExcluded && <div className="small muted">Personal property not included</div>}
                    </td>
                    <td>
                      {l.address ? <a href={`#/property/${liveId(l.apn)}`}>{l.address}</a> : <span className="muted">No street address (see Assessor)</span>}
                      <div className="small muted">
                        {l.landUse ? (
                          <>{classOfLandUse(l.landUse.code) && <span className={`badge tone-${classOfLandUse(l.landUse.code) === 'commercial' ? 'info' : 'go'}`}>{CLASS_LABEL[classOfLandUse(l.landUse.code)!]}</span>} {l.landUse.description}</>
                        ) : 'Type not classified yet'}
                      </div>
                    </td>
                    <td className="num">{fmtMoney(l.minimumBid)}</td>
                    <td>
                      {l.auctionStartsAt && fmtDateTime(l.auctionStartsAt)}
                      {l.auctionFormat && <div className="small muted">{l.auctionFormat}{l.auctionLocation ? ` · ${l.auctionLocation}` : ''}</div>}
                    </td>
                    <td className="small" title={`Snapshot SHA-256 ${l.snapshotSha256}`}>
                      {ago(l.lastVerifiedAt, now)}
                      <div className="muted">Assessor confirmed</div>
                    </td>
                    <td>
                      {isOfficialUrl(l.sourceUrl) && (
                        <a href={l.sourceUrl} target="_blank" rel="noreferrer noopener">Confirm&nbsp;↗</a>
                      )}
                      <div><TrackButton target={`tax:${l.apn}`} label={l.address ? `${l.address} (parcel ${l.apn})` : `Parcel ${l.apn}`} /></div>
                      <div className="live-views small" aria-label={`Pictures and records for parcel ${l.apn}`}>
                        {propertyViews({ apn: l.apn, address: l.address, city: 'Clark County' }).map((v) => (
                          <a key={v.key} href={v.url} target="_blank" rel="noreferrer noopener" title={v.detail}>{v.label}&nbsp;↗</a>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <IrsSales sales={federalSales} ago={(iso) => ago(iso, now)} />
      {!otherState && !nothingLive && countySection}
      <SidCertificates certificates={certificates} ago={(iso) => ago(iso, now)} />
      {result?.ok && (
        <section>
          <h2>Sources</h2>
          <ul className="sources">
            {result.feed.sources.map((s) => (
              <li key={s.sourceId}>
                <div>
                  <strong>{s.agency}</strong>{' '}
                  <span className={`badge tone-${s.health === 'ok' ? 'go' : s.health === 'terms_not_reviewed' ? 'info' : 'stop'}`}>{HEALTH_LABEL[s.health]}</span>
                </div>
                {/* What a buyer needs: where we checked and when. Fetch timing and site-certificate details stay out of the way. */}
                <div className="small muted">
                  {s.health === 'terms_not_reviewed' && !s.lastCheckedAt ? 'Not currently available here: check the official source' : <>Checked against {s.publishedBy ? `${s.publishedBy}'s official notice` : 'the official site'} {s.lastCheckedAt ? ago(s.lastCheckedAt, now) : 'never'}</>}
                  {s.lastChangedAt && <> · list last changed {ago(s.lastChangedAt, now)}</>}
                </div>
                {s.publishedBy && <div className="small muted">Published by {s.publishedBy} for the county and the cities</div>}
                {/* How a source is collected (terms, permissions) is for the operator, not the buyer. */}
                {s.message && s.health !== 'terms_not_reviewed' && <div className="small">{s.message}</div>}
                {(s.publishedBy ? isCertificateSourceUrl(s.officialUrl) : isOfficialUrl(s.officialUrl) || s.officialUrl === 'https://www.irsauctions.gov/') && (
                  <a className="small" href={s.officialUrl} target="_blank" rel="noreferrer noopener">{s.publishedBy ? 'Official notice of sale\u00a0↗' : 'Official auction page\u00a0↗'}</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Disclaimer kind="sales" />
    </main>
  );
}
