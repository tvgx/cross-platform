import { Redirect, Href } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const user = useAuthStore(state => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href={"/(auth)/welcome" as Href} />;
  }

  // Server có thể trả vai trò qua `role` (soldier/officer/vendor) hoặc `rank`.
  const role = (user as any)?.role;
  const rank = user?.rank;
  const isOfficer =
    rank === 'officer' || rank === 'admin' || rank === 'Sĩ quan' ||
    role === 'officer' || role === 'admin';
  if (isOfficer) {
    return <Redirect href={"/(main)/officer" as Href} />;
  }

  return <Redirect href={"/(main)/(tabs)" as Href} />;
}
