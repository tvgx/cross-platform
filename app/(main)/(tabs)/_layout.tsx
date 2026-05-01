import { Tabs } from 'expo-router';
import { Footer } from '../../../components/navigation/Footer';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <Footer 
          activeTab={props.state.routeNames[props.state.index]} 
          onTabChange={(key) => props.navigation.navigate(key)}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
