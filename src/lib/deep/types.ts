// Deeper pages for each property type and professional: detail, and real stories of what happened to other people.

export interface SourceRef {
  label: string;
  url: string;
}

/** Something that really happened, as reported by the source. Private people are described, never named. */
export interface Story {
  /** 'good': why it suited them. 'caution': what went wrong, or why they had to be careful. */
  tone: 'good' | 'caution';
  who: string;
  year: string;
  title: string;
  happened: string;
  lesson: string;
  source: SourceRef;
}

export interface TopicDeep {
  overview: string[];
  bestFor: string[];
  notFor: string[];
  costs: string[];
  /** Property types: how people finance it. Professionals: how they're paid. */
  money: string[];
  checklist: string[];
  facts: { text: string; source: SourceRef }[];
  stories: Story[];
  sources: SourceRef[];
}
