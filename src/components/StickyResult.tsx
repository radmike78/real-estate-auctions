import { useEffect, useRef, useState } from 'react';

/**
 * The calculator's headline number pinned to the bottom of the screen while you type, so you see what each change does.
 * It appears only while the calculator is on screen and its full results aren't, and a tap scrolls to them.
 */
export default function StickyResult({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [resultsVisible, setResultsVisible] = useState(true);
  const [calcInView, setCalcInView] = useState(false);
  useEffect(() => {
    const calc = ref.current?.closest('.calc');
    const results = calc?.querySelector('.calc-results');
    if (!calc || !results || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setResultsVisible(e.isIntersecting), { threshold: 0 });
    const ioCalc = new IntersectionObserver(([e]) => setCalcInView(e.isIntersecting), { threshold: 0 });
    io.observe(results);
    ioCalc.observe(calc);
    return () => { io.disconnect(); ioCalc.disconnect(); };
  }, []);
  return (
    <button ref={ref} type="button" hidden={resultsVisible || !calcInView} className={`calc-sticky${bad ? ' bad' : ''}`}
      onClick={() => ref.current?.closest('.calc')?.querySelector('.calc-results')?.scrollIntoView({ behavior: 'smooth' })}>
      <span>{label}</span>
      <strong>{value}</strong>
      <span className="calc-sticky-go">See details&nbsp;↓</span>
    </button>
  );
}
