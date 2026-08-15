import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { FormField } from '@/components/common';
import { Button, Input, Select } from '@/components/ui';
import { DEPARTMENTS } from '@/types';
import { registerSchema, type RegisterFormValues } from '@/lib/validationSchemas';
import { register as registerAction } from '@/store/authSlice';

const rules = [
  { test: (v: string) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'An uppercase letter' },
  { test: (v: string) => /[a-z]/.test(v), label: 'A lowercase letter' },
  { test: (v: string) => /[0-9]/.test(v), label: 'A digit' },
  { test: (v: string) => /[^a-zA-Z0-9]/.test(v), label: 'A special character' },
];

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      department: '',
    },
  });

  const password = watch('password') ?? '';

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await dispatch(
        registerAction({
          username: values.username,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          fullName: values.fullName || undefined,
          department: values.department || undefined,
        }),
      ).unwrap();

      toast.success('Account created. You can now sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Registration failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New accounts are created with the <span className="font-medium">User</span> role.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Username" htmlFor="username" required error={errors.username?.message}>
          <Input id="username" placeholder="jdoe" error={!!errors.username} {...register('username')} />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
          </FormField>

          <FormField label="Department" htmlFor="department" error={errors.department?.message}>
            <Select id="department" {...register('department')}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              error={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {password.length > 0 && (
          <ul className="grid gap-1 rounded-md border p-3 sm:grid-cols-2">
            {rules.map(({ test, label }) => {
              const passed = test(password);
              return (
                <li
                  key={label}
                  className={`flex items-center gap-1.5 text-xs ${
                    passed ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {label}
                </li>
              );
            })}
          </ul>
        )}

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}