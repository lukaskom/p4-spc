import { useEffect, useMemo, useState } from 'react';
import { useProducts, usePutTenantConfig, useTenantConfig } from '../../api/hooks';
import type { FieldType, FormDef, FormField, FormFieldOption } from '@p4-spc/config-sdk';
import { DynamicForm } from '../../components/DynamicForm';
import { generateDensityReadings, latestDensity } from '../../demo/lab';
import { scales } from '../../demo/static';

const FIELD_TYPES: FieldType[] = ['text', 'number', 'select', 'readonly', 'computed', 'datetime'];
const OPTIONS_FROM: Array<'products' | 'gages' | 'operators'> = ['products', 'gages', 'operators'];
const READER_CATALOG = [
  { id: 'latestLabDensity', description: 'Poslední hustota z laboratoře pro vybraný productId (g/ml)' },
];

const DEFAULTS_BY_TYPE: Record<FieldType, Partial<FormField>> = {
  text: { required: false },
  number: { required: false, defaultValue: 0 },
  select: { required: false, optionsFrom: 'products' },
  readonly: { readFrom: 'latestLabDensity' },
  computed: { expression: 'a + b' },
  datetime: {},
};

function cloneForm(f: FormDef): FormDef {
  return JSON.parse(JSON.stringify(f));
}

function move<T>(arr: T[], fromIdx: number, toIdx: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(fromIdx, 1);
  if (item === undefined) return copy;
  copy.splice(toIdx, 0, item);
  return copy;
}

