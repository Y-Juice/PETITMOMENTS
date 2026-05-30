import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { Brand } from '@/constants/theme';
import { useOnboarding } from '@/contexts/onboarding-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OnboardingRoute() {
  const { hasCompletedOnboarding, loading } = useOnboarding();
  const backgroundColor = useThemeColor({}, 'background');

  if (loading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/" />;
  }

  return <OnboardingScreen />;
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
