import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from './client';
import { TENANT_SLUG, type MeasurementDto, type ProductDto, type TenantConfigResponse } from './types';
import type { TenantConfig } from '@p4-spc/config-sdk';

export function useTenantConfig() {
  return useQuery({
    queryKey: ['tenant-config', TENANT_SLUG],
    queryFn: () => apiGet<TenantConfigResponse>(`/tenants/${TENANT_SLUG}/config`),
    staleTime: 10_000,
  });
}

export function usePutTenantConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: TenantConfig) =>
      apiPut<{ version: number }>(`/tenants/${TENANT_SLUG}/config`, config),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tenant-config', TENANT_SLUG] });
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products', TENANT_SLUG],
    queryFn: () => apiGet<ProductDto[]>(`/tenants/${TENANT_SLUG}/products`),
    staleTime: 30_000,
  });
}

export function useProductMeasurements(partId: string | undefined) {
  return useQuery({
    queryKey: ['measurements', TENANT_SLUG, partId],
    queryFn: () => apiGet<MeasurementDto[]>(`/tenants/${TENANT_SLUG}/products/${partId}/measurements`),
    enabled: Boolean(partId),
    staleTime: 30_000,
  });
}
