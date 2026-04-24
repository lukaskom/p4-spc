import { describe, expect, it } from 'vitest';
import { iMRLimits } from '../src/charts/i-mr.js';

describe('iMRLimits', () => {
  it('computes limits for a simple stable series', () => {
    const values = [10, 11, 10, 12, 11, 13, 10, 11];
    const res = iMRLimits({ values });
    expect(res.valueCount).toBe(8);
    expect(res.meanValue).toBeCloseTo(11, 6);
    const expectedMRBar = (1 + 1 + 2 + 1 + 2 + 3 + 1) / 7;
    expect(res.mrBar).toBeCloseTo(expectedMRBar, 6);
    expect(res.individuals.center).toBeCloseTo(11, 6);
    expect(res.individuals.ucl).toBeCloseTo(11 + 2.66 * expectedMRBar, 4);
    expect(res.individuals.lcl).toBeCloseTo(11 - 2.66 * expectedMRBar, 4);
    expect(res.movingRange.center).toBeCloseTo(expectedMRBar, 6);
    expect(res.movingRange.ucl).toBeCloseTo(3.267 * expectedMRBar, 4);
    expect(res.movingRange.lcl).toBe(0);
  });
});
