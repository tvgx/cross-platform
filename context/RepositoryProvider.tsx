import React, { createContext, useContext } from 'react';
import { UserRepository } from '../lib/repositories/UserRepository';
import { ProductRepository } from '../lib/repositories/ProductRepository';
import { OrderRepository } from '../lib/repositories/OrderRepository';
import { PostRepository } from '../lib/repositories/PostRepository';
import { MessageRepository } from '../lib/repositories/MessageRepository';
import { SyncQueueRepository } from '../lib/repositories/SyncQueueRepository';
import { NewsRepository } from '../lib/repositories/NewsRepository';

interface RepositoryContextValue {
  userRepository: typeof UserRepository;
  productRepository: typeof ProductRepository;
  orderRepository: typeof OrderRepository;
  postRepository: typeof PostRepository;
  messageRepository: typeof MessageRepository;
  syncQueueRepository: typeof SyncQueueRepository;
  newsRepository: typeof NewsRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

export const RepositoryProvider = ({ children }: { children: React.ReactNode }) => {
  const value: RepositoryContextValue = {
    userRepository: UserRepository,
    productRepository: ProductRepository,
    orderRepository: OrderRepository,
    postRepository: PostRepository,
    messageRepository: MessageRepository,
    syncQueueRepository: SyncQueueRepository,
    newsRepository: NewsRepository,
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
