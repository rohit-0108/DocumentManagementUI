import type { PaginationParams } from './common';

export const UserRole = {
  Admin: 'Admin',
  Approver: 'Approver',
  User: 'User',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Safe user projection — the API never returns a password hash. */
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName?: string | null;
  department?: string | null;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface UserListItem extends User {
  documentCount: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  department?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  department?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  email: string;
  fullName?: string;
  department?: string;
}

export interface UserFilterParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  department?: string;
}