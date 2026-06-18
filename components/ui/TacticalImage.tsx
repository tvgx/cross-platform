import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';

// Bản đồ ánh xạ từ Category ID/Tên sang ảnh Placeholder cục bộ dạng phẳng tối giản (Pre-loaded)
const PLACEHOLDER_MAP: Record<string, any> = {
  // Hỏa lực / Combat (AK-47)
  'c1': require('../../assets/images/ak47.png'),
  'combat': require('../../assets/images/ak47.png'),
  'hoaluc': require('../../assets/images/ak47.png'),
  'quân tư trang': require('../../assets/images/ak47.png'),
  'quantutrang': require('../../assets/images/ak47.png'),

  // Trinh sát & Drones (UAV Drone)
  'c2': require('../../assets/images/drone.png'),
  'drones': require('../../assets/images/drone.png'),
  'trinhsat': require('../../assets/images/drone.png'),

  // Năng lượng & Liên lạc / Power (Solar Panel)
  'c3': require('../../assets/images/solar_panel.png'),
  'power': require('../../assets/images/solar_panel.png'),
  'nangluong': require('../../assets/images/solar_panel.png'),
  'luuniem': require('../../assets/images/solar_panel.png'),
  'luu niem': require('../../assets/images/solar_panel.png'),

  // Quân nhu & Sinh tồn / Survival (MRE / Lương khô)
  'c4': require('../../assets/images/mre.png'),
  'survival': require('../../assets/images/mre.png'),
  'quannuo': require('../../assets/images/mre.png'),
  'nhu yếu phẩm': require('../../assets/images/mre.png'),
  'nhuyepham': require('../../assets/images/mre.png'),

  // Y tế / Medical (First-aid)
  'c5': require('../../assets/images/first_aid.png'),
  'medical': require('../../assets/images/first_aid.png'),
  'y te': require('../../assets/images/first_aid.png'),
  'yte': require('../../assets/images/first_aid.png'),

  // Kỹ thuật / Maintenance (Shovel / Xẻng)
  'c6': require('../../assets/images/shovel.png'),
  'maintenance': require('../../assets/images/shovel.png'),
  'kythuat': require('../../assets/images/shovel.png'),
  'khác': require('../../assets/images/shovel.png'),
  'khac': require('../../assets/images/shovel.png'),
};

const getPlaceholderImage = (categoryId?: string): any => {
  if (!categoryId) return PLACEHOLDER_MAP['c1'];
  const normalizedKey = categoryId.toLowerCase().trim();
  return PLACEHOLDER_MAP[normalizedKey] || PLACEHOLDER_MAP['c1'];
};

export interface TacticalImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  categoryId?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  timeoutMs?: number; 
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const TacticalImage = ({
  uri,
  categoryId,
  style,
  containerStyle,
  timeoutMs, // Ignored, kept for compatibility
  resizeMode = 'cover',
  ...props
}: TacticalImageProps) => {
  const placeholderSource = getPlaceholderImage(categoryId);

  // Map react-native resizeMode to expo-image contentFit
  const contentFitMap: Record<string, 'cover' | 'contain' | 'fill' | 'none'> = {
    'cover': 'cover',
    'contain': 'contain',
    'stretch': 'fill',
    'center': 'none'
  };

  const contentFit = contentFitMap[resizeMode] || 'cover';

  return (
    <View style={[styles.container, containerStyle]}>
      <Image 
        source={typeof uri === 'string' && uri.trim() !== '' ? { uri } : placeholderSource}
        placeholder={placeholderSource}
        style={[styles.image, style]}
        contentFit={contentFit}
        transition={350}
        {...props as any}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#141414',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
