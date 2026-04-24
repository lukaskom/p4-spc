import { z } from 'zod';
import { measurementStatusSchema } from './enums.js';

export const newMeasurementSchema = z.object({
  characteristicId: z.string().uuid(),
  value: z.number().finite(),
  status: measurementStatusSchema.optional(),
  measuredAt: z.coerce.date(),
  operatorId: z.string().max(40).optional(),
  machineId: z.string().max(40).optional(),
  gageId: z.string().max(40).optional(),
  batchId: z.string().uuid().optional(),
  aqdefKFields: z.record(z.string(), z.unknown()).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

export type NewMeasurementInput = z.input<typeof newMeasurementSchema>;
export type NewMeasurementParsed = z.output<typeof newMeasurementSchema>;

export const measurementBatchInputSchema = z.object({
  characteristicId: z.string().uuid(),
  subgroupSize: z.number().int().min(1).max(25),
  collectedAt: z.coerce.date(),
  measurements: z.array(newMeasurementSchema).min(1),
});
export type MeasurementBatchInput = z.input<typeof measurementBatchInputSchema>;
export type MeasurementBatchParsed = z.output<typeof measurementBatchInputSchema>;
