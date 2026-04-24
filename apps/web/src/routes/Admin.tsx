import { NavLink, Outlet } from 'react-router-dom';
import { useTenantConfig } from '../api/hooks';

function tabClass({ isActive }: { isActive: boolean }): string {
  return (
    'px-3 py-1.5 text-sm rounded-md border transition-colors ' +
    (isActive
      ? 'bg-slate-900 text-white border-slate-900'
      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100')
  );
}

export function AdminLayout(): React.ReactElement {
  const { data } = useTenantConfig();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin — konfigurace klienta</h1>
        <p className="text-sm text-slate-600 mt-1">
          Tenant <code className="font-mono">{data?.config.tenantId ?? '…'}</code>, aktivní verze{' '}
          <code className="font-mono">v{data?.version ?? '?'}</code>. Každé uložení vytvoří novou verzi
          a předchozí zůstanou v historii.
        </p>
      </div>
      <nav className="flex gap-2 flex-wrap">
        <NavLink to="/admin" end className={tabClass}>
          Labels
        </NavLink>
        <NavLink to="/admin/forms" className={tabClass}>
          Formuláře
        </NavLink>
        <NavLink to="/admin/transformers" className={tabClass}>
          Transformery
        </NavLink>
        <NavLink to="/admin/catalogs" className={tabClass}>
          Katalogy
        </NavLink>
        <NavLink to="/admin/spc" className={tabClass}>
          SPC
        </NavLink>
        <NavLink to="/admin/aqdef" className={tabClass}>
          AQDEF mapping
        </NavLink>
        <NavLink to="/admin/raw" className={tabClass}>
          Raw JSON
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
