import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, CheckCircle2 } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { formatDateCL, formatTime, isBookingEndPassed } from '../../lib/datetime';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { StatusBadge } from '../../components/ui/StatusBadge';

const Field = ({ label, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <div className="text-sm text-slate-900 mt-0.5">{children}</div>
  </div>
);

export function BookingDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id),
  });

  const onActionSuccess = (updated) => {
    queryClient.setQueryData(['booking', id], updated);
    queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    setCancelOpen(false);
    setReason('');
    setActionError(null);
  };

  const onActionError = (err) =>
    setActionError(err?.message || 'No se pudo ejecutar la acción');

  const confirmMut = useMutation({
    mutationFn: () => bookingsApi.confirm(id),
    onSuccess: onActionSuccess,
    onError: onActionError,
  });
  const completeMut = useMutation({
    mutationFn: () => bookingsApi.complete(id),
    onSuccess: onActionSuccess,
    onError: onActionError,
  });
  const cancelMut = useMutation({
    mutationFn: () => bookingsApi.cancel(id, reason.trim() || undefined),
    onSuccess: onActionSuccess,
    onError: onActionError,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Cargando reserva…
      </div>
    );
  }
  if (isError) return <Alert>{error?.message || 'Error al cargar'}</Alert>;

  const b = data;
  const isPending = b.status === 'pending';
  const isConfirmed = b.status === 'confirmed';
  const canCancel = isPending || isConfirmed;
  const canComplete = isConfirmed && isBookingEndPassed(b.booking_date, b.end_time);
  const busy =
    confirmMut.isPending || completeMut.isPending || cancelMut.isPending;

  return (
    <div className="max-w-2xl">
      <Link
        to="/pro/bookings"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a reservas
      </Link>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {formatDateCL(b.booking_date)} ·{' '}
              <span className="font-mono">
                {formatTime(b.start_time)}–{formatTime(b.end_time)}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              ID: <span className="font-mono">{b.id}</span>
            </p>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Cliente">
            {b.client?.full_name || '—'}
            {b.client?.email && (
              <div className="text-xs text-slate-500">{b.client.email}</div>
            )}
            {b.client?.phone && (
              <div className="text-xs text-slate-500">{b.client.phone}</div>
            )}
          </Field>
          <Field label="Servicio">
            {b.professional?.specialization || '—'}
            {b.professional?.hourly_rate && (
              <div className="text-xs text-slate-500">
                ${b.professional.hourly_rate} CLP/h
              </div>
            )}
          </Field>
          {b.notes && (
            <Field label="Notas del cliente">
              <p className="whitespace-pre-wrap">{b.notes}</p>
            </Field>
          )}
          {b.confirmed_at && (
            <Field label="Confirmada el">
              {new Date(b.confirmed_at).toLocaleString('es-CL')}
            </Field>
          )}
          {b.completed_at && (
            <Field label="Completada el">
              {new Date(b.completed_at).toLocaleString('es-CL')}
            </Field>
          )}
          {b.cancelled_at && (
            <Field label="Cancelada el">
              {new Date(b.cancelled_at).toLocaleString('es-CL')}
            </Field>
          )}
          {b.cancellation_reason && (
            <Field label="Motivo de cancelación">
              {b.cancellation_reason}
            </Field>
          )}
        </div>

        {actionError && <Alert className="mb-4">{actionError}</Alert>}

        {!cancelOpen && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {isPending && (
              <Button onClick={() => confirmMut.mutate()} loading={busy}>
                <Check className="h-4 w-4" /> Confirmar
              </Button>
            )}
            {isConfirmed && (
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => completeMut.mutate()}
                  loading={busy}
                  disabled={!canComplete}
                  title={
                    !canComplete
                      ? 'Disponible una vez finalizada la sesión'
                      : undefined
                  }
                >
                  <CheckCircle2 className="h-4 w-4" /> Marcar completada
                </Button>
                {!canComplete && (
                  <p className="text-xs text-slate-500">
                    Podrás marcar como completada después de las{' '}
                    {formatTime(b.end_time)} del {formatDateCL(b.booking_date)}.
                  </p>
                )}
              </div>
            )}
            {canCancel && (
              <Button
                variant="danger"
                onClick={() => setCancelOpen(true)}
                disabled={busy}
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
            )}
            {!canCancel && (
              <p className="text-sm text-slate-500">
                Esta reserva está en estado final y no admite acciones.
              </p>
            )}
          </div>
        )}

        {cancelOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: imprevisto familiar, agenda saturada…"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setCancelOpen(false);
                  setReason('');
                }}
                disabled={busy}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => cancelMut.mutate()}
                loading={cancelMut.isPending}
              >
                Confirmar cancelación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
