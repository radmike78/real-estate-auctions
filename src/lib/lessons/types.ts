// A Learn lesson: plain-language reading with the sources it was written from.

/** A paragraph, a bulleted list, or a small comparison table. */
export type LessonBlock = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };

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
  sources: { label: string; url: string }[];
  /** When the text was last checked against its sources (YYYY-MM-DD). */
  reviewed: string;
}
