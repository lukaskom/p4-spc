import { useMemo, useState } from 'react';
import { findScale, products, scales } from '../demo/brewery';
import { latestDensity, volumeFromMassAndDensity } from '../demo/measurements';
import { breweryTenant, label } from '../demo/tenant-config';
import { StatusBadge } from '../components/StatusBadge';

type SubmittedRow = {
  id: string;
  productId: string;
  gage: string;
  massG: number;
  densityGPerMl: number;
  volumeMl: number;
  status: 'ok' | 'warning' | 'reject';
  operator: string;
  measuredAt: string;
};

function statusFor(volume: number, lsl: number, usl: number): SubmittedRow['status'] {
  if (volume < lsl || volume > usl) return 'reject';
  const m = (usl - lsl) * 0.1;
  if (volume < lsl + m || volume > usl - m) return 'warning';
  return 'ok';
}

export function MeasurementsPage(): React.ReactElement {
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '');
  const [gage, setGage] = useState<string>(scales[0]?.id ?? '');
  const [mass, setMass] = useState<string>('520.50');
  const [operator, setOperator] = useState<string>('');
  const [submitted, setSubmitted] = useState<SubmittedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [productId]);
  const density = selectedProduct ? latestDensity(selectedProduct.id) : undefined;
  const densityG = density?.densityGPerMl ?? selectedProduct?.referenceDensityGPerMl ?? 1;

  const massNum = Number(mass);
  const live = useMemo(() => {
    if (!selectedProduct) return null;
    if (!Number.isFinite(massNum) || massNum <= 0) return null;
    const volume = volumeFromMassAndDensity(massNum, densityG);
    return {
      volume,
      status: statusFor(volume, selectedProduct.lslMl, selectedProduct.uslMl),
    };
  }, [massNum, densityG, selectedProduct]);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);
    if (!selectedProduct) {
      setError('Vyber produkt.');
      return;
    }
    if (!Number.isFinite(massNum) || massNum <= 0) {
      setError('Hmotnost musí být kladné číslo.');
      return;
    }
    if (operator.trim().length < 2) {
      setError('Vyplň jméno operátora.');
      return;
    }
    const volume = volumeFromMassAndDensity(massNum, densityG);
    const row: SubmittedRow = {
      id: `m-${Date.now()}`,
      productId: selectedProduct.id,
      gage,
      massG: Number(massNum.toFixed(2)),
      densityGPerMl: Number(densityG.toFixed(4)),
      volumeMl: Number(volume.toFixed(2)),
      status: statusFor(volume, selectedProduct.lslMl, selectedProduct.uslMl),
      operator,
      measuredAt: new Date().toISOString(),
    };
    setSubmitted((prev) => [row, ...prev].slice(0, 20));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Zadat měření</h1>
        <p className="text-sm text-slate-600 mt-1">
          Demo formulář. Labely jsou řízené konfigurací tenanta (pivovar), takže místo „Part
          number" vidíš „{label(breweryTenant, 'partNumber')}". Objem se počítá živě z hmotnosti
          a aktuální hustoty z laboratoře.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-slate-600">
            {label(breweryTenant, 'partNumber')}
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sapId} — {p.description}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-slate-600">
            {label(breweryTenant, 'gage')}
          </label>
          <select
            value={gage}
            onChange={(e) => setGage(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {scales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.manufacturer} {s.model}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-slate-600">Hmotnost [g]</label>
          <input
            type="number"
            step="0.01"
            value={mass}
            onChange={(e) => setMass(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono"
          />
          <div className="text-xs text-slate-500">
            Načteno z {findScale(gage)?.manufacturer ?? 'váhy'} (v reálu přes desktop appku
            a CUS).
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-slate-600">
            Hustota z laboratoře [g/ml]
          </label>
          <input
            type="text"
            readOnly
            value={densityG.toFixed(4)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono bg-slate-50 text-slate-600"
          />
          <div className="text-xs text-slate-500">
            {density ? `Aktualizováno ${new Date(density.measuredAt).toLocaleString('cs-CZ')}` : 'Referenční hodnota'}
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs uppercase tracking-wider text-slate-600">
            {label(breweryTenant, 'operator')}
          </label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="např. Jana Nováková"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2 p-4 bg-slate-900 text-white rounded-md">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Živý výpočet (nominál {selectedProduct?.nominalMl ?? '—'} ml, spec{' '}
            {selectedProduct?.lslMl}–{selectedProduct?.uslMl} ml)
          </div>
          {live ? (
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-3xl font-semibold font-mono">{live.volume.toFixed(2)}</div>
              <div className="text-slate-400">ml</div>
              <StatusBadge status={live.status} />
            </div>
          ) : (
            <div className="mt-2 text-slate-400 text-sm">Zadej hmotnost.</div>
          )}
        </div>

        {error && (
          <div className="md:col-span-2 bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
          >
            Uložit měření (demo – jen do tabulky níže)
          </button>
        </div>
      </form>

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
                  <th className="px-4 py-2">{label(breweryTenant, 'partNumber')}</th>
                  <th className="px-4 py-2">{label(breweryTenant, 'gage')}</th>
                  <th className="px-4 py-2 text-right">Hmot. [g]</th>
                  <th className="px-4 py-2 text-right">Hust. [g/ml]</th>
                  <th className="px-4 py-2 text-right">Objem [ml]</th>
                  <th className="px-4 py-2">Op.</th>
                  <th className="px-4 py-2">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submitted.map((r) => {
                  const p = products.find((x) => x.id === r.productId);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-slate-600">
                        {new Date(r.measuredAt).toLocaleTimeString('cs-CZ')}
                      </td>
                      <td className="px-4 py-2 font-mono">{p?.sapId}</td>
                      <td className="px-4 py-2 text-slate-600">{r.gage}</td>
                      <td className="px-4 py-2 font-mono text-right">{r.massG.toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono text-right">{r.densityGPerMl.toFixed(4)}</td>
                      <td className="px-4 py-2 font-mono text-right font-semibold">
                        {r.volumeMl.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">{r.operator}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
