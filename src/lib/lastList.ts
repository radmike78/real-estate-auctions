// The list a property was opened from (search results or the pre-foreclosure tracker), so "Back" returns there.
const KEY = 'deedowl.lastList';

export function rememberList(href: string, label: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ href, label }));
  } catch {
    /* storage unavailable */
  }
}

export function lastList(): { href: string; label: string } {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.href === 'string' && /^#\/(search|pre-foreclosures)$/.test(v.href) && typeof v.label === 'string') return v;
  } catch {
    /* fall through */
  }
  return { href: '#/search', label: 'Back to results' };
}
