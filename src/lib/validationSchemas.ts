import { z } from 'zod';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(100, 'Password is too long.')
  .regex(/[A-Z]/, 'Must contain an uppercase letter.')
  .regex(/[a-z]/, 'Must contain a lowercase letter.')
  .regex(/[0-9]/, 'Must contain a digit.')
  .regex(/[^a-zA-Z0-9]/, 'Must contain a special character.');

// ==================== AUTH ====================

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required.').max(150),
  password: z.string().min(1, 'Password is required.').max(100),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'At least 3 characters.')
      .max(50)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, digits, dot, underscore and hyphen.'),
    email: z.string().min(1, 'Email is required.').email('Enter a valid email address.').max(150),
    password: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    fullName: z.string().max(150).optional().or(z.literal('')),
    department: z.string().max(100).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordRules,
    confirmNewPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'The new password must differ from the current one.',
    path: ['newPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.').max(150),
  fullName: z.string().max(150).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

// ==================== DOCUMENTS ====================

export const uploadDocumentSchema = z.object({
  title: z.string().min(3, 'At least 3 characters.').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  department: z.string().min(1, 'Select a department.').max(100),
  file: z
    .instanceof(File, { message: 'A file is required.' })
    .refine((f) => f.size > 0, 'The selected file is empty.')
    .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, `Maximum size is ${MAX_FILE_SIZE_MB} MB.`)
    .refine(
      (f) => ALLOWED_EXTENSIONS.includes(f.name.slice(f.name.lastIndexOf('.')).toLowerCase()),
      `Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    ),
});
export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

export const updateDocumentSchema = z.object({
  title: z.string().min(3, 'At least 3 characters.').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  department: z.string().min(1, 'Select a department.').max(100),
});
export type UpdateDocumentFormValues = z.infer<typeof updateDocumentSchema>;

export const rejectDocumentSchema = z.object({
  reason: z.string().min(5, 'At least 5 characters.').max(500),
});
export type RejectDocumentFormValues = z.infer<typeof rejectDocumentSchema>;

export const approveDocumentSchema = z.object({
  comments: z.string().max(500).optional().or(z.literal('')),
});
export type ApproveDocumentFormValues = z.infer<typeof approveDocumentSchema>;

// ==================== USERS (admin) ====================

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters.')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, digits, dot, underscore and hyphen.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.').max(150),
  password: passwordRules,
  fullName: z.string().max(150).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  role: z.enum(['Admin', 'Approver', 'User']),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().max(150).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  role: z.enum(['Admin', 'Approver', 'User']),
  isActive: z.boolean(),
});
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;