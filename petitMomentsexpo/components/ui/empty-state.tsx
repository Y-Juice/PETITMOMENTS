import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

type EmptyStateProps = {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message?: string;
  /** Compact = kleinere variant binnen een sectie. */
  compact?: boolean;
};

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  compact = false,
}: EmptyStateProps) {
  const textColor = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: 'rgba(107, 124, 110, 0.35)', dark: 'rgba(255, 253, 226, 0.18)' },
    'text',
  );
  const surface = useThemeColor(
    { light: 'rgba(107, 124, 110, 0.06)', dark: 'rgba(255, 253, 226, 0.05)' },
    'background',
  );

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { borderColor, backgroundColor: surface },
      ]}>
      <View style={[styles.iconCircle, { borderColor }]}>
        <MaterialIcons name={icon} size={compact ? 22 : 28} color={muted} />
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: muted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  wrapCompact: {
    paddingVertical: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
});
