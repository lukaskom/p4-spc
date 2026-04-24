import { describe, expect, it } from 'vitest';
import { capability } from '../src/capability/index.js';

describe('capability', () => {
  it('computes Cp and Cpk from subgroups with two-sided tolerance', () => {
    const subgroups = [
      [10.02, 10.01, 9.99, 10.00, 10.03],
      [9.98, 10.02, 10.01, 10.00, 9.99],
      [10.01, 10.00, 9.99, 10.02, 10.00],
      [9.99, 10.00, 10.02, 10.01, 9.98],
    ];
    const res = capability({
      subgroups,
      lsl: 9.9,
      usl: 10.1,
      target: 10.0,
    });
    expect(res.sampleCount).toBe(20);
    expect(res.mean).toBeCloseTo(10.0035, 4);
    expect(res.sigmaWithin).not.toBeNull();
    expect(res.cp).not.toBeNull();
    expect(res.cpk).not.toBeNull();
    expect(res.cp).toBeGreaterThan(0);
    expect(res.cpk).toBeLessThanOrEqual(res.cp as number);
    expect(res.pp).not.toBeNull();
    expect(res.ppk).not.toBeNull();
  });

  it('handles one-sided upper tolerance (only Cpk / Ppk)', () => {
    const values = [10, 10.1, 9.9, 10.05, 9.95, 10, 10.02, 9.98];
    const res = capability({ values, usl: 10.2 });
    expect(res.cp).toBeNull();
    expect(res.cpk).toBeNull();
    expect(res.pp).toBeNull();
    expect(res.ppk).not.toBeNull();
  });

  it('handles one-sided lower tolerance (only Cpk / Ppk)', () => {
    const values = [10, 10.1, 9.9, 10.05, 9.95, 10, 10.02, 9.98];
    const res = capability({ values, lsl: 9.8 });
    expect(res.cp).toBeNull();
    expect(res.pp).toBeNull();
    expect(res.cpk).toBeNull();
    expect(res.ppk).not.toBeNull();
  });

  it('sets Cp/Cpk to null when only raw values provided (no subgroups)', () => {
    const values = [10, 10.1, 9.9, 10.05, 9.95, 10, 10.02, 9.98];
    const res = capability({ values, lsl: 9.8, usl: 10.2 });
    expect(res.sigmaWithin).toBeNull();
    expect(res.cp).toBeNull();
    expect(res.cpk).toBeNull();
    expect(res.pp).not.toBeNull();
    expect(res.ppk).not.toBeNull();
  });

  it('ppk reflects off-center process (mean shifted toward USL)', () => {
    const values: number[] = [];
    for (let i = 0; i < 30; i++) values.push(10.06 + 0.01 * Math.sin(i));
    const res = capability({ values, lsl: 9.9, usl: 10.1 });
    expect(res.pp).not.toBeNull();
    expect(res.ppk).not.toBeNull();
    expect(res.ppk as number).toBeLessThan(res.pp as number);
  });

  it('throws without subgroups or values', () => {
    expect(() => capability({ lsl: 0, usl: 1 })).toThrow();
  });

  it('throws with fewer than 2 values', () => {
    expect(() => capability({ values: [10], lsl: 9, usl: 11 })).toThrow();
  });
});
