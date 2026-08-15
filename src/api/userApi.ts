import axiosClient, { unwrap } from './axiosClient';
import type {
  ApiResponse,
  CreateUserRequest,
  PagedResult,
  UpdateProfileRequest,
  UpdateUserRequest,
  User,
  UserFilterParams,
  UserListItem,
} from '@/types';

export const userApi = {
  async getAll(filter: UserFilterParams = {}): Promise<PagedResult<UserListItem>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<UserListItem>>>('/users', {
      params: filter,
    });
    return unwrap(response);
  },

  async getById(id: number): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>(`/users/${id}`);
    return unwrap(response);
  },

  async create(payload: CreateUserRequest): Promise<User> {
    const response = await axiosClient.post<ApiResponse<User>>('/users', payload);
    return unwrap(response);
  },

  async update(id: number, payload: UpdateUserRequest): Promise<User> {
    const response = await axiosClient.put<ApiResponse<User>>(`/users/${id}`, payload);
    return unwrap(response);
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<User> {
    const response = await axiosClient.put<ApiResponse<User>>('/users/profile', payload);
    return unwrap(response);
  },

  async deactivate(id: number): Promise<void> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/users/${id}`);
    unwrap(response);
  },
};