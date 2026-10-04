// Page addresses are normal paths (/learn/red-flags), so search engines can find and link every page. Links in the
// code are still written "#/learn/red-flags"; they're shown as "/learn/red-flags" and opened without a page reload.
// Old "#/" links (bookmarks, emails) still work: they're turned into the path on load.

const EVENT = 'deedowl:navigate';

/** "#/learn?x=1" → "/learn?x=1"; anything else is returned as is. */
export const toPath = (href: string) => (href.startsWith('#/') ? `/${href.slice(2)}` : href === '#' ? '/' : href);

/** The current route without its leading slash: "learn/red-flags", "search?q=x", "" for home. */
export function currentRoute(): string {
  return `${window.location.pathname.replace(/^\/+|\/+$/g, '')}${window.location.search}`;
}

/** Turns an old "#/x" address into "/x" without adding a history entry. */
export function upgradeLegacyHash() {
  const h = window.location.hash;
  if (h.startsWith('#/')) window.history.replaceState(window.history.state, '', toPath(h));
}

/** Opens a page inside the app: a "#/x" or "/x" address. */
export function navigate(href: string, { replace = false } = {}) {
  const to = toPath(href);
  if (replace) window.history.replaceState(window.history.state, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Changes the address bar only (a search's filters), without a page change. */
export function replaceAddress(href: string) {
  window.history.replaceState(window.history.state, '', toPath(href));
}

/** Calls `fn` on every page change: a link inside the app, or the browser's back and forward buttons. */
export function onNavigate(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener('popstate', fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('popstate', fn);
  };
}

/** Whether a link should open inside the app rather than load a new document. */
export function isAppLink(a: HTMLAnchorElement): boolean {
  const raw = a.getAttribute('href') ?? '';
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download')) return false;
  if (raw.startsWith('#/')) return true;
  if (!raw.startsWith('/') || raw.startsWith('//')) return false;
  // Files and the server's own paths load normally.
  return !/^\/(api|data|assets)\//.test(raw) && !/\.[a-z0-9]{2,5}$/i.test(raw.split('#')[0].split('?')[0]);
}

/**
 * Keeps links real: every "#/x" link on the page is shown as "/x", so crawlers follow it and "open in new tab"
 * works. React doesn't rewrite an attribute it hasn't changed, so this sticks until the link itself changes.
 */
export function rewriteAppLinks(root: ParentNode = document) {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href^="#/"], a[href="#"]')) a.setAttribute('href', toPath(a.getAttribute('href')!));
}
