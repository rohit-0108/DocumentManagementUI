import axiosClient, { unwrap } from './axiosClient';
import type {
  ApiResponse,
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  User,
} from '@/types';

export const authApi = {
  async register(payload: RegisterRequest): Promise<User> {
    const response = await axiosClient.post<ApiResponse<User>>('/auth/register', payload);
    return unwrap(response);
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return unwrap(response);
  },

  async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', payload);
    return unwrap(response);
  },

  async logout(payload: LogoutRequest): Promise<void> {
    await axiosClient.post<ApiResponse<null>>('/auth/logout', payload);
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    const response = await axiosClient.post<ApiResponse<null>>('/auth/change-password', payload);
    unwrap(response);
  },

  async me(): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>('/auth/me');
    return unwrap(response);
  },
};