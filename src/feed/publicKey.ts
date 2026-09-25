// Ed25519 public key (SPKI, base64) the browser uses to verify signed feeds (listings.json, pros.json).
// Set by `npm run keys:generate`, or at build time with VITE_FEED_PUBLIC_KEY (container builds pass it
// as a build argument). null = live listings and the advertiser directory stay off until a key is set.
const fromBuild = import.meta.env.VITE_FEED_PUBLIC_KEY?.trim();
export const FEED_PUBLIC_KEY_SPKI_B64: string | null = fromBuild && /^[A-Za-z0-9+/=]{40,200}$/.test(fromBuild) ? fromBuild : null;
