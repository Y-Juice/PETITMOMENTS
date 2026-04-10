import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getMomentCardColors } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import type { Moment } from '@/data/mockMoments';

type Props = {
  moment: Moment;
  /** List index (0-based); drives red → green → blue cycling. */
  colorIndex: number;
  position: 'first' | 'middle' | 'last' | 'single';
  onPress?: () => void;
};

export function MomentCard({ moment, colorIndex, position, onPress }: Props) {
  const colors = getMomentCardColors(colorIndex);
  const isUp = moment.scoreDirection === 'up';
  const badgeBg = '#FFFFFF';
  const arrowColor = isUp ? '#2E7D4A' : '#C62828';

  const radiusStyle =
    position === 'single'
      ? styles.radiusAll
      : position === 'first'
        ? styles.radiusTop
        : position === 'last'
          ? styles.radiusBottom
          : styles.radiusNone;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bg },
        radiusStyle,
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {moment.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.sub }]}>
            {moment.username}, {moment.location.label}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <MaterialIcons name={isUp ? 'arrow-upward' : 'arrow-downward'} size={16} color={arrowColor} />
          <Text style={[styles.score, { color: arrowColor }]}>{moment.score}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: -40,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 50,
    overflow: 'hidden',
  },
  radiusAll: {
    borderRadius: 16,
  },
  radiusTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  radiusBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  radiusNone: {},
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  score: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
  },
});
