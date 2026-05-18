import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert } from '../../components/ui/Alert';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { full_name: '', email: '', phone: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await registerUser({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        password: values.password,
        role: 'professional',
      });
      navigate('/pro', { replace: true });
    } catch (err) {
      setServerError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Crear cuenta</h2>
      <p className="text-sm text-slate-500 mb-5">
        Registrate como profesional para ofrecer turnos.
      </p>

      {serverError && <Alert className="mb-4">{serverError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            type="text"
            autoComplete="name"
            error={errors.full_name}
            {...register('full_name', {
              required: 'Requerido',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            })}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email}
            {...register('email', {
              required: 'Requerido',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+56912345678"
            error={errors.phone}
            {...register('phone')}
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            {...register('password', {
              required: 'Requerido',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-600 text-center">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
