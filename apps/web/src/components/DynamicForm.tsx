import { useMemo, useState } from 'react';
import type { FormDef, FormField } from '@p4-spc/config-sdk';

interface DynamicFormProps {
  readonly def: FormDef;
  readonly context: {
    readonly products: Array<{ id: string; label: string }>;
    readonly gages: Array<{ id: string; label: string }>;
    readonly operators?: Array<{ id: string; label: string }>;
    readonly readers: Record<string, (formValues: Record<string, unknown>) => unknown>;
  };
  readonly onSubmit: (values: Record<string, unknown>) => void;
  readonly submitting?: boolean;
}

type FormValues = Record<string, unknown>;

function compileExpression(expr: string, fieldIds: readonly string[]): (values: FormValues) => unknown {
  try {
    const fn = new Function(...fieldIds, `"use strict"; return (${expr});`) as (
      ...args: unknown[]
    ) => unknown;
    return (values) => {
      try {
        return fn(...fieldIds.map((id) => values[id]));
      } catch {
        return undefined;
      }
    };
  } catch {
    return () => undefined;
  }
}

function fieldOptions(
  field: FormField,
  ctx: DynamicFormProps['context'],
): Array<{ value: string; label: string }> {
  if (field.options && field.options.length > 0) {
    return field.options.map((o) => ({ value: o.value, label: o.label }));
  }
  switch (field.optionsFrom) {
    case 'products':
      return ctx.products.map((p) => ({ value: p.id, label: p.label }));
    case 'gages':
      return ctx.gages.map((g) => ({ value: g.id, label: g.label }));
    case 'operators':
      return (ctx.operators ?? []).map((o) => ({ value: o.id, label: o.label }));
    default:
      return [];
  }
}

function defaultFor(field: FormField, ctx: DynamicFormProps['context']): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === 'select') {
    return fieldOptions(field, ctx)[0]?.value ?? '';
  }
  if (field.type === 'number') return '';
  return '';
}

export function DynamicForm({ def, context, onSubmit, submitting }: DynamicFormProps): React.ReactElement {
  const initial = useMemo<FormValues>(() => {
    const out: FormValues = {};
    for (const f of def.fields) {
      out[f.id] = defaultFor(f, context);
    }
    return out;
  }, [def, context]);

  const [values, setValues] = useState<FormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  const evaluators = useMemo(() => {
    const map = new Map<string, (v: FormValues) => unknown>();
    const ids = def.fields.map((f) => f.id);
    for (const f of def.fields) {
      if (f.type === 'computed' && f.expression) {
        map.set(f.id, compileExpression(f.expression, ids));
      }
    }
    return map;
  }, [def]);

  const resolvedValues = useMemo(() => {
    const out: FormValues = { ...values };
    for (const f of def.fields) {
      if (f.type === 'readonly' && f.readFrom && context.readers[f.readFrom]) {
        out[f.id] = context.readers[f.readFrom]!(out);
      }
    }
    for (const f of def.fields) {
      if (f.type === 'computed') {
        const ev = evaluators.get(f.id);
        if (ev) out[f.id] = ev(out);
      }
    }
    return out;
  }, [values, evaluators, def, context]);

  function setField(id: string, v: unknown): void {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);
    for (const f of def.fields) {
      if (f.required) {
        const v = resolvedValues[f.id];
        if (v === undefined || v === null || v === '' || Number.isNaN(v)) {
          setError(`Pole "${f.label}" je povinné.`);
          return;
        }
      }
      if (f.validation && (f.type === 'number' || f.type === 'computed')) {
        const num = Number(resolvedValues[f.id]);
        if (f.validation.min !== undefined && num < f.validation.min) {
          setError(f.validation.message ?? `${f.label}: hodnota musí být ≥ ${f.validation.min}`);
          return;
        }
        if (f.validation.max !== undefined && num > f.validation.max) {
          setError(f.validation.message ?? `${f.label}: hodnota musí být ≤ ${f.validation.max}`);
          return;
        }
      }
    }
    onSubmit(resolvedValues);
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {def.fields.map((f) => {
        const className =
          (f.columnSpan === 2 ? 'md:col-span-2 ' : '') + 'space-y-1';
        const v = resolvedValues[f.id];
        return (
          <div key={f.id} className={className}>
            <label className="text-xs uppercase tracking-wider text-slate-600">
              {f.label}
              {f.unit && <span className="ml-1 normal-case text-slate-400">[{f.unit}]</span>}
              {f.required && <span className="text-rose-600 ml-0.5">*</span>}
            </label>
            {f.type === 'text' && (
              <input
                type="text"
                value={String(v ?? '')}
                onChange={(e) => setField(f.id, e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            )}
            {f.type === 'number' && (
              <input
                type="number"
                step="0.01"
                value={String(v ?? '')}
                onChange={(e) => setField(f.id, e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono"
              />
            )}
            {f.type === 'datetime' && (
              <input
                type="datetime-local"
                value={String(v ?? '')}
                onChange={(e) => setField(f.id, e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono"
              />
            )}
            {f.type === 'select' && (
              <select
                value={String(v ?? '')}
                onChange={(e) => setField(f.id, e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                {fieldOptions(f, context).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {f.type === 'readonly' && (
              <input
                type="text"
                readOnly
                value={v === undefined || v === null ? '' : typeof v === 'number' ? v.toFixed(4) : String(v)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono bg-slate-50 text-slate-600"
              />
            )}
            {f.type === 'computed' && (
              <div className="w-full border border-dashed border-slate-300 rounded-md px-3 py-2 text-sm font-mono bg-slate-50">
                {v === undefined || v === null || Number.isNaN(v) ? (
                  <span className="text-slate-400">—</span>
                ) : typeof v === 'number' ? (
                  <span className="font-semibold text-slate-900">
                    {v.toFixed(2)} {f.unit && <span className="text-slate-400 text-xs">{f.unit}</span>}
                  </span>
                ) : (
                  String(v)
                )}
                {f.expression && (
                  <div className="text-[10px] text-slate-400 mt-0.5">= {f.expression}</div>
                )}
              </div>
            )}
            {f.description && (
              <div className="text-xs text-slate-500">{f.description}</div>
            )}
          </div>
        );
      })}

      {error && (
        <div className="md:col-span-2 bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          {def.submitLabel}
        </button>
      </div>
    </form>
  );
}
