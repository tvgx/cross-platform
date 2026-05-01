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

  if (user?.rank === 'officer' || user?.rank === 'admin') {
    return <Redirect href={"/(main)/officer" as Href} />;
  }

  return <Redirect href={"/(main)/(tabs)" as Href} />;
}
