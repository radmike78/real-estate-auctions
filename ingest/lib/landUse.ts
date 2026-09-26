// Land use for each parcel, read from the Clark County Assessor's own parcel page
// (maps.clarkcountynv.gov, the same county system used for corroboration). It tells residential
// from commercial parcels on the live tax-sale list. This is extra information: if a page can't be
// read or parsed, the parcel is simply shown as "not classified"; it never blocks a listing.

import { secureFetch, type FetchOptions } from './secureFetch';
import { IdentityError } from './siteIdentity';

const PARCEL_PAGE = 'https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/parceldetail.aspx';

export interface LandUse {
  code: string; // e.g. "20.110" or "41.335.C"
  description: string; // e.g. "Single Family Residential"
}

/** Pulls "Land Use 20.110 - Single Family Residential" out of an Assessor parcel page. */
export function parseLandUse(html: string): LandUse | null {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  const m = /Land Use (\d{2}\.\d{3}(?:\.[A-Z])?) - ([A-Za-z0-9 ,.&/()+'-]{2,120}?)(?= Dwelling Units| Primary Residence|$)/.exec(text);
  if (!m) return null;
  return { code: m[1], description: m[2].trim().slice(0, 80) };
}

export async function fetchLandUse(
  apns: string[],
  allowedHosts: string[],
  extra: Pick<FetchOptions, 'fetchImpl' | 'verifyCertificate'> = {},
  pauseMs = 400,
): Promise<Map<string, LandUse>> {
  const out = new Map<string, LandUse>();
  for (const [i, apn] of apns.entries()) {
    if (!/^\d{3}-\d{2}-\d{3}-\d{3}$/.test(apn)) continue;
    const url = new URL(PARCEL_PAGE);
    url.searchParams.set('hdnParcel', apn.replace(/-/g, ''));
    try {
      const res = await secureFetch(url.href, { allowedHosts, ...extra, maxBytes: 2 * 1024 * 1024, acceptContentTypes: /^text\/html\b/i });
      if (res.kind === 'ok') {
        const lu = parseLandUse(res.body);
        if (lu) out.set(apn, lu);
      }
    } catch (e) {
      // Site-identity failures must still stop the run; anything else just leaves this parcel unclassified.
      if (e instanceof IdentityError) throw e;
    }
    if (i < apns.length - 1 && pauseMs) await new Promise((r) => setTimeout(r, pauseMs));
  }
  return out;
}
