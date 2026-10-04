// "Search the guides": keyword search over the site's own guides, playbooks and policies.
// Everything searched is text already published on this site, which is written from official sources;
// nothing is fetched from elsewhere and no AI writes the answers. Each result links to the section it came
// from and lists the official pages that section cites.

export interface GuideSource {
  label: string;
  url: string;
}

export interface GuideDoc {
  /** Where the section lives on this site, e.g. "#/playbooks/tax/steps". */
  href: string;
  /** The guide it belongs to, e.g. "Tax sale playbook". */
  page: string;
  title: string;
  text: string;
  /** Official pages the section links to. */
  sources: GuideSource[];
  /** Lower for pages people rarely mean to search (privacy, terms). */
  weight?: number;
  /** The state a sale guide covers, so the reader's own state ranks first. */
  state?: string;
}

export interface GuideHit {
  doc: GuideDoc;
  score: number;
  snippet: string;
}

export interface GuideResults {
  hits: GuideHit[];
  /** True when nothing matched every word, so these match only some of them. */
  partial: boolean;
  /** The words that were searched for, after dropping common words. */
  terms: string[];
}

const STOP = new Set(
  'a an and are as at be by can do does for from get how i if in is it its me my of on or should so than that the their them then there these they this to up us was we what when where which who why will with you your'.split(' '),
);

// A few words people use that the guides spell differently.
const SYNONYMS: Record<string, string[]> = {
  reo: ['bank'],
  hoa: ['association'],
  irs: ['federal'],
  deposit: ['down'],
  auction: ['sale'],
  bid: ['bidder'],
  redeem: ['redemption'],
  redemption: ['redeem'],
  lien: ['liens'],
  eviction: ['evict', 'possession'],
  evict: ['eviction', 'possession'],
  tenant: ['occupant'],
  occupant: ['tenant'],
};

