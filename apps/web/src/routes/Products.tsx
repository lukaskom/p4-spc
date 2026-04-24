import { Link } from 'react-router-dom';
import { useProducts, useTenantConfig } from '../api/hooks';
import { findScale, lineForSapId, lines } from '../demo/static';
import { label } from '@p4-spc/config-sdk';

export function ProductsPage(): React.ReactElement {
  const { data: tenant } = useTenantConfig();
  const { data: products } = useProducts();

  if (!tenant || !products) return <div className="text-slate-500 text-sm">Načítám…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Produkty</h1>
        <p className="text-sm text-slate-600 mt-1">
          Evidence produktů pivovaru. Kliknutím na {label(tenant.config, 'partNumber')} se dostaneš na
          regulační diagram a detail měření. Data načtena z tenant DB v reálném čase.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2">{label(tenant.config, 'partNumber')}</th>
              <th className="px-4 py-2">{label(tenant.config, 'description')}</th>
              <th className="px-4 py-2">Plato</th>
              <th className="px-4 py-2 text-right">{label(tenant.config, 'nominal')}</th>
              <th className="px-4 py-2 text-right">{label(tenant.config, 'lsl')}</th>
              <th className="px-4 py-2 text-right">{label(tenant.config, 'usl')}</th>
              <th className="px-4 py-2">{label(tenant.config, 'line')}</th>
              <th className="px-4 py-2">{label(tenant.config, 'gage')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const plato = p.metadata.plato;
              const lineId = lineForSapId(p.partNumber);
              const line = lineId ? lines.find((l) => l.id === lineId) : undefined;
              const scale = line?.scaleId ? findScale(line.scaleId) : undefined;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono">
                    <Link to={`/products/${p.id}`} className="text-blue-700 hover:underline">
                      {p.partNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-900">{p.description}</td>
                  <td className="px-4 py-2 font-mono">{plato ? `${plato}°` : '—'}</td>
                  <td className="px-4 py-2 font-mono text-right">
                    {p.characteristic?.nominal} {p.characteristic?.unit}
                  </td>
                  <td className="px-4 py-2 font-mono text-right text-slate-600">
                    {p.characteristic?.lsl}
                  </td>
                  <td className="px-4 py-2 font-mono text-right text-slate-600">
                    {p.characteristic?.usl}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{line?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {scale ? `${scale.id} — ${scale.manufacturer}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
