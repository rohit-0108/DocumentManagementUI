import type { AuditLog } from './auditLog';

export interface DepartmentCount {
  department: string;
  count: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  count: number;
}

export interface TopUploader {
  userId: number;
  username: string;
  fullName?: string | null;
  documentCount: number;
}

export interface DashboardStats {
  totalDocuments: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalUsers: number;
  activeUsers: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  documentsByDepartment: DepartmentCount[];
  uploadTrend: TrendPoint[];
  topUploaders: TopUploader[];
  recentActivity: AuditLog[];
}