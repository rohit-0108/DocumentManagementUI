import axiosClient, { unwrap } from './axiosClient';
import { parseFileName } from '@/lib/utils';
import type {
  ApiResponse,
  ApproveDocumentRequest,
  DocumentDetail,
  DocumentFilterParams,
  DocumentListItem,
  PagedResult,
  RejectDocumentRequest,
  UpdateDocumentRequest,
  UploadDocumentRequest,
} from '@/types';

export const documentApi = {
  async upload(
    payload: UploadDocumentRequest,
    onProgress?: (percent: number) => void,
  ): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append('Title', payload.title);
    if (payload.description) formData.append('Description', payload.description);
    formData.append('Department', payload.department);
    formData.append('File', payload.file);

    const response = await axiosClient.post<ApiResponse<DocumentDetail>>(
      '/documents/upload',
      formData,
      {
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      },
    );

    return unwrap(response);
  },

  async getAll(filter: DocumentFilterParams = {}): Promise<PagedResult<DocumentListItem>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<DocumentListItem>>>('/documents', {
      params: filter,
    });
    return unwrap(response);
  },

  async getPendingApproval(filter: DocumentFilterParams = {}): Promise<PagedResult<DocumentListItem>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<DocumentListItem>>>(
      '/documents/pending-approval',
      { params: filter },
    );
    return unwrap(response);
  },

  async getById(id: number): Promise<DocumentDetail> {
    const response = await axiosClient.get<ApiResponse<DocumentDetail>>(`/documents/${id}`);
    return unwrap(response);
  },

  async download(id: number): Promise<{ blob: Blob; fileName: string }> {
    const response = await axiosClient.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    return {
      blob: response.data,
      fileName: parseFileName(response.headers['content-disposition'], `document-${id}`),
    };
  },

  async update(id: number, payload: UpdateDocumentRequest): Promise<DocumentDetail> {
    const response = await axiosClient.put<ApiResponse<DocumentDetail>>(`/documents/${id}`, payload);
    return unwrap(response);
  },

  async remove(id: number): Promise<void> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/documents/${id}`);
    unwrap(response);
  },

  async approve(id: number, payload: ApproveDocumentRequest = {}): Promise<DocumentDetail> {
    const response = await axiosClient.patch<ApiResponse<DocumentDetail>>(
      `/documents/${id}/approve`,
      payload,
    );
    return unwrap(response);
  },

  async reject(id: number, payload: RejectDocumentRequest): Promise<DocumentDetail> {
    const response = await axiosClient.patch<ApiResponse<DocumentDetail>>(
      `/documents/${id}/reject`,
      payload,
    );
    return unwrap(response);
  },
};