import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { BACKGROUND_SYNC_TASK, registerBackgroundSyncAsync, unregisterBackgroundSyncAsync } from '../../../lib/tasks/backgroundSync';
import { useSyncQueueStore } from '../../../store/syncQueue';

// Mock dependencies
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));

jest.mock('../../../store/syncQueue', () => ({
  useSyncQueueStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../../../lib/repositories/SyncQueueRepository', () => ({
  SyncQueueRepository: {
    getPendingTasks: jest.fn(),
  },
}));

jest.mock('../../../services/SyncService', () => ({
  SyncService: {
    runSyncProcess: jest.fn(),
  },
}));

describe('backgroundSync', () => {
  let taskCallback: Function;

  beforeAll(() => {
    // Capture the task callback when defineTask is called
    const defineTaskMock = TaskManager.defineTask as jest.Mock;
    if (defineTaskMock.mock.calls.length > 0) {
      taskCallback = defineTaskMock.mock.calls[0][1];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Execution Logic', () => {
    it('should return Success immediately if queues are empty', async () => {
      // Mock Zustand queue
      (useSyncQueueStore.getState as jest.Mock).mockReturnValue({
        queue: [],
        processQueue: jest.fn(),
      });

      // Mock SQLite queue
      const { SyncQueueRepository } = require('../../../lib/repositories/SyncQueueRepository');
      (SyncQueueRepository.getPendingTasks as jest.Mock).mockReturnValue([]);

      const result = await taskCallback();
      expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    });

    it('should process queue if tasks are present', async () => {
      const processQueueMock = jest.fn().mockResolvedValue(true);
      (useSyncQueueStore.getState as jest.Mock).mockReturnValue({
        queue: [{ id: '1' }], // Has task
        processQueue: processQueueMock,
      });

      const { SyncQueueRepository } = require('../../../lib/repositories/SyncQueueRepository');
      (SyncQueueRepository.getPendingTasks as jest.Mock).mockReturnValue([]);
      
      const { SyncService } = require('../../../services/SyncService');

      const result = await taskCallback();

      expect(processQueueMock).toHaveBeenCalled();
      expect(SyncService.runSyncProcess).toHaveBeenCalled();
      expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    });

    it('should return Failed if queue processing throws', async () => {
      (useSyncQueueStore.getState as jest.Mock).mockReturnValue({
        queue: [{ id: '1' }],
        processQueue: jest.fn().mockRejectedValue(new Error('Sync failed')),
      });

      const { SyncQueueRepository } = require('../../../lib/repositories/SyncQueueRepository');
      (SyncQueueRepository.getPendingTasks as jest.Mock).mockReturnValue([]);

      const result = await taskCallback();
      expect(result).toBe(BackgroundTask.BackgroundTaskResult.Failed);
    });
  });

  describe('Registration & Unregistration', () => {
    it('should register background task if environment is not StoreClient', async () => {
      Constants.executionEnvironment = ExecutionEnvironment.Standalone;
      await registerBackgroundSyncAsync();
      expect(BackgroundTask.registerTaskAsync).toHaveBeenCalledWith(
        BACKGROUND_SYNC_TASK,
        expect.objectContaining({ minimumInterval: 15 * 60 })
      );
    });

    it('should skip registration if environment is StoreClient (Expo Go)', async () => {
      Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
      await registerBackgroundSyncAsync();
      expect(BackgroundTask.registerTaskAsync).not.toHaveBeenCalled();
    });

    it('should unregister background task if environment is not StoreClient', async () => {
      Constants.executionEnvironment = ExecutionEnvironment.Standalone;
      await unregisterBackgroundSyncAsync();
      expect(BackgroundTask.unregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_SYNC_TASK);
    });
  });
});
