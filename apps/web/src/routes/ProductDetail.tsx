import { Link, useParams } from 'react-router-dom';
import { findLine, findProduct, findScale, productLineAssignment } from '../demo/brewery';
import { measurementsByProduct, latestDensity } from '../demo/measurements';
import { breweryTenant, label } from '../demo/tenant-config';
import { checkNelson, iMRLimits } from '@p4-spc/spc-engine';
import { ShewhartChart } from '../components/ShewhartChart';
import { CapabilityCard } from '../components/CapabilityCard';
import { StatusBadge } from '../components/StatusBadge';

function fmtCs(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const product = id ? findProduct(id) : undefined;
  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Produkt nenalezen.</p>
        <Link to="/products" className="text-blue-700 hover:underline">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const lineId = productLineAssignment[product.id];
  const line = lineId ? findLine(lineId) : undefined;
  const measurements = measurementsByProduct[product.id] ?? [];
  const values = measurements.map((m) => m.volumeMl);
  const timestamps = measurements.map((m) => m.measuredAt);

  const limits = values.length >= 2 ? iMRLimits({ values }) : null;
  const sigmaEstimate = limits ? limits.mrBar / 1.128 : 1;
  const nelson =
    limits && values.length >= 9
      ? checkNelson(values, { center: limits.individuals.center, sigma: sigmaEstimate })
      : null;

  const density = latestDensity(product.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/products" className="text-xs text-blue-700 hover:underline">
            ← Produkty
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{product.description}</h1>
          <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <span className="text-slate-500">{label(breweryTenant, 'partNumber')}:</span>{' '}
              <span className="font-mono text-slate-900">{product.sapId}</span>
            </span>
            <span>
              <span className="text-slate-500">Extrakt:</span>{' '}
              <span className="font-mono">{product.plato}° Plato</span>
            </span>
            <span>
              <span className="text-slate-500">{label(breweryTenant, 'line')}:</span>{' '}
              <span>{line?.name ?? '—'}</span>
            </span>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Specifikace</div>
          <div className="font-mono">
            {product.nominalMl} ml <span className="text-slate-500">nominál</span>
          </div>
          <div className="font-mono text-xs text-slate-500">
            LSL {product.lslMl} · USL {product.uslMl} ml
          </div>
        </div>
      </div>

      {nelson && nelson.violations.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-rose-800 font-semibold">
              ⚠ Detekováno {nelson.violations.length} porušení Nelson pravidel
            </div>
          </div>
          <ul className="mt-2 text-sm text-rose-900 list-disc ml-6 space-y-0.5">
            {nelson.violations.slice(0, 6).map((v, i) => (
              <li key={i}>
                Pravidlo {v.rule}: {v.description} (body {v.startIndex + 1}–{v.endIndex + 1})
              </li>
            ))}
          </ul>
        </div>
      )}

      {limits && (
        <ShewhartChart
          title={`I-MR regulační diagram — objem [ml]`}
          timestamps={timestamps}
          values={values}
          center={limits.individuals.center}
          ucl={limits.individuals.ucl}
          lcl={limits.individuals.lcl}
          lsl={product.lslMl}
          usl={product.uslMl}
          violations={nelson?.violations ?? []}
          unit="ml"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CapabilityCard
          values={values}
          subgroupSize={5}
          lsl={product.lslMl}
          usl={product.uslMl}
          target={product.nominalMl}
          tenant={breweryTenant}
        />
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Aktuální laboratoř</h3>
          {density ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Hustota</span>
                <span className="font-mono font-semibold">
                  {density.densityGPerMl.toFixed(4)} g/ml
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referenční hustota</span>
                <span className="font-mono">{product.referenceDensityGPerMl.toFixed(4)} g/ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Měřil</span>
                <span>{density.operator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kdy</span>
                <span>{fmtCs(density.measuredAt)}</span>
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Hustota z laboratoře se používá pro převod hmotnost → objem (= hmotnost / hustota).
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Žádná lab měření.</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Poslední měření
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-2">{label(breweryTenant, 'measuredAt')}</th>
                <th className="px-4 py-2">{label(breweryTenant, 'operator')}</th>
                <th className="px-4 py-2">{label(breweryTenant, 'gage')}</th>
                <th className="px-4 py-2 text-right">Hmotnost [g]</th>
                <th className="px-4 py-2 text-right">Hustota [g/ml]</th>
                <th className="px-4 py-2 text-right">Objem [ml]</th>
                <th className="px-4 py-2">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements
                .slice(-12)
                .reverse()
                .map((m) => {
                  const scale = findScale(m.gage);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-600">{fmtCs(m.measuredAt)}</td>
                      <td className="px-4 py-2 text-slate-900">{m.operator}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {m.gage}{' '}
                        {scale && <span className="text-xs text-slate-400">({scale.model})</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-right">{m.massG.toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono text-right">
                        {m.densityGPerMl.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 font-mono text-right font-semibold">
                        {m.volumeMl.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={m.status} />
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
