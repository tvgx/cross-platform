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
      backBehavior="history"
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="news" options={{ title: 'News' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="upload" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
    </Tabs>
  );
}
