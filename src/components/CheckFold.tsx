import type { ReactNode } from 'react';

/**
 * One topic of a long checklist, folded: the topic name and how many items are done, opening to the items.
 * Keeps big checklists from overwhelming beginners while every item stays one tap away.
 */
export default function CheckFold({ title, done, total, open, children }: { title: string; done: number; total: number; open?: boolean; children: ReactNode }) {
  const complete = total > 0 && done >= total;
  return (
    <details className={`check-fold${complete ? ' complete' : ''}`} open={open}>
      <summary>
        <span className="check-fold-title">{title}</span>
        <span className="check-fold-count">{complete ? '✓ All done' : `${done} of ${total} done`}</span>
      </summary>
      <div className="check-fold-body">{children}</div>
    </details>
  );
}
