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
