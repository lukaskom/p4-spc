import { useEffect, useState } from 'react';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';

interface Row {
  key: string;
  value: string;
}

export function AdminLabels(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();

  const [rows, setRows] = useState<Row[]>([]);
  const [newKey, setNewKey] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      const r = Object.entries(data.config.labels).map(([key, value]) => ({ key, value }));
      r.sort((a, b) => a.key.localeCompare(b.key));
      setRows(r);
      setDirty(false);
      setStatus(null);
    }
  }, [data]);

  function updateValue(key: string, value: string): void {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
    setDirty(true);
  }
  function removeKey(key: string): void {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setDirty(true);
  }
  function addKey(): void {
    const key = newKey.trim();
    if (!key || rows.some((r) => r.key === key)) return;
    setRows((prev) => [...prev, { key, value: '' }].sort((a, b) => a.key.localeCompare(b.key)));
    setNewKey('');
    setDirty(true);
  }

  async function save(): Promise<void> {
    if (!data) return;
    const labels: Record<string, string> = {};
    for (const r of rows) labels[r.key] = r.value;
    const next = { ...data.config, labels };
    try {
      const res = await mutation.mutateAsync(next);
      setStatus({ kind: 'ok', message: `Uloženo jako verze v${res.version}.` });
      setDirty(false);
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  if (!data) return <div className="text-slate-500 text-sm">Načítám…</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          Labely přepisují defaultní texty v UI pro tohoto tenanta. Např. <code>partNumber</code> →{' '}
          <code>SAP ID</code>.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2 w-1/3">Klíč</th>
              <th className="px-4 py-2">Hodnota (label v UI)</th>
              <th className="px-4 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-1.5 font-mono text-xs text-slate-600">{r.key}</td>
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={r.value}
                    onChange={(e) => updateValue(r.key, e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <button
                    onClick={() => removeKey(r.key)}
                    className="text-xs text-rose-700 hover:underline"
                  >
                    odstranit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Nový klíč (např. batchNumber)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
        />
        <button
          onClick={addKey}
          className="bg-slate-200 text-slate-800 px-3 py-1.5 text-sm rounded-md hover:bg-slate-300"
        >
          Přidat klíč
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={!dirty || mutation.isPending}
          onClick={save}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Ukládám…' : 'Uložit labely'}
        </button>
        {status && (
          <span
            className={
              'text-sm ' + (status.kind === 'ok' ? 'text-emerald-700' : 'text-rose-700')
            }
          >
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
