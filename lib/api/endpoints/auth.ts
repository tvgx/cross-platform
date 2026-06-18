import { apiCall } from '../client';
import type { ApiResponse, AuthTokens, User } from '../../../types';

// Helper to normalize auth responses from flat to nested structure
function normalizeAuthResponse(res: any): ApiResponse<{ tokens: AuthTokens; user: User }> {
  if (res && res.success) {
    const data = res.data || res;
    if (!data.tokens && data.token) {
      data.tokens = { access_token: data.token };
    }
    if (!data.user && data.id) {
      data.user = {
        id: String(data.id),
        username: data.username,
        full_name: data.full_name || data.username || 'Chiến sĩ',
        avatar: data.avatar,
        rank: data.rank || 'Chiến sĩ',
        virtual_balance: data.virtual_balance || 0,
        is_seller: data.is_seller || false,
        created_at: data.created_at || new Date().toISOString(),
        ...data // Giữ lại các trường khác như wallet_id, active
      };
    }
    res.data = data;
  }
  return res as ApiResponse<{ tokens: AuthTokens; user: User }>;
}

export const authApi = {
  login: async (body: { phone_number: string; password: string }) => {
    const res = await apiCall<any>('POST', '/auth/login', body);
    return normalizeAuthResponse(res);
  },

  logout: () =>
    apiCall<ApiResponse<null>>('POST', '/auth/logout'),

  getMe: () =>
    apiCall<ApiResponse<User>>('GET', '/auth/me'),


  signup: async (body: {
    phone_number: string;
    password: string;
    uuid: string;
  }) => {
    const res = await apiCall<any>('POST', '/auth/signup', body);
    return normalizeAuthResponse(res);
  },

  createResetCode: (body: { phone?: string; email?: string }) =>
    apiCall<ApiResponse<null>>('POST', '/auth/create_code_reset_password', body),

  checkResetCode: (body: { code: string; phone?: string; email?: string }) =>
    apiCall<ApiResponse<{ reset_token: string }>>('POST', '/auth/check_code_reset_password', body),

  resetPassword: (body: { reset_token: string; new_password: string }) =>
    apiCall<ApiResponse<null>>('POST', '/auth/reset_password', body),

  changePassword: (body: { old_password: string; new_password: string }) =>
    apiCall<ApiResponse<null>>('POST', '/auth/change_password', {
      password: body.old_password,
      new_password: body.new_password,
    }),

  changeInfoAfterSignup: (body: Partial<User>) =>
    apiCall<ApiResponse<User>>('POST', '/auth/change_info_after_signup', body),

  setDevToken: (body: { dev_token: string; platform: 'ios' | 'android' }) =>
    apiCall<ApiResponse<null>>('POST', '/dev_tokens/set_devtoken', {
      devtoken: body.dev_token,
      devtype: body.platform === 'ios' ? '1' : '0',
    }),
};
