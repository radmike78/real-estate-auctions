// Shared by the content tests and the content CLI (Node only; the site never imports this).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PageReview {
  id: string;
  title: string;
  /** Files whose words make up the page (from the repo root). */
  files: string[];
  /** When the page's content was last reviewed against its sources (YYYY-MM-DD). */
  reviewed: string;
  /** Fingerprint of `files` when it was reviewed: any later edit means it needs another review. */
  hash: string;
  note?: string;
}

export const ROOT = join(import.meta.dirname, '..', '..');
export const REVIEWS_FILE = join(ROOT, 'src/content/reviews.json');

export function loadReviews(): PageReview[] {
  return JSON.parse(readFileSync(REVIEWS_FILE, 'utf8')) as PageReview[];
}

/** Fingerprint of a page's files. Line endings don't matter; anything else does. */
export function pageHash(files: string[]): string {
  const h = createHash('sha256');
  for (const f of [...files].sort()) {
    const p = join(ROOT, f);
    h.update(`${f}\n`);
    h.update(existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : '(missing)');
  }
  return h.digest('hex').slice(0, 16);
}

/** Days from an ISO date to `today`. */
export const ageDays = (iso: string, today = new Date()) => Math.floor((today.getTime() - Date.parse(`${iso}T12:00:00Z`)) / 86_400_000);

/** Sources and facts older than this are listed as due for a re-check. */
export const RECHECK_DAYS = 180;
