import { useMemo, useState } from 'react';
import { useProducts, useTenantConfig } from '../api/hooks';
import { generateDensityReadings, latestDensity } from '../demo/lab';
import { scales } from '../demo/static';
import { DynamicForm } from '../components/DynamicForm';
import { StatusBadge } from '../components/StatusBadge';

type SubmittedRow = {
  id: string;
  productLabel: string;
  values: Record<string, unknown>;
  submittedAt: string;
  status: 'ok' | 'warning' | 'reject';
};

export function MeasurementsPage(): React.ReactElement {
  const { data: tenant } = useTenantConfig();
  const { data: products } = useProducts();
  const densityReadings = useMemo(() => (products ? generateDensityReadings(products) : {}), [products]);

  const [submitted, setSubmitted] = useState<SubmittedRow[]>([]);

  if (!tenant || !products) return <div className="text-slate-500 text-sm">Načítám…</div>;

  const forms = tenant.config.forms;
  const formIds = Object.keys(forms);
  const formDef = formIds.length > 0 ? forms[formIds[0]!]! : null;

  if (!formDef) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-900">
        V konfiguraci nenalezen žádný formulář. Vytvoř ho v <a className="underline" href="/admin">Adminu</a>.
      </div>
    );
  }

  function statusForVolume(volume: number, productId: string): 'ok' | 'warning' | 'reject' {
    const p = products?.find((x) => x.id === productId);
    const lsl = p?.characteristic?.lsl ?? null;
    const usl = p?.characteristic?.usl ?? null;
    if (lsl === null || usl === null) return 'ok';
    if (volume < lsl || volume > usl) return 'reject';
    const margin = (usl - lsl) * 0.1;
    if (volume < lsl + margin || volume > usl - margin) return 'warning';
    return 'ok';
  }

  const context = {
    products: products.map((p) => ({
      id: p.id,
      label: `${p.partNumber} — ${p.description ?? ''}`,
    })),
    gages: scales.map((s) => ({ id: s.id, label: `${s.id} — ${s.manufacturer} ${s.model}` })),
    readers: {
      latestLabDensity: (values: Record<string, unknown>): number | undefined => {
        const productId = values.productId as string | undefined;
        if (!productId) return undefined;
        const readings = densityReadings[productId];
        const d = latestDensity(readings);
        if (d) return d.densityGPerMl;
        const p = products.find((x) => x.id === productId);
        return (p?.metadata.referenceDensity as number | undefined) ?? undefined;
      },
    },
  };

  function handleSubmit(values: Record<string, unknown>): void {
    const resultFieldId = formDef?.resultField;
    const statusFieldId = formDef?.statusFromField ?? resultFieldId;
    const result = resultFieldId ? Number(values[resultFieldId]) : NaN;
    const productId = values.productId as string | undefined;
    const status: 'ok' | 'warning' | 'reject' =
      statusFieldId && productId && Number.isFinite(result)
        ? statusForVolume(result, productId)
        : 'ok';
    const p = products?.find((x) => x.id === productId);
    setSubmitted((prev) =>
      [
        {
          id: `m-${Date.now()}`,
          productLabel: p ? `${p.partNumber} — ${p.description ?? ''}` : '?',
          values,
          submittedAt: new Date().toISOString(),
          status,
        },
        ...prev,
      ].slice(0, 20),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{formDef.name}</h1>
        {formDef.description && (
          <p className="text-sm text-slate-600 mt-1">{formDef.description}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Formulář je renderován z tenant configu ({formDef.fields.length} polí). Labely, typy,
          výpočty — vše mění admin přes <a className="underline text-blue-700" href="/admin">Admin</a>.
        </p>
      </div>

      <DynamicForm def={formDef} context={context} onSubmit={handleSubmit} />

      <div>
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-3">
          Zaznamenaná demo měření v této session
        </h2>
        {submitted.length === 0 ? (
          <div className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-md p-4 text-center">
            Zatím nic. Vyplň formulář a klikni uložit.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-2">Kdy</th>
                  <th className="px-4 py-2">Produkt</th>
                  {formDef.fields
                    .filter((f) => !['productId'].includes(f.id))
                    .map((f) => (
                      <th key={f.id} className="px-4 py-2">
                        {f.label}
                      </th>
                    ))}
                  <th className="px-4 py-2">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submitted.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-slate-600">
                      {new Date(r.submittedAt).toLocaleTimeString('cs-CZ')}
                    </td>
                    <td className="px-4 py-2">{r.productLabel}</td>
                    {formDef.fields
                      .filter((f) => !['productId'].includes(f.id))
                      .map((f) => {
                        const v = r.values[f.id];
                        let content: string = '';
                        if (v === undefined || v === null || Number.isNaN(v)) content = '—';
                        else if (typeof v === 'number') content = v.toFixed(2);
                        else content = String(v);
                        return (
                          <td key={f.id} className="px-4 py-2 font-mono">
                            {content}
                          </td>
                        );
                      })}
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
