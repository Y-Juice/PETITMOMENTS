import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Marker from 'react-native-maps/lib/MapMarker';

import { Brand } from '@/constants/theme';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type AddPinMarkerProps = {
  coordinate: Coordinate;
  onDragEnd: (coordinate: Coordinate) => void;
};

/**
 * Marker met een korte "geprikt op de kaart" animatie: de pin valt licht omlaag
 * en stuitert subtiel na wanneer er een nieuwe locatie wordt gekozen.
 */
export function AddPinMarker({ coordinate, onDragEnd }: AddPinMarkerProps) {
  const drop = useSharedValue(0);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    drop.value = 0;
    drop.value = withSpring(1, { damping: 8, stiffness: 150, mass: 0.6 });

    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 750);
    return () => clearTimeout(timer);
  }, [coordinate.latitude, coordinate.longitude, drop]);

  const pinStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 1.4),
    transform: [
      { translateY: (1 - drop.value) * -22 },
      { scale: 0.7 + drop.value * 0.3 },
    ],
  }));

  return (
    <Marker
      coordinate={coordinate}
      draggable
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onDragEnd={(event) => onDragEnd(event.nativeEvent.coordinate)}>
      <Animated.View style={[styles.wrap, pinStyle]} collapsable={false}>
        <MaterialIcons name="place" size={42} color={Brand.primary} />
        <View style={styles.shadow} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 44,
    height: 52,
  },
  shadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginTop: -4,
  },
});
