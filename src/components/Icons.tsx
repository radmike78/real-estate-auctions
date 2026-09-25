// Minimal line icons (24px grid, 1.8px stroke, currentColor).
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconHome = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5" /></svg>;
export const IconBadge = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2z" /><path {...P} d="m8.8 12.2 2.2 2.2 4.2-4.6" /></svg>;
export const IconBank = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M3 9.5 12 4l9 5.5M4.5 10v8M9.5 10v8M14.5 10v8M19.5 10v8M3 20.5h18" /></svg>;
export const IconTools = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M14.5 6.5a4 4 0 0 0 5 5l-8.8 8.8a2.1 2.1 0 0 1-3-3zM6 3l3 3-1.5 1.5-3-3M13 13l5.5 5.5" /></svg>;
export const IconShield = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z" /><path {...P} d="m9 12 2 2 4-4.5" /></svg>;
export const IconPulse = () => <svg viewBox="0 0 24 24" aria-hidden><path {...P} d="M3 12h4l2.5-6 5 12 2.5-6h4" /></svg>;
export const IconLock = () => <svg viewBox="0 0 24 24" aria-hidden><rect {...P} x="5" y="10.5" width="14" height="10" rx="2" /><path {...P} d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>;
export const IconSearch = () => <svg viewBox="0 0 24 24" aria-hidden><circle {...P} cx="11" cy="11" r="6.5" /><path {...P} d="m16 16 4.5 4.5" /></svg>;
