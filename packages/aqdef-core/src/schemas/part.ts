import { z } from 'zod';

export const newPartSchema = z.object({
  partNumber: z.string().min(1).max(40),
  description: z.string().max(80).optional(),
  abbreviation: z.string().max(20).optional(),
  drawingNumber: z.string().max(40).optional(),
  variant: z.string().max(40).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type NewPartInput = z.input<typeof newPartSchema>;
export type NewPartParsed = z.output<typeof newPartSchema>;

export const partSchema = newPartSchema.extend({
  id: z.string().uuid(),
  metadata: z.record(z.unknown()),
});
export type PartInput = z.input<typeof partSchema>;
export type PartParsed = z.output<typeof partSchema>;
