import { capability } from '@p4-spc/spc-engine';
import { label, capabilityLevel, type TenantConfig } from '@p4-spc/config-sdk';

interface CapabilityCardProps {
  readonly values: readonly number[];
  readonly subgroupSize?: number;
  readonly lsl: number;
  readonly usl: number;
  readonly target: number;
  readonly tenant: TenantConfig;
}

function chunk<T>(arr: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i + n <= arr.length; i += n) {
    out.push(arr.slice(i, i + n) as T[]);
  }
  return out;
}

function fmt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

function pillColor(level: 'excellent' | 'good' | 'marginal' | 'poor' | 'unknown'): string {
  switch (level) {
    case 'excellent':
      return 'bg-emerald-100 text-emerald-800';
    case 'good':
      return 'bg-lime-100 text-lime-800';
    case 'marginal':
      return 'bg-amber-100 text-amber-800';
    case 'poor':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function CapabilityCard({
  values,
  subgroupSize,
  lsl,
  usl,
  target,
  tenant,
}: CapabilityCardProps): React.ReactElement {
  const size = subgroupSize ?? tenant.spc.subgroupSize;
  const subgroups = chunk(values, size);
  const result = capability({ values, subgroups, lsl, usl, target });

  const items: Array<{ key: string; value: number | null }> = [
    { key: 'cp', value: result.cp },
    { key: 'cpk', value: result.cpk },
    { key: 'pp', value: result.pp },
    { key: 'ppk', value: result.ppk },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">Indexy způsobilosti</h3>
      <div className="grid grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.key} className="text-center">
            <div className={'inline-block px-2 py-1 rounded-md text-xs ' + pillColor(capabilityLevel(tenant, item.value))}>
              {label(tenant, item.key)}
            </div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
              {fmt(item.value)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>n={result.sampleCount}</span>
        <span>subgrupa: {size}</span>
        <span>σ within: {result.sigmaWithin?.toFixed(3) ?? '—'}</span>
        <span>σ overall: {result.sigmaOverall.toFixed(3)}</span>
        <span>
          spec: [{lsl}, {usl}]
        </span>
      </div>
    </div>
  );
}
