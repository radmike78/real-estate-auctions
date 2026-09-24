// Independent corroboration: every parcel offered by the Treasurer must also exist in the
// Clark County Assessor's parcel layer, served by a different county system
// (maps.clarkcountynv.gov). A fake parcel injected into one system would have to be
// forged in both to be published.

import { secureFetch, type FetchOptions } from './secureFetch';

const ASSESSOR_QUERY = 'https://maps.clarkcountynv.gov/arcgis/rest/services/Assessor/Layers/MapServer/1/query';
const BATCH = 50;

const digits = (apn: string) => apn.replace(/\D/g, '');

/** Returns the subset of APNs the Assessor confirms exist. Throws if the Assessor can't be read. */
export async function confirmParcelsExist(
  apns: string[],
  allowedHosts: string[],
  extra: Pick<FetchOptions, 'fetchImpl' | 'verifyCertificate'> = {},
): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < apns.length; i += BATCH) {
    const batch = apns.slice(i, i + BATCH);
    if (batch.some((a) => !/^\d{3}-\d{2}-\d{3}-\d{3}$/.test(a))) throw new Error('Refusing to query with a malformed APN');
    const url = new URL(ASSESSOR_QUERY);
    url.searchParams.set('where', `APN IN (${batch.map((a) => `'${digits(a)}'`).join(',')})`);
    url.searchParams.set('outFields', 'APN');
    url.searchParams.set('returnGeometry', 'false');
    url.searchParams.set('f', 'json');
    const res = await secureFetch(url.href, {
      allowedHosts,
      ...extra,
      acceptContentTypes: /^(application\/json|text\/plain)\b/i,
    });
    if (res.kind !== 'ok') throw new Error('Unexpected 304 from Assessor');
    const json = JSON.parse(res.body) as { features?: { attributes?: { APN?: unknown } }[]; error?: unknown };
    if (json.error || !Array.isArray(json.features)) throw new Error(`Assessor query failed: ${JSON.stringify(json.error ?? 'no features').slice(0, 200)}`);
    const want = new Map(batch.map((a) => [digits(a), a]));
    for (const f of json.features) {
      const apn = want.get(String(f.attributes?.APN ?? ''));
      if (apn) found.add(apn);
    }
    if (i + BATCH < apns.length) await new Promise((r) => setTimeout(r, 1000));
  }
  return found;
}
