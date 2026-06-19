import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface SwipeWrapperProps {
  children: React.ReactNode;
  currentTab: 'index' | 'news' | 'orders' | 'wallet' | 'profile';
}

const TABS = ['index', 'news', 'orders', 'wallet', 'profile'];

export const SwipeWrapper: React.FC<SwipeWrapperProps> = ({ children, currentTab }) => {
  const router = useRouter();
  
  const panResponder = useRef(
    PanResponder.create({
      // We don't use Capture phase so that child ScrollViews (like FlatList or horizontal sliders)
      // have a chance to claim the gesture first.
      onMoveShouldSetPanResponderCapture: () => false,
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isSignificantDistance = Math.abs(gestureState.dx) > 30; // threshold
        
        // Vùng loại trừ (Exclude Area) dành riêng cho Categories & News Sliders ở trang Home
        // Ước lượng vị trí Slider nằm khoảng Y từ 140 đến 550
        if (currentTab === 'index' && evt.nativeEvent.pageY >= 140 && evt.nativeEvent.pageY <= 550) {
            return false;
        }

        return isHorizontalSwipe && isSignificantDistance;
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = TABS.indexOf(currentTab);
        const swipeDistance = gestureState.dx;
        const velocity = gestureState.vx;
        
        if (swipeDistance > 50 && velocity > 0.3) {
          // Swipe Right -> Go to previous tab
          if (currentIndex > 0) {
            const prevTab = TABS[currentIndex - 1];
            router.navigate(prevTab === 'index' ? '/(main)/(tabs)' : `/(main)/(tabs)/${prevTab}` as any);
          }
        } else if (swipeDistance < -50 && velocity < -0.3) {
          // Swipe Left -> Go to next tab
          if (currentIndex < TABS.length - 1) {
            const nextTab = TABS[currentIndex + 1];
            router.navigate(`/(main)/(tabs)/${nextTab}` as any);
          }
        }
      },
      // Ngăn chặn việc PanResponder vô tình giữ gesture khi không cần thiết
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
