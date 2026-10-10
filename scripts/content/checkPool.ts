/** Bounded workers and a deadline keep a source check within its scheduled job's time limit. */
export async function checkPool<T>(items: readonly T[], check: (item: T) => Promise<void>, workers = 8, budgetMs = 10 * 60_000, clock = Date.now): Promise<number> {
  const deadline = clock() + budgetMs;
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (next < items.length && clock() < deadline) {
      const item = items[next++];
      await check(item);
    }
  }));
  return items.length - next;
}
