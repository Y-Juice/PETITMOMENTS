import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');

  if (loading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
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
