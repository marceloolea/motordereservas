import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Calendar, Clock } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatTime, longDateCL } from '../../lib/datetime';

export function MyBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [serverError, setServerError] = useState(null);

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id),
    retry: false,
  });

  const cancelMut = useMutation({
    mutationFn: () => bookingsApi.cancel(id, reason.trim() || undefined),
    onSuccess: () => {
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me', 'client'] });
    },
    onError: (err) => setServerError(err.message || 'No se pudo cancelar'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div>
        <Back />
        <Alert className="mt-4">
          {error?.message || 'No se pudo cargar la reserva'}
        </Alert>
      </div>
    );
  }

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div>
      <Back />

      <div className="mt-4 bg-white rounded-lg border border-slate-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Detalle de reserva</h1>
          <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-3 text-sm">
          <Row icon={Calendar} label="Fecha" value={longDateCL(booking.booking_date)} />
          <Row
            icon={Clock}
            label="Horario"
            value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`}
          />
          <Row
            icon={Briefcase}
            label="Profesional"
            value={
              <span>
                {booking.professional?.user?.full_name || '—'}
                {booking.professional?.specialization && (
                  <span className="text-slate-500"> · {booking.professional.specialization}</span>
                )}
              </span>
            }
          />
        </div>

        {booking.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Tus notas</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
          </div>
        )}

        {booking.cancellation_reason && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Motivo de cancelación</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {booking.cancellation_reason}
            </p>
          </div>
        )}
      </div>

      {canCancel && (
        <div className="mt-4 flex justify-end">
          <Button variant="danger" onClick={() => setCancelOpen(true)}>
            Cancelar reserva
          </Button>
        </div>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => !cancelMut.isPending && setCancelOpen(false)}
        title="Cancelar reserva"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCancelOpen(false)}
              disabled={cancelMut.isPending}
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
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-700">
            ¿Seguro que querés cancelar esta reserva?
          </p>
          <div>
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>
          {serverError && <Alert>{serverError}</Alert>}
        </div>
      </Modal>
    </div>
  );

  function Back() {
    return (
      <Link
        to="/mis-reservas"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
    );
  }
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}
