import { apiCall } from '../client';
import type { ApiResponse, User } from '../../../types';

export interface PushSetting {
  orders: boolean;
  messages: boolean;
  rewards: boolean;
  promotions: boolean;
}

export const userApi = {
  getUserInfo: (userId: string | number) =>
    apiCall<ApiResponse<User>>('POST', '/users/get_user_info', { user_id: userId }),

  setUserInfo: (body: Partial<User>) =>
    apiCall<ApiResponse<User>>('POST', '/users/set_user_info', body),

  getPushSetting: () =>
    apiCall<ApiResponse<PushSetting>>('POST', '/push_settings/get_push_setting'),

  setPushSetting: (body: Partial<PushSetting>) =>
    apiCall<ApiResponse<PushSetting>>('POST', '/push_settings/set_push_setting', body),

  getMyAddresses: () =>
    apiCall<ApiResponse<any[]>>('GET', '/addresses/me'),

  createAddress: (body: any) =>
    apiCall<ApiResponse<any>>('POST', '/addresses/create', body),
};
