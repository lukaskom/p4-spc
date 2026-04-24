export interface RuleContext {
  readonly center: number;
  readonly sigma: number;
}

export interface RuleViolation {
  readonly rule: NelsonRuleId;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly description: string;
}

export type NelsonRuleId = 1 | 2 | 3 | 4;

export interface NelsonRule {
  readonly id: NelsonRuleId;
  readonly description: string;
  readonly check: (values: readonly number[], ctx: RuleContext) => readonly RuleViolation[];
}

export interface CheckOptions {
  readonly rules?: readonly NelsonRuleId[];
}

export interface CheckResult {
  readonly violations: readonly RuleViolation[];
  readonly rulesChecked: readonly NelsonRuleId[];
}
