import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Marker from 'react-native-maps/lib/MapMarker';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';
import type { LatLng } from '@/utils/moments-map-region';

type ThreadNumberedMarkerProps = {
  coordinate: LatLng;
  order: number;
  title: string;
  description?: string;
  onPress?: () => void;
};

/** Rode punais met volgnummer — ankerpunt waar de draad vastzit. */
export function ThreadNumberedMarker({
  coordinate,
  order,
  title,
  description,
  onPress,
}: ThreadNumberedMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, [order, title]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <View style={styles.wrap} collapsable={false}>
        <View style={styles.pinHead}>
          <View style={styles.pinHighlight} />
          <Text style={styles.pinNumber}>{order}</Text>
        </View>
        <View style={styles.pinNeedle} />
      </View>
    </Marker>
  );
}

const PIN_RED = Brand.primary;
const NEEDLE = '#8A8A8A';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    ...(Platform.OS === 'android' ? { width: 30, height: 40 } : {}),
  },
  pinHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PIN_RED,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2,
    elevation: 4,
  },
  pinHighlight: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 7,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  pinNumber: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  pinNeedle: {
    width: 2,
    height: 10,
    backgroundColor: NEEDLE,
    marginTop: -1,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
});
