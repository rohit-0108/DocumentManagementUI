import type { PaginationParams } from './common';

export const DocumentStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export interface DocumentListItem {
  documentId: number;
  title: string;
  department: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  fileSizeFormatted: string;
  uploadedBy: number;
  uploadedByName: string;
  uploadedAt: string;
  status: DocumentStatus;
  statusName: string;
  approvedByName?: string | null;
  approvedAt?: string | null;
}

export interface DocumentDetail extends DocumentListItem {
  description?: string | null;
  fileExtension: string;
  approvedBy?: number | null;
  rejectionReason?: string | null;
  version: number;
  createdAt: string;
  updatedAt?: string | null;
  /** Per-caller permission flags computed server-side. */
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export interface UploadDocumentRequest {
  title: string;
  description?: string;
  department: string;
  file: File;
}

export interface UpdateDocumentRequest {
  title: string;
  description?: string;
  department: string;
}

export interface ApproveDocumentRequest {
  comments?: string;
}

export interface RejectDocumentRequest {
  reason: string;
}

export interface DocumentFilterParams extends PaginationParams {
  department?: string;
  status?: DocumentStatus;
  uploadedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  contentType?: string;
}