import { apiCall } from '../client';
import type { ApiResponse, PaginatedResponse } from '../../../types';

export interface RewardProof {
  id: number;
  user_id: number;
  description: string;
  image_url: string;
  video_url: string;
  ai_score: number;
  reward_coin: number;
  status: string;
  created_at: string;
}

export interface RewardHistory {
  id: number;
  user_id: number;
  amount: number;
  reason: string;
  created_at: string;
}

export const rewardsApi = {
  addRewardProof: (body: { description: string; image_url: string; video_url: string }) =>
    apiCall<ApiResponse<RewardProof>>('POST', '/rewards/add_reward_proof', body),

  getRewardProof: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<RewardProof>>>('POST', '/rewards/get_reward_proof', {
      index: (page - 1) * limit,
      count: limit,
    });
  },

  getRewardHistory: (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return apiCall<ApiResponse<PaginatedResponse<RewardHistory>>>('POST', '/rewards/get_reward_history', {
      index: (page - 1) * limit,
      count: limit,
    });
  },

  createRewardAppeal: (body: { reward_id: number; reason: string }) =>
    apiCall<ApiResponse<null>>('POST', '/rewards/create_reward_appeal', body),
};
