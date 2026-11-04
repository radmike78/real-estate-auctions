import { useEffect, useRef, useState, type ReactNode } from 'react';

/** A calculator area whose result boxes (.calc-verdict, .calc-max, [data-result]) aren't live regions (they'd be re-read on every
 *  keystroke): once you stop typing, the result that changed is announced once, in a short summary. */
export default function AnnouncedResults({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [said, setSaid] = useState('');
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // A result box as words, in their own case (textContent, not the capitals CSS shows): inline parts (a bold amount)
    // stay in their sentence; block parts (a label over a number, list rows) become their own pieces, joined as
    // "Label: value." Buttons aren't part of the result.
    const pieces = (n: Node, out: string[], cur: { s: string }) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === Node.TEXT_NODE) { cur.s += c.textContent ?? ''; continue; }
        if (!(c instanceof HTMLElement) || c.tagName === 'BUTTON' || c.getAttribute('aria-hidden') === 'true') continue;
        if (getComputedStyle(c).display.startsWith('inline')) { pieces(c, out, cur); continue; }
        if (cur.s.trim()) out.push(cur.s); cur.s = '';
        pieces(c, out, cur);
        if (cur.s.trim()) out.push(cur.s); cur.s = '';
      }
    };
    const words = (b: HTMLElement) => {
      const out: string[] = []; const cur = { s: '' };
      pieces(b, out, cur); if (cur.s.trim()) out.push(cur.s);
      // (A sentence run into the next one in the markup, "guarantee.Still", gets its space.)
      const parts = out.map((p) => p.replace(/\s+/g, ' ').replace(/([.!?])(?=[A-Z])/g, '$1 ').trim()).filter(Boolean);
      return parts.reduce((acc, p, k) => (k === 0 ? p : `${acc}${/[.:!?]$/.test(acc) ? ' ' : parts[k - 1].length < 40 && !/^[$\d−-]/.test(parts[k - 1]) ? ': ' : '. '}${p}`), '');
    };
    const sentences = (x: string) => x.split(/(?<=[.!?])\s+/).filter(Boolean);
    const boxes = () => [...el.querySelectorAll<HTMLElement>('.calc-verdict, .calc-max, [data-result]')].filter((b) => b.getClientRects().length > 0);
    let t: ReturnType<typeof setTimeout> | undefined;
    // The results as they were when you started typing: the one that changed is announced.
    let before = new Map<HTMLElement, string>();
    const on = (e: Event) => {
      // Typing (input events), or a menu choice; not the change event a text field fires when you click away.
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
      if (e.type === 'change' && !(e.target instanceof HTMLSelectElement)) return;
      if (t) clearTimeout(t);
      else before = new Map(boxes().map((b) => [b, words(b)]));
      t = setTimeout(() => {
        t = undefined;
        // Every box that changed: one that just appeared (a new verdict) first, in full; then each changed box's first
        // sentence (what it is) and the sentences that changed. Not every line again.
        const now = boxes().map((b) => ({ b, w: words(b), was: before.get(b) })).filter((x) => x.w && x.w !== x.was);
        const fresh = now.filter((x) => x.was === undefined).map((x) => x.w);
        const moved = now.filter((x) => x.was !== undefined).map((x) => {
          const was = new Set(sentences(x.was!));
          const ss = sentences(x.w);
          return [ss[0], ...ss.slice(1).filter((y) => !was.has(y))].filter(Boolean).join(' ');
        });
        const all = [...fresh, ...moved].join(' ');
        if (all) setSaid(`Result updated: ${all.length > 400 ? `${all.slice(0, 397)}…` : all}`);
      }, 1200);
    };
    el.addEventListener('input', on);
    el.addEventListener('change', on);
    return () => { el.removeEventListener('input', on); el.removeEventListener('change', on); if (t) clearTimeout(t); };
  }, []);
  return (
    <div className={className} ref={root}>
      <p className="sr-only" aria-live="polite">{said}</p>
      {children}
    </div>
  );
}
