// Content tracking: what's been checked, what changed, what's due.
//
//   npm run content:status                     sources, facts and pages due for a check, and pages edited since review
//   npm run content:reviewed -- <page-id> ...   record that you reviewed these pages today (after checking their sources)
//   npm run content:check-sources              fetch every source: broken links, and watched pages that changed
//     --update                                 accept the current version of watched pages (after re-reading them)
//     --report <file>                          also write the findings as Markdown (used by the weekly GitHub check)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FACTS } from '../../src/content/facts';
import { SOURCES } from '../../src/content/sources';
import { ageDays, loadReviews, pageHash, RECHECK_DAYS, REVIEWS_FILE, ROOT } from './ledger';

const today = new Date().toISOString().slice(0, 10);
const [cmd, ...args] = process.argv.slice(2);
const FINGERPRINTS = join(ROOT, 'src/content/fingerprints.json');

function status(): number {
  let due = 0;
  const line = (s: string) => console.log(`  - ${s}`);
  const unchecked = SOURCES.filter((s) => s.role !== 'sample' && s.role !== 'payment' && !s.prefix && !s.checked);
  const stale = SOURCES.filter((s) => s.checked && ageDays(s.checked) > RECHECK_DAYS);
  console.log(`\nSources: ${SOURCES.length} listed, ${SOURCES.filter((s) => s.checked).length} checked.`);
  if (unchecked.length) console.log(`Never checked (${unchecked.length}):`), unchecked.forEach((s) => line(`${s.id}: ${s.title} <${s.url}>`));
  if (stale.length) console.log(`Checked more than ${RECHECK_DAYS} days ago (${stale.length}):`), stale.forEach((s) => line(`${s.id}: checked ${s.checked}`));
  due += unchecked.length + stale.length;

  const staleFacts = FACTS.filter((f) => ageDays(f.checked) > RECHECK_DAYS);
  console.log(`\nFacts: ${FACTS.length} tracked.`);
  if (staleFacts.length) console.log(`Due for a re-check (${staleFacts.length}):`), staleFacts.forEach((f) => line(`${f.id}: checked ${f.checked}`));
  const conflicts = FACTS.filter((f) => f.note);
  if (conflicts.length) console.log('Notes to keep in mind:'), conflicts.forEach((f) => line(`${f.id}: ${f.note}`));
  due += staleFacts.length;

  const reviews = loadReviews();
  const edited = reviews.filter((r) => pageHash(r.files) !== r.hash);
  const oldPages = reviews.filter((r) => ageDays(r.reviewed) > RECHECK_DAYS);
  console.log(`\nPages: ${reviews.length} tracked.`);
  if (edited.length) console.log(`Edited since their last review (${edited.length}):`), edited.forEach((r) => line(`${r.id}: ${r.title} (reviewed ${r.reviewed})`));
  if (oldPages.length) console.log(`Reviewed more than ${RECHECK_DAYS} days ago (${oldPages.length}):`), oldPages.forEach((r) => line(`${r.id}: ${r.reviewed}`));
  due += edited.length + oldPages.length;
  console.log(due ? `\n${due} item(s) need attention.\n` : '\nEverything is checked and up to date.\n');
  return 0;
}

function reviewed(ids: string[]): number {
  const reviews = loadReviews();
  const note = ids.includes('--note') ? ids.splice(ids.indexOf('--note'), 2)[1] : undefined;
  if (!ids.length) {
    console.error('Name the pages you reviewed, e.g.: npm run content:reviewed -- playbook checklists');
    return 1;
  }
  for (const id of ids) {
    const r = reviews.find((x) => x.id === id);
    if (!r) {
      console.error(`No page "${id}". Pages: ${reviews.map((x) => x.id).join(', ')}`);
      return 1;
    }
    r.reviewed = today;
    r.hash = pageHash(r.files);
    if (note) r.note = note;
    console.log(`Recorded: ${r.title} reviewed ${today}.`);
  }
  writeFileSync(REVIEWS_FILE, `${JSON.stringify(reviews, null, 2)}\n`);
  return 0;
}

/** Visible text of a page or PDF-ish body, so small markup changes don't count as a change. */
const textOf = (body: string) =>
  body
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*[AP]\.?M\.?/gi, ' ') // clocks printed on the page
    .replace(/\s+/g, ' ')
    .trim();

async function checkSources(update: boolean, reportFile?: string): Promise<number> {
  const fingerprints: Record<string, string> = existsSync(FINGERPRINTS) ? JSON.parse(readFileSync(FINGERPRINTS, 'utf8')) : {};
  const broken: string[] = [];
  const blocked: string[] = [];
  const changed: string[] = [];
  const targets = SOURCES.filter((s) => s.role !== 'sample' && !(s.prefix && s.id === 'nrs'));
  for (const s of targets) {
    let res: Response;
    try {
      res = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(20_000), headers: { 'user-agent': 'DeedOwl source check (+https://deedowl.com)' } });
    } catch (e) {
      broken.push(`${s.id}: couldn't connect (${(e as Error).message}) <${s.url}>`);
      continue;
    }
    if (res.status === 401 || res.status === 403 || res.status === 405 || res.status === 429 || (res.status >= 300 && res.status < 400)) {
      blocked.push(`${s.id}: the site refused an automated check (HTTP ${res.status}); open it yourself <${s.url}>`);
      continue;
    }
    if (!res.ok) {
      broken.push(`${s.id}: HTTP ${res.status} <${s.url}>`);
      continue;
    }
    if (!s.watch) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const isPdf = /pdf/i.test(res.headers.get('content-type') ?? '') || buf.subarray(0, 4).toString() === '%PDF';
    const fp = createHash('sha256').update(isPdf ? buf : textOf(buf.toString('utf8'))).digest('hex').slice(0, 16);
    if (fingerprints[s.id] && fingerprints[s.id] !== fp) changed.push(`${s.id}: ${s.title} changed since it was last read <${s.url}>`);
    if (update || !fingerprints[s.id]) fingerprints[s.id] = fp;
  }
  if (update || Object.keys(fingerprints).length) writeFileSync(FINGERPRINTS, `${JSON.stringify(fingerprints, null, 2)}\n`);

  const sections: [string, string[], string][] = [
    ['Watched official pages that changed', changed, 'Re-read each one, fix the site text if the rules changed, update `checked` in src/content/sources.ts, then run `npm run content:check-sources -- --update`.'],
    ['Broken links', broken, 'Find the new address on the official site and update src/content/sources.ts and the page that links to it.'],
    ['Could not check automatically', blocked, 'These sites block automated checks. Open them yourself now and then.'],
  ];
  const md = sections
    .filter(([, items]) => items.length)
    .map(([title, items, todo]) => `### ${title}\n${items.map((i) => `- ${i}`).join('\n')}\n\n${todo}`)
    .join('\n\n');
  console.log(md || 'All sources reachable; no watched page changed.');
  if (reportFile) writeFileSync(reportFile, md);
  return changed.length || broken.length ? 2 : 0;
}

const run = async () => {
  if (cmd === 'status') return status();
  if (cmd === 'reviewed') return reviewed(args);
  if (cmd === 'check-sources') {
    const i = args.indexOf('--report');
    return checkSources(args.includes('--update'), i >= 0 ? args[i + 1] : undefined);
  }
  console.error('Use: status | reviewed <page-id> ... | check-sources [--update] [--report <file>]');
  return 1;
};
process.exitCode = await run();
