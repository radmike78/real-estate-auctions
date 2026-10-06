import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are self-hosted (the CSP only allows fonts from our own origin).
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/schibsted-grotesk';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import './styles/review-sources.css';
import App from './App';
import { upgradeLegacyHash } from './lib/nav';

// Pages live at normal addresses (/learn/red-flags/). Old #/ links from bookmarks and emails open the same page.
upgradeLegacyHash();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
