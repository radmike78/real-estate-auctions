import PageHero from './PageHero';
import EmptyState from './EmptyState';
import PathNext from './PathNext';
import { useMarkStep } from '../lib/path';

/** Step 2 of the path: choose a focus. The guided questions come next. */
export default function DecidePage() {
  useMarkStep('decide');
  return (
    <main className="page">
      <PageHero
        eyebrow={<span className="eyebrow">Step 2 of 6</span>}
        title={<>Decide <span className="grad">your focus</span></>}
        sub="Pick the kind of property and market that fits your money, time and goals, then get a checklist to prepare."
      />
      <EmptyState soon title="Your focus questions are coming soon">
        <p>A few quick questions (your budget, how much time you have, residential or commercial, fix-and-sell or keep-and-rent) will narrow down a focus and give you a checklist of what to prepare.</p>
        <p>Until then, <a href="#/learn">start with the lessons</a> or <a href="#/practice">try a practice purchase</a>.</p>
      </EmptyState>
      <PathNext step="decide" />
    </main>
  );
}
