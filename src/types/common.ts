/** Uniform envelope returned by every API endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  correlationId?: string | null;
  timestamp: string;
}

/** Standard pagination payload for all list endpoints. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Base query-string parameters for paged endpoints. */
export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export const DEPARTMENTS = [
  'HR',
  'Finance',
  'IT',
  'Legal',
  'Operations',
  'Sales',
  'Marketing',
] as const;

export type Department = (typeof DEPARTMENTS)[number];