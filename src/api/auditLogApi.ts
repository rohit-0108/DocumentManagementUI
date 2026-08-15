import axiosClient, { unwrap } from './axiosClient';
import { parseFileName } from '@/lib/utils';
import type {
  ApiResponse,
  AuditLog,
  AuditLogFilterParams,
  AuditLogTrace,
  ExportFormat,
  PagedResult,
} from '@/types';

export const auditLogApi = {
  async getAll(filter: AuditLogFilterParams = {}): Promise<PagedResult<AuditLog>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AuditLog>>>('/auditlogs', {
      params: filter,
    });
    return unwrap(response);
  },

  async getByCorrelationId(correlationId: string): Promise<AuditLogTrace> {
    const response = await axiosClient.get<ApiResponse<AuditLogTrace>>(`/auditlogs/${correlationId}`);
    return unwrap(response);
  },

  async getRecent(count = 20): Promise<AuditLog[]> {
    const response = await axiosClient.get<ApiResponse<AuditLog[]>>('/auditlogs/recent', {
      params: { count },
    });
    return unwrap(response);
  },

  async export(
    format: ExportFormat,
    filter: AuditLogFilterParams = {},
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await axiosClient.get<Blob>('/auditlogs/export', {
      params: { ...filter, format },
      responseType: 'blob',
    });

    const fallback = `AuditLog.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    return {
      blob: response.data,
      fileName: parseFileName(response.headers['content-disposition'], fallback),
    };
  },
};