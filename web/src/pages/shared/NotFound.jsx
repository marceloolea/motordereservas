import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">404</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Página no encontrada
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
