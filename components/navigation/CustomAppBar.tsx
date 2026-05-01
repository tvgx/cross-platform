import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/auth';
import { IconSymbol } from '../ui/icon-symbol';

interface CustomAppBarProps {
  title: string;
  showBack?: boolean;
}

export function CustomAppBar({ title, showBack = false }: CustomAppBarProps) {
  const navigation = useNavigation();
  const user = useAuthStore(state => state.user);

  const handleLeftPress = () => {
    if (showBack) {
      navigation.goBack();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLeftPress} style={styles.iconButton}>
        <IconSymbol name={showBack ? "chevron.left" : "line.3.horizontal"} size={24} color={UI_CONFIG.colors.text} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.rightContainer}>
        {user && (
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="bell" size={24} color={UI_CONFIG.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'web' ? 60 : 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.spacing.md,
    backgroundColor: UI_CONFIG.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  iconButton: {
    padding: UI_CONFIG.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.text,
  },
  rightContainer: {
    flexDirection: 'row',
    minWidth: 40,
    justifyContent: 'flex-end',
  }
});
