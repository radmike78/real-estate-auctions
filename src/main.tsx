import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are self-hosted (the CSP only allows fonts from our own origin).
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/schibsted-grotesk';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
