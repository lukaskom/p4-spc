import { describe, expect, it } from 'vitest';
import { checkNelson, NELSON_RULE_1, NELSON_RULE_2, NELSON_RULE_3, NELSON_RULE_4 } from '../src/rules/index.js';

const ctx = { center: 10, sigma: 1 };

describe('Nelson rule 1 — beyond 3σ', () => {
  it('flags points outside ±3σ', () => {
    const v = NELSON_RULE_1.check([10, 10.5, 13.5, 10.2, 6.5], ctx);
    expect(v.map((x) => x.startIndex)).toEqual([2, 4]);
  });
  it('does not flag points exactly at 3σ', () => {
    const v = NELSON_RULE_1.check([13, 7, 10], ctx);
    expect(v).toHaveLength(0);
  });
});

describe('Nelson rule 2 — 9 on same side', () => {
  it('flags runs of 9 or more above the center', () => {
    const values = [11, 11, 11, 11, 11, 11, 11, 11, 11];
    const v = NELSON_RULE_2.check(values, ctx);
    expect(v).toHaveLength(1);
    expect(v[0]!.startIndex).toBe(0);
    expect(v[0]!.endIndex).toBe(8);
  });
  it('flags extended runs producing multiple overlapping windows', () => {
    const values = [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11];
    const v = NELSON_RULE_2.check(values, ctx);
    expect(v).toHaveLength(3);
  });
  it('does not flag runs of 8', () => {
    const values = [11, 11, 11, 11, 11, 11, 11, 11, 9];
    const v = NELSON_RULE_2.check(values, ctx);
    expect(v).toHaveLength(0);
  });
});

describe('Nelson rule 3 — 6 monotonic trend', () => {
  it('flags strictly increasing runs of 6+ points', () => {
    const v = NELSON_RULE_3.check([1, 2, 3, 4, 5, 6], ctx);
    expect(v).toHaveLength(1);
  });
  it('flags strictly decreasing runs', () => {
    const v = NELSON_RULE_3.check([10, 9, 8, 7, 6, 5, 4], ctx);
    expect(v.length).toBeGreaterThan(0);
  });
  it('does not flag 5-point trend', () => {
    const v = NELSON_RULE_3.check([1, 2, 3, 4, 5], ctx);
    expect(v).toHaveLength(0);
  });
  it('does not flag trend with plateau', () => {
    const v = NELSON_RULE_3.check([1, 2, 3, 3, 4, 5], ctx);
    expect(v).toHaveLength(0);
  });
});

describe('Nelson rule 4 — 14 alternating', () => {
  it('flags 14 alternating points', () => {
    const values: number[] = [];
    for (let i = 0; i < 14; i++) values.push(i % 2 === 0 ? 10 : 11);
    const v = NELSON_RULE_4.check(values, ctx);
    expect(v).toHaveLength(1);
  });
  it('does not flag shorter alternations', () => {
    const values: number[] = [];
    for (let i = 0; i < 13; i++) values.push(i % 2 === 0 ? 10 : 11);
    const v = NELSON_RULE_4.check(values, ctx);
    expect(v).toHaveLength(0);
  });
});

describe('checkNelson aggregator', () => {
  it('aggregates violations from all default rules', () => {
    const values = [10, 10.5, 15, 10.2, 6.5];
    const result = checkNelson(values, ctx);
    expect(result.rulesChecked).toEqual([1, 2, 3, 4]);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.every((v) => [1, 2, 3, 4].includes(v.rule))).toBe(true);
  });
  it('restricts to requested rule ids', () => {
    const values = [10, 10.5, 15, 10.2, 6.5];
    const result = checkNelson(values, ctx, { rules: [1] });
    expect(result.violations.every((v) => v.rule === 1)).toBe(true);
  });
  it('throws for non-positive sigma', () => {
    expect(() => checkNelson([10], { center: 10, sigma: 0 })).toThrow();
    expect(() => checkNelson([10], { center: 10, sigma: -1 })).toThrow();
  });
});
