import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ShopView } from '../../../pages/shop/ShopView';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ShopView sellerId={id} />;
}
