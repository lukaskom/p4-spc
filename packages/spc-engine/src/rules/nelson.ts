import type { NelsonRule, RuleContext, RuleViolation } from './types.js';

function outside3Sigma(value: number, ctx: RuleContext): boolean {
  return Math.abs(value - ctx.center) > 3 * ctx.sigma;
}

export const NELSON_RULE_1: NelsonRule = {
  id: 1,
  description: 'One point beyond 3σ from the center line',
  check(values, ctx) {
    const out: RuleViolation[] = [];
    for (let i = 0; i < values.length; i++) {
      if (outside3Sigma(values[i] as number, ctx)) {
        out.push({
          rule: 1,
          startIndex: i,
          endIndex: i,
          description: NELSON_RULE_1.description,
        });
      }
    }
    return out;
  },
};

export const NELSON_RULE_2: NelsonRule = {
  id: 2,
  description: 'Nine consecutive points on the same side of the center line',
  check(values, ctx) {
    const out: RuleViolation[] = [];
    const sides = values.map((v) => (v > ctx.center ? 1 : v < ctx.center ? -1 : 0));
    let runStart = 0;
    let runSide = sides[0] ?? 0;
    for (let i = 1; i <= sides.length; i++) {
      const s = i < sides.length ? (sides[i] as number) : 0;
      if (i === sides.length || s !== runSide) {
        const runLen = i - runStart;
        if (runSide !== 0 && runLen >= 9) {
          for (let k = runStart + 8; k < i; k++) {
            out.push({
              rule: 2,
              startIndex: k - 8,
              endIndex: k,
              description: NELSON_RULE_2.description,
            });
          }
        }
        runStart = i;
        runSide = s;
      }
    }
    return out;
  },
};

export const NELSON_RULE_3: NelsonRule = {
  id: 3,
  description: 'Six consecutive points monotonically trending up or down',
  check(values, ctx) {
    void ctx;
    const out: RuleViolation[] = [];
    if (values.length < 6) return out;
    const dirs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const a = values[i - 1] as number;
      const b = values[i] as number;
      dirs.push(b > a ? 1 : b < a ? -1 : 0);
    }
    for (let i = 0; i <= dirs.length - 5; i++) {
      const slice = dirs.slice(i, i + 5);
      if (slice.every((d) => d === 1) || slice.every((d) => d === -1)) {
        out.push({
          rule: 3,
          startIndex: i,
          endIndex: i + 5,
          description: NELSON_RULE_3.description,
        });
      }
    }
    return out;
  },
};

export const NELSON_RULE_4: NelsonRule = {
  id: 4,
  description: 'Fourteen consecutive points alternating up and down',
  check(values, ctx) {
    void ctx;
    const out: RuleViolation[] = [];
    if (values.length < 14) return out;
    const dirs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const a = values[i - 1] as number;
      const b = values[i] as number;
      dirs.push(b > a ? 1 : b < a ? -1 : 0);
    }
    for (let i = 0; i <= dirs.length - 13; i++) {
      let ok = true;
      for (let k = 0; k < 13; k++) {
        const d = dirs[i + k] as number;
        if (d === 0) {
          ok = false;
          break;
        }
        const expected = k === 0 ? d : -(dirs[i + k - 1] as number);
        if (d !== expected) {
          ok = false;
          break;
        }
      }
      if (ok) {
        out.push({
          rule: 4,
          startIndex: i,
          endIndex: i + 13,
          description: NELSON_RULE_4.description,
        });
      }
    }
    return out;
  },
};

export const NELSON_RULES: Readonly<Record<1 | 2 | 3 | 4, NelsonRule>> = {
  1: NELSON_RULE_1,
  2: NELSON_RULE_2,
  3: NELSON_RULE_3,
  4: NELSON_RULE_4,
};
