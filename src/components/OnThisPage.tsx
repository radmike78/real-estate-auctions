import { useEffect, useState, type RefObject } from 'react';

/** "On this page": jump links to each heading in a long page, so readers can see its parts and skip to one. */
export default function OnThisPage({ root, selector }: { root: RefObject<HTMLElement | null>; selector: string }) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  useEffect(() => {
    const els = [...(root.current?.querySelectorAll<HTMLElement>(selector) ?? [])];
    setItems(
      els.map((el, i) => {
        if (!el.id) el.id = `part-${i}-${(el.textContent ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
        return { id: el.id, text: el.textContent ?? '' };
      }),
    );
  }, [root, selector]);
  if (items.length < 3) return null;
  return (
    <nav className="on-this-page" aria-label="On this page">
      <span className="on-this-page-label">On this page:</span>
      {items.map((x) => (
        <button key={x.id} type="button" onClick={() => document.getElementById(x.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{x.text}</button>
      ))}
    </nav>
  );
}
