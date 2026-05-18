import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { formatDateCL, formatTime } from '../../lib/datetime';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  StatusBadge,
  STATUS_OPTIONS,
} from '../../components/ui/StatusBadge';

export function BookingsPage() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookings', 'me', 'professional', { status, from, to }],
    queryFn: () =>
      bookingsApi.listMine({
        role: 'professional',
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Reservas</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Tus turnos como profesional. Confirmá, completá o cancelá desde el
          detalle.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>Estado</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Desde</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner /> Cargando reservas…
        </div>
      )}

      {isError && <Alert>{error?.message || 'Error al cargar'}</Alert>}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-6 text-center">
          No hay reservas para los filtros seleccionados.
        </p>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <ul className="space-y-2">
          {data.map((b) => (
            <li key={b.id}>
              <Link
                to={`/pro/bookings/${b.id}`}
                className="block bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-400 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">
                        {formatDateCL(b.booking_date)}
                      </span>
                      <span className="font-mono text-sm text-slate-600">
                        {formatTime(b.start_time)}–{formatTime(b.end_time)}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-slate-600 mt-1 truncate">
                      Cliente:{' '}
                      <span className="text-slate-900">
                        {b.client?.full_name || '—'}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
