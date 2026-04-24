import type { TenantConfig } from './types.js';

export function label(config: TenantConfig, key: string): string {
  return config.labels[key] ?? key;
}

export function capabilityLevel(
  config: TenantConfig,
  value: number | null,
): 'excellent' | 'good' | 'marginal' | 'poor' | 'unknown' {
  if (value === null || !Number.isFinite(value)) return 'unknown';
  const t = config.spc.capabilityThresholds;
  if (value >= t.excellent) return 'excellent';
  if (value >= t.good) return 'good';
  if (value >= t.marginal) return 'marginal';
  return 'poor';
}
