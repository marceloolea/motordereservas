import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { StatusBadge, STATUS_OPTIONS } from '../../components/ui/StatusBadge';
import { formatTime, longDateCL } from '../../lib/datetime';

export function MyBookingsPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookings', 'me', 'client', status],
    queryFn: () =>
      bookingsApi.listMine({ role: 'client', status: status || undefined }),
  });

  const bookings = data || [];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mis reservas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y próximos turnos.
          </p>
        </div>
        <div className="sm:w-56">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {isError && (
        <Alert>{error?.message || 'No se pudieron cargar las reservas'}</Alert>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Aún no tienes reservas.</p>
          <Link
            to="/profesionales"
            className="inline-block mt-3 text-sm font-medium text-slate-900 hover:underline"
          >
            Ver profesionales →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <Link
            key={b.id}
            to={`/mis-reservas/${b.id}`}
            className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-900 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">
                  {b.professional?.user?.full_name || 'Profesional'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {b.professional?.specialization || ''}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {longDateCL(b.booking_date)} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
