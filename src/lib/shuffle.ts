/**
 * A fixed order for n answer choices, different for each question (seeded by its text) but the same on every visit, so
 * the right answer isn't always in the same place and a returning learner sees the same layout.
 */
export function shuffled(n: number, seed: string): number[] {
  const h = (i: number) => {
    let x = 2166136261;
    for (const c of `${seed}#${i}`) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
    return x >>> 0;
  };
  return [...Array(n).keys()].sort((a, b) => h(a) - h(b));
}
