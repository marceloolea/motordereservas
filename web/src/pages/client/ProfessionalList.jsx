import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Clock, GraduationCap, Search, Stethoscope } from 'lucide-react';
import { profileApi } from '../../api/profile.api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

const TYPE_LABEL = {
  psychologist: 'Psicólogo/a',
  teacher: 'Profesor/a',
};

const TYPE_ICON = {
  psychologist: Stethoscope,
  teacher: GraduationCap,
};

const formatRate = (rate) => {
  if (rate == null || rate === '') return null;
  const n = Number(rate);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString('es-CL')}`;
};

export function ProfessionalListPage() {
  const [type, setType] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['profiles', 'list', type, specialization],
    queryFn: () =>
      profileApi.list({
        professional_type: type || undefined,
        specialization: specialization.trim() || undefined,
        limit: 50,
      }),
  });

  const items = data?.items || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Profesionales</h1>
        <p className="text-sm text-slate-500 mt-1">
          Busca un profesional y reserva tu próximo turno.
        </p>
      </div>

      <div className="grid sm:grid-cols-[180px_1fr] gap-3 mb-6">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="psychologist">Psicólogos</option>
          <option value="teacher">Profesores</option>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por especialidad…"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <Alert className="mb-4">
          {error?.message || 'No se pudo cargar el listado'}
        </Alert>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No hay profesionales que coincidan con tu búsqueda.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => {
          const Icon = TYPE_ICON[p.professional_type] || Briefcase;
          const rate = formatRate(p.hourly_rate);
          return (
            <Link
              key={p.id}
              to={`/profesionales/${p.id}`}
              className="group bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-900 hover:shadow-sm transition flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {p.users?.full_name || 'Profesional'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABEL[p.professional_type] || p.professional_type}
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-800">
                {p.specialization}
              </p>

              {p.bio && (
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {p.bio}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {p.slot_duration_minutes || 60} min
                </span>
                {rate && <span className="font-semibold text-slate-700">{rate}</span>}
              </div>

              <span className="mt-3 inline-block text-sm font-medium text-slate-900 group-hover:underline">
                Ver disponibilidad →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
