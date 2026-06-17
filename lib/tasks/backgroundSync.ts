import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSyncQueueStore } from '../../store/syncQueue';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the task
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const queueSize = useSyncQueueStore.getState().queue.length;
      const { SyncQueueRepository } = require('../repositories/SyncQueueRepository');
      const sqliteQueueSize = SyncQueueRepository.getPendingTasks(1).length;

      if (queueSize === 0 && sqliteQueueSize === 0) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      // Process the Zustand queue
      await useSyncQueueStore.getState().processQueue();
      
      // Process the SQLite offline sync queue
      const { SyncService } = require('../../services/SyncService');
      await SyncService.runSyncProcess();

      // Check Notification ngầm
      const { useAuthStore } = require('../../store/auth');
      const { messagingApi } = require('../api/endpoints/misc');
      const { ordersApi } = require('../api/endpoints/orders');
      const { NotificationRepository } = require('../repositories/NotificationRepository');
      
      const state = useAuthStore.getState();
      if (state.isLoggedIn && state.user) {
        // Fetch new messages
        const convRes = await messagingApi.getConversationList({ page: 0, limit: 10 });
        if (convRes && convRes.success && convRes.data?.items) {
           for (const conv of convRes.data.items) {
             if (conv.unread_count > 0 && conv.last_message && conv.last_message.sender_id !== state.user.id) {
               const notifId = `msg_${conv.last_message.id}`;
               const existing = NotificationRepository.getNotifications(50).find((n: any) => n.id === notifId);
               if (!existing) {
                 NotificationRepository.saveNotification({
                   id: notifId,
                   type: 'message',
                   title: `Tin nhắn mới`,
                   body: conv.last_message.content,
                   data: { conversation_id: conv.id },
                   is_read: false,
                   created_at: conv.last_message.created_at || new Date().toISOString()
                 });
                 // Có thể bắn Local Push Notification tại đây nếu expo-notifications được setup
               }
             }
           }
        }
      }
      
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('Background sync failed:', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

// Register the task
export async function registerBackgroundSyncAsync() {
  if (Platform.OS === 'web') return;
  // Bỏ qua đăng ký nếu đang chạy Expo Go (StoreClient) để tránh warning
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    console.log('Skipping Background Sync task registration in Expo Go.');
    return;
  }
  
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
    });
    console.log('Background sync task registered successfully');
  } catch (err) {
    console.error('Failed to register background sync task:', err);
  }
}

// Unregister the task (optional utility)
export async function unregisterBackgroundSyncAsync() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('Background sync task unregistered successfully');
  } catch (err) {
    console.error('Failed to unregister background sync task:', err);
  }
}
