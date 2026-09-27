import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy for production builds: only same-origin scripts and data, no plugins,
// no inline scripts, and map tiles only from OpenStreetMap. (Dev mode skips it for HMR.)
// frame-ancestors / HSTS must be sent as HTTP headers by the host; see SECURITY.md.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const csp = (): Plugin => ({
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
});

// Production builds set VITE_SHOW_SAMPLE_DATA=0. The sample files build their data when loaded, so the
// bundler can't drop them on its own; this swaps in empty stand-ins so no fictional data is shipped.
const hideSamples = ['0', 'false'].includes(process.env.VITE_SHOW_SAMPLE_DATA ?? '');
const noSampleData = (): Plugin => ({
  name: 'no-sample-data',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!hideSamples || !importer || !/[\\/]src[\\/]data[\\/]index\.ts$/.test(importer)) return null;
    if (source !== './sampleProperties' && source !== './samplePros') return null;
    return this.resolve('./noSamples', importer, { ...options, skipSelf: true });
  },
});

export default defineConfig({
  plugins: [react(), csp(), noSampleData()],
  base: './',
  // Never inline fonts as data: URLs; the CSP (font-src 'self') would block them.
  build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) },
  // `npm run server` provides the API; the dev server forwards /api to it.
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
});
