import { useEffect, useRef, useState } from 'react';

/**
 * The calculator's headline number pinned to the bottom of the screen while you type, so you see what each change does.
 * It appears only while the calculator is on screen and its headline result isn't, and a tap scrolls to it. While a
 * box holds a number that can't be read, it asks you to fix that instead of showing the last result.
 */
export default function StickyResult({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [resultsVisible, setResultsVisible] = useState(true);
  const [calcInView, setCalcInView] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    const calc = ref.current?.closest('.calc');
    if (!calc) return;
    // Follows every box's aria-invalid, however it changes (typing, or a button that sets the number).
    const check = () => setInvalid(!!calc.querySelector('input[aria-invalid="true"]'));
    check();
    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(check);
    mo.observe(calc, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-invalid'] });
    return () => mo.disconnect();
  }, []);
  useEffect(() => {
    const calc = ref.current?.closest('.calc');
    // The headline number, not the whole results column: on a wide screen the column is long, and a checklist far
    // below the price can be on screen while the price isn't.
    const results = calc?.querySelector('.calc-results .calc-max') ?? calc?.querySelector('.calc-results');
    if (!calc || !results || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { threshold: 0 });
    const ioCalc = new IntersectionObserver(([e]) => setCalcInView(e.isIntersecting), { threshold: 0 });
    io.observe(results);
    ioCalc.observe(calc);
    return () => { io.disconnect(); ioCalc.disconnect(); };
  }, []);
  return (
    <button ref={ref} type="button" hidden={resultsVisible || !calcInView} className={`calc-sticky${bad || invalid ? ' bad' : ''}`}
      onClick={() => { const calc = ref.current?.closest('.calc'); (invalid ? calc?.querySelector<HTMLElement>('input[aria-invalid="true"]') : calc?.querySelector('.calc-results .calc-max') ?? calc?.querySelector('.calc-results'))?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
      <span>{invalid ? 'Results paused' : label}</span>
      <strong>{invalid ? 'Fix the highlighted number' : value}</strong>
      <span className="calc-sticky-go">{invalid ? 'Go to it' : 'See details'}&nbsp;↓</span>
    </button>
  );
}
