import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are self-hosted (the CSP only allows fonts from our own origin).
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/schibsted-grotesk';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';

// Search engines get a plain copy of each page at a normal address like /learn/red-flags/ (scripts/prerender.ts).
// The app itself runs on #/ addresses, so a visit to one of those copies opens the matching #/ page.
if (!window.location.hash && window.location.pathname !== '/') {
  window.history.replaceState(null, '', `/#/${window.location.pathname.replace(/^\/+|\/+$/g, '')}${window.location.search}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
