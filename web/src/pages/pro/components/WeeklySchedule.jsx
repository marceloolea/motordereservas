import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../../api/availability.api';
import { DAYS_OF_WEEK, formatTime } from '../../../lib/datetime';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function DayCard({ day, schedules, onAdd, onDelete, busy }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [error, setError] = useState(null);

  const handleAdd = async () => {
    setError(null);
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
      setError('Formato HH:MM');
      return;
    }
    if (start >= end) {
      setError('La hora de fin debe ser mayor');
      return;
    }
    try {
      await onAdd({ day_of_week: day.value, start_time: start, end_time: end });
      setOpen(false);
      setStart('09:00');
      setEnd('13:00');
    } catch (err) {
      setError(err?.message || 'Error');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-slate-900">{day.label}</h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>

      {schedules.length === 0 && !open && (
        <p className="text-xs text-slate-400">Sin franjas configuradas.</p>
      )}

      <ul className="space-y-1">
        {schedules.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between text-sm bg-slate-50 rounded px-3 py-1.5"
          >
            <span className="font-mono text-slate-700">
              {formatTime(s.start_time)} – {formatTime(s.end_time)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              disabled={busy}
              className="text-slate-400 hover:text-red-600 disabled:opacity-50"
              aria-label="Eliminar franja"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="!h-9 text-sm"
            />
            <span className="text-slate-400 text-sm">–</span>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="!h-9 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} loading={busy}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklySchedule() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['schedules', 'me'],
    queryFn: () => availabilityApi.listSchedules(),
  });

  const createMut = useMutation({
    mutationFn: (payload) => availabilityApi.createSchedule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules', 'me'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => availabilityApi.deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules', 'me'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Cargando horario…
      </div>
    );
  }
  if (isError) return <Alert>{error?.message || 'Error al cargar'}</Alert>;

  const byDay = (dow) => (data || []).filter((s) => s.day_of_week === dow);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {DAYS_OF_WEEK.map((day) => (
        <DayCard
          key={day.value}
          day={day}
          schedules={byDay(day.value)}
          onAdd={(p) => createMut.mutateAsync(p)}
          onDelete={(id) => deleteMut.mutate(id)}
          busy={createMut.isPending || deleteMut.isPending}
        />
      ))}
    </div>
  );
}
