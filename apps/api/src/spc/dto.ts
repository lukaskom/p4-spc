import { z } from 'zod';

export const controlLimitsRequestSchema = z
  .object({
    subgroups: z.array(z.array(z.number().finite()).min(1)).min(2).optional(),
    values: z.array(z.number().finite()).min(2).optional(),
  })
  .refine((d) => !!d.subgroups || !!d.values, {
    message: 'Either `subgroups` (for X-bar/R, X-bar/S) or `values` (for I-MR) must be provided',
  });
export type ControlLimitsRequest = z.infer<typeof controlLimitsRequestSchema>;

export const nelsonRequestSchema = z.object({
  values: z.array(z.number().finite()).min(1),
  center: z.number().finite(),
  sigma: z.number().positive().finite(),
  rules: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])).optional(),
});
export type NelsonRequest = z.infer<typeof nelsonRequestSchema>;

export const capabilityRequestSchema = z
  .object({
    subgroups: z.array(z.array(z.number().finite()).min(1)).min(2).optional(),
    values: z.array(z.number().finite()).min(2).optional(),
    lsl: z.number().finite().optional(),
    usl: z.number().finite().optional(),
    target: z.number().finite().optional(),
  })
  .refine((d) => !!d.subgroups || !!d.values, {
    message: 'Either `subgroups` or `values` must be provided',
  })
  .refine((d) => d.lsl !== undefined || d.usl !== undefined, {
    message: 'At least one of `lsl` or `usl` must be provided',
  });
export type CapabilityRequest = z.infer<typeof capabilityRequestSchema>;
