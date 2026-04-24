import type { TenantConfig } from '@p4-spc/config-sdk';

export interface TenantConfigResponse {
  readonly organizationId: string;
  readonly version: number;
  readonly config: TenantConfig;
}

export interface ProductDto {
  readonly id: string;
  readonly partNumber: string;
  readonly description: string | null;
  readonly variant: string | null;
  readonly metadata: {
    plato?: number;
    referenceDensity?: number;
    [key: string]: unknown;
  };
  readonly characteristic: {
    id: string;
    code: string;
    description: string | null;
    unit: string | null;
    nominal: number | null;
    target: number | null;
    lsl: number | null;
    usl: number | null;
  } | null;
}

export interface MeasurementDto {
  readonly id: string;
  readonly characteristicId: string;
  readonly value: number;
  readonly status: number;
  readonly measuredAt: string;
  readonly operatorId: string | null;
  readonly machineId: string | null;
  readonly gageId: string | null;
  readonly aqdefKFields: Record<string, unknown>;
  readonly extensions: {
    mass?: number;
    density?: number;
    [key: string]: unknown;
  };
}

export const TENANT_SLUG = 'demo-brewery';
