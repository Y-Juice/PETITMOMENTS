import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  CONTENT_WARNING_LABELS,
  formatContentWarningLabels,
  hasContentWarning,
  type ContentWarningLabel,
  type ModeratedContent,
} from '@/data/moderation';
import { FontFamily } from '@/constants/typography';

type ContentWarningGateProps = {
  item: ModeratedContent;
  labels?: ContentWarningLabel[];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function ContentWarningGate({
  item,
  labels,
  style,
  children,
}: ContentWarningGateProps) {
  const warningLabels =
    labels ?? item.contentWarning ?? (item.moderationStatus === 'warned' ? ['sensitive'] : []);
  const active = hasContentWarning({ ...item, contentWarning: warningLabels });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [warningLabels.join('|'), item.moderationStatus]);

  if (!active) {
    return <View style={style}>{children}</View>;
  }

  if (revealed) {
    return (
      <View style={style}>
        <View style={styles.revealedBanner}>
          <MaterialIcons name="warning-amber" size={16} color="#8A4B00" />
          <Text style={styles.revealedBannerText}>
            {formatContentWarningLabels(warningLabels)}
          </Text>
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.hiddenContent} pointerEvents="none">
        {children}
      </View>

      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFillObject, styles.webBlur]} />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? 28 : 48}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <View style={styles.overlay}>
        <MaterialIcons name="visibility-off" size={28} color="#FFFFFF" />
        <Text style={styles.title}>Content warning</Text>
        <Text style={styles.subtitle}>
          {formatContentWarningLabels(warningLabels)}
        </Text>
        <Text style={styles.help}>
          Deze inhoud kan gevoelig zijn. Tik om bewust te bekijken.
        </Text>
        <Pressable
          onPress={() => setRevealed(true)}
          style={({ pressed }) => [styles.revealBtn, pressed && styles.revealBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Toon inhoud">
          <Text style={styles.revealBtnText}>Toon inhoud</Text>
        </Pressable>
      </View>
    </View>
  );
}

type ContentWarningBadgeProps = {
  labels?: ContentWarningLabel[];
};

export function ContentWarningBadge({ labels = ['sensitive'] }: ContentWarningBadgeProps) {
  const text =
    labels.length === 1
      ? CONTENT_WARNING_LABELS[labels[0]]
      : `${labels.length} waarschuwingen`;

  return (
    <View style={badgeStyles.wrap}>
      <MaterialIcons name="warning-amber" size={14} color="#8A4B00" />
      <Text style={badgeStyles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  hiddenContent: {
    opacity: 0.35,
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  title: {
    marginTop: 10,
    fontFamily: FontFamily.titleBold,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  help: {
    marginTop: 8,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  revealBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  revealBtnPressed: {
    opacity: 0.88,
  },
  revealBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  revealedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 214, 102, 0.28)',
  },
  revealedBannerText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    color: '#5C3B00',
  },
});

const badgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 214, 102, 0.35)',
  },
  text: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: '700',
    color: '#5C3B00',
  },
});
