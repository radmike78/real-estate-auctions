// Applies a saved light/dark choice before the page paints (no choice = follow the device).
try { var t = localStorage.getItem('deedowl.theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}
