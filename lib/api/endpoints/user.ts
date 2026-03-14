import { apiCall } from '../client';
import type { ApiResponse, User } from '../../../types';

export interface PushSetting {
  orders: boolean;
  messages: boolean;
  rewards: boolean;
  promotions: boolean;
}

export const userApi = {
  getUserInfo: (userId?: string) =>
    apiCall<ApiResponse<User>>('GET', '/get_user_info', undefined, userId ? { user_id: userId } : undefined),

  setUserInfo: (body: Partial<User>) =>
    apiCall<ApiResponse<User>>('POST', '/set_user_info', body),

  getPushSetting: () =>
    apiCall<ApiResponse<PushSetting>>('GET', '/get_push_setting'),

  setPushSetting: (body: Partial<PushSetting>) =>
    apiCall<ApiResponse<PushSetting>>('POST', '/set_push_setting', body),
};
