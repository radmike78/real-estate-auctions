// Define a term where readers first meet it, not only in "Key terms" at the bottom: the first mention of each of a
// lesson's key terms becomes a tap-to-open definition.

export interface KeyTerm {
  term: string;
  meaning: string;
}

/** The words a term goes by: "Net operating income (NOI)" → ["Net operating income", "NOI"]. */
export function aliasesOf(term: string): string[] {
  const clean = term.replace(/[“”"]/g, '').trim();
  const m = clean.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const names = m ? [m[1], ...m[2].split(/,\s*/)] : [clean];
  // Single common words would match too much ordinary text.
  return names.map((n) => n.trim()).filter((n) => n.length >= 3 && !/^(security|reserves|zoning|upsell)$/i.test(n));
}

export type Piece = string | { text: string; term: KeyTerm };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits text so the first mention of each term not yet in `used` is marked. `used` carries across the blocks of a
 * page, in reading order, so each term is explained once.
 */
export function markTerms(text: string, terms: KeyTerm[], used: Set<string>): Piece[] {
  const pending = terms.filter((t) => !used.has(t.term));
  if (!pending.length) return [text];
  const alias = new Map<string, KeyTerm>();
  for (const t of pending) for (const a of aliasesOf(t.term)) alias.set(a.toLowerCase(), t);
  if (!alias.size) return [text];
  // Longest names first, so "Cash-on-cash return" wins over a shorter name inside it.
  const names = [...alias.keys()].sort((a, b) => b.length - a.length).map(esc);
  const re = new RegExp(`(?<![\\w-])(${names.join('|')})s?(?![\\w-])`, 'gi');
  const out: Piece[] = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    const t = alias.get(m[1].toLowerCase());
    if (!t || used.has(t.term)) continue;
    used.add(t.term);
    if (m.index! > at) out.push(text.slice(at, m.index));
    out.push({ text: m[0], term: t });
    at = m.index! + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}
