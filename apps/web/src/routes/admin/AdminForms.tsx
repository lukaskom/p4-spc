import { useEffect, useState } from 'react';
import { usePutTenantConfig, useTenantConfig } from '../../api/hooks';
import type { FieldType, FormDef, FormField } from '@p4-spc/config-sdk';

const FIELD_TYPES: FieldType[] = ['text', 'number', 'select', 'readonly', 'computed', 'datetime'];
const OPTIONS_FROM: Array<'products' | 'gages' | 'operators'> = ['products', 'gages', 'operators'];

function cloneForm(f: FormDef): FormDef {
  return JSON.parse(JSON.stringify(f));
}

export function AdminForms(): React.ReactElement {
  const { data } = useTenantConfig();
  const mutation = usePutTenantConfig();

  const [forms, setForms] = useState<FormDef[]>([]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      const list = Object.values(data.config.forms).map(cloneForm);
      setForms(list);
      setStatus(null);
    }
  }, [data]);

  if (!data) return <div className="text-slate-500 text-sm">Načítám…</div>;

  function updateForm(idx: number, mut: (f: FormDef) => void): void {
    setForms((prev) => {
      const next = prev.map(cloneForm);
      const current = next[idx];
      if (!current) return prev;
      mut(current);
      return next;
    });
  }

  function addField(idx: number): void {
    updateForm(idx, (f) => {
      const newField: FormField = {
        id: `field${(f.fields as FormField[]).length + 1}`,
        type: 'text',
        label: 'Nové pole',
      };
      (f.fields as FormField[]).push(newField);
    });
  }

  function removeField(formIdx: number, fieldId: string): void {
    updateForm(formIdx, (f) => {
      const mutable = f as unknown as { fields: FormField[] };
      mutable.fields = mutable.fields.filter((x) => x.id !== fieldId);
    });
  }

  function updateField(formIdx: number, fieldId: string, patch: Partial<FormField>): void {
    updateForm(formIdx, (f) => {
      const mutable = f as unknown as { fields: FormField[] };
      mutable.fields = mutable.fields.map((x) => (x.id === fieldId ? { ...x, ...patch } : x));
    });
  }

  async function save(): Promise<void> {
    if (!data) return;
    const nextForms: Record<string, FormDef> = {};
    for (const f of forms) nextForms[f.id] = f;
    const next = { ...data.config, forms: nextForms };
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
        Formuláře pro sběr měřených hodnot. Každé pole má typ, label a volitelně jednotku, validaci
        a výraz. <code>computed</code> počítá z ostatních polí, <code>readonly</code> čte ze zdroje
        (např. <code>latestLabDensity</code>). Po uložení se změna okamžitě projeví na stránce{' '}
        <a className="underline text-blue-700" href="/measurements">Zadat měření</a>.
      </div>

      {forms.map((form, idx) => (
        <div key={form.id} className="bg-white border border-slate-200 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">ID formuláře</div>
              <div className="font-mono">{form.id}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-slate-500">Název</div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm(idx, (f) => ((f as { name: string }).name = e.target.value))}
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Submit label</div>
              <input
                type="text"
                value={form.submitLabel}
                onChange={(e) =>
                  updateForm(idx, (f) => ((f as { submitLabel: string }).submitLabel = e.target.value))
                }
                className="border border-slate-200 rounded-md px-2 py-1 text-sm w-48"
              />
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-1 w-36">ID</th>
                  <th className="px-2 py-1 w-32">Typ</th>
                  <th className="px-2 py-1">Label</th>
                  <th className="px-2 py-1 w-20">Jednotka</th>
                  <th className="px-2 py-1 w-20">Povinné</th>
                  <th className="px-2 py-1 w-48">Výraz / zdroj</th>
                  <th className="px-2 py-1 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {form.fields.map((field) => (
                  <tr key={field.id}>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={field.id}
                        disabled
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono bg-slate-50"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(idx, field.id, { type: e.target.value as FieldType })
                        }
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(idx, field.id, { label: e.target.value })}
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={field.unit ?? ''}
                        onChange={(e) =>
                          updateField(idx, field.id, { unit: e.target.value || undefined })
                        }
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(field.required)}
                        onChange={(e) => updateField(idx, field.id, { required: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-1">
                      {field.type === 'computed' && (
                        <input
                          type="text"
                          value={field.expression ?? ''}
                          onChange={(e) => updateField(idx, field.id, { expression: e.target.value })}
                          placeholder="mass / density"
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                        />
                      )}
                      {field.type === 'readonly' && (
                        <input
                          type="text"
                          value={field.readFrom ?? ''}
                          onChange={(e) => updateField(idx, field.id, { readFrom: e.target.value })}
                          placeholder="latestLabDensity"
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                        />
                      )}
                      {field.type === 'select' && (
                        <select
                          value={field.optionsFrom ?? ''}
                          onChange={(e) =>
                            updateField(idx, field.id, {
                              optionsFrom: (e.target.value || undefined) as
                                | 'products'
                                | 'gages'
                                | 'operators'
                                | undefined,
                            })
                          }
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                        >
                          <option value="">(žádné)</option>
                          {OPTIONS_FROM.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => removeField(idx, field.id)}
                        className="text-rose-700 text-xs hover:underline"
                      >
                        smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => addField(idx)}
              className="mt-2 bg-slate-200 text-slate-800 px-3 py-1 text-xs rounded-md hover:bg-slate-300"
            >
              + Přidat pole
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
          {mutation.isPending ? 'Ukládám…' : 'Uložit formuláře'}
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
