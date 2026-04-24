import { useMemo } from 'react';
import { useProducts, useTenantConfig } from '../api/hooks';
import { generateDensityReadings, latestDensity, volumeFromMassAndDensity } from '../demo/lab';
import { label } from '@p4-spc/config-sdk';

function fmtCs(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LabPage(): React.ReactElement {
  const { data: tenant } = useTenantConfig();
  const { data: products } = useProducts();
  const sampleMass = 520;

  const densityReadings = useMemo(() => (products ? generateDensityReadings(products) : {}), [products]);

  if (!tenant || !products) return <div className="text-slate-500 text-sm">Načítám…</div>;

  const domain = tenant.config.domain.density as { unit?: string; referenceTemperatureC?: number } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Laboratoř — hustota</h1>
        <p className="text-sm text-slate-600 mt-1">
          Laboratoř měří hustotu každého produktu v {domain?.unit ?? 'g/ml'} (referenční teplota{' '}
          {domain?.referenceTemperatureC ?? 20} °C). Hodnoty se periodicky aktualizují a ovlivňují převod
          hmotnosti na objem u každého měření z váhy.
        </p>
      </div>

      <div className="bg-slate-900 text-white rounded-lg p-4">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Živá konverze hmotnost → objem
        </div>
        <div className="mt-2 text-sm text-slate-300">
          Pro hypotetickou hmotnost <span className="font-mono text-white">{sampleMass} g</span> a aktuální
          hustotu z laboratoře:
        </div>
        <table className="mt-3 min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="py-1 pr-4">{label(tenant.config, 'partNumber')}</th>
              <th className="py-1 pr-4">Produkt</th>
              <th className="py-1 pr-4 text-right">{label(tenant.config, 'density')} [g/ml]</th>
              <th className="py-1 pr-4 text-right">Referenční</th>
              <th className="py-1 pr-4 text-right">
                {label(tenant.config, 'volume')} [ml]
              </th>
              <th className="py-1 text-right">Odchylka od nominálu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {products.map((p) => {
              const d = latestDensity(densityReadings[p.id]);
              const reference = (p.metadata.referenceDensity as number | undefined) ?? 1.04;
              const density = d?.densityGPerMl ?? reference;
              const volume = volumeFromMassAndDensity(sampleMass, density);
              const nominal = p.characteristic?.nominal ?? 500;
              const deviation = volume - nominal;
              return (
                <tr key={p.id}>
                  <td className="py-1 pr-4 font-mono">{p.partNumber}</td>
                  <td className="py-1 pr-4">{p.description}</td>
                  <td className="py-1 pr-4 font-mono text-right">{density.toFixed(4)}</td>
                  <td className="py-1 pr-4 font-mono text-right text-slate-400">
                    {reference.toFixed(4)}
                  </td>
                  <td className="py-1 pr-4 font-mono text-right font-semibold">{volume.toFixed(2)}</td>
                  <td
                    className={
                      'py-1 font-mono text-right ' +
                      (Math.abs(deviation) > 3
                        ? 'text-rose-400'
                        : Math.abs(deviation) > 1.5
                          ? 'text-amber-400'
                          : 'text-emerald-400')
                    }
                  >
                    {deviation > 0 ? '+' : ''}
                    {deviation.toFixed(2)} ml
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Historie lab měření
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => {
            const readings = densityReadings[p.id] ?? [];
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    {p.partNumber}
                  </div>
                  <div className="font-medium text-slate-900">{p.description}</div>
                </div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-1">Kdy</th>
                      <th className="px-4 py-1">Kdo</th>
                      <th className="px-4 py-1 text-right">Hustota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readings
                      .slice()
                      .reverse()
                      .map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-1 text-slate-600">{fmtCs(r.measuredAt)}</td>
                          <td className="px-4 py-1 text-slate-900">{r.operator}</td>
                          <td className="px-4 py-1 font-mono text-right">
                            {r.densityGPerMl.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
