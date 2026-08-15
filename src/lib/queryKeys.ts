import type { AuditLogFilterParams, DocumentFilterParams, UserFilterParams } from '@/types';

/** Centralised React Query cache keys so invalidation stays consistent. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (filter: DocumentFilterParams) => ['documents', 'list', filter] as const,
    pending: (filter: DocumentFilterParams) => ['documents', 'pending', filter] as const,
    detail: (id: number) => ['documents', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filter: UserFilterParams) => ['users', 'list', filter] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  auditLogs: {
    all: ['auditLogs'] as const,
    list: (filter: AuditLogFilterParams) => ['auditLogs', 'list', filter] as const,
    trace: (correlationId: string) => ['auditLogs', 'trace', correlationId] as const,
    recent: (count: number) => ['auditLogs', 'recent', count] as const,
  },
  dashboard: {
    stats: (trendDays: number) => ['dashboard', 'stats', trendDays] as const,
  },
};