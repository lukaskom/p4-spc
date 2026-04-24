import { z } from 'zod';
import {
  CatalogScope,
  CharacteristicType,
  MeasurementStatus,
  ToleranceType,
} from '../model/enums.js';

export const characteristicTypeSchema = z.nativeEnum(CharacteristicType);
export const toleranceTypeSchema = z.nativeEnum(ToleranceType);
export const measurementStatusSchema = z.nativeEnum(MeasurementStatus);
export const catalogScopeSchema = z.nativeEnum(CatalogScope);
