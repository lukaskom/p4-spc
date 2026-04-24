import { describe, expect, it } from 'vitest';
import { xbarRLimits } from '../src/charts/xbar-r.js';

describe('xbarRLimits', () => {
  it('computes limits for a canonical n=5 dataset (Montgomery Table 6.1-style)', () => {
    const subgroups = [
      [74.030, 74.002, 74.019, 73.992, 74.008],
      [73.995, 73.992, 74.001, 74.011, 74.004],
      [73.988, 74.024, 74.021, 74.005, 74.002],
      [74.002, 73.996, 73.993, 74.015, 74.009],
      [73.992, 74.007, 74.015, 73.989, 74.014],
    ];
    const res = xbarRLimits({ subgroups });
    expect(res.subgroupSize).toBe(5);
    expect(res.subgroupCount).toBe(5);
    expect(res.xDoubleBar).toBeCloseTo(74.00504, 4);
    expect(res.rBar).toBeCloseTo(0.02820, 4);
    expect(res.xbar.center).toBeCloseTo(res.xDoubleBar, 6);
    expect(res.xbar.ucl).toBeCloseTo(res.xDoubleBar + 0.577 * res.rBar, 6);
    expect(res.xbar.lcl).toBeCloseTo(res.xDoubleBar - 0.577 * res.rBar, 6);
    expect(res.r.center).toBeCloseTo(res.rBar, 6);
    expect(res.r.ucl).toBeCloseTo(2.114 * res.rBar, 6);
    expect(res.r.lcl).toBeCloseTo(0, 6);
  });

  it('throws for mismatched subgroup sizes', () => {
    expect(() =>
      xbarRLimits({
        subgroups: [
          [1, 2, 3],
          [4, 5],
        ],
      }),
    ).toThrow();
  });

  it('throws for <2 subgroups', () => {
    expect(() => xbarRLimits({ subgroups: [[1, 2, 3]] })).toThrow();
  });
});
