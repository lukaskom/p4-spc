import { useEffect, useMemo, useState } from 'react';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';
import type { TransformerDef } from '@p4-spc/config-sdk';

function cloneTransformer(t: TransformerDef): TransformerDef {
  return JSON.parse(JSON.stringify(t));
}

function compile(
  expression: string,
  inputs: readonly string[],
): (vals: Record<string, number>) => { value?: number; error?: string } {
  try {
    const fn = new Function(...inputs, `"use strict"; return (${expression});`) as (
      ...args: number[]
    ) => unknown;
    return (vals) => {
      try {
        const args = inputs.map((i) => Number(vals[i] ?? 0));
        const out = fn(...args);
        if (typeof out === 'number' && Number.isFinite(out)) return { value: out };
        return { error: `Výsledek není konečné číslo: ${String(out)}` };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    };
  } catch (err) {
    return () => ({ error: err instanceof Error ? err.message : 'Chyba kompilace' });
  }
}

export function AdminTransformers(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();
  const [transformers, setTransformers] = useState<TransformerDef[]>([]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setTransformers(Object.values(data.config.transformers).map(cloneTransformer));
      setStatus(null);
    }
  }, [data]);

  if (!data) return <div className="text-slate-500 text-sm">Načítám…</div>;

  function updateTransformer(idx: number, patch: Partial<TransformerDef>): void {
    setTransformers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function addTransformer(): void {
    const existingIds = new Set(transformers.map((t) => t.id));
    let n = 1;
    let id = `transformer-${n}`;
    while (existingIds.has(id)) {
      n += 1;
      id = `transformer-${n}`;
    }
    setTransformers((prev) => [
      ...prev,
      {
        id,
        name: 'Nový transformer',
        description: '',
        inputs: ['a', 'b'],
        output: 'result',
        expression: 'a + b',
      },
    ]);
  }

  function removeTransformer(id: string): void {
    setTransformers((prev) => prev.filter((t) => t.id !== id));
  }

  async function save(): Promise<void> {
    if (!data) return;
    const byId: Record<string, TransformerDef> = {};
    for (const t of transformers) byId[t.id] = t;
    const next = { ...data.config, transformers: byId };
    try {
      const res = await mutation.mutateAsync(next);
      setStatus({ kind: 'ok', message: `Uloženo jako verze v${res.version}.` });
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600 space-y-1">
        <p>
          Transformery jsou pojmenované výrazy pro zpracování vstupních hodnot na AQDEF-kompatibilní model.
          Typický případ: převod hmotnosti z váhy + hustoty z lab na objem v ml.
        </p>
        <p>
          Výrazy jsou JavaScript (běží izolovaně, jen numerické vstupy). V produkci se kompilují do
          sandboxu (<code>isolated-vm</code>); tady v adminu se testují pro okamžitou zpětnou vazbu.
        </p>
      </div>

      {transformers.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-md p-6 text-center text-sm text-slate-500">
          Zatím není nakonfigurován žádný transformer.
        </div>
      )}

      {transformers.map((t, idx) => (
        <TransformerCard
          key={t.id}
          transformer={t}
          onPatch={(p) => updateTransformer(idx, p)}
          onRemove={() => removeTransformer(t.id)}
        />
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={addTransformer}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Nový transformer
        </button>
        <div className="flex-1" />
        <button
          onClick={save}
          disabled={mutation.isPending}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Ukládám…' : 'Uložit transformery'}
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

type TestResult =
  | { missing: true }
  | { value: number }
  | { error: string };

function ResultView({ result }: { result: TestResult }): React.ReactElement {
  if ('missing' in result) {
    return <div className="text-sm text-slate-500 mt-1">Zadej všechny vstupy výše.</div>;
  }
  if ('error' in result) {
    return <div className="text-sm text-rose-700 font-mono mt-1">{result.error}</div>;
  }
  return (
    <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
      {result.value.toFixed(4)}
    </div>
  );
}

function TransformerCard({
  transformer,
  onPatch,
  onRemove,
}: {
  readonly transformer: TransformerDef;
  readonly onPatch: (p: Partial<TransformerDef>) => void;
  readonly onRemove: () => void;
}): React.ReactElement {
  const inputsText = useMemo(() => transformer.inputs.join(', '), [transformer.inputs]);
  const [testValues, setTestValues] = useState<Record<string, string>>({});

  const compiled = useMemo(
    () => compile(transformer.expression, transformer.inputs),
    [transformer.expression, transformer.inputs],
  );

  const result: TestResult = useMemo(() => {
    const vals: Record<string, number> = {};
    for (const input of transformer.inputs) {
      const raw = testValues[input];
      const num = raw === undefined || raw === '' ? NaN : Number(raw);
      if (Number.isFinite(num)) vals[input] = num;
    }
    if (Object.keys(vals).length !== transformer.inputs.length) {
      return { missing: true };
    }
    const r = compiled(vals);
    if (r.error !== undefined) return { error: r.error };
    if (r.value !== undefined) return { value: r.value };
    return { error: 'Žádný výsledek' };
  }, [compiled, testValues, transformer.inputs]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
        <div className="text-slate-500 text-xs">Transformer</div>
        <div className="font-mono text-sm">{transformer.id}</div>
        <div className="flex-1" />
        <button onClick={onRemove} className="text-xs text-rose-700 hover:underline">
          odstranit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Název</label>
            <input
              type="text"
              value={transformer.name}
              onChange={(e) => onPatch({ name: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Popis</label>
            <textarea
              value={transformer.description ?? ''}
              onChange={(e) => onPatch({ description: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Vstupy (čárkou oddělená jména)
            </label>
            <input
              type="text"
              value={inputsText}
              onChange={(e) =>
                onPatch({
                  inputs: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Výstup (název)</label>
            <input
              type="text"
              value={transformer.output}
              onChange={(e) => onPatch({ output: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500">Výraz</label>
            <textarea
              value={transformer.expression}
              onChange={(e) => onPatch({ expression: e.target.value })}
              rows={3}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
              spellCheck={false}
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Dostupné proměnné: {transformer.inputs.map((i) => (
                <code key={i} className="mr-1 bg-slate-100 px-1 rounded">
                  {i}
                </code>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-l border-slate-200 pl-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Testovací vstupy</div>
          {transformer.inputs.length === 0 ? (
            <div className="text-xs text-slate-500">Zatím žádné vstupy.</div>
          ) : (
            transformer.inputs.map((input) => (
              <div key={input} className="flex items-center gap-2">
                <label className="font-mono text-xs w-24">{input}</label>
                <input
                  type="number"
                  step="any"
                  value={testValues[input] ?? ''}
                  onChange={(e) =>
                    setTestValues((prev) => ({ ...prev, [input]: e.target.value }))
                  }
                  className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                />
              </div>
            ))
          )}
          <div className="border-t border-slate-200 pt-3">
            <div className="text-xs uppercase tracking-wider text-slate-500">Výsledek</div>
            <ResultView result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}
