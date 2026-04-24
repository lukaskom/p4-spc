import { useState } from 'react';
import {
  useCatalogs,
  useCreateCatalog,
  useDeleteCatalog,
  usePutCatalog,
  type CatalogDto,
  type CatalogItemDto,
} from '../../api/catalog-hooks';

export function AdminCatalogs(): React.ReactElement {
  const { data: catalogs, isLoading } = useCatalogs();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading || !catalogs) return <div className="text-slate-500 text-sm">Načítám…</div>;

  const system = catalogs.filter((c) => c.isSystem);
  const tenant = catalogs.filter((c) => !c.isSystem);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
        Katalogy (číselníky) definují povolené hodnoty pro `select` pole ve formulářích a klíčová
        AQDEF pole jako status, typ charakteristiky atd. <strong>System katalogy</strong> jsou
        předdefinované podle AQDEF a nelze je editovat. <strong>Tenant katalogy</strong> si definuje
        dodavatel per klient.
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          {creating ? 'Zrušit' : '+ Nový tenant katalog'}
        </button>
      </div>

      {creating && <CreateCatalog onDone={() => setCreating(false)} />}

      {tenant.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Tenant katalogy</h3>
          <div className="space-y-2">
            {tenant.map((c) => (
              <CatalogRow
                key={c.key}
                catalog={c}
                expanded={expandedKey === c.key}
                onToggle={() => setExpandedKey(expandedKey === c.key ? null : c.key)}
                editable
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">System katalogy (read-only)</h3>
        <div className="space-y-2">
          {system.map((c) => (
            <CatalogRow
              key={c.key}
              catalog={c}
              expanded={expandedKey === c.key}
              onToggle={() => setExpandedKey(expandedKey === c.key ? null : c.key)}
              editable={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CatalogRow({
  catalog,
  expanded,
  onToggle,
  editable,
}: {
  readonly catalog: CatalogDto;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly editable: boolean;
}): React.ReactElement {
  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-slate-50"
      >
        <span className="text-slate-400">{expanded ? '▾' : '▸'}</span>
        <div className="flex-1">
          <div className="font-mono text-sm text-slate-900">{catalog.key}</div>
          <div className="text-xs text-slate-500">{catalog.name}</div>
        </div>
        <span className="text-xs text-slate-500">{catalog.items.length} položek</span>
        <span
          className={
            'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ' +
            (catalog.scope === 'aqdef'
              ? 'bg-indigo-100 text-indigo-800'
              : catalog.scope === 'spc'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800')
          }
        >
          {catalog.scope}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 p-4">
          {editable ? <TenantCatalogEditor catalog={catalog} /> : <SystemCatalogView items={catalog.items} />}
        </div>
      )}
    </div>
  );
}

function SystemCatalogView({ items }: { items: readonly CatalogItemDto[] }): React.ReactElement {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
          <th className="px-2 py-1 w-24">Kód</th>
          <th className="px-2 py-1">Label</th>
          <th className="px-2 py-1 w-16 text-right">Pořadí</th>
          <th className="px-2 py-1 w-16">Aktivní</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((it) => (
          <tr key={it.id}>
            <td className="px-2 py-1 font-mono">{it.code}</td>
            <td className="px-2 py-1">{it.label}</td>
            <td className="px-2 py-1 font-mono text-right text-slate-500">{it.order}</td>
            <td className="px-2 py-1 text-xs">{it.active ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type EditableItem = { code: string; label: string; order: number; active: boolean };

function TenantCatalogEditor({ catalog }: { catalog: CatalogDto }): React.ReactElement {
  const putMut = usePutCatalog();
  const delMut = useDeleteCatalog();
  const [name, setName] = useState(catalog.name);
  const [items, setItems] = useState<EditableItem[]>(
    catalog.items.map((i) => ({ code: i.code, label: i.label, order: i.order, active: i.active })),
  );
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  function updateItem(i: number, patch: Partial<EditableItem>): void {
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function addItem(): void {
    setItems((prev) => [...prev, { code: '', label: '', order: prev.length, active: true }]);
  }
  function removeItem(i: number): void {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(): Promise<void> {
    try {
      const res = await putMut.mutateAsync({ key: catalog.key, name, items });
      setStatus({ kind: 'ok', message: `Uloženo, ${res.itemCount} položek.` });
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  async function remove(): Promise<void> {
    if (!confirm(`Opravdu smazat katalog "${catalog.key}"?`)) return;
    try {
      await delMut.mutateAsync(catalog.key);
    } catch (err) {
      setStatus({ kind: 'err', message: err instanceof Error ? err.message : 'Chyba' });
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Klíč</label>
          <input
            type="text"
            value={catalog.key}
            disabled
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono bg-slate-50 text-slate-500"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Název</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
      </div>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-2 py-1 w-28">Kód</th>
            <th className="px-2 py-1">Label</th>
            <th className="px-2 py-1 w-20 text-right">Pořadí</th>
            <th className="px-2 py-1 w-16 text-center">Aktivní</th>
            <th className="px-2 py-1 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it, i) => (
            <tr key={i}>
              <td className="px-2 py-1">
                <input
                  type="text"
                  value={it.code}
                  onChange={(e) => updateItem(i, { code: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  value={it.label}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  value={it.order}
                  onChange={(e) => updateItem(i, { order: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono text-right"
                />
              </td>
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={it.active}
                  onChange={(e) => updateItem(i, { active: e.target.checked })}
                />
              </td>
              <td className="px-2 py-1 text-right">
                <button
                  onClick={() => removeItem(i)}
                  className="text-xs text-rose-700 hover:underline"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          className="text-xs bg-slate-200 text-slate-800 px-3 py-1 rounded-md hover:bg-slate-300"
        >
          + Položka
        </button>
        <div className="flex-1" />
        <button
          onClick={remove}
          disabled={delMut.isPending}
          className="text-xs text-rose-700 hover:underline"
        >
          smazat celý katalog
        </button>
        <button
          onClick={save}
          disabled={putMut.isPending}
          className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {putMut.isPending ? 'Ukládám…' : 'Uložit'}
        </button>
      </div>
      {status && (
        <div className={'text-sm ' + (status.kind === 'ok' ? 'text-emerald-700' : 'text-rose-700')}>
          {status.message}
        </div>
      )}
    </div>
  );
}

function CreateCatalog({ onDone }: { onDone: () => void }): React.ReactElement {
  const createMut = useCreateCatalog();
  const [key, setKey] = useState('tenant.');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'aqdef' | 'spc' | 'tenant'>('tenant');
  const [status, setStatus] = useState<string | null>(null);

  async function create(): Promise<void> {
    setStatus(null);
    if (!key || !name) {
      setStatus('Vyplň klíč i název.');
      return;
    }
    try {
      await createMut.mutateAsync({ key, name, scope, items: [] });
      onDone();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Chyba');
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Klíč</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="tenant.lines"
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Název</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Výrobní linky"
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-500">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'aqdef' | 'spc' | 'tenant')}
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm bg-white"
          >
            <option value="tenant">tenant</option>
            <option value="aqdef">aqdef</option>
            <option value="spc">spc</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={create}
          disabled={createMut.isPending}
          className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {createMut.isPending ? 'Vytvářím…' : 'Vytvořit'}
        </button>
        {status && <span className="text-sm text-rose-700">{status}</span>}
      </div>
    </div>
  );
}
