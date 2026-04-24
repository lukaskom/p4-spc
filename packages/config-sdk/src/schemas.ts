import { z } from 'zod';

export const fieldTypeSchema = z.enum(['text', 'number', 'select', 'readonly', 'computed', 'datetime']);

export const formFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const formFieldValidationSchema = z.object({
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
});

export const formFieldSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  type: fieldTypeSchema,
  label: z.string().min(1).max(120),
  description: z.string().max(240).optional(),
  unit: z.string().max(16).optional(),
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  options: z.array(formFieldOptionSchema).optional(),
  optionsFrom: z.enum(['products', 'gages', 'operators']).optional(),
  expression: z.string().optional(),
  readFrom: z.string().optional(),
  validation: formFieldValidationSchema.optional(),
  columnSpan: z.union([z.literal(1), z.literal(2)]).optional(),
});

export const formDefSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().max(240).optional(),
  productIds: z.array(z.string()).optional(),
  fields: z.array(formFieldSchema).min(1),
  submitLabel: z.string().min(1).max(60),
  resultField: z.string().optional(),
  statusFromField: z.string().optional(),
});

export const transformerDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  inputs: z.array(z.string()).min(1),
  output: z.string().min(1),
  expression: z.string().min(1),
});

export const aqdefMappingSchema = z.object({
  part: z.record(z.string(), z.string()),
  characteristic: z.record(z.string(), z.string()),
  measurement: z.record(z.string(), z.string()),
});

export const spcConfigSchema = z.object({
  defaultChartType: z.enum(['i-mr', 'xbar-r', 'xbar-s']),
  enabledNelsonRules: z
    .array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
    .min(0),
  subgroupSize: z.number().int().min(1).max(25),
  capabilityThresholds: z.object({
    excellent: z.number().positive(),
    good: z.number().positive(),
    marginal: z.number().positive(),
  }),
});

export const tenantConfigSchema = z.object({
  version: z.number().int().min(1),
  tenantId: z.string().min(1),
  tenantName: z.string().min(1),
  locale: z.string().min(2),
  labels: z.record(z.string(), z.string()),
  aqdefMapping: aqdefMappingSchema,
  forms: z.record(z.string(), formDefSchema),
  transformers: z.record(z.string(), transformerDefSchema),
  spc: spcConfigSchema,
  domain: z.record(z.string(), z.unknown()),
});

export type TenantConfigParsed = z.infer<typeof tenantConfigSchema>;
