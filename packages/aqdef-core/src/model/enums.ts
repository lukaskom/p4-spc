export const CharacteristicType = {
  Variable: 1,
  Attribute: 2,
} as const;
export type CharacteristicType = (typeof CharacteristicType)[keyof typeof CharacteristicType];

export const ToleranceType = {
  TwoSided: 0,
  OneSidedUpper: 1,
  OneSidedLower: 2,
  Natural: 3,
} as const;
export type ToleranceType = (typeof ToleranceType)[keyof typeof ToleranceType];

export const MeasurementStatus = {
  Ok: 0,
  InReworkRange: 1,
  ReworkRequired: 2,
  Scrap: 3,
  InvalidValue: 255,
} as const;
export type MeasurementStatus = (typeof MeasurementStatus)[keyof typeof MeasurementStatus];

export const CatalogScope = {
  Aqdef: 'aqdef',
  Spc: 'spc',
  Tenant: 'tenant',
} as const;
export type CatalogScope = (typeof CatalogScope)[keyof typeof CatalogScope];
