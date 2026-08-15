import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Save, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { userApi, extractErrorMessage } from '@/api';
import { useAppDispatch } from '@/app/hooks';
import { FormField, RoleBadge } from '@/components/common';
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select,
} from '@/components/ui';
import { useAuth } from '@/hooks';
import { formatDateTime, getInitials } from '@/lib/utils';
import {
  changePasswordSchema, profileSchema,
  type ChangePasswordFormValues, type ProfileFormValues,
} from '@/lib/validationSchemas';
import { changePassword, setUser } from '@/store/authSlice';
import { DEPARTMENTS } from '@/types';

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------- profile form ----------
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      department: user?.department ?? '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      userApi.updateProfile({
        email: values.email,
        fullName: values.fullName || undefined,
        department: values.department || undefined,
      }),
    onSuccess: (updated) => {
      dispatch(setUser(updated));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile updated successfully.');
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  // ---------- password form ----------
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await dispatch(changePassword(values)).unwrap();
      toast.success('Password changed. Please sign in again.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Password change failed.');
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account details and password.</p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
            {getInitials(user.fullName ?? user.username)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{user.fullName ?? user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleBadge role={user.roleName} />
              {user.department && (
                <span className="text-xs text-muted-foreground">{user.department}</span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Member since {formatDateTime(user.createdAt)}</p>
            {user.lastLoginAt && <p>Last sign-in {formatDateTime(user.lastLoginAt)}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Account details
          </CardTitle>
          <CardDescription>Only an administrator can change your role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit((v) => profileMutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Email"
              htmlFor="email"
              required
              error={profileForm.formState.errors.email?.message}
            >
              <Input id="email" type="email" {...profileForm.register('email')} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                htmlFor="fullName"
                error={profileForm.formState.errors.fullName?.message}
              >
                <Input id="fullName" {...profileForm.register('fullName')} />
              </FormField>

              <FormField label="Department" htmlFor="department">
                <Select id="department" {...profileForm.register('department')}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={profileMutation.isPending}>
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change password
          </CardTitle>
          <CardDescription>
            Changing your password signs you out of all devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Current password"
              htmlFor="currentPassword"
              required
              error={passwordForm.formState.errors.currentPassword?.message}
            >
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="New password"
                htmlFor="newPassword"
                required
                error={passwordForm.formState.errors.newPassword?.message}
              >
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                />
              </FormField>

              <FormField
                label="Confirm new password"
                htmlFor="confirmNewPassword"
                required
                error={passwordForm.formState.errors.confirmNewPassword?.message}
              >
                <Input
                  id="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmNewPassword')}
                />
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="destructive"
                loading={passwordForm.formState.isSubmitting}
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}