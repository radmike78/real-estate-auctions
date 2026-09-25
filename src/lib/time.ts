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
