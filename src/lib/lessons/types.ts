// A Learn lesson: plain-language reading with the sources it was written from.

/** One reason for or against, for a kind of reader, with a real example and its source when there is one. */
export interface WhyPoint {
  who: string;
  text: string;
  example?: string;
  source?: { label: string; url: string };
}

/** A paragraph, a bulleted list, a small comparison table, a list of tools to open, or "why you would / wouldn't". */
export type LessonBlock =
  | string
  | { list: string[] }
  | { table: { head: string[]; rows: string[][] } }
  /** Official tools and offices to open, each with what it's for. */
  | { links: { label: string; url: string; what: string }[] }
  /** Reasons to choose it and reasons not to, side by side. */
  | { why: { title: string; yes: WhyPoint[]; no: WhyPoint[]; more?: { href: string; label: string } } };

export interface Lesson {
  /** Matches a LEARN_MODULES key. */
  key: string;
  minutes: number;
  intro: string;
  /** What you'll know by the end: three to five lines. */
  takeaways: string[];
  sections: { heading: string; blocks: LessonBlock[] }[];
  terms: { term: string; meaning: string }[];
  /** Where to practice or use it on this site. */
  tryIt?: { label: string; href: string };
  /** One concrete thing to do with the lesson before moving on. */
  practice?: string;
  /** The button under "Put it into practice" when it isn't `tryIt`; null when the task needs no link here. */
  practiceLink?: { label: string; href: string } | null;
  /** Books from Recommended reading that fit this lesson (ISBN-10s), shown with their covers after the practice. */
  books?: string[];
  sources: { label: string; url: string }[];
  /** When the text was last checked against its sources (YYYY-MM-DD). */
  reviewed: string;
}
