import { describe, expect, it } from 'vitest';
import { calculatorInputError } from './CalcFields';

describe('calculator input limits', () => {
  it('accepts zero, decimals and the percentage boundary', () => {
    expect(calculatorInputError('0', '$')).toBeNull();
    expect(calculatorInputError('12.5', 'x')).toBeNull();
    expect(calculatorInputError('100', '%')).toBeNull();
  });
  it('explains invalid values instead of silently calculating with zero or a capped value', () => {
    for (const text of ['', '-100', 'Infinity', 'not a number']) {
      expect(calculatorInputError(text, '$')).toContain('Results use the last valid value');
    }
    expect(calculatorInputError('100.1', '%')).toContain('0 to 100');
    expect(calculatorInputError('10000000001', '$')).not.toBeNull();
  });
});
