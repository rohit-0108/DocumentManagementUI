import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '@/components/common';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginFormValues } from '@/lib/validationSchemas';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/documents';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await login(values);
      toast.success(`Welcome back, ${result.user.fullName ?? result.user.username}!`);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed.');
    }
  };

  const quickFill = (usernameOrEmail: string, password: string) => {
    (document.getElementById('usernameOrEmail') as HTMLInputElement).value = usernameOrEmail;
    (document.getElementById('password') as HTMLInputElement).value = password;
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your credentials to access your documents.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label="Username or email"
          htmlFor="usernameOrEmail"
          required
          error={errors.usernameOrEmail?.message}
        >
          <Input
            id="usernameOrEmail"
            autoComplete="username"
            placeholder="admin or admin@dps.local"
            error={!!errors.usernameOrEmail}
            {...register('usernameOrEmail')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              error={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting || loading}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>

      {/* Demo credentials — remove before production */}
      <div className="rounded-lg border border-dashed p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Demo accounts
        </p>
        <div className="mt-3 space-y-2">
          {[
            { label: 'Admin', user: 'admin', pass: 'Admin@123!' },
            { label: 'Approver', user: 'approver', pass: 'Approver@123!' },
            { label: 'User', user: 'user', pass: 'User@123!' },
          ].map(({ label, user, pass }) => (
            <button
              key={user}
              type="button"
              onClick={() => quickFill(user, pass)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
            >
              <span className="font-medium">{label}</span>
              <span className="font-mono text-muted-foreground">
                {user} / {pass}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}