import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CategoryView } from '../../../../pages/category/CategoryView';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryView categoryId={id} />;
}
