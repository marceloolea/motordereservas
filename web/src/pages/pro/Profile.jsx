import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

const PROFESSIONAL_TYPES = [
  { value: 'psychologist', label: 'Psicólogo/a' },
  { value: 'teacher', label: 'Profesor/a' },
];

const EMPTY = {
  professional_type: '',
  specialization: '',
  bio: '',
  hourly_rate: '',
  experience_years: '',
  slot_duration_minutes: '',
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      try {
        return await profileApi.me();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (data) {
      reset({
        professional_type: data.professional_type || '',
        specialization: data.specialization || '',
        bio: data.bio || '',
        hourly_rate: data.hourly_rate ?? '',
        experience_years: data.experience_years ?? '',
        slot_duration_minutes: data.slot_duration_minutes ?? '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => profileApi.upsert(payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(['profile', 'me'], saved);
      setSuccessMsg(data ? 'Perfil actualizado' : 'Perfil creado');
      setServerError(null);
    },
    onError: (err) => {
      const details = err?.details;
      const msg = Array.isArray(details) && details.length
        ? details.join(' · ')
        : err?.message || 'No se pudo guardar el perfil';
      setServerError(msg);
      setSuccessMsg(null);
    },
  });

  const onSubmit = (values) => {
    setServerError(null);
    setSuccessMsg(null);
    const payload = {
      professional_type: values.professional_type,
      specialization: values.specialization.trim(),
      bio: values.bio?.trim() || null,
      hourly_rate:
        values.hourly_rate === '' ? null : Number(values.hourly_rate),
      experience_years:
        values.experience_years === '' ? null : Number(values.experience_years),
      slot_duration_minutes:
        values.slot_duration_minutes === ''
          ? null
          : Number(values.slot_duration_minutes),
    };
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> Cargando perfil…
      </div>
    );
  }

  if (isError) {
    return (
      <Alert>
        {error?.message || 'No se pudo cargar el perfil'}
      </Alert>
    );
  }

  const isNew = !data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-slate-600 mt-1 text-sm">
          {isNew
            ? 'Completá tu perfil profesional para que los clientes puedan encontrarte.'
            : 'Actualizá los datos de tu perfil profesional.'}
        </p>
      </div>

      {serverError && <Alert className="mb-4">{serverError}</Alert>}
      {successMsg && (
        <Alert variant="success" className="mb-4">
          {successMsg}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-slate-200 rounded-lg p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="professional_type">Tipo de profesional *</Label>
            <Select
              id="professional_type"
              error={errors.professional_type}
              {...register('professional_type', { required: 'Requerido' })}
            >
              <option value="">Seleccionar…</option>
              {PROFESSIONAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            {errors.professional_type && (
              <p className="mt-1 text-xs text-red-600">
                {errors.professional_type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="specialization">Especialización *</Label>
            <Input
              id="specialization"
              type="text"
              placeholder="Ej: Terapia cognitivo-conductual"
              error={errors.specialization}
              {...register('specialization', {
                required: 'Requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 150, message: 'Máximo 150 caracteres' },
              })}
            />
            {errors.specialization && (
              <p className="mt-1 text-xs text-red-600">
                {errors.specialization.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Biografía</Label>
          <Textarea
            id="bio"
            rows={5}
            placeholder="Contale a tus clientes sobre tu experiencia, enfoque y especialidades."
            error={errors.bio}
            {...register('bio', {
              maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
            })}
          />
          {errors.bio && (
            <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="hourly_rate">Tarifa por hora (CLP)</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              step="1"
              placeholder="30000"
              error={errors.hourly_rate}
              {...register('hourly_rate', {
                min: { value: 0, message: 'Debe ser ≥ 0' },
              })}
            />
            {errors.hourly_rate && (
              <p className="mt-1 text-xs text-red-600">
                {errors.hourly_rate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="experience_years">Años de experiencia</Label>
            <Input
              id="experience_years"
              type="number"
              min="0"
              max="80"
              step="1"
              placeholder="5"
              error={errors.experience_years}
              {...register('experience_years', {
                min: { value: 0, message: 'Mín 0' },
                max: { value: 80, message: 'Máx 80' },
              })}
            />
            {errors.experience_years && (
              <p className="mt-1 text-xs text-red-600">
                {errors.experience_years.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="slot_duration_minutes">
              Duración de sesión (min)
            </Label>
            <Input
              id="slot_duration_minutes"
              type="number"
              min="1"
              max="480"
              step="1"
              placeholder="60"
              error={errors.slot_duration_minutes}
              {...register('slot_duration_minutes', {
                min: { value: 1, message: 'Mín 1' },
                max: { value: 480, message: 'Máx 480' },
              })}
            />
            {errors.slot_duration_minutes && (
              <p className="mt-1 text-xs text-red-600">
                {errors.slot_duration_minutes.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" loading={mutation.isPending}>
            {isNew ? 'Crear perfil' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
