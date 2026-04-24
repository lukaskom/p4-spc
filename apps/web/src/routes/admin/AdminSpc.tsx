import { useEffect, useState } from 'react';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';
import type { NelsonRuleId, SpcConfig } from '@p4-spc/config-sdk';

const NELSON_DESCRIPTIONS: Record<NelsonRuleId, string> = {
  1: 'Bod mimo ±3σ',
  2: '9 po sobě jdoucích bodů na stejné straně CL',
  3: '6 po sobě jdoucích bodů monotónně trendujících',
  4: '14 po sobě jdoucích bodů alternujících',
};

export function AdminSpc(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();
  const [spc, setSpc] = useState<SpcConfig | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setSpc(data.config.spc);
      setStatus(null);
    }
  }, [data]);

  if (!data || !spc) return <div className="text-slate-500 text-sm">Načítám…</div>;

  function toggleRule(rule: NelsonRuleId): void {
    if (!spc) return;
    const set = new Set(spc.enabledNelsonRules);
    if (set.has(rule)) set.delete(rule);
    else set.add(rule);
    const sorted = Array.from(set).sort() as NelsonRuleId[];
    setSpc({ ...spc, enabledNelsonRules: sorted });
  }

  async function save(): Promise<void> {
    if (!data || !spc) return;
    const next = { ...data.config, spc };
    try {
      const res = await mutation.mutateAsync(next);
      setStatus({ kind: 'ok', message: `Uloženo jako verze v${res.version}.` });
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-600">
            Výchozí typ regulačního diagramu
          </label>
          <select
            value={spc.defaultChartType}
            onChange={(e) => setSpc({ ...spc, defaultChartType: e.target.value as SpcConfig['defaultChartType'] })}
            className="mt-1 block border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="i-mr">I-MR (individuál + klouzavé rozpětí)</option>
            <option value="xbar-r">X-bar / R (průměr + rozpětí)</option>
            <option value="xbar-s">X-bar / S (průměr + směrodatná odchylka)</option>
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-slate-600">Velikost podskupiny</label>
          <input
            type="number"
            min={1}
            max={25}
            value={spc.subgroupSize}
            onChange={(e) => setSpc({ ...spc, subgroupSize: Number(e.target.value) })}
            className="mt-1 block border border-slate-300 rounded-md px-3 py-2 text-sm font-mono w-32"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs uppercase tracking-wider text-slate-600">
            Povolená Nelson pravidla
          </legend>
          {([1, 2, 3, 4] as NelsonRuleId[]).map((rule) => (
            <label key={rule} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={spc.enabledNelsonRules.includes(rule)}
                onChange={() => toggleRule(rule)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">Pravidlo {rule}</span>
                <span className="text-slate-600"> — {NELSON_DESCRIPTIONS[rule]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs uppercase tracking-wider text-slate-600">
            Prahy způsobilosti (Cpk/Ppk)
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Excellent ≥</label>
              <input
                type="number"
                step="0.01"
                value={spc.capabilityThresholds.excellent}
                onChange={(e) =>
                  setSpc({
                    ...spc,
                    capabilityThresholds: {
                      ...spc.capabilityThresholds,
                      excellent: Number(e.target.value),
                    },
                  })
                }
                className="mt-1 block w-full border border-slate-300 rounded-md px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Good ≥</label>
              <input
                type="number"
                step="0.01"
                value={spc.capabilityThresholds.good}
                onChange={(e) =>
                  setSpc({
                    ...spc,
                    capabilityThresholds: { ...spc.capabilityThresholds, good: Number(e.target.value) },
                  })
                }
                className="mt-1 block w-full border border-slate-300 rounded-md px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Marginal ≥</label>
              <input
                type="number"
                step="0.01"
                value={spc.capabilityThresholds.marginal}
                onChange={(e) =>
                  setSpc({
                    ...spc,
                    capabilityThresholds: {
                      ...spc.capabilityThresholds,
                      marginal: Number(e.target.value),
                    },
                  })
                }
                className="mt-1 block w-full border border-slate-300 rounded-md px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={mutation.isPending}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Ukládám…' : 'Uložit SPC nastavení'}
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
