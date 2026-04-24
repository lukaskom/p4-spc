import { Link, useParams } from 'react-router-dom';
import { useProducts, useProductMeasurements, useTenantConfig } from '../api/hooks';
import { findScale, lineForSapId, lines } from '../demo/static';
import { generateDensityReadings, latestDensity } from '../demo/lab';
import { checkNelson, iMRLimits } from '@p4-spc/spc-engine';
import { label } from '@p4-spc/config-sdk';
import { ShewhartChart } from '../components/ShewhartChart';
import { CapabilityCard } from '../components/CapabilityCard';
import { StatusBadge } from '../components/StatusBadge';
import { useMemo } from 'react';

function fmtCs(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(n: number): 'ok' | 'warning' | 'reject' {
  if (n === 0) return 'ok';
  if (n === 14) return 'reject';
  return 'warning';
}

export function ProductDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { data: tenant } = useTenantConfig();
  const { data: products } = useProducts();
  const { data: measurements } = useProductMeasurements(id);

  const densityReadings = useMemo(() => (products ? generateDensityReadings(products) : {}), [products]);

  if (!tenant || !products || !measurements) {
    return <div className="text-slate-500 text-sm">Načítám…</div>;
  }

  const product = products.find((p) => p.id === id);
  if (!product || !product.characteristic) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Produkt nenalezen.</p>
        <Link to="/products" className="text-blue-700 hover:underline">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const char = product.characteristic;
  const lineId = lineForSapId(product.partNumber);
  const line = lineId ? lines.find((l) => l.id === lineId) : undefined;
  const values = measurements.map((m) => m.value);
  const timestamps = measurements.map((m) => m.measuredAt);

  const limits = values.length >= 2 ? iMRLimits({ values }) : null;
  const sigmaEstimate = limits ? limits.mrBar / 1.128 : 1;
  const nelson =
    limits && values.length >= 9
      ? checkNelson(values, { center: limits.individuals.center, sigma: sigmaEstimate }, {
          rules: tenant.config.spc.enabledNelsonRules,
        })
      : null;

  const density = latestDensity(densityReadings[product.id]);

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
              <span className="text-slate-500">{label(tenant.config, 'partNumber')}:</span>{' '}
              <span className="font-mono text-slate-900">{product.partNumber}</span>
            </span>
            {product.metadata.plato !== undefined && (
              <span>
                <span className="text-slate-500">Extrakt:</span>{' '}
                <span className="font-mono">{String(product.metadata.plato)}° Plato</span>
              </span>
            )}
            <span>
              <span className="text-slate-500">{label(tenant.config, 'line')}:</span>{' '}
              <span>{line?.name ?? '—'}</span>
            </span>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Specifikace</div>
          <div className="font-mono">
            {char.nominal} {char.unit} <span className="text-slate-500">nominál</span>
          </div>
          <div className="font-mono text-xs text-slate-500">
            LSL {char.lsl} · USL {char.usl} {char.unit}
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
          title={`I-MR regulační diagram — ${label(tenant.config, 'volume')} [${char.unit ?? ''}]`}
          timestamps={timestamps}
          values={values}
          center={limits.individuals.center}
          ucl={limits.individuals.ucl}
          lcl={limits.individuals.lcl}
          lsl={char.lsl ?? undefined}
          usl={char.usl ?? undefined}
          violations={nelson?.violations ?? []}
          unit={char.unit ?? ''}
        />
      )}

      {char.lsl !== null && char.usl !== null && char.target !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CapabilityCard
            values={values}
            lsl={char.lsl}
            usl={char.usl}
            target={char.target}
            tenant={tenant.config}
          />
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Aktuální laboratoř</h3>
            {density ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{label(tenant.config, 'density')}</span>
                  <span className="font-mono font-semibold">
                    {density.densityGPerMl.toFixed(4)} g/ml
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Referenční hustota</span>
                  <span className="font-mono">
                    {(product.metadata.referenceDensity as number | undefined)?.toFixed(4)} g/ml
                  </span>
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
      )}

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Poslední měření
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-2">{label(tenant.config, 'measuredAt')}</th>
                <th className="px-4 py-2">{label(tenant.config, 'operator')}</th>
                <th className="px-4 py-2">{label(tenant.config, 'gage')}</th>
                <th className="px-4 py-2 text-right">{label(tenant.config, 'mass')} [g]</th>
                <th className="px-4 py-2 text-right">{label(tenant.config, 'density')} [g/ml]</th>
                <th className="px-4 py-2 text-right">
                  {label(tenant.config, 'volume')} [{char.unit ?? ''}]
                </th>
                <th className="px-4 py-2">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements
                .slice(-12)
                .reverse()
                .map((m) => {
                  const scale = m.gageId ? findScale(m.gageId) : undefined;
                  const mass = m.extensions.mass;
                  const density = m.extensions.density;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-600">{fmtCs(m.measuredAt)}</td>
                      <td className="px-4 py-2 text-slate-900">{m.operatorId ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {m.gageId}{' '}
                        {scale && <span className="text-xs text-slate-400">({scale.model})</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-right">
                        {typeof mass === 'number' ? mass.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-right">
                        {typeof density === 'number' ? density.toFixed(4) : '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-right font-semibold">
                        {m.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={statusLabel(m.status)} />
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
