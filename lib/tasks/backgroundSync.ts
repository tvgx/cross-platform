import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { useSyncQueueStore } from '../../store/syncQueue';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the task
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const queueSize = useSyncQueueStore.getState().queue.length;
      if (queueSize === 0) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Process the queue
      await useSyncQueueStore.getState().processQueue();
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background sync failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

// Register the task
export async function registerBackgroundSyncAsync() {
  if (Platform.OS === 'web') return;
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,   // android only
      startOnBoot: true,        // android only
    });
    console.log('Background sync task registered successfully');
  } catch (err) {
    console.error('Failed to register background sync task:', err);
  }
}

// Unregister the task (optional utility)
export async function unregisterBackgroundSyncAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('Background sync task unregistered successfully');
  } catch (err) {
    console.error('Failed to unregister background sync task:', err);
  }
}
