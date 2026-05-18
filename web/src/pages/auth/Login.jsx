import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert } from '../../components/ui/Alert';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const user = await login(values.email.trim(), values.password);
      const fallback = user.role === 'professional' ? '/pro' : '/profesionales';
      const to = location.state?.from?.pathname || fallback;
      navigate(to, { replace: true });
    } catch (err) {
      setServerError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Iniciar sesión</h2>
      <p className="text-sm text-slate-500 mb-5">
        Ingresa con tu cuenta de cliente o profesional.
      </p>

      {serverError && (
        <Alert className="mb-4">{serverError}</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            {...register('password', { required: 'Requerido' })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-600 text-center">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-slate-900 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
