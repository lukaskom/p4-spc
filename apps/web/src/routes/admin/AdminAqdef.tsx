import { useEffect, useState } from 'react';
import { KField } from '@p4-spc/aqdef-core';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';
import type { AqdefMapping } from '@p4-spc/config-sdk';

const KFIELD_OPTIONS = Object.entries(KField).map(([name, code]) => ({
  name,
  code,
}));

type Section = keyof AqdefMapping;
const SECTIONS: Section[] = ['part', 'characteristic', 'measurement'];
const SECTION_LABELS: Record<Section, string> = {
  part: 'Díl / produkt (K1xxx)',
  characteristic: 'Charakteristika (K2xxx)',
  measurement: 'Měření (K0xxx / K8xxx)',
};

export function AdminAqdef(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();
  const [mapping, setMapping] = useState<AqdefMapping | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setMapping(JSON.parse(JSON.stringify(data.config.aqdefMapping)) as AqdefMapping);
      setStatus(null);
    }
  }, [data]);

  if (!data || !mapping) return <div className="text-slate-500 text-sm">Načítám…</div>;

  function updatePair(section: Section, key: string, newKey: string, value: string): void {
    if (!mapping) return;
    const entries = Object.entries(mapping[section]);
    const updated = entries.map(([k, v]) => (k === key ? [newKey, value] : [k, v]));
    setMapping({ ...mapping, [section]: Object.fromEntries(updated) });
  }

  function addPair(section: Section): void {
    if (!mapping) return;
    setMapping({
      ...mapping,
      [section]: { ...mapping[section], '': '' },
    });
  }

  function removePair(section: Section, key: string): void {
    if (!mapping) return;
    const entries = Object.entries(mapping[section]).filter(([k]) => k !== key);
    setMapping({ ...mapping, [section]: Object.fromEntries(entries) });
  }

  async function save(): Promise<void> {
    if (!data || !mapping) return;
    const next = { ...data.config, aqdefMapping: mapping };
    try {
      const res = await mutation.mutateAsync(next);
      setStatus({ kind: 'ok', message: `Uloženo jako verze v${res.version}.` });
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        Mapování interních klíčů (tenant-ová terminologie, např. <code>sapId</code>) na standardní
        AQDEF K-kódy (K1001 = part number). Používá se při exportu DFQ/DFX a při ingest transformacích.
      </div>

      {SECTIONS.map((section) => (
        <div key={section} className="bg-white border border-slate-200 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="font-medium text-slate-800">{SECTION_LABELS[section]}</div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 w-1/3">Interní klíč</th>
                <th className="px-4 py-2">K-kód</th>
                <th className="px-4 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(mapping[section]).map(([key, value], i) => (
                <tr key={`${section}-${i}`}>
                  <td className="px-4 py-1.5">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updatePair(section, key, e.target.value, value)}
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                      placeholder="např. sapId"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <input
                      list={`kfield-${section}`}
                      value={value}
                      onChange={(e) => updatePair(section, key, key, e.target.value.toUpperCase())}
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                      placeholder="K0001"
                    />
                    <datalist id={`kfield-${section}`}>
                      {KFIELD_OPTIONS.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.name}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <button
                      onClick={() => removePair(section, key)}
                      className="text-xs text-rose-700 hover:underline"
                    >
                      odstranit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-slate-200">
            <button
              onClick={() => addPair(section)}
              className="text-xs bg-slate-200 text-slate-800 px-3 py-1 rounded-md hover:bg-slate-300"
            >
              + Přidat mapování
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={mutation.isPending}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Ukládám…' : 'Uložit mapování'}
        </button>
        {status && (
          <span className={'text-sm ' + (status.kind === 'ok' ? 'text-emerald-700' : 'text-rose-700')}>
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
