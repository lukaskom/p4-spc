import { z } from 'zod';
import { characteristicTypeSchema, toleranceTypeSchema } from './enums.js';

export const newCharacteristicSchema = z
  .object({
    partId: z.string().uuid(),
    code: z.string().min(1).max(40),
    description: z.string().max(80).optional(),
    type: characteristicTypeSchema,
    unit: z.string().max(20).optional(),
    decimals: z.number().int().min(0).max(10).optional(),
    nominal: z.number().finite().optional(),
    target: z.number().finite().optional(),
    lowerSpecLimit: z.number().finite().optional(),
    upperSpecLimit: z.number().finite().optional(),
    toleranceType: toleranceTypeSchema.optional(),
    group: z.string().max(40).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (c) =>
      c.lowerSpecLimit === undefined ||
      c.upperSpecLimit === undefined ||
      c.lowerSpecLimit < c.upperSpecLimit,
    { message: 'lowerSpecLimit must be less than upperSpecLimit', path: ['lowerSpecLimit'] },
  );

export type NewCharacteristicInput = z.input<typeof newCharacteristicSchema>;
export type NewCharacteristicParsed = z.output<typeof newCharacteristicSchema>;
