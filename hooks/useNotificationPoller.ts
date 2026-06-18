import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/auth';
import { useNotificationsStore } from '../store/notifications';
import { messagingApi } from '../lib/api/endpoints/misc';
import { ordersApi } from '../lib/api/endpoints/orders';
import { NotificationRepository } from '../lib/repositories/NotificationRepository';
import { MessageRepository } from '../lib/repositories/MessageRepository';

const POLL_INTERVAL = 15000; // 15s

export function useNotificationPoller() {
  const { isLoggedIn, user } = useAuthStore();
  const prependNotifications = useNotificationsStore((state) => state.prependNotifications);
  const pollerRef = useRef<any>(null);

  const fetchAndDiff = async () => {
    if (!isLoggedIn || !user) return;

    try {
      // 1. Fetch Conversations
      const convRes = await messagingApi.getConversationList({ page: 0, limit: 50 });
      if (convRes && convRes.success && convRes.data?.items) {
        // Chỉ lưu và hiển thị thông báo cho những cuộc hội thoại mà user đang đăng nhập thực sự tham gia
        const convos = convRes.data.items.filter((conv: any) => {
          if (!conv.participants) return true;
          return conv.participants.some((p: any) => String(p.id) === String(user.id));
        });

        // Save to SQLite
        MessageRepository.saveConversations(user.id, convos);

        const newNotifications = [];
        for (const conv of convos) {
          if (conv.unread_count > 0 && conv.last_message && String(conv.last_message.sender_id) !== String(user.id)) {
            const notifId = `msg_${conv.last_message.id}`;
            // Check if already in SQLite to avoid duplicate notification
            const existing = NotificationRepository.getNotifications(50).find(n => n.id === notifId);
            if (!existing) {
              const sender = conv.participants?.find(p => String(p.id) === String(conv.last_message!.sender_id));
              const senderName = sender?.full_name || (sender?.firstname && sender?.lastname ? `${sender.firstname} ${sender.lastname}` : sender?.username) || 'Người dùng';
              const notif = {
                id: notifId,
                type: 'message' as const,
                title: `Tin nhắn mới từ ${senderName}`,
                body: conv.last_message.content,
                data: { conversation_id: conv.id },
                is_read: false,
                created_at: conv.last_message.created_at || new Date().toISOString()
              };
              NotificationRepository.saveNotification(notif);
              newNotifications.push(notif);
            }
          }
        }
        if (newNotifications.length > 0) {
          prependNotifications(newNotifications);
        }
      }

      // 2. Fetch Orders (Purchases)
      const ordersRes = await ordersApi.getPurchases({ index: 0, count: 50 });
      if (ordersRes && ordersRes.success && ordersRes.data?.items) {
        const orders = ordersRes.data.items;
        const newNotifications = [];
        for (const order of orders) {
          const notifId = `order_${order.id}_${order.status}`;
          const existing = NotificationRepository.getNotifications(50).find(n => n.id === notifId);
          if (!existing) {
            const updatedTime = new Date(order.updated_at).getTime();
            if (Date.now() - updatedTime < 86400000) {
              const notif = {
                id: notifId,
                type: 'order' as const,
                title: `Cập nhật đơn hàng #${order.id}`,
                body: `Đơn hàng của bạn đã chuyển sang trạng thái: ${order.status}`,
                data: { order_id: order.id },
                is_read: false,
                created_at: order.updated_at || new Date().toISOString()
              };
              NotificationRepository.saveNotification(notif);
              newNotifications.push(notif);
            }
          }
        }
        if (newNotifications.length > 0) {
          prependNotifications(newNotifications);
        }
      }

    } catch (e) {
      console.log('[NotificationPoller] Lỗi polling:', e);
    }
  };

  useEffect(() => {
    // Load notifications from SQLite to Zustand on mount
    const storedNotifs = NotificationRepository.getNotifications(50);
    useNotificationsStore.getState().setNotifications(storedNotifs);

    if (isLoggedIn) {
      // Chỉ fetch 1 lần khi mount, TẮT TÍNH NĂNG TỰ ĐỘNG GỌI SAU 1 KHOẢNG THỜI GIAN
      fetchAndDiff();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isLoggedIn) {
        // Fetch 1 lần khi app quay lại màn hình chính (foreground)
        fetchAndDiff();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, user]);
}
