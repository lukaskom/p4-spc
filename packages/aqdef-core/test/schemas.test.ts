import { describe, expect, it } from 'vitest';
import {
  CharacteristicType,
  MeasurementStatus,
  ToleranceType,
  newCharacteristicSchema,
  newMeasurementSchema,
  newPartSchema,
} from '../src/index.js';

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

describe('newPartSchema', () => {
  it('accepts minimal valid input', () => {
    const result = newPartSchema.parse({ partNumber: 'P-100' });
    expect(result.partNumber).toBe('P-100');
  });

  it('rejects empty partNumber', () => {
    expect(() => newPartSchema.parse({ partNumber: '' })).toThrow();
  });

  it('rejects partNumber longer than 40 chars', () => {
    expect(() => newPartSchema.parse({ partNumber: 'x'.repeat(41) })).toThrow();
  });
});

describe('newCharacteristicSchema', () => {
  it('accepts variable characteristic with spec limits', () => {
    const result = newCharacteristicSchema.parse({
      partId: UUID_A,
      code: 'DIM-1',
      type: CharacteristicType.Variable,
      nominal: 10,
      lowerSpecLimit: 9.9,
      upperSpecLimit: 10.1,
      toleranceType: ToleranceType.TwoSided,
      unit: 'mm',
      decimals: 3,
    });
    expect(result.type).toBe(CharacteristicType.Variable);
  });

  it('rejects when LSL >= USL', () => {
    expect(() =>
      newCharacteristicSchema.parse({
        partId: UUID_A,
        code: 'DIM-1',
        type: CharacteristicType.Variable,
        lowerSpecLimit: 10,
        upperSpecLimit: 9,
      }),
    ).toThrow(/lowerSpecLimit must be less than upperSpecLimit/);
  });

  it('accepts attribute characteristic without spec limits', () => {
    const result = newCharacteristicSchema.parse({
      partId: UUID_A,
      code: 'VIS-DEFECT',
      type: CharacteristicType.Attribute,
    });
    expect(result.type).toBe(CharacteristicType.Attribute);
  });
});

describe('newMeasurementSchema', () => {
  it('coerces ISO string to Date', () => {
    const result = newMeasurementSchema.parse({
      characteristicId: UUID_B,
      value: 10.023,
      measuredAt: '2026-04-24T12:30:00Z',
    });
    expect(result.measuredAt).toBeInstanceOf(Date);
    expect(result.measuredAt.toISOString()).toBe('2026-04-24T12:30:00.000Z');
  });

  it('defaults optional fields to undefined (not present)', () => {
    const result = newMeasurementSchema.parse({
      characteristicId: UUID_B,
      value: 10,
      measuredAt: new Date(),
    });
    expect(result.status).toBeUndefined();
    expect(result.operatorId).toBeUndefined();
  });

  it('accepts status from MeasurementStatus enum', () => {
    const result = newMeasurementSchema.parse({
      characteristicId: UUID_B,
      value: 10,
      status: MeasurementStatus.InvalidValue,
      measuredAt: new Date(),
    });
    expect(result.status).toBe(MeasurementStatus.InvalidValue);
  });

  it('rejects non-finite values', () => {
    expect(() =>
      newMeasurementSchema.parse({
        characteristicId: UUID_B,
        value: Number.POSITIVE_INFINITY,
        measuredAt: new Date(),
      }),
    ).toThrow();
  });
});
