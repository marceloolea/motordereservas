import { useState } from 'react';
import { Plus, Trash2, Ban, CalendarPlus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../../api/availability.api';
import { formatDateCL, formatTime, todayISO } from '../../../lib/datetime';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';

const EMPTY = {
  exception_date: '',
  type: 'block',
  start_time: '',
  end_time: '',
  reason: '',
};

function ExceptionForm({ onSubmit, onCancel, busy }) {
  const [values, setValues] = useState({ ...EMPTY, exception_date: todayISO() });
  const [error, setError] = useState(null);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!values.exception_date) {
      setError('La fecha es requerida');
      return;
    }
    const hasStart = !!values.start_time;
    const hasEnd = !!values.end_time;
    if (hasStart !== hasEnd) {
      setError('Indicá ambas horas o ninguna');
      return;
    }
    if (values.type === 'add' && (!hasStart || !hasEnd)) {
      setError('Para "agregar disponibilidad" las horas son obligatorias');
      return;
    }
    if (hasStart && hasEnd && values.start_time >= values.end_time) {
      setError('La hora de fin debe ser mayor');
      return;
    }
    try {
      await onSubmit({
        exception_date: values.exception_date,
        type: values.type,
        start_time: hasStart ? values.start_time : null,
        end_time: hasEnd ? values.end_time : null,
        reason: values.reason.trim() || null,
      });
    } catch (err) {
      const details = err?.details;
      setError(
        Array.isArray(details) && details.length
          ? details.join(' · ')
          : err?.message || 'Error'
      );
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Fecha</Label>
          <Input
            type="date"
            value={values.exception_date}
            min={todayISO()}
            onChange={(e) => set('exception_date', e.target.value)}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set('type', 'block')}
              className={`flex-1 h-10 rounded-md border text-sm font-medium inline-flex items-center justify-center gap-2 ${
                values.type === 'block'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Ban className="h-4 w-4" /> Bloquear
            </button>
            <button
              type="button"
              onClick={() => set('type', 'add')}
              className={`flex-1 h-10 rounded-md border text-sm font-medium inline-flex items-center justify-center gap-2 ${
                values.type === 'add'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CalendarPlus className="h-4 w-4" /> Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Hora inicio {values.type === 'add' ? '*' : '(opcional)'}</Label>
          <Input
            type="time"
            value={values.start_time}
            onChange={(e) => set('start_time', e.target.value)}
          />
        </div>
        <div>
          <Label>Hora fin {values.type === 'add' ? '*' : '(opcional)'}</Label>
          <Input
            type="time"
            value={values.end_time}
            onChange={(e) => set('end_time', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Motivo (opcional)</Label>
        <Input
          type="text"
          value={values.reason}
          maxLength={500}
          placeholder="Ej: feriado, congreso, etc."
          onChange={(e) => set('reason', e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-500">
        {values.type === 'block'
          ? 'Sin horas: bloquea el día completo. Con horas: bloquea solo ese rango.'
          : 'Agrega un rango de disponibilidad puntual fuera del horario semanal.'}
      </p>

      {error && <Alert>{error}</Alert>}

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={submit} loading={busy}>
          Guardar excepción
        </Button>
      </div>
    </div>
  );
}

export function ExceptionsSection() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['exceptions', 'me'],
    queryFn: () => availabilityApi.listExceptions(),
  });

  const createMut = useMutation({
    mutationFn: (payload) => availabilityApi.createException(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions', 'me'] });
      setAdding(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => availabilityApi.deleteException(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['exceptions', 'me'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Cargando excepciones…
      </div>
    );
  }
  if (isError) return <Alert>{error?.message || 'Error al cargar'}</Alert>;

  const today = todayISO();
  const upcoming = (data || []).filter((e) => e.exception_date >= today);
  const past = (data || []).filter((e) => e.exception_date < today);

  return (
    <div className="space-y-3">
      {!adding && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Agregar excepción
          </Button>
        </div>
      )}

      {adding && (
        <ExceptionForm
          onSubmit={(p) => createMut.mutateAsync(p)}
          onCancel={() => setAdding(false)}
          busy={createMut.isPending}
        />
      )}

      {upcoming.length === 0 && past.length === 0 && !adding && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-4 text-center">
          No tienes excepciones configuradas.
        </p>
      )}

      {upcoming.length > 0 && (
        <ExceptionList
          title="Próximas"
          items={upcoming}
          onDelete={(id) => deleteMut.mutate(id)}
          busy={deleteMut.isPending}
        />
      )}

      {past.length > 0 && (
        <ExceptionList
          title="Pasadas"
          items={past}
          onDelete={(id) => deleteMut.mutate(id)}
          busy={deleteMut.isPending}
          muted
        />
      )}
    </div>
  );
}

function ExceptionList({ title, items, onDelete, busy, muted = false }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((e) => (
          <li
            key={e.id}
            className={`bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
              muted ? 'opacity-70' : ''
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-900">
                  {formatDateCL(e.exception_date)}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    e.type === 'block'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {e.type === 'block' ? 'Bloqueo' : 'Disponibilidad extra'}
                </span>
                {e.start_time && e.end_time && (
                  <span className="text-xs font-mono text-slate-600">
                    {formatTime(e.start_time)}–{formatTime(e.end_time)}
                  </span>
                )}
                {!e.start_time && e.type === 'block' && (
                  <span className="text-xs text-slate-500">día completo</span>
                )}
              </div>
              {e.reason && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {e.reason}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDelete(e.id)}
              disabled={busy}
              className="text-slate-400 hover:text-red-600 disabled:opacity-50 shrink-0"
              aria-label="Eliminar excepción"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
