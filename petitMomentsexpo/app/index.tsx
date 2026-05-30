import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useOnboarding } from '@/contexts/onboarding-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function IndexRoute() {
  const { session, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();
  const backgroundColor = useThemeColor({}, 'background');

  if (authLoading || onboardingLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
