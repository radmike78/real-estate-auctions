import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { AtRule, Plugin as PostcssPlugin, Rule } from 'postcss';

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

// Light/dark switch: each `@media (prefers-color-scheme: dark)` block also gets a copy for
// `<html data-theme="dark">`, and the media version is skipped when `<html data-theme="light">`.
// `:where()` keeps each rule's specificity the same, so the cascade order is unchanged.
const scope = (sel: string, root: string) =>
  sel.split(',').map((s) => s.trim()).map((s) => (s.startsWith(':root') ? `:root:where(${root})${s.slice(5)}` : `:where(:root${root}) ${s}`)).join(', ');
const themeSwitch = (): PostcssPlugin => ({
  postcssPlugin: 'theme-switch',
  AtRule: {
    media(at: AtRule) {
      if (at.params.replace(/\s/g, '') !== '(prefers-color-scheme:dark)' || (at as AtRule & { themed?: boolean }).themed) return;
      (at as AtRule & { themed?: boolean }).themed = true;
      const forced = at.nodes?.map((n) => n.clone()) ?? [];
      at.walkRules((r: Rule) => { if (r.parent?.type !== 'atrule' || (r.parent as AtRule).name !== 'keyframes') r.selector = scope(r.selector, ':not([data-theme="light"])'); });
      forced.forEach((n) => { if (n.type === 'rule') n.selector = scope(n.selector, '[data-theme="dark"]'); });
      at.after(forced);
    },
  },
});

export default defineConfig({
  css: { postcss: { plugins: [themeSwitch()] } },
  plugins: [react(), csp(), noSampleData()],
  base: './',
  // Never inline fonts as data: URLs; the CSP (font-src 'self') would block them.
  build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) },
  // `npm run server` provides the API; the dev server forwards /api to it.
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
});
