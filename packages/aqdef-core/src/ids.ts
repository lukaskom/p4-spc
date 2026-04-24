declare const brand: unique symbol;

type Brand<TValue, TBrand> = TValue & { readonly [brand]: TBrand };

export type PartId = Brand<string, 'PartId'>;
export type CharacteristicId = Brand<string, 'CharacteristicId'>;
export type MeasurementId = Brand<string, 'MeasurementId'>;
export type MeasurementBatchId = Brand<string, 'MeasurementBatchId'>;
export type CatalogId = Brand<string, 'CatalogId'>;
export type TenantId = Brand<string, 'TenantId'>;

export const asPartId = (v: string): PartId => v as PartId;
export const asCharacteristicId = (v: string): CharacteristicId => v as CharacteristicId;
export const asMeasurementId = (v: string): MeasurementId => v as MeasurementId;
export const asMeasurementBatchId = (v: string): MeasurementBatchId => v as MeasurementBatchId;
export const asCatalogId = (v: string): CatalogId => v as CatalogId;
export const asTenantId = (v: string): TenantId => v as TenantId;
