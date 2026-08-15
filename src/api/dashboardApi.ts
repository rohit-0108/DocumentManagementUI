import axiosClient, { unwrap } from './axiosClient';
import type { ApiResponse, DashboardStats } from '@/types';

export const dashboardApi = {
  async getStats(trendDays = 30): Promise<DashboardStats> {
    const response = await axiosClient.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
      params: { trendDays },
    });
    return unwrap(response);
  },
};