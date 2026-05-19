import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-ink-100">
      <header className="pt-safe sticky top-0 z-20 bg-ink-950/85 backdrop-blur border-b border-ink-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="font-semibold tracking-tight text-ink-100 text-lg">
            <span className="text-accent-500">●</span> Festival
          </NavLink>
          <nav className="flex items-center gap-1 text-sm">
            <NavTab to="/" label="Eventos" />
            <NavTab to="/watch" label="Watch" />
            <NavTab to="/settings" label="Ajustes" />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-full transition ${
          isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-300 hover:text-ink-100'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
