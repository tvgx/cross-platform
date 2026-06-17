import React, { createContext, useContext } from 'react';
import { UserRepository } from '../lib/repositories/UserRepository';
import { ProductRepository } from '../lib/repositories/ProductRepository';
import { OrderRepository } from '../lib/repositories/OrderRepository';
import { PostRepository } from '../lib/repositories/PostRepository';
import { MessageRepository } from '../lib/repositories/MessageRepository';
import { SyncQueueRepository } from '../lib/repositories/SyncQueueRepository';
import { NewsRepository } from '../lib/repositories/NewsRepository';
import { DatabaseRepository } from '../lib/repositories/DatabaseRepository';
import { NotificationRepository } from '../lib/repositories/NotificationRepository';

interface RepositoryContextValue {
  databaseRepository: typeof DatabaseRepository;
  userRepository: typeof UserRepository;
  productRepository: typeof ProductRepository;
  orderRepository: typeof OrderRepository;
  postRepository: typeof PostRepository;
  messageRepository: typeof MessageRepository;
  syncQueueRepository: typeof SyncQueueRepository;
  newsRepository: typeof NewsRepository;
  notificationRepository: typeof NotificationRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

export const RepositoryProvider = ({ children }: { children: React.ReactNode }) => {
  // Bootstrap CSDL được thực hiện sớm & có cổng chờ (gate) trong app/_layout.tsx
  // TRƯỚC khi render cây này, nên ở đây không cần khởi tạo lại.
  const value: RepositoryContextValue = {
    databaseRepository: DatabaseRepository,
    userRepository: UserRepository,
    productRepository: ProductRepository,
    orderRepository: OrderRepository,
    postRepository: PostRepository,
    messageRepository: MessageRepository,
    syncQueueRepository: SyncQueueRepository,
    newsRepository: NewsRepository,
    notificationRepository: NotificationRepository,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepositories = () => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
};
