import { Link } from 'react-router-dom';
import { findScale, lines, productLineAssignment, products } from '../demo/brewery';
import { latestMeasurement, measurementsByProduct } from '../demo/measurements';
import { breweryTenant, label } from '../demo/tenant-config';
import { checkNelson } from '@p4-spc/spc-engine';
import { StatusBadge } from '../components/StatusBadge';

function countRecent(productId: string, windowMin = 60): number {
  const list = measurementsByProduct[productId] ?? [];
  const cutoff = Date.now() - windowMin * 60_000;
  return list.filter((m) => new Date(m.measuredAt).getTime() >= cutoff).length;
}

function lineTile(lineId: string): React.ReactElement {
  const line = lines.find((l) => l.id === lineId);
  if (!line) return <></>;
  const productEntry = Object.entries(productLineAssignment).find(([, l]) => l === lineId);
  const productId = productEntry?.[0];
  const product = productId ? products.find((p) => p.id === productId) : undefined;
  const latest = productId ? latestMeasurement(productId) : undefined;
  const values = productId ? (measurementsByProduct[productId] ?? []).map((m) => m.volumeMl) : [];
  const center = product ? product.nominalMl : 0;
  const sigma = Math.max(
    (values.reduce((a, b) => a + (b - center) ** 2, 0) / Math.max(values.length - 1, 1)) ** 0.5,
    0.01,
  );
  const nelson = values.length >= 9 ? checkNelson(values, { center, sigma }) : null;
  const hasIssue = nelson && nelson.violations.length > 0;
  return (
    <Link
      key={lineId}
      to={product ? `/products/${product.id}` : '/products'}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">{line.id}</div>
          <div className="font-medium text-slate-900 mt-0.5">{line.name}</div>
        </div>
        {hasIssue ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 ring-1 ring-rose-200">
            Nelson
          </span>
        ) : latest ? (
          <StatusBadge status={latest.status} />
        ) : null}
      </div>
      {product && latest && (
        <div className="mt-3 text-sm text-slate-600">
          <div>
            <span className="text-slate-500">{label(breweryTenant, 'partNumber')}:</span>{' '}
            <span className="font-mono">{product.sapId}</span>
          </div>
          <div>
            <span className="text-slate-500">Poslední hodnota:</span>{' '}
            <span className="font-mono font-semibold text-slate-900">
              {latest.volumeMl.toFixed(2)} ml
            </span>
          </div>
          <div>
            <span className="text-slate-500">Za 60 min:</span>{' '}
            <span className="font-mono">{countRecent(product.id, 60)}× měřeno</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function labTile(): React.ReactElement {
  const line = lines.find((l) => l.id === 'LAB');
  if (!line) return <></>;
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
        <div>Hustota v g/ml z lab aktualizuje referenci pro každý produkt.</div>
        <div className="mt-1 text-slate-400 text-xs">Konverze: objem = hmotnost / hustota</div>
      </div>
    </Link>
  );
}

function fmtPercent(value: number): string {
  return (value * 100).toFixed(1) + ' %';
}

export function DashboardPage(): React.ReactElement {
  const totalMeasurements = Object.values(measurementsByProduct).reduce(
    (n, list) => n + list.length,
    0,
  );
  const rejectRate = (() => {
    let total = 0;
    let rejects = 0;
    for (const list of Object.values(measurementsByProduct)) {
      for (const m of list) {
        total++;
        if (m.status === 'reject') rejects++;
      }
    }
    return total > 0 ? rejects / total : 0;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Přehled provozu</h1>
        <p className="text-sm text-slate-600 mt-1">
          Pivovar má 4 výrobní linky a laboratoř. Stáčené lahve jsou váženy na dvou typech vah
          (Mettler, Sartorius); hustota pro převod hmotnost → objem se aktualizuje z laboratoře.
          Nominál každého produktu je {products[0]?.nominalMl} ml.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Měření celkem</div>
          <div className="text-3xl font-semibold text-slate-900 font-mono mt-1">
            {totalMeasurements}
          </div>
          <div className="text-xs text-slate-500 mt-1">napříč {products.length} produkty</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Podíl vadných</div>
          <div
            className={
              'text-3xl font-semibold font-mono mt-1 ' +
              (rejectRate > 0.03 ? 'text-rose-700' : 'text-emerald-700')
            }
          >
            {fmtPercent(rejectRate)}
          </div>
          <div className="text-xs text-slate-500 mt-1">hodnot mimo toleranci</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Aktivní linky</div>
          <div className="text-3xl font-semibold text-slate-900 font-mono mt-1">
            {lines.filter((l) => l.kind === 'production').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">+ 1 laboratoř</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Linky a laboratoř
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lines.filter((l) => l.kind === 'production').map((l) => lineTile(l.id))}
          {labTile()}
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
                <th className="px-4 py-2">{label(breweryTenant, 'partNumber')}</th>
                <th className="px-4 py-2">{label(breweryTenant, 'description')}</th>
                <th className="px-4 py-2">Plato</th>
                <th className="px-4 py-2 text-right">{label(breweryTenant, 'nominal')}</th>
                <th className="px-4 py-2 text-right">Spec</th>
                <th className="px-4 py-2">Linka</th>
                <th className="px-4 py-2 text-right">Poslední</th>
                <th className="px-4 py-2">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const latest = latestMeasurement(p.id);
                const lineId = productLineAssignment[p.id];
                const line = lineId ? lines.find((l) => l.id === lineId) : undefined;
                const scale = line?.scaleId ? findScale(line.scaleId) : undefined;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-900">
                      <Link to={`/products/${p.id}`} className="text-blue-700 hover:underline">
                        {p.sapId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-900">{p.description}</td>
                    <td className="px-4 py-2 font-mono">{p.plato}°</td>
                    <td className="px-4 py-2 font-mono text-right">{p.nominalMl} ml</td>
                    <td className="px-4 py-2 font-mono text-right text-slate-600">
                      {p.lslMl}–{p.uslMl}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {line?.name}{' '}
                      {scale && (
                        <span className="text-xs text-slate-400">({scale.manufacturer})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-right">
                      {latest ? latest.volumeMl.toFixed(2) + ' ml' : '—'}
                    </td>
                    <td className="px-4 py-2">{latest && <StatusBadge status={latest.status} />}</td>
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
