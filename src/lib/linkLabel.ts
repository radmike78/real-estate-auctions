// Named links for checklist items, so a link says where it goes instead of a generic "Go".

/** A named link for a checklist item, instead of a generic "Go". */
export function linkLabel(href: string): string {
  if (href.startsWith('#/learn/types')) return 'Property types';
  if (href.startsWith('#/learn')) return 'Read the lesson';
  if (href.startsWith('#/practice')) return 'Practice';
  if (href.startsWith('#/playbooks')) return 'Sale guide';
  if (href.startsWith('#/pros')) return 'Your team';
  if (href.startsWith('#/analyze')) return 'Analyze';
  if (href.startsWith('#/find-deals')) return 'Find deals';
  if (href.startsWith('#/toolkit')) return 'My plan';
  if (href.startsWith('#/financing')) return 'Financing';
  return 'Open';
}

