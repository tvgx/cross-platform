import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SellerInfoView } from '../../../pages/seller/SellerInfoView';

export default function SellerInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SellerInfoView userId={id} />;
}
