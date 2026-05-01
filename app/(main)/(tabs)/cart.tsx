import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeArea } from '../../../components/layout/SafeArea';
import { Header } from '../../../components/navigation/Header';
import { UI_CONFIG } from '../../../constants/config';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

export default function CartScreen() {
  const navigation = useNavigation();
  
  return (
    <SafeArea edges={['top']}>
      <Header 
        leftIcon="menu" 
        onPressLeft={() => navigation.dispatch(DrawerActions.openDrawer())} 
        title="Cart"
      />
      <View style={styles.container}>
        <Text>Cart is Empty</Text>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
