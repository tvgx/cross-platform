import { db } from '../storage/sqlite';
import { PostHelper } from '../helpers/PostHelper';
import { UserRepository } from './UserRepository';

export const PostRepository = {
  /**
   * Lấy danh sách bài đăng chiến tích đang chờ phê duyệt (dành cho Sĩ quan duyệt bài).
   */
  getPendingPosts(): any[] {
    try {
      const rows = db.getAllSync<any>(
        'SELECT * FROM Posts WHERE status = "pending" ORDER BY created_at DESC'
      );
      return rows.map(r => PostHelper.parsePost(r));
    } catch (e) {
      console.error('[PostRepo] Lỗi lấy danh sách bài viết chờ duyệt:', e);
      return [];
    }
  },

  /**
   * Lấy danh sách bài đăng chiến công của một chiến sĩ cụ thể.
   */
  getUserPosts(authorId: string): any[] {
    try {
      const rows = db.getAllSync<any>(
        'SELECT * FROM Posts WHERE author_id = ? ORDER BY created_at DESC',
        [authorId]
      );
      return rows.map(r => PostHelper.parsePost(r));
    } catch (e) {
      console.error('[PostRepo] Lỗi lấy danh sách bài viết của user:', e);
      return [];
    }
  },

  /**
   * Lấy danh hiệu chiến thắng, chiến tích và quy chế cộng điểm của chiến sĩ.
   */
  getAchievements(userId: string): { posts: any[]; rules: any[] } {
    try {
      const posts = db.getAllSync<any>(
        `SELECT * FROM Posts 
         WHERE author_id = ? AND status = 'approved' 
         ORDER BY created_at DESC`,
        [userId]
      ).map(r => PostHelper.parsePost(r));

      const rules = db.getAllSync<any>('SELECT * FROM RewardRules');

      return { posts, rules };
    } catch (e) {
      console.error('[PostRepo] Lỗi lấy thông tin thành tích chiến sĩ:', e);
      return { posts: [], rules: [] };
    }
  },

  /**
   * Upload bài đăng chiến tích (Online-first).
   */
  async createPost(post: {
    id: string;
    title: string;
    description: string;
    media_url: string;
    video_url?: string;
    image_url?: string;
    author_id: string;
    status: string;
    ai_score: number;
    reward_coin: number;
    created_at: string;
  }): Promise<void> {
    try {
      let apiSuccess = false;
      try {
        console.log('[PostRepo] Đang gọi API tạo bài đăng chiến tích...');
        const { apiCall } = require('../api/client');
        await apiCall('POST', '/api/upload_post', post);
        apiSuccess = true;
      } catch (err) {
        console.log('[PostRepo] Lỗi mạng hoặc backend Offline. Chuyển sang fallback cục bộ.', err);
      }

      db.runSync(
        `INSERT INTO Posts (
          id, title, description, media_url, video_url, image_url, 
          author_id, status, sync_status, ai_score, reward_coin, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          post.id,
          post.title,
          post.description,
          post.media_url,
          post.video_url || '',
          post.image_url || '',
          post.author_id,
          post.status,
          apiSuccess ? 'synced' : 'pending_sync',
          post.ai_score,
          post.reward_coin,
          post.created_at
        ]
      );

      if (!apiSuccess) {
        // Thêm hàng chờ đồng bộ hóa SyncQueue ngầm lên server
        const queueId = 'q_post_' + Math.random().toString(36).substr(2, 9);
        const syncPayload = JSON.stringify({
          title: post.title,
          description: post.description,
          media_url: post.media_url,
          ai_score: post.ai_score,
          reward_coin: post.reward_coin
        });

        db.runSync(
          `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            queueId,
            'MEDIA_UPLOAD',
            post.id,
            syncPayload,
            2, // Ưu tiên trung bình cao
            0,
            new Date().toISOString()
          ]
        );
      }

      console.log(`[PostRepo] Đã lưu bài đăng chiến tích ${post.id} (API: ${apiSuccess ? 'Thành công' : 'Offline Fallback'}).`);
    } catch (e) {
      console.error('[PostRepo] Lỗi lưu bài đăng chiến tích:', e);
      throw e;
    }
  },

  /**
   * Phê duyệt chiến công (Dành cho sĩ quan).
   * 1. Thay đổi trạng thái Post sang approved.
   * 2. Cộng điểm xu chiến công vào Wallets và Users của chiến sĩ dã chiến.
   */
  approvePost(postId: string, rewardAmount: number): void {
    try {
      const post = this.getPostDetail(postId);
      if (!post) throw new Error('Không tìm thấy bài đăng chiến công cần phê duyệt');

      db.withTransactionSync(() => {
        // A. Cập nhật trạng thái bài đăng
        db.runSync(
          'UPDATE Posts SET status = "approved" WHERE id = ?',
          [postId]
        );

        // B. Cộng số dư ví ảo cho tác giả bài viết
        const currentBalance = UserRepository.getUserBalance(post.author_id);
        UserRepository.updateUserBalance(post.author_id, currentBalance + rewardAmount);
      });
      console.log(`[PostRepo] Sĩ quan phê duyệt thành công bài viết ${postId}, cộng ${rewardAmount} ₫.`);
    } catch (e) {
      console.error('[PostRepo] Lỗi phê duyệt chiến tích:', e);
      throw e;
    }
  },

  /**
   * Từ chối phê duyệt chiến công (Dành cho sĩ quan).
   */
  rejectPost(postId: string): void {
    try {
      db.runSync(
        'UPDATE Posts SET status = "rejected" WHERE id = ?',
        [postId]
      );
      console.log(`[PostRepo] Sĩ quan từ chối bài viết ${postId}.`);
    } catch (e) {
      console.error('[PostRepo] Lỗi từ chối phê duyệt:', e);
      throw e;
    }
  },

  /**
   * Nộp đơn khiếu nại (Appeal) chiến công bị từ chối dã chiến.
   */
  submitAppeal(appeal: {
    id: string;
    proof_id: string;
    user_id: string;
    reason: string;
  }): void {
    try {
      db.withTransactionSync(() => {
        // A. Lưu đơn khiếu nại vào SQLite
        db.runSync(
          `INSERT INTO Appeals (id, proof_id, user_id, reason, status, sync_status) 
           VALUES (?, ?, ?, ?, 'pending', 'pending_sync')`,
          [appeal.id, appeal.proof_id, appeal.user_id, appeal.reason]
        );

        // B. Cập nhật trạng thái bài đăng sang appealing
        db.runSync(
          'UPDATE Posts SET status = "appealing" WHERE id = ?',
          [appeal.proof_id]
        );

        // C. Xếp hàng chờ đồng bộ hóa SyncQueue ngầm lên server
        const queueId = 'q_appeal_' + Math.random().toString(36).substr(2, 9);
        const syncPayload = JSON.stringify({
          proof_id: appeal.proof_id,
          reason: appeal.reason
        });

        db.runSync(
          `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            queueId,
            'APPEAL_SUBMIT',
            appeal.id,
            syncPayload,
            2,
            0,
            new Date().toISOString()
          ]
        );
      });
      console.log(`[PostRepo] Đã nộp khiếu nại ${appeal.id} cho bài viết ${appeal.proof_id}.`);
    } catch (e) {
      console.error('[PostRepo] Lỗi nộp đơn khiếu nại dã chiến:', e);
      throw e;
    }
  },

  /**
   * Lấy thông tin chi tiết bài đăng chiến công.
   */
  getPostDetail(postId: string): any | null {
    try {
      const row = db.getFirstSync<any>('SELECT * FROM Posts WHERE id = ?', [postId]);
      if (!row) return null;
      return PostHelper.parsePost(row);
    } catch (e) {
      console.error('[PostRepo] Lỗi truy vấn getPostDetail:', e);
      return null;
    }
  },

  /**
   * Đánh dấu chiến tích đã đồng bộ hóa thành công lên máy chủ dã chiến.
   */
  markPostSynced(postId: string): void {
    try {
      db.runSync(
        'UPDATE Posts SET sync_status = "synced" WHERE id = ?',
        [postId]
      );
      console.log(`[PostRepo] Đã đánh dấu bài đăng ${postId} đã đồng bộ thành công.`);
    } catch (e) {
      console.error('[PostRepo] Lỗi cập nhật trạng thái đồng bộ bài đăng:', e);
    }
  },

  /**
   * Đánh dấu khiếu nại đã đồng bộ hóa thành công lên máy chủ dã chiến.
   */
  markAppealSynced(appealId: string): void {
    try {
      db.runSync(
        "UPDATE Appeals SET sync_status = 'synced', status = 'resolved' WHERE id = ?",
        [appealId]
      );
      console.log(`[PostRepo] Đã đánh dấu đơn khiếu nại ${appealId} đã đồng bộ thành công.`);
    } catch (e) {
      console.error('[PostRepo] Lỗi cập nhật trạng thái đồng bộ khiếu nại:', e);
    }
  }
};
