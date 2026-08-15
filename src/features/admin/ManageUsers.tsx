import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Search, UserPlus, Users as UsersIcon, UserX, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userApi, extractErrorMessage } from '@/api';
import {
  BooleanBadge, ConfirmDialog, EmptyState, ErrorState, FormField, Pagination, RoleBadge,
} from '@/components/common';
import {
  Button, Card, CardContent, Dialog, Input, Select, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow, TableSkeleton,
} from '@/components/ui';
import { useAuth, useDebounce, usePagination } from '@/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime, getInitials } from '@/lib/utils';
import {
  createUserSchema, updateUserSchema,
  type CreateUserFormValues, type UpdateUserFormValues,
} from '@/lib/validationSchemas';
import { DEPARTMENTS, UserRole, type UserFilterParams, type UserListItem } from '@/types';

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);

  const debouncedSearch = useDebounce(search);

  const filter: UserFilterParams = {
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: pagination.sortBy,
    sortDesc: pagination.sortDesc,
    search: debouncedSearch || undefined,
    role: (role as UserRole) || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.users.list(filter),
    queryFn: () => userApi.getAll(filter),
    placeholderData: (previous) => previous,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  // ---------- mutations ----------
  const createMutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      userApi.create({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName || undefined,
        department: values.department || undefined,
        role: values.role as UserRole,
      }),
    onSuccess: (u) => {
      invalidate();
      setCreateOpen(false);
      createForm.reset();
      toast.success(`User "${u.username}" created.`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateUserFormValues }) =>
      userApi.update(id, {
        fullName: values.fullName || undefined,
        department: values.department || undefined,
        role: values.role as UserRole,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      invalidate();
      setEditTarget(null);
      toast.success('User updated.');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.deactivate(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('User deactivated.');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  // ---------- forms ----------
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '', email: '', password: '', fullName: '', department: '', role: 'User',
    },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    values: {
      fullName: editTarget?.fullName ?? '',
      department: editTarget?.department ?? '',
      role: (editTarget?.role ?? 'User') as 'Admin' | 'Approver' | 'User',
      isActive: editTarget?.isActive ?? true,
    },
  });

  const clearFilters = () => {
    setSearch('');
    setRole('');
    setIsActive('');
    pagination.setPageNumber(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UsersIcon className="h-6 w-6 text-primary" />
            Manage users
          </h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.totalCount} user(s)` : 'Loading…'}
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username, email or full name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                pagination.setPageNumber(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              pagination.setPageNumber(1);
            }}
            className="sm:w-40"
          >
            <option value="">All roles</option>
            <option value={UserRole.Admin}>Admin</option>
            <option value={UserRole.Approver}>Approver</option>
            <option value={UserRole.User}>User</option>
          </Select>

          <Select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              pagination.setPageNumber(1);
            }}
            className="sm:w-36"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : isError ? (
            <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users found" description="Adjust your filters." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last sign-in</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.items.map((u) => {
                    const isSelf = u.userId === currentUser?.userId;
                    return (
                      <TableRow key={u.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                              {getInitials(u.fullName ?? u.username)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {u.fullName ?? u.username}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                                )}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.department ?? '—'}
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.roleName} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.documentCount}</TableCell>
                        <TableCell>
                          <BooleanBadge value={u.isActive} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => setEditTarget(u)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title={isSelf ? 'You cannot deactivate yourself' : 'Deactivate'}
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                pageNumber={data.pageNumber}
                pageSize={data.pageSize}
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                hasPreviousPage={data.hasPreviousPage}
                hasNextPage={data.hasNextPage}
                onPageChange={pagination.setPageNumber}
                onPageSizeChange={pagination.setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------- Create dialog ---------- */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create user"
        description="The account is active immediately with the role you choose."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createForm.handleSubmit((v) => createMutation.mutate(v))}
              loading={createMutation.isPending}
            >
              <UserPlus className="h-4 w-4" />
              Create user
            </Button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Username" required error={createForm.formState.errors.username?.message}>
              <Input {...createForm.register('username')} />
            </FormField>
            <FormField label="Email" required error={createForm.formState.errors.email?.message}>
              <Input type="email" {...createForm.register('email')} />
            </FormField>
          </div>

          <FormField
            label="Password"
            required
            error={createForm.formState.errors.password?.message}
            hint="Min 8 chars with upper, lower, digit and special character."
          >
            <Input type="password" {...createForm.register('password')} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" error={createForm.formState.errors.fullName?.message}>
              <Input {...createForm.register('fullName')} />
            </FormField>
            <FormField label="Department">
              <Select {...createForm.register('department')}>
                <option value="">Select…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Role" required error={createForm.formState.errors.role?.message}>
            <Select {...createForm.register('role')}>
              <option value="User">User — upload and view own documents</option>
              <option value="Approver">Approver — review and approve documents</option>
              <option value="Admin">Admin — full access</option>
            </Select>
          </FormField>
        </form>
      </Dialog>

      {/* ---------- Edit dialog ---------- */}
      <Dialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.username ?? ''}`}
        description="Changing a role takes effect the next time the user signs in."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={editForm.handleSubmit((v) =>
                editTarget && updateMutation.mutate({ id: editTarget.userId, values: v }),
              )}
              loading={updateMutation.isPending}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form className="space-y-4" noValidate>
          <FormField label="Full name" error={editForm.formState.errors.fullName?.message}>
            <Input {...editForm.register('fullName')} />
          </FormField>

          <FormField label="Department">
            <Select {...editForm.register('department')}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Role" required error={editForm.formState.errors.role?.message}>
            <Select {...editForm.register('role')}>
              <option value="User">User</option>
              <option value="Approver">Approver</option>
              <option value="Admin">Admin</option>
            </Select>
          </FormField>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...editForm.register('isActive')}
            />
            <span className="text-sm font-medium">Account is active</span>
          </label>
        </form>
      </Dialog>

      {/* ---------- Deactivate confirm ---------- */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Deactivate this user?"
        message={
          deleteTarget
            ? `"${deleteTarget.username}" will no longer be able to sign in. Their documents are preserved.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.userId)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}