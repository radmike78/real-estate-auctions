import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are self-hosted (the CSP only allows fonts from our own origin).
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/schibsted-grotesk';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import './styles/review-lessons.css';
import './styles/review-pros.css';
import './styles/review-practice.css';
import './styles/review-sources.css';
import './styles/review-guides.css';
import './styles/r8-case.css';
import './styles/r8-accuracy.css';
import './styles/r8-plan.css';
import './styles/r8-tools.css';
import './styles/r8-spacing.css';
import './styles/r9-content.css';
import App from './App';
import { upgradeLegacyHash } from './lib/nav';
import { holdPrerender } from './lib/firstPaint';

// Pages live at normal addresses (/learn/red-flags/). Old #/ links from bookmarks and emails open the same page.
const servedAt = window.location.pathname;
upgradeLegacyHash();
// Keep the server's prerendered copy of this page on screen until its code arrives (no flash of "Loading…").
holdPrerender(window.location.pathname === servedAt && !window.location.hash.startsWith('#/'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
