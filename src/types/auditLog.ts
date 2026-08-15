import type { PaginationParams } from './common';

export const EntityType = {
  None: 'None',
  User: 'User',
  Document: 'Document',
  AuditLog: 'AuditLog',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export interface AuditLog {
  logId: number;
  correlationId: string;
  action: string;
  httpMethod: string;
  endpoint: string;
  userId?: number | null;
  username?: string | null;
  entityType: EntityType;
  entityTypeName: string;
  entityId?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  durationMs?: number | null;
  isSuccess: boolean;
  errorMessage?: string | null;
  createdAt: string;
}

/** All entries sharing one correlation id. */
export interface AuditLogTrace {
  correlationId: string;
  entryCount: number;
  startedAt: string;
  endedAt: string;
  totalDurationMs?: number | null;
  entries: AuditLog[];
}

export interface AuditLogFilterParams extends PaginationParams {
  userId?: number;
  action?: string;
  correlationId?: string;
  httpMethod?: string;
  entityType?: EntityType;
  entityId?: string;
  statusCode?: number;
  isSuccess?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export type ExportFormat = 'excel' | 'pdf';