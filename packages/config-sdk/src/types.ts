export interface TenantConfig {
  readonly version: number;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly locale: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly aqdefMapping: AqdefMapping;
  readonly forms: Readonly<Record<string, FormDef>>;
  readonly transformers: Readonly<Record<string, TransformerDef>>;
  readonly spc: SpcConfig;
  readonly domain: Readonly<Record<string, unknown>>;
}

export interface AqdefMapping {
  readonly part: Readonly<Record<string, string>>;
  readonly characteristic: Readonly<Record<string, string>>;
  readonly measurement: Readonly<Record<string, string>>;
}

export type FieldType = 'text' | 'number' | 'select' | 'readonly' | 'computed' | 'datetime';

export interface FormFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface FormFieldValidation {
  readonly min?: number;
  readonly max?: number;
  readonly pattern?: string;
  readonly message?: string;
}

export interface FormField {
  readonly id: string;
  readonly type: FieldType;
  readonly label: string;
  readonly description?: string;
  readonly unit?: string;
  readonly required?: boolean;
  readonly defaultValue?: unknown;
  readonly options?: readonly FormFieldOption[];
  readonly optionsFrom?: 'products' | 'gages' | 'operators';
  readonly expression?: string;
  readonly readFrom?: string;
  readonly validation?: FormFieldValidation;
  readonly columnSpan?: 1 | 2;
}

export interface FormDef {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly productIds?: readonly string[];
  readonly fields: readonly FormField[];
  readonly submitLabel: string;
  readonly resultField?: string;
  readonly statusFromField?: string;
}

export interface TransformerDef {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly inputs: readonly string[];
  readonly output: string;
  readonly expression: string;
}

export type NelsonRuleId = 1 | 2 | 3 | 4;

export interface SpcConfig {
  readonly defaultChartType: 'i-mr' | 'xbar-r' | 'xbar-s';
  readonly enabledNelsonRules: readonly NelsonRuleId[];
  readonly subgroupSize: number;
  readonly capabilityThresholds: {
    readonly excellent: number;
    readonly good: number;
    readonly marginal: number;
  };
}
