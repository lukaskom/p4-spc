import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from './client';
import { TENANT_SLUG } from './types';

export interface CatalogItemDto {
  id: string;
  code: string;
  label: string;
  order: number;
  active: boolean;
}

export interface CatalogDto {
  id: string;
  key: string;
  name: string;
  scope: 'aqdef' | 'spc' | 'tenant';
  version: number;
  isSystem: boolean;
  items: CatalogItemDto[];
}

const CATALOGS_KEY = ['catalogs', TENANT_SLUG] as const;

export function useCatalogs() {
  return useQuery({
    queryKey: CATALOGS_KEY,
    queryFn: () => apiGet<CatalogDto[]>(`/tenants/${TENANT_SLUG}/catalogs`),
    staleTime: 30_000,
  });
}

const BASE_URL =
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? 'http://localhost:3100';

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      detail = await res.json();
    } catch {
      /* noop */
    }
    throw new Error(`POST ${path} failed: ${res.status} ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as T;
}

async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function usePutCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      name,
      items,
    }: {
      key: string;
      name?: string;
      items: Array<{ code: string; label: string; order?: number; active?: boolean }>;
    }) =>
      apiPut<{ ok: true; itemCount: number }>(`/tenants/${TENANT_SLUG}/catalogs/${key}`, {
        name,
        items,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CATALOGS_KEY });
    },
  });
}

export function useCreateCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      key: string;
      name: string;
      scope: 'aqdef' | 'spc' | 'tenant';
      items: Array<{ code: string; label: string; order?: number; active?: boolean }>;
    }) => apiPost<{ id: string; key: string }>(`/tenants/${TENANT_SLUG}/catalogs`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CATALOGS_KEY });
    },
  });
}

export function useDeleteCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => apiDelete<{ ok: true }>(`/tenants/${TENANT_SLUG}/catalogs/${key}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CATALOGS_KEY });
    },
  });
}
