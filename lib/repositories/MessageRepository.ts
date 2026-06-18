import { db } from '../storage/sqlite';

export const MessageRepository = {
  /**
   * Lấy danh sách cuộc trò chuyện của người dùng.
   */
  getConversations(userId: string): any[] {
    try {
      // Tìm tất cả các conversation_id liên kết với user này
      const rows = db.getAllSync<any>(
        `SELECT c.*, uc.user_id 
         FROM Conversations c 
         JOIN UserConversations uc ON c.id = uc.conversation_id 
         WHERE uc.user_id = ? 
         ORDER BY c.time_last_update DESC`,
        [userId]
      );

      const convos = [];
      for (const row of rows) {
        // Lấy tin nhắn cuối cùng làm Last Message preview
        const lastMsg = db.getFirstSync<any>(
          'SELECT * FROM Messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1',
          [row.id]
        );

        // Lấy tất cả thành viên tham gia hội thoại (loại bỏ chính mình ra khỏi hiển thị)
        const participantsRows = db.getAllSync<any>(
          `SELECT u.id, u.username, u.full_name, u.avatar 
           FROM Users u 
           JOIN UserConversations uc ON u.id = uc.user_id 
           WHERE uc.conversation_id = ?`,
          [row.id]
        );

        convos.push({
          id: row.id,
          participants: participantsRows.map(p => ({
            id: p.id,
            username: p.username || '',
            avatar: p.avatar || undefined,
            full_name: p.full_name || ''
          })),
          last_message: lastMsg ? {
            id: lastMsg.id,
            conversation_id: lastMsg.conversation_id,
            sender_id: lastMsg.sender_id,
            content: lastMsg.content,
            image_url: lastMsg.image_url,
            video_url: lastMsg.video_url,
            created_at: String(lastMsg.created_at)
          } : undefined,
          unread_count: 0,
          updated_at: new Date(row.time_last_update || Date.now()).toISOString()
        });
      }

      return convos;
    } catch (e) {
      console.error('[MessageRepo] Lỗi lấy danh sách cuộc trò chuyện:', e);
      return [];
    }
  },

  /**
   * Lấy lịch sử tin nhắn của một cuộc hội thoại.
   */
  getMessages(conversationId: string): any[] {
    try {
      const rows = db.getAllSync<any>(
        'SELECT * FROM Messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      return rows.map(r => ({
        id: r.id,
        conversation_id: r.conversation_id,
        sender_id: r.sender_id,
        content: r.content,
        image_url: r.image_url,
        video_url: r.video_url,
        type: (r.image_url || r.video_url) ? (r.image_url ? 'image' : 'video') : 'text',
        is_read: true,
        created_at: new Date(r.created_at || Date.now()).toISOString()
      }));
    } catch (e) {
      console.error('[MessageRepo] Lỗi lấy tin nhắn hội thoại:', e);
      return [];
    }
  },

  /**
   * Gửi/Lưu tin nhắn mới (hỗ trợ offline-first và xếp hàng SyncQueue).
   */
  sendMessage(msg: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: number;
    type?: string;
    image_url?: string;
  }): void {
    try {
      db.withTransactionSync(() => {
        // A. Lưu tin nhắn vào SQLite
        db.runSync(
          `INSERT INTO Messages (id, conversation_id, sender_id, content, image_url, sync_status, created_at) 
           VALUES (?, ?, ?, ?, ?, 'pending_sync', ?)`,
          [msg.id, msg.conversation_id, msg.sender_id, msg.content, msg.image_url || null, msg.created_at]
        );

        // B. Cập nhật thời gian Last Update của cuộc trò chuyện
        db.runSync(
          'UPDATE Conversations SET time_last_update = ? WHERE id = ?',
          [msg.created_at, msg.conversation_id]
        );

        // C. Xếp hàng chờ đồng bộ hóa SyncQueue ngầm lên server
        const queueId = 'q_msg_' + Math.random().toString(36).substr(2, 9);
        const syncPayload = JSON.stringify({
          conversation_id: msg.conversation_id,
          content: msg.image_url || msg.content,
          type: msg.type || 'text'
        });

        db.runSync(
          `INSERT INTO SyncQueue (id, action, target_id, payload, priority, retry_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            queueId,
            'MESSAGE_SEND',
            msg.id,
            syncPayload,
            0, // Tin nhắn có độ ưu tiên bình thường
            0,
            new Date().toISOString()
          ]
        );
      });
      console.log(`[MessageRepo] Đã lưu tin nhắn offline ${msg.id} dã chiến thành công.`);
    } catch (e) {
      console.error('[MessageRepo] Lỗi gửi tin nhắn:', e);
      throw e;
    }
  },

  /**
   * Khởi tạo một cuộc trò chuyện mới.
   */
  createConversation(convoId: string, userIds: string[]): void {
    try {
      db.withTransactionSync(() => {
        // A. Tạo Conversation
        db.runSync(
          'INSERT OR IGNORE INTO Conversations (id, time_last_update) VALUES (?, ?)',
          [convoId, Date.now()]
        );

        // B. Tạo liên kết User - Conversation cho từng participant
        userIds.forEach(uId => {
          db.runSync(
            'INSERT OR IGNORE INTO UserConversations (user_id, conversation_id) VALUES (?, ?)',
            [uId, convoId]
          );
        });
      });
      console.log(`[MessageRepo] Khởi tạo thành công cuộc hội thoại ${convoId}`);
    } catch (e) {
      console.error('[MessageRepo] Lỗi khởi tạo cuộc trò chuyện:', e);
    }
  },

  /**
   * Đánh dấu tin nhắn đã đồng bộ hóa thành công lên máy chủ dã chiến.
   */
  markMessageSynced(messageId: string): void {
    try {
      db.runSync(
        "UPDATE Messages SET sync_status = 'synced' WHERE id = ?",
        [messageId]
      );
      console.log(`[MessageRepo] Đã đánh dấu tin nhắn ${messageId} đã đồng bộ thành công.`);
    } catch (e) {
      console.error('[MessageRepo] Lỗi cập nhật trạng thái đồng bộ tin nhắn:', e);
    }
  },

  /**
   * Lưu danh sách conversation lấy từ server, giới hạn cache 50 mục
   */
  saveConversations(userId: string, conversations: any[]): void {
    try {
      db.execSync('BEGIN TRANSACTION;');
      
      for (const conv of conversations) {
        // Upsert Conversation
        db.runSync(
          `INSERT INTO Conversations (id, time_last_update)
           VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET time_last_update = excluded.time_last_update`,
          [conv.id, new Date(conv.updated_at).getTime()]
        );

        // Map to User
        db.runSync(
          `INSERT OR IGNORE INTO UserConversations (user_id, conversation_id) VALUES (?, ?)`,
          [userId, conv.id]
        );

        // Map participants
        if (conv.participants) {
          for (const p of conv.participants) {
             // ensure user is in DB
             db.runSync(
               `INSERT OR IGNORE INTO Users (id, username, full_name, avatar) VALUES (?, ?, ?, ?)`,
               [p.id, p.username, p.full_name || p.username, p.avatar || null]
             );
             db.runSync(
               `INSERT OR IGNORE INTO UserConversations (user_id, conversation_id) VALUES (?, ?)`,
               [p.id, conv.id]
             );
          }
        }

        // Cập nhật last message nếu có
        if (conv.last_message) {
          MessageRepository.saveMessageFromServer(conv.last_message);
        }
      }
      
      db.execSync('COMMIT;');
    } catch (e) {
      db.execSync('ROLLBACK;');
      console.error('[MessageRepo] saveConversations error', e);
    }
  },

  /** Lưu tin nhắn lấy từ server */
  saveMessageFromServer(msg: any): void {
    try {
      db.runSync(
        `INSERT INTO Messages (id, conversation_id, sender_id, content, image_url, video_url, sync_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET sync_status = excluded.sync_status`,
        [
          msg.id,
          msg.conversation_id,
          msg.sender_id,
          msg.content,
          msg.type === 'image' ? msg.content : null,
          msg.type === 'video' ? msg.content : null,
          'synced',
          new Date(msg.created_at).getTime(),
        ]
      );
    } catch (e) {
      console.error('[MessageRepo] saveMessageFromServer error', e);
    }
  }
};
