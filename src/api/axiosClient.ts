import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/constants';
import { tokenStorage } from './tokenStorage';
import type { ApiResponse, AuthResponse } from '@/types';

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== REQUEST INTERCEPTOR ====================
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let axios set the multipart boundary itself
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ==================== REFRESH QUEUE ====================
let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null): void {
  queue.forEach(({ resolve, reject }) => (error || !token ? reject(error) : resolve(token)));
  queue = [];
}

function forceLogout(message = 'Your session has expired. Please sign in again.'): void {
  tokenStorage.clear();
  if (!window.location.pathname.startsWith('/login')) {
    toast.error(message);
    window.location.href = '/login';
  }
}

// ==================== RESPONSE INTERCEPTOR ====================
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Surface the correlation id for support/debugging
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId) {
      (response as AxiosResponse & { correlationId?: string }).correlationId = correlationId;
    }
    return response;
  },

  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as RetriableRequest | undefined;
    const status = error.response?.status;

    // ---- Network / server unreachable ----
    if (!error.response) {
      toast.error('Cannot reach the server. Check that the API is running.');
      return Promise.reject(error);
    }

    // ---- 401: try one silent refresh ----
    if (status === 401 && original && !original._retry) {
      const refreshToken = tokenStorage.getRefreshToken();
      const accessToken = tokenStorage.getAccessToken();

      if (!refreshToken || !accessToken || original.url?.includes('/auth/')) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Park this request until the in-flight refresh finishes
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              if (original.headers) original.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<AuthResponse>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { accessToken, refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        if (!data.success || !data.data) throw new Error(data.message);

        tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
        tokenStorage.setUser(data.data.user);

        flushQueue(null, data.data.accessToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        }
        return axiosClient(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ---- 403 ----
    if (status === 403) {
      toast.error("You don't have permission to perform this action.");
    }

    // ---- 5xx ----
    if (status && status >= 500) {
      const correlationId = error.response.headers['x-correlation-id'];
      toast.error(
        correlationId
          ? `Server error. Reference: ${String(correlationId).slice(0, 8)}`
          : 'A server error occurred. Please try again.',
      );
    }

    return Promise.reject(error);
  },
);

/** Extracts a readable message from an API error response. */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const payload = error.response?.data;
    if (payload?.errors?.length) return payload.errors.join(' ');
    if (payload?.message) return payload.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Unwraps ApiResponse<T> and throws on failure so React Query handles errors uniformly. */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (!body.success) {
    throw new Error(body.errors?.length ? body.errors.join(' ') : body.message);
  }
  return body.data as T;
}

export default axiosClient;