import { expect, it } from 'vitest';
import { checkPool } from './checkPool';

it('checks each source once without exceeding the worker limit', async () => {
  let active = 0;
  let peak = 0;
  const checked: number[] = [];
  const pending = Array.from({ length: 20 }, (_, i) => i);
  const left = await checkPool(pending, async (i) => {
    peak = Math.max(peak, ++active);
    await Promise.resolve();
    checked.push(i);
    active--;
  }, 3);
  expect(peak).toBe(3);
  expect(checked.sort((a, b) => a - b)).toEqual(pending);
  expect(left).toBe(0);
});

it('reports unchecked sources when the budget ends instead of claiming a clean check', async () => {
  let time = 0;
  const checked: number[] = [];
  const left = await checkPool([1, 2, 3], async (i) => { checked.push(i); time += 10; }, 1, 15, () => time);
  expect(checked).toEqual([1, 2]);
  expect(left).toBe(1);
});
