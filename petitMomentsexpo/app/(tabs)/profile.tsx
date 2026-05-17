import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');

  const email = session?.user?.email ?? '';

  const onSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }, [signOut]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top']}>
      <View style={styles.wrap}>
        <Text style={[styles.emailLabel, { color: muted }]}>Ingelogd als</Text>
        <Text style={[styles.email, { color: textColor }]}>{email || '—'}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            { borderColor: tint, opacity: pressed || signingOut ? 0.75 : 1 },
          ]}
          onPress={() => void onSignOut()}
          disabled={signingOut}>
          {signingOut ? (
            <ActivityIndicator color={tint} />
          ) : (
            <Text style={[styles.signOutLabel, { color: tint }]}>Uitloggen</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emailLabel: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 4,
  },
  email: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    marginBottom: 28,
  },
  signOutBtn: {
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  signOutLabel: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    fontWeight: '600',
  },
});
