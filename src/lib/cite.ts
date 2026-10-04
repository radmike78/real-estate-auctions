// Statute and rule citations, like "(NRS 107.080)" or "(26 U.S.C. 6335(e); IRM 5.10.5.14)", stay on the page so
// readers can check them, but are shown smaller and lighter so the sentence reads first.
const PREFIX = String.raw`(?:see |under )?(?:NRS|A\.R\.S\.|ARS|Utah Code|Civ(?:il Code)?\.?|CCP|Code of Civil Procedure|Revenue and Taxation Code|R&T Code|Commercial Code|Business and Professions Code|Utah Rules? of Civil Procedure|Code Civ\. Proc\.|R&T|Rev\. & Tax\.|Gov(?:'t|’t)? Code|IRM|URCP|IRS Pub(?:lication)?\.?|\d+ U\.?S\.?C\.?|\d+ C\.?F\.?R\.?)`;
const CITE = new RegExp(String.raw`(\(${PREFIX} [^()]*(?:\([^()]*\)[^()]*)*\))`, 'g');

export type CitePart = string | { cite: string };

/** Splits text into plain parts and citation parts (each citation keeps its parentheses). */
export function splitCites(text: string): CitePart[] {
  const out: CitePart[] = [];
  text.split(CITE).forEach((part, i) => {
    if (!part) return;
    if (i % 2) out.push({ cite: part });
    else out.push(part);
  });
  return out;
}
