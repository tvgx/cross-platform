import { apiCall } from '../client';
import type { ApiResponse, AuthTokens, User } from '../../../types';

export const authApi = {
  login: (body: { phone_number: string; password: string }) =>
    apiCall<ApiResponse<{ tokens: AuthTokens; user: User }>>('POST', '/auth/login', body),

  logout: () =>
    apiCall<ApiResponse<null>>('POST', '/auth/logout'),

  getMe: () =>
    apiCall<ApiResponse<User>>('GET', '/auth/me'),


  signup: (body: {
    phone_number: string;
    password: string;
    uuid: string;
  }) => apiCall<ApiResponse<{ tokens: AuthTokens; user: User }>>('POST', '/auth/signup', body),

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
