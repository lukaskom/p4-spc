import type { CharacteristicId, PartId } from '../ids.js';
import type { CharacteristicType, ToleranceType } from './enums.js';

export interface Characteristic {
  id: CharacteristicId;
  partId: PartId;
  code: string;
  description?: string | undefined;
  type: CharacteristicType;
  unit?: string | undefined;
  decimals?: number | undefined;
  nominal?: number | undefined;
  target?: number | undefined;
  lowerSpecLimit?: number | undefined;
  upperSpecLimit?: number | undefined;
  toleranceType?: ToleranceType | undefined;
  group?: string | undefined;
  metadata: Readonly<Record<string, unknown>>;
}

export interface NewCharacteristic {
  partId: PartId;
  code: string;
  description?: string | undefined;
  type: CharacteristicType;
  unit?: string | undefined;
  decimals?: number | undefined;
  nominal?: number | undefined;
  target?: number | undefined;
  lowerSpecLimit?: number | undefined;
  upperSpecLimit?: number | undefined;
  toleranceType?: ToleranceType | undefined;
  group?: string | undefined;
  metadata?: Readonly<Record<string, unknown>>;
}
