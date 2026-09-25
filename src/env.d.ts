// Build-time settings Vite replaces in the bundle.
interface ImportMetaEnv {
  /** Ed25519 public key (SPKI, base64) for verifying signed feeds; see src/feed/publicKey.ts. */
  readonly VITE_FEED_PUBLIC_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
