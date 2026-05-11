import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { MomentDetailOverlayProvider } from '@/contexts/moment-detail-overlay-context';
import { MomentsProvider } from '@/contexts/moments-context';
import { ThreadsProvider } from '@/contexts/threads-context';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const toggleAuthRefresh = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await supabase.auth.startAutoRefresh();
      } else {
        await supabase.auth.stopAutoRefresh();
      }
    };

    toggleAuthRefresh(AppState.currentState);
    const sub = AppState.addEventListener('change', toggleAuthRefresh);
    return () => {
      sub.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  const appReady = fontsLoaded || !!fontError;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <MomentsProvider>
          <MomentDetailOverlayProvider>
            <ThreadsProvider>
              {appReady ? (
                <>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  </Stack>
                  <StatusBar style="auto" />
                </>
              ) : null}
            </ThreadsProvider>
          </MomentDetailOverlayProvider>
        </MomentsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
