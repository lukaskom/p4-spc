import { NELSON_RULES } from './nelson.js';
import type { CheckOptions, CheckResult, NelsonRuleId, RuleContext, RuleViolation } from './types.js';

const DEFAULT_RULES: readonly NelsonRuleId[] = [1, 2, 3, 4];

export function checkNelson(
  values: readonly number[],
  ctx: RuleContext,
  options: CheckOptions = {},
): CheckResult {
  if (!Number.isFinite(ctx.sigma) || ctx.sigma <= 0) {
    throw new RangeError(`sigma must be a positive finite number, got ${ctx.sigma}`);
  }
  const rulesChecked = options.rules ?? DEFAULT_RULES;
  const violations: RuleViolation[] = [];
  for (const ruleId of rulesChecked) {
    const rule = NELSON_RULES[ruleId];
    for (const v of rule.check(values, ctx)) {
      violations.push(v);
    }
  }
  return { violations, rulesChecked };
}
