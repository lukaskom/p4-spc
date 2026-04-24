import { useEffect, useMemo, useState } from 'react';
import { tenantConfigSchema } from '@p4-spc/config-sdk';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';

export function AdminRaw(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();

  const [text, setText] = useState<string>('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setText(JSON.stringify(data.config, null, 2));
      setStatus(null);
    }
  }, [data]);

  const parsed = useMemo(() => {
    try {
      const obj = JSON.parse(text);
      const result = tenantConfigSchema.safeParse(obj);
      return { ok: result.success, object: obj, errors: result.success ? null : result.error.flatten() };
    } catch (e) {
      return { ok: false, object: null, errors: { _raw: [(e as Error).message] } };
    }
  }, [text]);

  async function save(): Promise<void> {
    if (!parsed.ok || parsed.object === null) return;
    try {
      const res = await mutation.mutateAsync(parsed.object);
      setStatus({ kind: 'ok', message: `Uloženo jako verze v${res.version}.` });
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        Přímá editace celého configu jako JSON. Validace probíhá přes Zod schema z{' '}
        <code>@p4-spc/config-sdk</code>. Uložit lze, jen když je JSON validní.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-[500px] border border-slate-300 rounded-md p-3 text-xs font-mono bg-white"
        spellCheck={false}
      />

      <div
        className={
          'p-3 rounded-md text-sm ' +
          (parsed.ok
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900')
        }
      >
        {parsed.ok ? '✓ Validní TenantConfig' : '✗ Neplatný JSON nebo nevyhovuje schématu'}
        {!parsed.ok && parsed.errors && (
          <pre className="mt-2 text-xs whitespace-pre-wrap">
            {JSON.stringify(parsed.errors, null, 2)}
          </pre>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!parsed.ok || mutation.isPending}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Ukládám…' : 'Uložit celý config'}
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
