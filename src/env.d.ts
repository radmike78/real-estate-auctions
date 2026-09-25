// Build-time settings Vite replaces in the bundle.
interface ImportMetaEnv {
  /** Ed25519 public key (SPKI, base64) for verifying signed feeds; see src/feed/publicKey.ts. */
  readonly VITE_FEED_PUBLIC_KEY?: string;
  /** "0" hides all fictional sample data (production builds); see src/data/index.ts. */
  readonly VITE_SHOW_SAMPLE_DATA?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
