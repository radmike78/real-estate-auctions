// The prerendered copy of the first page (built by scripts/prerender.ts) stays on screen while that page's code loads,
// instead of being replaced by a bare "Loading…". Only for the page the server sent: after the first navigation, or
// when an old #/ link was rewritten to another page, it isn't used.
let held: string | null = null;

/** Called once, before React renders: keep the prerendered <main> if it belongs to the address being shown. */
export function holdPrerender(sameAddress: boolean) {
  try {
    const main = document.querySelector('#root > main:not([class])');
    held = sameAddress && main ? main.innerHTML : null;
  } catch {
    held = null;
  }
}

/** The prerendered content to show while the first page loads, or null. */
export const prerendered = () => held;

/** After the first navigation the prerendered copy no longer matches the page. */
export const releasePrerender = () => {
  held = null;
};
