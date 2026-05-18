import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Briefcase, Calendar, Clock, GraduationCap, Stethoscope,
} from 'lucide-react';
import { profileApi } from '../../api/profile.api';
import { availabilityApi } from '../../api/availability.api';
import { bookingsApi } from '../../api/bookings.api';
import { useAuth } from '../../hooks/useAuth';
import { addDaysISO, formatTime, longDateCL, todayISO } from '../../lib/datetime';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';

const TYPE_LABEL = { psychologist: 'Psicólogo/a', teacher: 'Profesor/a' };
const TYPE_ICON = { psychologist: Stethoscope, teacher: GraduationCap };

const RANGE_DAYS = 14;

const formatRate = (rate) => {
  if (rate == null || rate === '') return null;
  const n = Number(rate);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString('es-CL')}`;
};

export function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [serverError, setServerError] = useState(null);

  const profileQuery = useQuery({
    queryKey: ['profile', 'public', id],
    queryFn: () => profileApi.getById(id),
    retry: false,
  });

  const proUserId = profileQuery.data?.user_id;
  const from = todayISO();
  const to = addDaysISO(from, RANGE_DAYS);

  const slotsQuery = useQuery({
    queryKey: ['slots', proUserId, from, to],
    queryFn: () => availabilityApi.getSlots(proUserId, from, to),
    enabled: !!proUserId,
  });

  const groupedSlots = useMemo(() => {
    const slots = slotsQuery.data?.slots || [];
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return Array.from(map.entries());
  }, [slotsQuery.data]);

  const createBooking = useMutation({
    mutationFn: (payload) => bookingsApi.create(payload),
    onSuccess: () => {
      setSelectedSlot(null);
      setNotes('');
      navigate('/mis-reservas', { replace: true });
    },
    onError: (err) => setServerError(err.message || 'No se pudo crear la reserva'),
  });

  const onSlotClick = (slot) => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (user.role !== 'client') {
      setServerError('Iniciá sesión como cliente para reservar.');
      return;
    }
    setServerError(null);
    setSelectedSlot(slot);
  };

  const confirmBooking = () => {
    if (!selectedSlot || !proUserId) return;
    setServerError(null);
    createBooking.mutate({
      professional_id: proUserId,
      booking_date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      notes: notes.trim() || undefined,
    });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div>
        <BackLink />
        <Alert className="mt-4">
          {profileQuery.error?.message || 'No se pudo cargar el profesional'}
        </Alert>
      </div>
    );
  }

  const p = profileQuery.data;
  const Icon = TYPE_ICON[p.professional_type] || Briefcase;
  const rate = formatRate(p.hourly_rate);

  return (
    <div>
      <BackLink />

      <div className="mt-4 bg-white rounded-lg border border-slate-200 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {p.users?.full_name || 'Profesional'}
            </h1>
            <p className="text-sm text-slate-500">
              {TYPE_LABEL[p.professional_type] || p.professional_type}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {p.specialization}
            </p>
          </div>
        </div>

        {p.bio && (
          <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{p.bio}</p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Info icon={Clock} label="Duración" value={`${p.slot_duration_minutes || 60} min`} />
          {rate && <Info icon={Briefcase} label="Tarifa" value={rate} />}
          {p.experience_years != null && (
            <Info icon={Calendar} label="Experiencia" value={`${p.experience_years} años`} />
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Disponibilidad</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Próximos {RANGE_DAYS} días · Horario Chile
        </p>

        {serverError && <Alert className="mt-3">{serverError}</Alert>}

        {slotsQuery.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {slotsQuery.isError && (
          <Alert className="mt-3">
            {slotsQuery.error?.message || 'No se pudieron cargar los horarios'}
          </Alert>
        )}

        {!slotsQuery.isLoading && !slotsQuery.isError && groupedSlots.length === 0 && (
          <div className="mt-4 text-center py-12 text-slate-500 text-sm bg-white rounded-lg border border-slate-200">
            Este profesional no tiene horarios disponibles en los próximos {RANGE_DAYS} días.
          </div>
        )}

        <div className="mt-3 space-y-4">
          {groupedSlots.map(([date, slots]) => (
            <div key={date} className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-800 text-sm mb-3">
                {longDateCL(date)}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={`${s.date}-${s.start_time}`}
                    type="button"
                    disabled={s.is_booked}
                    onClick={() => onSlotClick(s)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                      s.is_booked
                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {formatTime(s.start_time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!selectedSlot}
        onClose={() => {
          if (createBooking.isPending) return;
          setSelectedSlot(null);
          setNotes('');
          setServerError(null);
        }}
        title="Confirmar reserva"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedSlot(null);
                setNotes('');
              }}
              disabled={createBooking.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmBooking} loading={createBooking.isPending}>
              Confirmar
            </Button>
          </>
        }
      >
        {selectedSlot && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-700">
              Vas a reservar con <strong>{p.users?.full_name}</strong>.
            </p>
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-slate-800 font-medium">
                {longDateCL(selectedSlot.date)}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">
                {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
              </p>
            </div>
            {rate && (
              <p className="text-slate-700">
                Tarifa: <strong>{rate}</strong>
              </p>
            )}
            <div>
              <Label htmlFor="notes">Notas para el profesional (opcional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: primera sesión, prefiero modalidad online…"
                maxLength={500}
              />
            </div>
            {serverError && <Alert>{serverError}</Alert>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/profesionales"
      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al listado
    </Link>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
