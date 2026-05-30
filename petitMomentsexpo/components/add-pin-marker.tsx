import { useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Marker from 'react-native-maps/lib/MapMarker';

import { MapPinGlyph } from '@/components/map-pin';

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
      <Animated.View collapsable={false} style={pinStyle}>
        <MapPinGlyph />
      </Animated.View>
    </Marker>
  );
}
