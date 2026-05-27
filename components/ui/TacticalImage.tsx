import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  ImageProps, 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  StyleProp, 
  ViewStyle, 
  ImageStyle, 
  Animated 
} from 'react-native';
import { UI_CONFIG } from '../../constants/config';

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
  timeoutMs?: number; // Mặc định 5000ms (5 giây)
}

export const TacticalImage = ({
  uri,
  categoryId,
  style,
  containerStyle,
  timeoutMs = 5000,
  resizeMode = 'cover',
  ...props
}: TacticalImageProps) => {
  const [isLoading, setIsLoading] = useState(!!uri);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  const placeholderSource = getPlaceholderImage(categoryId);

  // Xử lý Timeout nếu ảnh tải quá lâu (môi trường mạng dã chiến yếu)
  useEffect(() => {
    if (isLoading && uri) {
      timeoutRef.current = setTimeout(() => {
        console.warn(`[TacticalImage] Timeout khi tải ảnh: ${uri}`);
        setHasError(true);
        setIsLoading(false);
      }, timeoutMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, uri, timeoutMs]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Fade in ảnh chính cực mượt khi tải xong
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadError = () => {
    console.warn(`[TacticalImage] Lỗi tải ảnh: ${uri}`);
    setHasError(true);
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* 1. Ảnh Placeholder cục bộ làm nền (Luôn hiển thị khi đang load hoặc có lỗi) */}
      <Image 
        source={placeholderSource} 
        style={[styles.image, style]} 
        resizeMode={resizeMode}
      />

      {/* 2. Ảnh thực tế từ Network/URI (Nếu có và không có lỗi) */}
      {uri && !hasError && (
        <Animated.Image
          source={{ uri }}
          style={[
            styles.absoluteImage, 
            style, 
            { opacity: fadeAnim }
          ]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleLoadError}
          {...props}
        />
      )}

      {/* 3. Spinner xoay mờ tác chiến nhỏ ở góc khi đang loading */}
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={UI_CONFIG.colors.primary} />
        </View>
      )}
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
  absoluteImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