/** Reduces a word to a simple stem so "liens", "lien" and "sales", "sale" match. */
export function stem(w: string): string {
  if (w.length <= 3 || /^\d/.test(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && /(ss|sh|ch|x|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];

/** The searchable words of a query, stemmed, without common words. */
export function queryTerms(q: string): string[] {
  const out: string[] = [];
  for (const w of words(q.slice(0, 200))) {
    if (STOP.has(w)) continue;
    const s = stem(w);
    if (!out.includes(s)) out.push(s);
    if (out.length >= 12) break;
  }
  return out;
}

interface Indexed {
  doc: GuideDoc;
  title: Map<string, number>;
  body: Map<string, number>;
  lower: string;
}

function counts(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words(s)) {
    const k = stem(w);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export interface GuideIndex {
  docs: Indexed[];
  df: Map<string, number>;
}

export function buildIndex(docs: GuideDoc[]): GuideIndex {
  const indexed = docs.map((doc) => ({
    doc,
    title: counts(`${doc.title} ${doc.page}`),
    body: counts(doc.text),
    lower: doc.text.toLowerCase(),
  }));
  const df = new Map<string, number>();
  for (const d of indexed) for (const k of new Set([...d.title.keys(), ...d.body.keys()])) df.set(k, (df.get(k) ?? 0) + 1);
  return { docs: indexed, df };
}

function termScore(ix: GuideIndex, d: Indexed, variants: string[]): number {
  let best = 0;
  for (const [i, t] of variants.entries()) {
    const tf = (d.title.get(t) ?? 0) * 6 + Math.min(d.body.get(t) ?? 0, 8);
    if (!tf) continue;
    const idf = Math.log(1 + ix.docs.length / (ix.df.get(t) ?? 1));
    // A synonym counts, but less than the word itself.
    best = Math.max(best, (i === 0 ? 1 : 0.6) * (1 + Math.log(tf)) * idf);
  }
  return best;
}

/** The sentence or two that best answer the query, trimmed to about 260 characters. */
export function snippetFor(text: string, terms: string[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  if (!sentences.length) return '';
  let bestI = 0;
  let bestN = -1;
  sentences.forEach((s, i) => {
    const have = new Set(words(s).map(stem));
    const n = terms.filter((t) => have.has(t)).length;
    if (n > bestN) {
      bestN = n;
      bestI = i;
    }
  });
  let out = sentences[bestI];
  if (out.length < 120 && sentences[bestI + 1]) out += ` ${sentences[bestI + 1]}`;
  if (out.length > 260) out = `${out.slice(0, 257).replace(/\s+\S*$/, '')}…`;
  return out;
}

// A query that names a law or code is looking for the sources lists; otherwise those rank last.
const LEGAL = /\b(nrs|ars|a\.r\.s|code|statute|law|r&t|usc|u\.s\.c|cfr|ccp|civ)\b/i;

export function searchGuides(ix: GuideIndex, q: string, limit = 20, state?: string | null): GuideResults {
  const terms = queryTerms(q);
  if (!terms.length) return { hits: [], partial: false, terms };
  const variants = terms.map((t) => [t, ...(SYNONYMS[t] ?? []).map(stem)]);
  // While someone is still typing the last word ("depo"), it also matches the words it starts.
  const lastWord = words(q).pop() ?? '';
  const typing = !/\s$/.test(q) && lastWord.length >= 3 && terms.length > 0 && stem(lastWord) === terms[terms.length - 1];
  const completions = typing ? [...ix.df.keys()].filter((k) => k.length > lastWord.length && k.startsWith(lastWord)).sort((a, b) => (ix.df.get(b) ?? 0) - (ix.df.get(a) ?? 0)).slice(0, 12) : [];
  if (completions.length) variants[variants.length - 1].push(...completions);
  const shown = [...terms, ...completions];
  const phrase = q.trim().toLowerCase().replace(/\s+/g, ' ');
  const scored = ix.docs.map((d) => {
    let score = 0;
    let matched = 0;
    for (const v of variants) {
      const s = termScore(ix, d, v);
      if (s > 0) matched++;
      score += s;
    }
    if (matched > 1 && phrase.length > 5 && d.lower.includes(phrase)) score *= 1.5;
    let w = d.doc.weight ?? 1;
    if (state && d.doc.state) w *= d.doc.state === state ? 1.6 : 0.6;
    if (d.doc.title === 'Official sources' && !LEGAL.test(q)) w *= 0.4;
    return { d, score: score * w, matched };
  });
  const all = scored.filter((s) => s.matched === terms.length);
  const partial = all.length === 0;
  const pool = partial ? scored.filter((s) => s.matched > 0 && s.matched >= Math.ceil(terms.length / 2)) : all;
  pool.sort((a, b) => b.matched - a.matched || b.score - a.score);
  // The same passage appears in several playbooks (the team lists, for example): show it once.
  const seen = new Set<string>();
  const hits: GuideHit[] = [];
  for (const s of pool) {
    const snippet = snippetFor(s.d.doc.text, shown);
    const key = `${s.d.doc.title}|${snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ doc: s.d.doc, score: s.score, snippet });
    if (hits.length >= limit) break;
  }
  return {
    hits,
    partial,
    terms: shown,
  };
}

/** Splits text into plain and matching pieces, for highlighting the searched words. */
export function highlight(text: string, terms: string[]): { text: string; hit: boolean }[] {
  const want = new Set(terms);
  const parts: { text: string; hit: boolean }[] = [];
  for (const piece of text.split(/([A-Za-z0-9’']+)/)) {
    if (!piece) continue;
    const hit = /[A-Za-z0-9]/.test(piece) && want.has(stem(piece.toLowerCase().replace(/[’']/g, '')));
    const last = parts[parts.length - 1];
    if (last && last.hit === hit && !hit) last.text += piece;
    else parts.push({ text: piece, hit });
  }
  return parts;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

/** Plain text and outside links from a section's rendered HTML. */
export function fromHtml(html: string): { text: string; sources: GuideSource[] } {
  const sources: GuideSource[] = [];
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = decode(m[1]);
    const label = decode(m[2].replace(/<[^>]+>/g, '')).replace(/\s*↗\s*$/, '').replace(/\s+/g, ' ').trim();
    if (label && !sources.some((s) => s.url === url)) sources.push({ label, url });
  }
  const text = decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
      // A bold label followed by its detail ("<strong>Pay</strong><span>in full</span>") reads as "Pay: in full".
      .replace(/<\/strong>(\s*<(?:span|small|div)\b)/g, '</strong>:$1')
      // A tag line before a heading or paragraph ("Illustrative example" then a title) ends there.
      .replace(/<\/(span|small)>(\s*<(?:h[1-6]|p)\b)/g, '</$1>. $2')
      // Block ends become sentence breaks so list items don't run together.
      .replace(/<\/(li|p|h[1-6]|dt|dd|div|tr|section)>/g, (m) => (/h[1-6]|dt/.test(m) ? ': ' : '. '))
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[↗→←]/g, ' ')
    .replace(/\s+([.,:;])/g, '$1')
    .replace(/([.:])\s*[.:](?:\s*[.:])*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, sources };
}
