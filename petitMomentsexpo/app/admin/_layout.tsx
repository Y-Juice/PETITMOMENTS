import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAdmin } from '@/contexts/admin-context';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AdminLayout() {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const backgroundColor = useThemeColor({}, 'background');

  if (authLoading || adminLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
