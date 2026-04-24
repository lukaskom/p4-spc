import type {
  CharacteristicId,
  MeasurementBatchId,
  MeasurementId,
} from '../ids.js';
import type { MeasurementStatus } from './enums.js';

export interface Measurement {
  id: MeasurementId;
  characteristicId: CharacteristicId;
  value: number;
  status: MeasurementStatus;
  measuredAt: Date;
  operatorId?: string | undefined;
  machineId?: string | undefined;
  gageId?: string | undefined;
  batchId?: MeasurementBatchId | undefined;
  aqdefKFields: Readonly<Record<string, unknown>>;
  extensions: Readonly<Record<string, unknown>>;
}

export interface NewMeasurement {
  characteristicId: CharacteristicId;
  value: number;
  status?: MeasurementStatus;
  measuredAt: Date;
  operatorId?: string | undefined;
  machineId?: string | undefined;
  gageId?: string | undefined;
  batchId?: MeasurementBatchId | undefined;
  aqdefKFields?: Readonly<Record<string, unknown>>;
  extensions?: Readonly<Record<string, unknown>>;
}

export interface MeasurementBatch {
  id: MeasurementBatchId;
  characteristicId: CharacteristicId;
  subgroupSize: number;
  collectedAt: Date;
}
