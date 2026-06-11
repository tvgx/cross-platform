import { apiCall } from '../client';
import type { ApiResponse, User } from '../../../types';

export const usersApi = {
  getUserInfo: (userId?: string) =>
    apiCall<ApiResponse<User>>('POST', '/users/get_user_info', { user_id: userId }),

  setUserInfo: (body: {
    email?: string;
    username?: string;
    status?: string;
    avatar?: string;
    firstname?: string;
    lastname?: string;
    address?: string;
    cover_image?: string;
    cover_image_web?: string;
  }) => apiCall<ApiResponse<User>>('POST', '/users/set_user_info', body),
};
