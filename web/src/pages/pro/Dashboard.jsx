import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { bookingsApi } from '../../api/bookings.api';
import { todayISO, formatDateCL, formatTime } from '../../lib/datetime';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: bookings } = useQuery({
    queryKey: ['bookings', 'me', 'professional', 'dashboard'],
    queryFn: () =>
      bookingsApi.listMine({ role: 'professional', from: todayISO() }),
  });

  const upcoming = (bookings || []).filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const pending = upcoming.filter((b) => b.status === 'pending').length;
  const confirmed = upcoming.filter((b) => b.status === 'confirmed').length;
  const next = [...upcoming]
    .sort((a, b) =>
      `${a.booking_date}${a.start_time}`.localeCompare(
        `${b.booking_date}${b.start_time}`
      )
    )
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Hola, {user?.full_name?.split(' ')[0] || 'profesional'} 👋
      </h1>
      <p className="text-slate-600 mt-1">
        Bienvenido al panel. Desde acá vas a poder gestionar tu perfil,
        disponibilidad y reservas.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Próximas reservas
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {upcoming.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Pendientes de confirmar
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {pending}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Confirmadas
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {confirmed}
          </p>
        </div>
      </div>

      {next.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Próximas
          </h2>
          <ul className="space-y-2">
            {next.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/pro/bookings/${b.id}`}
                  className="block bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-400 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">
                      {formatDateCL(b.booking_date)}
                    </span>
                    <span className="font-mono text-sm text-slate-600">
                      {formatTime(b.start_time)}–{formatTime(b.end_time)}
                    </span>
                    <StatusBadge status={b.status} />
                    <span className="text-sm text-slate-500 truncate">
                      · {b.client?.full_name || '—'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
