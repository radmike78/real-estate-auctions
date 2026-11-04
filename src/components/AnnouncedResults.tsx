import { useEffect, useRef, useState, type ReactNode } from 'react';

/** A calculator area whose result boxes (.calc-verdict, .calc-max, [data-result]) aren't live regions (they'd be re-read on every
 *  keystroke): once you stop typing, the result that changed is announced once, in a short summary. */
export default function AnnouncedResults({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [said, setSaid] = useState('');
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // A result box as words: its parts in order ("Walk-away price: $123,000. …"), in their own case (textContent,
    // not the capitals CSS shows).
    const words = (b: HTMLElement) => {
      const parts = [...b.childNodes].map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      return parts.reduce((acc, p, k) => (k === 0 ? p : `${acc}${/[.:!?]$/.test(acc) ? ' ' : parts[k - 1].length < 40 && !parts[k - 1].includes(':') && !/^[$\d−-]/.test(parts[k - 1]) ? ': ' : '. '}${p}`), '');
    };
    const boxes = () => [...el.querySelectorAll<HTMLElement>('.calc-verdict, .calc-max, [data-result]')].filter((b) => b.getClientRects().length > 0);
    let t: ReturnType<typeof setTimeout> | undefined;
    // The results as they were when you started typing: the one that changed is announced.
    let before = new Map<HTMLElement, string>();
    const on = (e: Event) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
      if (t) clearTimeout(t);
      else before = new Map(boxes().map((b) => [b, words(b)]));
      t = setTimeout(() => {
        t = undefined;
        const changed = boxes().find((b) => before.get(b) !== words(b));
        if (!changed) return;
        // The first few sentences: the result, not every line under it.
        const short = words(changed).split(/(?<=[.!?])\s+/).slice(0, 3).join(' ');
        if (short) setSaid(`Result updated: ${short.length > 260 ? `${short.slice(0, 257)}…` : short}`);
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