export function AdminForms(): React.ReactElement {
  const { data } = useTenantConfig();
  const { data: products } = useProducts();
  const mutation = usePutTenantConfig();

  const [forms, setForms] = useState<FormDef[]>([]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);
  const [selectedFormIdx, setSelectedFormIdx] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const list = Object.values(data.config.forms).map(cloneForm);
      setForms(list);
      setStatus(null);
      if (selectedFormIdx >= list.length) setSelectedFormIdx(0);
    }
  }, [data, selectedFormIdx]);

  const densityReadings = useMemo(() => (products ? generateDensityReadings(products) : {}), [products]);

  if (!data) return <div className="text-slate-500 text-sm">Načítám…</div>;

  const selected = forms[selectedFormIdx];

  function updateForm(mut: (f: FormDef) => void): void {
    setForms((prev) => {
      const next = prev.map(cloneForm);
      const current = next[selectedFormIdx];
      if (!current) return prev;
      mut(current);
      return next;
    });
  }

  function patchField(fieldId: string, patch: Partial<FormField>): void {
    updateForm((f) => {
      const m = f as unknown as { fields: FormField[] };
      m.fields = m.fields.map((x) => (x.id === fieldId ? { ...x, ...patch } : x));
    });
  }

  function addField(): void {
    updateForm((f) => {
      const m = f as unknown as { fields: FormField[] };
      const i = m.fields.length + 1;
      m.fields.push({
        id: `field${i}`,
        type: 'text',
        label: `Pole ${i}`,
        ...DEFAULTS_BY_TYPE.text,
      } as FormField);
    });
  }

  function removeField(fieldId: string): void {
    updateForm((f) => {
      const m = f as unknown as { fields: FormField[] };
      m.fields = m.fields.filter((x) => x.id !== fieldId);
    });
  }

  function changeType(fieldId: string, type: FieldType): void {
    patchField(fieldId, { type, ...(DEFAULTS_BY_TYPE[type] as Partial<FormField>) });
  }

  function onDrop(targetId: string): void {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    updateForm((f) => {
      const m = f as unknown as { fields: FormField[] };
      const fromIdx = m.fields.findIndex((x) => x.id === dragId);
      const toIdx = m.fields.findIndex((x) => x.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      m.fields = move(m.fields, fromIdx, toIdx);
    });
    setDragId(null);
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

  const previewContext = {
    products: (products ?? []).map((p) => ({ id: p.id, label: `${p.partNumber} — ${p.description ?? ''}` })),
    gages: scales.map((s) => ({ id: s.id, label: `${s.id} — ${s.manufacturer} ${s.model}` })),
    readers: {
      latestLabDensity: (values: Record<string, unknown>): number | undefined => {
        const productId = values.productId as string | undefined;
        if (!productId) return undefined;
        const d = latestDensity(densityReadings[productId]);
        return d?.densityGPerMl;
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        Přetáhni řádek za rukojeť <code className="font-mono">☰</code> pro přeuspořádání pořadí.
        Napravo živý náhled vykresluje aktuální formulář tak, jak ho uvidí operátor.
      </div>

      {forms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {forms.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormIdx(i)}
              className={
                'px-3 py-1 text-sm rounded-md border ' +
                (i === selectedFormIdx
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-300 hover:bg-slate-50')
              }
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="px-4 py-3 border-b border-slate-200 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">ID formuláře</div>
                  <div className="font-mono text-sm">{selected.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Název</div>
                  <input
                    type="text"
                    value={selected.name}
                    onChange={(e) => updateForm((f) => ((f as { name: string }).name = e.target.value))}
                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Submit label</div>
                  <input
                    type="text"
                    value={selected.submitLabel}
                    onChange={(e) =>
                      updateForm((f) => ((f as { submitLabel: string }).submitLabel = e.target.value))
                    }
                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {selected.fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    onPatch={(p) => patchField(field.id, p)}
                    onRemove={() => removeField(field.id)}
                    onChangeType={(t) => changeType(field.id, t)}
                    dragging={dragId === field.id}
                    onDragStart={() => setDragId(field.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(field.id)}
                    allFields={selected.fields}
                  />
                ))}
              </ul>

              <div className="px-4 py-2 border-t border-slate-200">
                <button
                  onClick={addField}
                  className="text-sm bg-slate-200 text-slate-800 px-3 py-1 rounded-md hover:bg-slate-300"
                >
                  + Přidat pole
                </button>
              </div>
            </div>

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

          <div className="xl:col-span-2 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">Živý náhled</div>
            <DynamicForm def={selected} context={previewContext} onSubmit={() => { /* preview */ }} />
            <div className="text-xs text-slate-500">
              Náhled nereprezentuje uložený stav — ten uvidíš až po stisku „Uložit" a na stránce{' '}
              <a className="underline text-blue-700" href="/measurements">Zadat měření</a>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldRowProps {
  readonly field: FormField;
  readonly allFields: readonly FormField[];
  readonly dragging: boolean;
  readonly onPatch: (p: Partial<FormField>) => void;
  readonly onChangeType: (t: FieldType) => void;
  readonly onRemove: () => void;
  readonly onDragStart: () => void;
  readonly onDragEnd: () => void;
  readonly onDragOver: (e: React.DragEvent) => void;
  readonly onDrop: () => void;
}

function FieldRow({
  field,
  allFields,
  dragging,
  onPatch,
  onChangeType,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: FieldRowProps): React.ReactElement {
  return (
    <li
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={
        'px-4 py-3 grid grid-cols-12 gap-2 items-start ' +
        (dragging ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50')
      }
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="col-span-1 cursor-grab active:cursor-grabbing flex items-center justify-center text-slate-400 select-none"
        title="Přetáhni pro přeřazení"
      >
        ☰
      </div>
      <div className="col-span-3">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">ID</label>
        <input
          type="text"
          value={field.id}
          onChange={(e) => onPatch({ id: e.target.value })}
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
        />
      </div>
      <div className="col-span-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Typ</label>
        <select
          value={field.type}
          onChange={(e) => onChangeType(e.target.value as FieldType)}
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-3">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
        />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Jedn.</label>
        <input
          type="text"
          value={field.unit ?? ''}
          onChange={(e) => onPatch({ unit: e.target.value || undefined })}
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
        />
      </div>
      <div className="col-span-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Šířka</label>
        <select
          value={field.columnSpan ?? 1}
          onChange={(e) => onPatch({ columnSpan: (Number(e.target.value) as 1 | 2) })}
          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </div>
      <div className="col-span-1 flex items-end pb-1 justify-center">
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(field.required)}
            onChange={(e) => onPatch({ required: e.target.checked })}
          />
          <span>pov.</span>
        </label>
      </div>
      <div className="col-span-1 text-right">
        <button onClick={onRemove} className="text-xs text-rose-700 hover:underline">
          smazat
        </button>
      </div>

      {field.type === 'computed' && (
        <ComputedHint field={field} allFields={allFields} onPatch={onPatch} />
      )}
      {field.type === 'readonly' && <ReadonlyHint field={field} onPatch={onPatch} />}
      {field.type === 'select' && <SelectHint field={field} onPatch={onPatch} />}
    </li>
  );
}

function ComputedHint({
  field,
  allFields,
  onPatch,
}: {
  field: FormField;
  allFields: readonly FormField[];
  onPatch: (p: Partial<FormField>) => void;
}): React.ReactElement {
  const refs = allFields.filter((f) => f.id !== field.id).map((f) => f.id);
  return (
    <div className="col-span-12 -mt-1 ml-[calc(8.3333%+0.5rem)] pl-2 border-l-2 border-slate-200">
      <label className="text-[10px] uppercase tracking-wider text-slate-500">
        JavaScript výraz
      </label>
      <textarea
        value={field.expression ?? ''}
        onChange={(e) => onPatch({ expression: e.target.value })}
        placeholder="např. mass / density"
        rows={2}
        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
      />
      <div className="text-[11px] text-slate-500 mt-1">
        <span>Dostupné proměnné (jména polí):</span>{' '}
        {refs.map((id) => (
          <button
            key={id}
            onClick={() => onPatch({ expression: (field.expression ?? '') + id })}
            className="inline-block mr-1 font-mono text-[10px] bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5"
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadonlyHint({
  field,
  onPatch,
}: {
  field: FormField;
  onPatch: (p: Partial<FormField>) => void;
}): React.ReactElement {
  return (
    <div className="col-span-12 -mt-1 ml-[calc(8.3333%+0.5rem)] pl-2 border-l-2 border-slate-200">
      <label className="text-[10px] uppercase tracking-wider text-slate-500">Zdroj hodnoty (reader)</label>
      <select
        value={field.readFrom ?? ''}
        onChange={(e) => onPatch({ readFrom: e.target.value || undefined })}
        className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
      >
        <option value="">(žádný)</option>
        {READER_CATALOG.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id}
          </option>
        ))}
      </select>
      {field.readFrom && (
        <div className="text-[11px] text-slate-500 mt-1">
          {READER_CATALOG.find((r) => r.id === field.readFrom)?.description ?? 'Vlastní reader.'}
        </div>
      )}
    </div>
  );
}

function SelectHint({
  field,
  onPatch,
}: {
  field: FormField;
  onPatch: (p: Partial<FormField>) => void;
}): React.ReactElement {
  const [mode, setMode] = useState<'dynamic' | 'static'>(
    field.optionsFrom ? 'dynamic' : (field.options ? 'static' : 'dynamic'),
  );

  function setOption(idx: number, v: FormFieldOption): void {
    const next = [...(field.options ?? [])];
    next[idx] = v;
    onPatch({ options: next });
  }
  function addOption(): void {
    const next = [...(field.options ?? []), { value: '', label: '' }];
    onPatch({ options: next, optionsFrom: undefined });
  }
  function removeOption(idx: number): void {
    const next = (field.options ?? []).filter((_, i) => i !== idx);
    onPatch({ options: next });
  }

  return (
    <div className="col-span-12 -mt-1 ml-[calc(8.3333%+0.5rem)] pl-2 border-l-2 border-slate-200 space-y-2">
      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === 'dynamic'}
            onChange={() => {
              setMode('dynamic');
              onPatch({ options: undefined });
            }}
          />
          <span>Dynamický zdroj</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === 'static'}
            onChange={() => {
              setMode('static');
              onPatch({ optionsFrom: undefined });
            }}
          />
          <span>Statické hodnoty</span>
        </label>
      </div>
      {mode === 'dynamic' && (
        <select
          value={field.optionsFrom ?? ''}
          onChange={(e) =>
            onPatch({
              optionsFrom: (e.target.value || undefined) as 'products' | 'gages' | 'operators' | undefined,
            })
          }
          className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
        >
          <option value="">(vyber)</option>
          {OPTIONS_FROM.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      {mode === 'static' && (
        <div className="space-y-1">
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={opt.value}
                onChange={(e) => setOption(i, { ...opt, value: e.target.value })}
                placeholder="value"
                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => setOption(i, { ...opt, label: e.target.value })}
                placeholder="label"
                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs"
              />
              <button
                onClick={() => removeOption(i)}
                className="text-xs text-rose-700 hover:underline"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded hover:bg-slate-300"
          >
            + volba
          </button>
        </div>
      )}
    </div>
  );
}
