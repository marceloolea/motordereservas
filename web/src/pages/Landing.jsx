import { Link } from 'react-router-dom';
import { GraduationCap, Stethoscope } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="font-semibold text-slate-900">Motor de Reservas</p>
          <Link
            to="/login"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
            Reserva tu próxima sesión
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Conectamos clientes con psicólogos y profesores. Elige el rol con el
            que quieres ingresar.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <Link
              to="/profesionales"
              className="group flex flex-col items-center gap-3 p-8 rounded-xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-sm transition"
            >
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <Stethoscope className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-900">Soy cliente</p>
              <p className="text-sm text-slate-500">
                Buscar profesionales y reservar un turno.
              </p>
              <span className="mt-2 text-sm font-medium text-slate-900 group-hover:underline">
                Ver profesionales →
              </span>
            </Link>

            <Link
              to="/register-pro"
              className="group flex flex-col items-center gap-3 p-8 rounded-xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-sm transition"
            >
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-900">Soy profesional</p>
              <p className="text-sm text-slate-500">
                Publicar tu disponibilidad y recibir reservas.
              </p>
              <span className="mt-2 text-sm font-medium text-slate-900 group-hover:underline">
                Crear cuenta →
              </span>
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-slate-900 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
