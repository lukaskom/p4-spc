import { Link } from 'react-router-dom';
import { findLine, findScale, products, productLineAssignment } from '../demo/brewery';
import { breweryTenant, label } from '../demo/tenant-config';

export function ProductsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Produkty</h1>
        <p className="text-sm text-slate-600 mt-1">
          Evidence 4 produktů pivovaru. Kliknutím na {label(breweryTenant, 'partNumber')} se dostaneš na
          regulační diagram a detail měření.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2">{label(breweryTenant, 'partNumber')}</th>
              <th className="px-4 py-2">{label(breweryTenant, 'description')}</th>
              <th className="px-4 py-2">Plato</th>
              <th className="px-4 py-2 text-right">{label(breweryTenant, 'nominal')}</th>
              <th className="px-4 py-2 text-right">LSL</th>
              <th className="px-4 py-2 text-right">USL</th>
              <th className="px-4 py-2">{label(breweryTenant, 'line')}</th>
              <th className="px-4 py-2">{label(breweryTenant, 'gage')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const lineId = productLineAssignment[p.id];
              const line = lineId ? findLine(lineId) : undefined;
              const scale = line?.scaleId ? findScale(line.scaleId) : undefined;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono">
                    <Link to={`/products/${p.id}`} className="text-blue-700 hover:underline">
                      {p.sapId}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-900">{p.description}</td>
                  <td className="px-4 py-2 font-mono">{p.plato}°</td>
                  <td className="px-4 py-2 font-mono text-right">{p.nominalMl} ml</td>
                  <td className="px-4 py-2 font-mono text-right text-slate-600">{p.lslMl}</td>
                  <td className="px-4 py-2 font-mono text-right text-slate-600">{p.uslMl}</td>
                  <td className="px-4 py-2 text-slate-600">{line?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {scale ? `${scale.id} — ${scale.manufacturer} ${scale.model}` : '—'}
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
