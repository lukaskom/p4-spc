import { describe, expect, it } from 'vitest';
import { hasShewhartConstants, shewhartConstants } from '../src/constants/shewhart.js';

describe('shewhartConstants', () => {
  it('returns canonical values for n=5', () => {
    const c = shewhartConstants(5);
    expect(c.A2).toBeCloseTo(0.577, 3);
    expect(c.D3).toBeCloseTo(0.0, 3);
    expect(c.D4).toBeCloseTo(2.114, 3);
    expect(c.d2).toBeCloseTo(2.326, 3);
    expect(c.c4).toBeCloseTo(0.9400, 4);
    expect(c.E2).toBeCloseTo(1.290, 3);
  });

  it('throws for n out of tabulated range', () => {
    expect(() => shewhartConstants(1)).toThrow();
    expect(() => shewhartConstants(26)).toThrow();
    expect(() => shewhartConstants(1.5)).toThrow();
  });

  it('has all required fields for n=2..25', () => {
    for (let n = 2; n <= 25; n++) {
      expect(hasShewhartConstants(n)).toBe(true);
      const c = shewhartConstants(n);
      expect(c.A2).toBeGreaterThan(0);
      expect(c.D4).toBeGreaterThan(1);
      expect(c.d2).toBeGreaterThan(1);
    }
  });
});
