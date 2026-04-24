import { NavLink, Outlet } from 'react-router-dom';
import { breweryTenant } from '../demo/tenant-config';

function navClass({ isActive }: { isActive: boolean }): string {
  return (
    'px-3 py-2 rounded-md text-sm font-medium transition-colors ' +
    (isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900')
  );
}

export function Layout(): React.ReactElement {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-900 text-lg">p4-spc</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {breweryTenant.tenantName}
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Přehled
            </NavLink>
            <NavLink to="/products" className={navClass}>
              Produkty
            </NavLink>
            <NavLink to="/lab" className={navClass}>
              Laboratoř
            </NavLink>
            <NavLink to="/measurements" className={navClass}>
              Zadat měření
            </NavLink>
          </nav>
          <div className="ml-auto text-xs text-slate-500">
            Demo — data jsou generována lokálně, nic se neukládá.
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-slate-500 flex justify-between">
          <span>p4-spc · Performance4 SPC platform</span>
          <span>
            SPC výpočty poháněné <code className="text-slate-700">@p4-spc/spc-engine</code>
          </span>
        </div>
      </footer>
    </div>
  );
}
