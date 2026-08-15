export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Document Processing System';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://docmngsys.runasp.net/api';

export const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB ?? 25);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_EXTENSIONS = (
  import.meta.env.VITE_ALLOWED_EXTENSIONS ?? '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'
).split(',');

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 15000);

export const STORAGE_KEYS = {
  accessToken: 'dps_access_token',
  refreshToken: 'dps_refresh_token',
  user: 'dps_user',
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;