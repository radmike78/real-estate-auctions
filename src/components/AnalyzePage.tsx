import PageHero from './PageHero';
import { Calculators } from './CalculatorPage';
import { useMarkStep } from '../lib/path';

const STEPS: [string, string, string?][] = [
  ['Run the numbers', 'Find the most you can pay and still make your profit (below).'],
  ['Check title and liens', 'A title search shows who owns it and which liens could stay with the property.', '#/pros/title'],
  ['Check the condition', 'An inspection, or an exterior look if you can’t go inside, and a repair estimate.', '#/pros/inspector'],
  ['Line up the money', 'Cash, a loan pre-approval, or a hard-money lender, before you make an offer or bid.', '#/pros/lender'],
  ['Confirm with the official seller', 'Sales are paid off, postponed and cancelled. Check the date, terms and payment rules.'],
  ['Keep track', 'Save it to My deals to follow dates, deadlines and your notes.', '#/deals'],
];

/** Step 6 of the path: work through a real deal, starting with the numbers. */
export default function AnalyzePage() {
  useMarkStep('analyze');
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 6 of 6</span>}
        title={<>Analyze <span className="grad">a deal</span></>}
        sub="Found one you like? Work through it step by step, and know your number before you offer or bid."
      />
      <ol className="work-steps">
        {STEPS.map(([t, d, href]) => (
          <li key={t}><strong>{t}</strong><span>{d}{href && <> <a href={href}>How →</a></>}</span></li>
        ))}
      </ol>
      <h2 className="section-title">Run the numbers</h2>
      <Calculators />
    </main>
  );
}
