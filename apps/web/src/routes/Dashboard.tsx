import { Link } from 'react-router-dom';
import { useTenantConfig, useProducts } from '../api/hooks';
import type { ProductDto } from '../api/types';
import { lines, productLineAssignment } from '../demo/static';
import { label } from '@p4-spc/config-sdk';
import { StatusBadge } from '../components/StatusBadge';
import { useProductMeasurements } from '../api/hooks';

function statusFor(volume: number, lsl: number | null, usl: number | null): 'ok' | 'warning' | 'reject' {
  if (typeof lsl !== 'number' || typeof usl !== 'number') return 'ok';
  if (volume < lsl || volume > usl) return 'reject';
  const margin = (usl - lsl) * 0.1;
  if (volume < lsl + margin || volume > usl - margin) return 'warning';
  return 'ok';
}

function LineTile({ lineId, product }: { lineId: string; product: ProductDto | undefined }) {
  const line = lines.find((l) => l.id === lineId);
  const { data: measurements } = useProductMeasurements(product?.id);
  if (!line) return null;
  const latest = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : undefined;
  const char = product?.characteristic;
  const status = latest && char ? statusFor(latest.value, char.lsl, char.usl) : 'ok';
  return (
    <Link
      to={product ? `/products/${product.id}` : '/products'}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">{line.id}</div>
          <div className="font-medium text-slate-900 mt-0.5">{line.name}</div>
        </div>
        {latest && <StatusBadge status={status} />}
      </div>
      {product && latest && char && (
        <div className="mt-3 text-sm text-slate-600">
          <div>
            <span className="text-slate-500">SAP ID:</span>{' '}
            <span className="font-mono">{product.partNumber}</span>
          </div>
          <div>
            <span className="text-slate-500">Poslední hodnota:</span>{' '}
            <span className="font-mono font-semibold text-slate-900">
              {latest.value.toFixed(2)} {char.unit ?? ''}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}

function LabTile() {
  const line = lines.find((l) => l.id === 'LAB');
  if (!line) return null;
  return (
    <Link
      to="/lab"
      className="block bg-slate-900 text-white border border-slate-900 rounded-lg p-4 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">LAB</div>
          <div className="font-medium mt-0.5">{line.name}</div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-200">
          hustota
        </span>
      </div>
      <div className="mt-3 text-sm text-slate-300">
        Hustota z laboratoře se propaguje do výpočtu objemu u každého měření z váhy.
      </div>
    </Link>
  );
}

export function DashboardPage(): React.ReactElement {
  const { data: tenant, isLoading: loadingConfig } = useTenantConfig();
  const { data: products, isLoading: loadingProducts } = useProducts();

  if (loadingConfig || loadingProducts || !tenant || !products) {
    return <div className="text-slate-500 text-sm">Načítám…</div>;
  }

  const prodByLine: Record<string, ProductDto | undefined> = {};
  for (const [productKey, lineId] of Object.entries(productLineAssignment)) {
    prodByLine[lineId] = products.find((p) =>
      p.partNumber.includes(productKey.replace('prod-', '').toUpperCase()),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Přehled provozu</h1>
        <p className="text-sm text-slate-600 mt-1">
          Pivovar má 4 výrobní linky a laboratoř. Stáčené lahve jsou váženy na dvou typech vah;
          hustota pro převod hmotnost → objem se aktualizuje z laboratoře. Nominál každého produktu je{' '}
          {products[0]?.characteristic?.nominal ?? 500} ml.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Data: config z control-plane DB (v{tenant.version}), produkty + měření z tenant data-plane DB.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Linky a laboratoř
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lines.filter((l) => l.kind === 'production').map((l) => (
            <LineTile key={l.id} lineId={l.id} product={prodByLine[l.id]} />
          ))}
          <LabTile />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Produkty
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-2">{label(tenant.config, 'partNumber')}</th>
                <th className="px-4 py-2">{label(tenant.config, 'description')}</th>
                <th className="px-4 py-2">Plato</th>
                <th className="px-4 py-2 text-right">{label(tenant.config, 'nominal')}</th>
                <th className="px-4 py-2 text-right">Spec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const meta = p.metadata;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-900">
                      <Link to={`/products/${p.id}`} className="text-blue-700 hover:underline">
                        {p.partNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-900">{p.description}</td>
                    <td className="px-4 py-2 font-mono">{meta.plato ? `${meta.plato}°` : '—'}</td>
                    <td className="px-4 py-2 font-mono text-right">
                      {p.characteristic?.nominal} {p.characteristic?.unit}
                    </td>
                    <td className="px-4 py-2 font-mono text-right text-slate-600">
                      {p.characteristic?.lsl}–{p.characteristic?.usl}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
