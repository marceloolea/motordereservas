import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarCheck, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isClient = user?.role === 'client';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            Motor de Reservas
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/profesionales"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Profesionales
            </NavLink>

            {isClient && (
              <NavLink
                to="/mis-reservas"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <CalendarCheck className="h-4 w-4" />
                Mis reservas
              </NavLink>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Crear cuenta</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
