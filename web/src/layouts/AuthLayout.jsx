import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-semibold text-slate-900">
              Motor de Reservas
            </h1>
          </Link>
          <p className="text-sm text-slate-500 mt-1">
            Clientes y profesionales
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
