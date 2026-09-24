import { useEffect, useState } from 'react';
import { FEED_PUBLIC_KEY_SPKI_B64 } from '../feed/publicKey';
import { isOfficialUrl, loadVerifiedFeed, type VerifyResult } from '../feed/verify';
import { fmtDateTime, fmtMoney } from '../lib/status';

const REVERIFY_MS = 5 * 60_000;

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
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    const load = () =>
      loadVerifiedFeed(FEED_PUBLIC_KEY_SPKI_B64)
        .catch((e: Error): VerifyResult => ({ ok: false, reason: 'MISSING', detail: e.message }))
        .then((r) => alive && setResult(r));
    load();
    // Re-verify periodically so an open tab never keeps showing listings past their expiry.
    const t = setInterval(() => {
      setNow(Date.now());
      load();
    }, REVERIFY_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const expired = result?.ok && Date.parse(result.feed.expiresAt) <= now;
  const listings = result?.ok && !expired ? result.feed.listings : [];

  return (
    <main className="page">
      <h1>Clark County tax sales: verified live listings</h1>
      <p className="muted">
        Parcels the Clark County Treasurer currently lists for its delinquent-tax (trustee) auction. Every row is re-checked against the
        official list on a schedule that follows how often the Treasurer updates it. Parcels that are paid off (lined out), removed, or not
        re-verified recently are hidden automatically.
      </p>

      {!result && <p>Verifying listings…</p>}

      {result && !result.ok && (
        <div className="verify" role="status">
          <strong>No live listings shown.</strong> {result.detail}
          {result.reason === 'NOT_CONFIGURED' || result.reason === 'MISSING' ? (
            <> The live connector has not published a signed feed yet. See the README ("Live data").</>
          ) : (
            <> For your safety, nothing is displayed unless it passes verification.</>
          )}
        </div>
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
                  Last checked {s.lastCheckedAt ? ago(s.lastCheckedAt, now) : 'never'}
                  {s.lastChangedAt && <> · list last changed {ago(s.lastChangedAt, now)}</>}
                  {s.observedChangeIntervalHours !== null && <> · updates about every {s.observedChangeIntervalHours.toFixed(1)} h</>}
                  {s.nextCheckAt && <> · next check {fmtDateTime(s.nextCheckAt)}</>}
                </div>
                {s.message && <div className="small">{s.message}</div>}
                {isOfficialUrl(s.officialUrl) && (
                  <a className="small" href={s.officialUrl} target="_blank" rel="noreferrer noopener">Official auction page ↗</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {listings.length > 0 && (
        <section>
          <div className="verify" role="alert">
            <strong>Verify before bidding.</strong> Owners can pay until the parcel is offered. The Treasurer's sale does not satisfy all liens,
            and the IRS may redeem within 120 days. Registration, deposit and sale format are set in each auction's official notice.
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Parcel (APN)</th><th>Address</th><th className="num">Minimum bid</th><th>Auction</th><th>Verified</th><th /></tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.apn}>
                    <td>{l.apn}</td>
                    <td>{l.address ?? <span className="muted">See Assessor</span>}</td>
                    <td className="num">{fmtMoney(l.minimumBid)}</td>
                    <td>{l.auctionStartsAt ? fmtDateTime(l.auctionStartsAt) : <span className="muted">See official notice</span>}</td>
                    <td className="small" title={`Snapshot SHA-256 ${l.snapshotSha256}`}>{ago(l.lastVerifiedAt, now)}</td>
                    <td>
                      {isOfficialUrl(l.sourceUrl) && (
                        <a href={l.sourceUrl} target="_blank" rel="noreferrer noopener">Confirm ↗</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {result?.ok && !expired && listings.length === 0 && <p className="muted">No parcels are currently verified as available.</p>}
    </main>
  );
}
