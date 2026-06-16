import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Sidebar } from '../../components/navigation/Sidebar';
import { NavigationService } from '../../lib/navigation/NavigationService';
import { ROUTES } from '../../lib/navigation/routes';
import { useAuthStore } from '../../store/auth';

export default function MainDrawerLayout() {
  const user = useAuthStore(state => state.user);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        backBehavior="history"
        drawerContent={(props) => (
          <Sidebar 
            userInfo={{
              name: (user?.firstname || user?.lastname) ? `${user?.lastname || ''} ${user?.firstname || ''}`.trim() : (user?.full_name || user?.username || 'Khách'),
              email: user?.email || '',
              avatar: user?.avatar
            }}
            activeItem={props.state.routeNames[props.state.index]}
            onMenuSelect={(key) => {
              if (key === 'home') {
                NavigationService.navigate(ROUTES.HOME);
              } else if (key === 'all-products') {
                NavigationService.navigate(ROUTES.ALL_PRODUCTS);
              } else if (key === 'orders') {
                NavigationService.navigate(ROUTES.ORDERS);
              } else if (key === 'liked-products') {
                NavigationService.navigate(ROUTES.LIKED_PRODUCTS);
              } else if (key === 'profile-info') {
                NavigationService.navigate(ROUTES.PROFILE_INFO);
              } else if (key === 'change-password') {
                NavigationService.navigate(ROUTES.CHANGE_PASSWORD);
              } else if (key === 'settings') {
                NavigationService.navigate(ROUTES.SETTINGS);
              } else if (key === 'notifications') {
                NavigationService.navigate(ROUTES.NOTIFICATIONS);
              } else if (key.startsWith('cat_')) {
                const catId = key.replace('cat_', '');
                NavigationService.navigate(ROUTES.CATEGORY(catId));
              } else {
                console.log('Menu selected:', key);
              }
              props.navigation.closeDrawer();
            }}
          />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Home Tabs',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
