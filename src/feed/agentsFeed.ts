// Signed agent directory (public/data/agents.json + .sig), written by the server when an
// admin approves, re-verifies or suspends an agent. The browser verifies the Ed25519 signature
// and expiry before showing any profile, and re-applies every listing rule to each agent, so a
// tampered or stale file can't add a fake agent or swap in a scammer's phone number.

import { isListable, safeMailto, safeTel, safeWebsite, type Agent } from '../lib/agents';
import { checkSignature } from './verify';

export interface AgentsFeed {
  version: 1;
  generatedAt: string;
  expiresAt: string;
  agents: Agent[];
}

export type AgentsFeedResult =
  | { ok: true; feed: AgentsFeed }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING' | 'BAD_SIGNATURE' | 'EXPIRED' | 'MALFORMED'; detail: string };

const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;
const strArr = (v: unknown, maxLen: number, maxItems: number) =>
  Array.isArray(v) && v.length <= maxItems && v.every((x) => str(x, maxLen));

export function validAgent(a: Agent, now = new Date()): boolean {
  return (
    str(a.id, 64) &&
    str(a.name, 80) &&
    str(a.brokerage, 120) &&
    str(a.licenseNumber, 20) &&
    ['Salesperson', 'Broker-Salesperson', 'Broker'].includes(a.licenseType) &&
    strArr(a.serviceCities, 40, 10) &&
    strArr(a.serviceZips, 5, 40) &&
    strArr(a.specialties, 40, 6) &&
    strArr(a.languages, 40, 6) &&
    (a.shortSaleExperience === null || str(a.shortSaleExperience, 80)) &&
    str(a.bio, 600) &&
    a.isSample === false &&
    (a.phone === null || !!safeTel(a.phone)) &&
    (a.email === null || !!safeMailto(a.email)) &&
    (a.website === null || !!safeWebsite(a.website)) &&
    isListable(a, now)
  );
}

export async function verifyAgentsFeed(
  data: ArrayBuffer,
  signatureB64: string,
  publicKeySpkiB64: string | null,
  now = new Date(),
  subtle: SubtleCrypto = crypto.subtle,
): Promise<AgentsFeedResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No signing key configured.' };
  const sigError = await checkSignature(data, signatureB64, publicKeySpkiB64, subtle);
  if (sigError) return { ok: false, reason: 'BAD_SIGNATURE', detail: sigError };
  let feed: AgentsFeed;
  try {
    feed = JSON.parse(new TextDecoder().decode(data));
  } catch {
    return { ok: false, reason: 'MALFORMED', detail: 'Agent directory is not valid JSON.' };
  }
  if (feed.version !== 1 || !Array.isArray(feed.agents)) return { ok: false, reason: 'MALFORMED', detail: 'Unexpected directory format.' };
  if (!(Date.parse(feed.expiresAt) > now.getTime())) return { ok: false, reason: 'EXPIRED', detail: 'The agent directory has expired and is being refreshed.' };
  return { ok: true, feed: { ...feed, agents: feed.agents.filter((a) => validAgent(a, now)) } };
}

export async function loadVerifiedAgents(publicKeySpkiB64: string | null): Promise<AgentsFeedResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No signing key configured.' };
  const [data, sig] = await Promise.all([fetch('data/agents.json', { cache: 'no-store' }), fetch('data/agents.json.sig', { cache: 'no-store' })]);
  if (!data.ok || !sig.ok) return { ok: false, reason: 'MISSING', detail: 'No agent directory has been published yet.' };
  return verifyAgentsFeed(await data.arrayBuffer(), await sig.text(), publicKeySpkiB64);
}
