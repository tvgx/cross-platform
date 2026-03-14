import { apiCall } from '../client';
import type { ApiResponse, AuthTokens, User } from '../../../types';

export const authApi = {
  login: (body: { username: string; password: string }) =>
    apiCall<ApiResponse<{ tokens: AuthTokens; user: User }>>('POST', '/login', body),

  logout: () =>
    apiCall<ApiResponse<null>>('POST', '/logout'),

  signup: (body: {
    username: string;
    password: string;
    full_name: string;
    phone?: string;
    rank?: string;
    unit?: string;
  }) => apiCall<ApiResponse<{ tokens: AuthTokens; user: User }>>('POST', '/signup', body),

  createResetCode: (body: { phone?: string; email?: string }) =>
    apiCall<ApiResponse<null>>('POST', '/create_code_reset_password', body),

  checkResetCode: (body: { code: string; phone?: string; email?: string }) =>
    apiCall<ApiResponse<{ reset_token: string }>>('POST', '/check_code_reset_password', body),

  resetPassword: (body: { reset_token: string; new_password: string }) =>
    apiCall<ApiResponse<null>>('POST', '/reset_password', body),

  changePassword: (body: { old_password: string; new_password: string }) =>
    apiCall<ApiResponse<null>>('POST', '/change_password', body),

  changeInfoAfterSignup: (body: Partial<User>) =>
    apiCall<ApiResponse<User>>('POST', '/change_info_after_signup', body),

  setDevToken: (body: { dev_token: string; platform: 'ios' | 'android' }) =>
    apiCall<ApiResponse<null>>('POST', '/set_devtoken', body),
};
