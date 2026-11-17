// Clark County sales run on Las Vegas (Pacific) wall-clock time.

/** Converts a Las Vegas wall-clock time to an ISO UTC string (handles PST/PDT). */
export function pacificToIso(y: number, month0: number, d: number, h: number, mi = 0): string {
  const guess = Date.UTC(y, month0, d, h, mi);
  const offsetOf = (t: number) => {
    const name =
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'longOffset' })
        .formatToParts(new Date(t))
        .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-08:00';
    const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000 : 0;
  };
  const first = guess - offsetOf(guess);
  return new Date(guess - offsetOf(first)).toISOString();
}

/** "5 minutes ago", "3 hours ago", "2 days ago" — for "last checked" labels. */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
  if (!Number.isFinite(s)) return 'unknown';
  if (s < 90) return 'just now';
  if (s < 3600) return unit(Math.round(s / 60), 'minute');
  if (s < 86_400) return unit(Math.round(s / 3600), 'hour');
  return unit(Math.round(s / 86_400), 'day');
}

/** Today's date (YYYY-MM-DD) in Nevada/California time, the day paid-through and license dates are written in. */
export function pacificDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** A Nevada legal holiday (NRS 236.015), as observed (a Sunday holiday on Monday, a Saturday one on Friday): county
 * offices are closed. */
export const nvHoliday = (t: Date): boolean => {
  const y = t.getFullYear(); const m = t.getMonth(); const day = t.getDate();
  const nth = (mo: number, wd: number, n: number) => { const f = new Date(y, mo, 1).getDay(); return 1 + ((wd - f + 7) % 7) + (n - 1) * 7; };
  const last = (mo: number, wd: number) => { const lastDay = new Date(y, mo + 1, 0); return lastDay.getDate() - ((lastDay.getDay() - wd + 7) % 7); };
  const fixed = [[y, 0, 1], [y + 1, 0, 1], [y, 5, 19], [y, 6, 4], [y, 10, 11], [y, 11, 25]].some(([yy, mo, dd]) => { const h = new Date(yy, mo, dd); const o = h.getDay() === 0 ? new Date(yy, mo, dd + 1) : h.getDay() === 6 ? new Date(yy, mo, dd - 1) : h; return o.getFullYear() === y && o.getMonth() === m && o.getDate() === day; });
  const thanks = nth(10, 4, 4);
  return fixed || (m === 0 && day === nth(0, 1, 3)) || (m === 1 && day === nth(1, 1, 3)) || (m === 4 && day === last(4, 1)) || (m === 8 && day === nth(8, 1, 1)) || (m === 9 && day === last(9, 5)) || (m === 10 && (day === thanks || day === thanks + 1));
};
