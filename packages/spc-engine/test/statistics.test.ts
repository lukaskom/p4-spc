import { describe, expect, it } from 'vitest';
import { mean, movingRanges, range, sampleStdev } from '../src/statistics/descriptive.js';

describe('mean', () => {
  it('computes arithmetic mean', () => {
    expect(mean([2, 4, 6, 8])).toBe(5);
  });
  it('throws for empty input', () => {
    expect(() => mean([])).toThrow();
  });
});

describe('range', () => {
  it('returns max - min', () => {
    expect(range([3, 1, 4, 1, 5, 9, 2, 6])).toBe(8);
  });
  it('returns 0 for constant series', () => {
    expect(range([7, 7, 7])).toBe(0);
  });
});

describe('sampleStdev', () => {
  it('computes sample standard deviation (divisor n-1)', () => {
    expect(sampleStdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138089935, 6);
  });
  it('throws for n < 2', () => {
    expect(() => sampleStdev([5])).toThrow();
  });
});

describe('movingRanges', () => {
  it('returns absolute differences of consecutive values', () => {
    expect(movingRanges([10, 12, 11, 14])).toEqual([2, 1, 3]);
  });
});
