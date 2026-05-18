import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/pro', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/pro/profile', label: 'Mi perfil', icon: User },
  { to: '/pro/schedule', label: 'Disponibilidad', icon: Clock },
  { to: '/pro/bookings', label: 'Reservas', icon: CalendarDays },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Motor de Reservas</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {user?.full_name || user?.email}
          </p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
