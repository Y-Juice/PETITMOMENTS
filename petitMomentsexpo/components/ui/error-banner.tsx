import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = 'Opnieuw laden',
}: ErrorBannerProps) {
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <MaterialIcons name="error-outline" size={18} color={Brand.primary} />
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </View>
      {onRetry ? (
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}>
          <Text style={styles.retryBtnText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 69, 54, 0.45)',
    backgroundColor: 'rgba(196, 69, 54, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  message: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
