import { useEffect, useState } from 'react';
import { isCertificateSourceUrl, isOfficialUrl } from '../feed/verify';
import SidCertificates from './SidCertificates';
import IrsSales from './IrsSales';
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
import { CLASS_LABEL, classOfLandUse, type ClassFilter } from '../lib/propertyClass';

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
  terms_not_reviewed: 'Not enabled',
} as const;

export default function LivePage() {
  // The shared loader verifies the signed feed and re-checks it every 5 minutes.
  const { result } = useLiveFeed();
  const [now, setNow] = useState(Date.now());
  const [cls, setCls] = useState<ClassFilter>('all');

  // Keep "x min ago" and the expiry check current in an open tab.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const expired = result?.ok && Date.parse(result.feed.expiresAt) <= now;
  const listings = result?.ok && !expired ? result.feed.listings : [];
  const certificates = result?.ok && !expired ? (result.feed.certificates ?? []) : [];
  const federalSales = result?.ok && !expired ? (result.feed.federalSales ?? []) : [];
  const nothingLive = listings.length + certificates.length + federalSales.length === 0;
  const shown = cls === 'all' ? listings : listings.filter((l) => classOfLandUse(l.landUse?.code) === cls);

  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow"><span className="live-dot" aria-hidden /> From official lists, checked by us</span>}
        title={<>Live <span className="grad">tax sales</span></>}
        sub="Parcels the Clark County Treasurer currently lists for its delinquent-tax auction, and Clark County property the IRS is selling, re-checked against the official lists and the Assessor's parcel records."
      />
      <p className="muted">
        Listings are re-checked on a schedule that follows how often each official list is updated. Parcels that are paid off (lined out), sold,
        removed, unconfirmed, or not re-verified recently are hidden automatically. When no auction is scheduled, nothing is listed.
      </p>
      <div className="row live-alerts">
        <SearchAlertButton cls={cls} />
        <span className="muted">A daily email when new parcels match, including when the next auction list comes out.</span>
      </div>

      {!result && <p>Verifying listings…</p>}

      {result && !result.ok && (
        <div className="verify" role="status" title={result.detail}>
          {result.reason === 'NOT_CONFIGURED' || result.reason === 'MISSING' ? (
            <>
              <strong>No live listings right now.</strong> Verified listings appear here once the Treasurer schedules its next auction and
              the list passes our checks.
            </>
          ) : (
            <>
              <strong>No live listings shown.</strong> The latest data didn't pass our security checks, so for your safety nothing is
              displayed until verified data is published.
            </>
          )}{' '}
          Meanwhile, {SHOW_SAMPLE_DATA && <><a href="#/search?type=TAX_DEED">browse sample tax-sale listings</a> or </>}check the{' '}
          <a href="https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList" target="_blank" rel="noreferrer noopener">
            Treasurer's official auction list ↗
          </a>
          .
        </div>
      )}
      {result && nothingLive && (
        <section className="while-you-wait" aria-labelledby="wait-head">
          <h2 id="wait-head">While you wait</h2>
          <div className="drill-tiles">
            {SHOW_SAMPLE_DATA && <Tile href="#/search?type=TAX_DEED" icon={<IconSearch />} title="Sample tax-sale listings" summary="See how a tax-sale listing looks, with liens and equity worked out" />}
            <Tile href="#/about/sale-types" icon={<IconLayers />} title="How tax sales work" summary="What you receive at a tax sale compared with other forced sales" />
            <Tile href="#/financing" icon={<IconBank />} title="Line up your money" tone="go" summary="Tax sales need certified funds fast. Compare lenders now" />
          </div>
        </section>
      )}
      {expired && (
        <div className="verify" role="status">
          <strong>Listings are being re-verified.</strong> The last verification has expired, so listings are hidden until fresh data is published.
        </div>
      )}

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
                <div className="small muted">
                  {s.health === 'terms_not_reviewed' && !s.lastCheckedAt ? 'Not collected' : <>Last checked {s.lastCheckedAt ? ago(s.lastCheckedAt, now) : 'never'}</>}
                  {s.lastChangedAt && <> · list last changed {ago(s.lastChangedAt, now)}</>}
                  {s.observedChangeIntervalHours !== null && <> · updates about every {s.observedChangeIntervalHours.toFixed(1)} h</>}
                  {s.nextCheckAt && s.health !== 'terms_not_reviewed' && <> · next check {fmtDateTime(s.nextCheckAt)}</>}
                </div>
                {s.publishedBy && <div className="small muted">Published by {s.publishedBy} for the county and the cities</div>}
                {s.certificateIssuer && (
                  <div className="small muted">
                    Site identity verified: valid certificate for {s.publishedBy ? `${s.publishedBy}'s site` : "the agency's .gov domain"} issued by {s.certificateIssuer}
                  </div>
                )}
                {s.message && <div className="small">{s.message}</div>}
                {(s.publishedBy ? isCertificateSourceUrl(s.officialUrl) : isOfficialUrl(s.officialUrl) || s.officialUrl === 'https://www.irsauctions.gov/') && (
                  <a className="small" href={s.officialUrl} target="_blank" rel="noreferrer noopener">{s.publishedBy ? 'Official notice of sale ↗' : 'Official auction page ↗'}</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {listings.length > 0 && (
        <section>
          <div className="verify" role="alert">
            <strong>Verify before bidding.</strong> Owners can pay until close of business 3 business days before the sale. The Treasurer's sale
            does not satisfy all liens: a federal tax lien can survive, and the IRS can buy a property back within 120 days of the sale. Registration, deposit and sale format are set in each auction's official notice.
          </div>
          <div className="row" style={{ justifyContent: 'space-between', margin: '0 0 12px' }}>
            <ClassSwitch value={cls} onChange={setCls} />
            <span className="small muted">
              {shown.length} of {listings.length} parcels{cls !== 'all' && ' · type from the County Assessor’s land-use code; unclassified parcels show under All'}
            </span>
          </div>
          {shown.length === 0 && <p className="muted">No {cls} parcels on the current list.</p>}
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
                        <a href={l.sourceUrl} target="_blank" rel="noreferrer noopener">Confirm ↗</a>
                      )}
                      <div><TrackButton target={`tax:${l.apn}`} label={l.address ? `${l.address} (APN ${l.apn})` : `APN ${l.apn}`} /></div>
                      <div className="live-views small" aria-label={`Pictures and records for parcel ${l.apn}`}>
                        {propertyViews({ apn: l.apn, address: l.address, city: 'Clark County' }).map((v) => (
                          <a key={v.key} href={v.url} target="_blank" rel="noreferrer noopener" title={v.detail}>{v.label} ↗</a>
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
      {result?.ok && !expired && nothingLive && <p className="muted">No parcels are currently verified as available.</p>}
      <IrsSales sales={federalSales} ago={(iso) => ago(iso, now)} />
      <SidCertificates certificates={certificates} ago={(iso) => ago(iso, now)} />
      <Disclaimer kind="sales" />
    </main>
  );
}
